import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import type { RequestOptions } from 'node:http';
import { isIP, isIPv4 } from 'node:net';
import { networkInterfaces as osNetworkInterfaces } from 'node:os';
import type { NetworkInterfaceInfo } from 'node:os';
import type {
  DashboardAddressInfo,
  DashboardAddressesResponse,
  DashboardAddressReasonCode,
} from '@everdash/contracts/auth/devices';

const DEFAULT_TABLET_PORT = 8095;
const HA_CONFIG_TIMEOUT_MS = 2000;
const DNS_LOOKUP_TIMEOUT_MS = 1500;
const SUPERVISOR_NETWORK_TIMEOUT_MS = 1500;
const PROBE_TIMEOUT_MS = 2500;
const MAX_HEALTH_BODY_BYTES = 64 * 1024;

const TIMEOUT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

const DNS_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'EAI_NONAME']);

const TLS_ERROR_CODES = new Set([
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'EPROTO',
]);

const UNREACHABLE_ERROR_CODES = new Set(['ENETUNREACH', 'EHOSTUNREACH', 'ENETDOWN', 'EHOSTDOWN']);

export interface DashboardAddressesRequestContext {
  isIngress: boolean;
  tabletPort?: number;
  browserOrigin?: string | null;
  requestOrigin?: string | null;
}

export interface ResolveDashboardAddressesDeps {
  getHaConfig?: (signal?: AbortSignal) => Promise<unknown>;
  networkInterfaces?: () => NodeJS.Dict<NetworkInterfaceInfo[]>;
  lookupIpv4?: (hostname: string, signal?: AbortSignal) => Promise<string | null>;
  getSupervisorPrimaryIp?: (signal?: AbortSignal) => Promise<string | null>;
  probe?: (url: string, signal?: AbortSignal) => Promise<DashboardAddressInfo>;
  env?: NodeJS.ProcessEnv;
}

export interface ProbeDashboardAddressOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function stripBrackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function parseIpv4Octets(ip: string): [number, number, number, number] | null {
  if (!isIPv4(ip)) {
    return null;
  }

  const parts = ip.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  return [parts[0], parts[1], parts[2], parts[3]];
}

function isLoopbackIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);
  return octets !== null && octets[0] === 127;
}

function isLinkLocalIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);
  return octets !== null && octets[0] === 169 && octets[1] === 254;
}

export function isPrivateLanIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);

  if (!octets) {
    return false;
  }

  const [a, b] = octets;

  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isDockerOrSupervisorBridgeIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);

  if (!octets) {
    return false;
  }

  const [a, b, c] = octets;

  // Docker default bridge (172.17.0.0/16) and Home Assistant Supervisor subnets (172.30.32.0/23, 172.30.33.0/24).
  return (a === 172 && b === 17) || (a === 172 && b === 30 && (c === 32 || c === 33));
}

function isLoopbackHostname(hostname: string): boolean {
  const clean = stripBrackets(hostname.trim().toLowerCase()).replace(/\.$/, '');

  if (clean === 'localhost' || clean.endsWith('.localhost') || clean === '::1') {
    return true;
  }

  return isLoopbackIpv4(clean);
}

export function isExternalHostname(hostname: string): boolean {
  const clean = stripBrackets(hostname.trim().toLowerCase()).replace(/\.$/, '');

  if (!clean || isLoopbackHostname(clean)) {
    return false;
  }

  if (isIPv4(clean)) {
    return (
      !isPrivateLanIpv4(clean) &&
      !isLinkLocalIpv4(clean) &&
      !isLoopbackIpv4(clean) &&
      clean !== '0.0.0.0'
    );
  }

  if (isIP(clean) === 6) {
    return false;
  }

  return clean.includes('.') && !clean.endsWith('.local');
}

function parseUrl(value: unknown): URL | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username ||
    parsed.password ||
    !parsed.hostname
  ) {
    return null;
  }

  return parsed;
}

function parsePort(port: unknown): number | undefined {
  if (typeof port === 'number' && Number.isInteger(port) && port >= 1 && port <= 65_535) {
    return port;
  }

  return undefined;
}

function inferPortFromUrl(url: URL | null): number | undefined {
  if (!url) {
    return undefined;
  }

  if (url.port) {
    return parsePort(Number(url.port));
  }

  return url.protocol === 'https:' ? 443 : 80;
}

function formatHttpUrl(hostname: string, port: number): string {
  if (port === 80) {
    return `http://${hostname}/`;
  }

  return `http://${hostname}:${port}/`;
}

function combineSignal(timeoutMs: number, parentSignal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);

  if (parentSignal) {
    return AbortSignal.any([timeout, parentSignal]);
  }

  return timeout;
}

function rankInterfaceIpv4Candidates(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>): {
  preferredLan: string[];
  bridge: string[];
  other: string[];
} {
  const preferredLan: string[] = [];
  const bridge: string[] = [];
  const other: string[] = [];
  const seen = new Set<string>();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      const ip = entry.address;

      if (!isIPv4(ip) || seen.has(ip) || isLoopbackIpv4(ip) || isLinkLocalIpv4(ip)) {
        continue;
      }

      seen.add(ip);

      if (isPrivateLanIpv4(ip)) {
        if (isDockerOrSupervisorBridgeIpv4(ip)) {
          bridge.push(ip);
        } else {
          preferredLan.push(ip);
        }
      } else {
        other.push(ip);
      }
    }
  }

  return { preferredLan, bridge, other };
}

function defaultLookupIpv4(hostname: string, signal?: AbortSignal): Promise<string | null> {
  if (signal?.aborted) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    const cleanups: (() => void)[] = [];

    const finish = (value: string | null) => {
      if (settled) {
        return;
      }

      settled = true;

      for (const cleanup of cleanups) {
        cleanup();
      }

      resolve(value);
    };

    const timer = setTimeout(() => {
      finish(null);
    }, DNS_LOOKUP_TIMEOUT_MS);
    cleanups.push(() => clearTimeout(timer));

    if (signal) {
      const onAbort = () => {
        finish(null);
      };
      signal.addEventListener('abort', onAbort, { once: true });
      cleanups.push(() => signal.removeEventListener('abort', onAbort));
    }

    dnsLookup(hostname, { family: 4 })
      .then((result) => {
        finish(isIPv4(result.address) ? result.address : null);
      })
      .catch(() => {
        finish(null);
      });
  });
}

function readJsonOverHttp(
  options: RequestOptions,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<unknown> {
  if (signal?.aborted) {
    return Promise.reject(new Error('Aborted'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanups: (() => void)[] = [];

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }

      settled = true;

      for (const cleanup of cleanups) {
        cleanup();
      }

      fn();
    };

    const req = httpRequest({ agent: false, ...options }, (res) => {
      const chunks: Buffer[] = [];
      let total = 0;

      res.on('data', (chunk: Buffer) => {
        total += chunk.byteLength;

        if (total > MAX_HEALTH_BODY_BYTES) {
          req.destroy(new Error('Supervisor response too large'));
          return;
        }

        chunks.push(chunk);
      });

      res.on('end', () => {
        if ((res.statusCode ?? 500) >= 400) {
          finish(() => reject(new Error(`HTTP ${res.statusCode ?? 500}`)));
          return;
        }

        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          finish(() => resolve(parsed));
        } catch (error) {
          finish(() => reject(error));
        }
      });

      res.on('error', (error) => {
        finish(() => reject(error));
      });
    });

    if (signal) {
      const onAbort = () => {
        req.destroy(new Error('Aborted'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      cleanups.push(() => signal.removeEventListener('abort', onAbort));
    }

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Supervisor network lookup timed out'));
    });
    req.on('error', (error) => {
      finish(() => reject(error));
    });
    req.end();
  });
}

export function extractSupervisorPrimaryIpv4(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const { data } = payload as { data?: unknown };

  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const { interfaces } = data as { interfaces?: unknown };

  if (!Array.isArray(interfaces)) {
    return null;
  }

  const ordered = [...interfaces].sort((left, right) => {
    const leftPrimary =
      typeof left === 'object' && left !== null && (left as { primary?: unknown }).primary === true
        ? 0
        : 1;
    const rightPrimary =
      typeof right === 'object' &&
      right !== null &&
      (right as { primary?: unknown }).primary === true
        ? 0
        : 1;

    return leftPrimary - rightPrimary;
  });

  const preferredLan: string[] = [];
  const fallbackIps: string[] = [];

  for (const item of ordered) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const record = item as { connected?: unknown; ipv4?: unknown };

    if (record.connected === false || typeof record.ipv4 !== 'object' || record.ipv4 === null) {
      continue;
    }

    const addresses = (record.ipv4 as { address?: unknown }).address;

    if (!Array.isArray(addresses)) {
      continue;
    }

    for (const raw of addresses) {
      if (typeof raw !== 'string') {
        continue;
      }

      const ip = raw.split('/')[0]?.trim() ?? '';

      if (!isIPv4(ip) || isLoopbackIpv4(ip) || isLinkLocalIpv4(ip)) {
        continue;
      }

      if (isPrivateLanIpv4(ip) && !isDockerOrSupervisorBridgeIpv4(ip)) {
        preferredLan.push(ip);
      } else if (!isDockerOrSupervisorBridgeIpv4(ip)) {
        fallbackIps.push(ip);
      }
    }
  }

  return preferredLan[0] ?? fallbackIps[0] ?? null;
}

async function defaultGetSupervisorPrimaryIp(
  env: NodeJS.ProcessEnv,
  signal?: AbortSignal,
): Promise<string | null> {
  const socketPath = env.SUPERVISOR_SOCKET?.trim();

  if (socketPath) {
    try {
      const payload = await readJsonOverHttp(
        { socketPath, path: '/network/info', method: 'GET' },
        SUPERVISOR_NETWORK_TIMEOUT_MS,
        signal,
      );
      const ip = extractSupervisorPrimaryIpv4(payload);

      if (ip) {
        return ip;
      }
    } catch {
      // Fall through to HTTP supervisor API or return null.
    }
  }

  const supervisorToken = env.SUPERVISOR_TOKEN?.trim();

  if (supervisorToken) {
    try {
      const payload = await readJsonOverHttp(
        {
          host: 'supervisor',
          path: '/network/info',
          method: 'GET',
          headers: { Authorization: `Bearer ${supervisorToken}` },
        },
        SUPERVISOR_NETWORK_TIMEOUT_MS,
        signal,
      );

      return extractSupervisorPrimaryIpv4(payload);
    } catch {
      return null;
    }
  }

  return null;
}

function collectErrorDetails(
  error: unknown,
  visited: Set<unknown>,
  codes: Set<string>,
  names: Set<string>,
  messages: string[],
): void {
  if (typeof error !== 'object' || error === null || visited.has(error)) {
    return;
  }

  visited.add(error);

  const record = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    cause?: unknown;
    errors?: unknown;
  };

  if (typeof record.code === 'string' && record.code) {
    codes.add(record.code);
  }

  if (typeof record.name === 'string' && record.name) {
    names.add(record.name);
  }

  if (typeof record.message === 'string' && record.message) {
    messages.push(record.message);
  }

  if (record.cause !== undefined) {
    collectErrorDetails(record.cause, visited, codes, names, messages);
  }

  if (Array.isArray(record.errors)) {
    for (const nested of record.errors) {
      collectErrorDetails(nested, visited, codes, names, messages);
    }
  }
}

export function classifyProbeError(error: unknown): DashboardAddressReasonCode {
  const codes = new Set<string>();
  const names = new Set<string>();
  const messages: string[] = [];

  collectErrorDetails(error, new Set(), codes, names, messages);

  if (codes.has('ERR_INVALID_REDIRECT') || messages.some((message) => /redirect/i.test(message))) {
    return 'wrong_service';
  }

  if (
    names.has('TimeoutError') ||
    names.has('AbortError') ||
    [...codes].some((code) => TIMEOUT_ERROR_CODES.has(code))
  ) {
    return 'timeout';
  }

  if (codes.has('ECONNREFUSED')) {
    return 'connection_refused';
  }

  if ([...codes].some((code) => DNS_ERROR_CODES.has(code))) {
    return 'dns_failed';
  }

  if (
    [...codes].some(
      (code) =>
        TLS_ERROR_CODES.has(code) || code.startsWith('ERR_TLS_') || code.startsWith('ERR_SSL_'),
    ) ||
    messages.some((message) => /\b(tls|ssl|certificate|self[- ]signed)\b/i.test(message))
  ) {
    return 'tls_error';
  }

  if ([...codes].some((code) => UNREACHABLE_ERROR_CODES.has(code))) {
    return 'network_unreachable';
  }

  return 'unknown';
}

async function readBoundedText(response: Response): Promise<string | null> {
  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (total > MAX_HEALTH_BODY_BYTES) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}

export async function probeDashboardAddress(
  url: string,
  options?: ProbeDashboardAddressOptions,
): Promise<DashboardAddressInfo> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? PROBE_TIMEOUT_MS;

  let response: Response;

  try {
    response = await fetchImpl(new URL('/health', url), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: combineSignal(timeoutMs, options?.signal),
    });
  } catch (error) {
    return {
      url,
      reachable: false,
      reasonCode: classifyProbeError(error),
    };
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);

    return {
      url,
      reachable: false,
      reasonCode: 'wrong_service',
      httpStatus: response.status,
    };
  }

  try {
    const text = await readBoundedText(response);

    if (text === null) {
      return {
        url,
        reachable: false,
        reasonCode: 'wrong_service',
        httpStatus: response.status,
      };
    }

    const parsed: unknown = JSON.parse(text);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      (parsed as { status?: unknown }).status === 'ok'
    ) {
      return { url, reachable: true };
    }
  } catch {
    // Non-JSON or aborted body reading means this is not an EverDash health endpoint.
  }

  return {
    url,
    reachable: false,
    reasonCode: 'wrong_service',
    httpStatus: response.status,
  };
}

interface ParsedHaUrls {
  internalUrl: URL | null;
  externalUrl: URL | null;
}

async function readHaConfigUrls(
  getHaConfig: ResolveDashboardAddressesDeps['getHaConfig'],
  signal?: AbortSignal,
): Promise<ParsedHaUrls> {
  if (!getHaConfig) {
    return { internalUrl: null, externalUrl: null };
  }

  try {
    const payload = await getHaConfig(combineSignal(HA_CONFIG_TIMEOUT_MS, signal));

    if (typeof payload !== 'object' || payload === null) {
      return { internalUrl: null, externalUrl: null };
    }

    const record = payload as { internal_url?: unknown; external_url?: unknown };

    return {
      internalUrl: parseUrl(record.internal_url),
      externalUrl: parseUrl(record.external_url),
    };
  } catch {
    return { internalUrl: null, externalUrl: null };
  }
}

async function resolveLocalCandidateUrl(
  context: DashboardAddressesRequestContext,
  tabletPort: number,
  effectiveOriginUrl: URL | null,
  browserOriginUrl: URL | null,
  haInternalUrl: URL | null,
  deps: ResolveDashboardAddressesDeps,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!context.isIngress && effectiveOriginUrl && isPrivateLanIpv4(effectiveOriginUrl.hostname)) {
    return `${effectiveOriginUrl.origin}/`;
  }

  // 1. Home Assistant /api/config internal_url.
  if (haInternalUrl) {
    const host = stripBrackets(haInternalUrl.hostname);

    if (isPrivateLanIpv4(host)) {
      return formatHttpUrl(host, tabletPort);
    }

    if (!isIP(host) && !isLoopbackHostname(host)) {
      const lookup = deps.lookupIpv4 ?? defaultLookupIpv4;
      const resolvedIp = await lookup(host, signal);

      if (resolvedIp && isPrivateLanIpv4(resolvedIp)) {
        return formatHttpUrl(resolvedIp, tabletPort);
      }
    }
  }

  // 2. Host network interfaces, preferring real private LAN subnets over Docker/Supervisor bridges.
  const ranked = rankInterfaceIpv4Candidates((deps.networkInterfaces ?? osNetworkInterfaces)());

  if (ranked.preferredLan.length > 0) {
    return formatHttpUrl(ranked.preferredLan[0], tabletPort);
  }

  // 3. Supervisor /network/info when running inside Home Assistant OS/Supervised.
  const supervisorIp = deps.getSupervisorPrimaryIp
    ? await deps.getSupervisorPrimaryIp(signal)
    : await defaultGetSupervisorPrimaryIp(deps.env ?? process.env, signal);

  if (supervisorIp && isIPv4(supervisorIp) && !isLoopbackIpv4(supervisorIp)) {
    return formatHttpUrl(supervisorIp, tabletPort);
  }

  // 4. Under Ingress, if the browser itself is connected over a non-bridge LAN IPv4, reuse that host.
  if (
    context.isIngress &&
    browserOriginUrl &&
    isPrivateLanIpv4(browserOriginUrl.hostname) &&
    !isDockerOrSupervisorBridgeIpv4(browserOriginUrl.hostname)
  ) {
    return formatHttpUrl(browserOriginUrl.hostname, tabletPort);
  }

  // 5. Fallback to bridge or other non-loopback interface IPv4.
  const fallbackInterfaceIp = ranked.bridge[0] ?? ranked.other[0];

  if (fallbackInterfaceIp) {
    return formatHttpUrl(fallbackInterfaceIp, tabletPort);
  }

  // 6. Direct loopback fallback (e.g. local development without any non-internal LAN interface).
  if (!context.isIngress && effectiveOriginUrl && isLoopbackHostname(effectiveOriginUrl.hostname)) {
    return `${effectiveOriginUrl.origin}/`;
  }

  return null;
}

function resolveExternalCandidateUrl(
  context: DashboardAddressesRequestContext,
  tabletPort: number,
  effectiveOriginUrl: URL | null,
  haExternalUrl: URL | null,
  localUrl: string | null,
): string | null {
  let externalUrl: string | null = null;

  if (effectiveOriginUrl && isExternalHostname(effectiveOriginUrl.hostname)) {
    externalUrl = context.isIngress
      ? formatHttpUrl(effectiveOriginUrl.hostname, tabletPort)
      : `${effectiveOriginUrl.origin}/`;
  } else if (haExternalUrl && isExternalHostname(haExternalUrl.hostname)) {
    externalUrl = formatHttpUrl(haExternalUrl.hostname, tabletPort);
  }

  if (externalUrl && externalUrl === localUrl) {
    return null;
  }

  return externalUrl;
}

export async function resolveDashboardAddresses(
  context: DashboardAddressesRequestContext,
  deps: ResolveDashboardAddressesDeps = {},
  signal?: AbortSignal,
): Promise<DashboardAddressesResponse> {
  const browserOriginUrl = parseUrl(context.browserOrigin);
  const requestOriginUrl = parseUrl(context.requestOrigin);
  const effectiveOriginUrl = browserOriginUrl ?? (context.isIngress ? null : requestOriginUrl);

  const tabletPort =
    parsePort(context.tabletPort) ??
    (context.isIngress ? DEFAULT_TABLET_PORT : inferPortFromUrl(requestOriginUrl)) ??
    DEFAULT_TABLET_PORT;

  const haUrls = await readHaConfigUrls(deps.getHaConfig, signal);

  const localUrl = await resolveLocalCandidateUrl(
    context,
    tabletPort,
    effectiveOriginUrl,
    browserOriginUrl,
    haUrls.internalUrl,
    deps,
    signal,
  );

  const externalUrl = resolveExternalCandidateUrl(
    context,
    tabletPort,
    effectiveOriginUrl,
    haUrls.externalUrl,
    localUrl,
  );

  const probe =
    deps.probe ??
    ((url: string, probeSignal?: AbortSignal) =>
      probeDashboardAddress(url, { signal: probeSignal }));

  const [local, external] = await Promise.all([
    localUrl ? probe(localUrl, signal) : Promise.resolve(null),
    externalUrl ? probe(externalUrl, signal) : Promise.resolve(null),
  ]);

  return { local, external };
}
