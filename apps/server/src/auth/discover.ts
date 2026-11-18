import dgram from 'node:dgram';
import dns from 'node:dns';
import net from 'node:net';
import os from 'node:os';
import type { NetworkInterfaceInfo } from 'node:os';
import type { DiscoveredHomeAssistant, DiscoverySource } from '@everdash/contracts/auth/oauth';
import { parseHomeAssistantOrigin } from './origin';

const MDNS_ADDRESS = '224.0.0.251';
const MDNS_PORT = 5353;
const HA_MDNS_SERVICE = '_home-assistant._tcp.local';
const DEFAULT_HA_PORT = 8123;
const MAX_SUBNETS_TO_SCAN = 4;
const TCP_SCAN_CONCURRENCY = 48;
const MAX_PROVIDERS_BYTES = 65_536;

interface CandidateEntry {
  origin: string;
  source: DiscoverySource;
  name?: string;
  version?: string;
  groupKey?: string;
  resolvedIps?: readonly string[];
}

interface SrvRecord {
  port: number;
  target: string;
}

export interface ParsedMdnsResponse {
  ptrs: Map<string, string[]>;
  srvs: Map<string, SrvRecord>;
  txts: Map<string, Record<string, string>>;
  addresses: Map<string, string[]>;
}

export interface DiscoverOptions {
  fetch?: typeof fetch;
  mdnsTimeoutMs?: number;
  tcpTimeoutMs?: number;
  probeTimeoutMs?: number;
  networkInterfaces?: () => NodeJS.Dict<NetworkInterfaceInfo[]>;
  checkTcpPort?: (host: string, port: number, timeoutMs: number) => Promise<boolean>;
  discoverMdnsCandidates?: () => Promise<CandidateEntry[]>;
  resolveHostAddresses?: (hostname: string) => Promise<readonly string[]>;
  wellKnownOrigins?: readonly string[];
  extraOrigins?: readonly string[];
  includeLoopback?: boolean;
}

const DEFAULT_WELL_KNOWN_ORIGINS = [
  'http://homeassistant.local:8123',
  'http://homeassistant:8123',
  'http://hassio.local:8123',
  'http://host.docker.internal:8123',
] as const;

function encodeDnsName(name: string): Buffer {
  const labels = name
    .replace(/\.$/, '')
    .split('.')
    .filter((label) => label.length > 0);
  const parts: Buffer[] = [];

  for (const label of labels) {
    const encoded = Buffer.from(label, 'utf8');

    parts.push(Buffer.from([encoded.length]), encoded);
  }

  parts.push(Buffer.from([0]));

  return Buffer.concat(parts);
}

/** Builds a DNS-SD PTR multicast query for Home Assistant instances (`_home-assistant._tcp.local`). */
export function buildMdnsPtrQuery(serviceType = HA_MDNS_SERVICE): Buffer {
  const header = Buffer.alloc(12);

  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(0, 2);
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(0, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(0, 10);

  const qname = encodeDnsName(serviceType);
  const questionFooter = Buffer.alloc(4);

  // QTYPE = PTR (12), QCLASS = IN with QU unicast-response bit (0x8001).
  questionFooter.writeUInt16BE(12, 0);
  questionFooter.writeUInt16BE(0x8001, 2);

  return Buffer.concat([header, qname, questionFooter]);
}

function readDnsName(
  packet: Buffer,
  startOffset: number,
): { name: string; nextOffset: number } | null {
  const labels: string[] = [];
  let offset = startOffset;
  let endOffset: number | null = null;
  let jumps = 0;

  while (offset < packet.length) {
    const length = packet[offset]!;

    if ((length & 0xc0) === 0xc0) {
      if (offset + 1 >= packet.length || jumps >= 16) {
        return null;
      }

      const pointer = ((length & 0x3f) << 8) | packet[offset + 1]!;

      if (pointer >= packet.length) {
        return null;
      }

      if (endOffset === null) {
        endOffset = offset + 2;
      }

      offset = pointer;
      jumps += 1;
      continue;
    }

    if (length === 0) {
      if (endOffset === null) {
        endOffset = offset + 1;
      }

      return { name: labels.join('.').toLowerCase(), nextOffset: endOffset };
    }

    if (length > 63 || offset + 1 + length > packet.length) {
      return null;
    }

    labels.push(packet.toString('utf8', offset + 1, offset + 1 + length));
    offset += 1 + length;
  }

  return null;
}

function parseTxtRecord(rdata: Buffer): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 0;

  while (offset < rdata.length) {
    const length = rdata[offset]!;

    offset += 1;

    if (offset + length > rdata.length) {
      break;
    }

    const entry = rdata.toString('utf8', offset, offset + length);
    const separator = entry.indexOf('=');

    if (separator > 0) {
      const key = entry.slice(0, separator).trim();
      const value = entry.slice(separator + 1).trim();

      if (key) {
        result[key] = value;
      }
    }

    offset += length;
  }

  return result;
}

/** Parses PTR, SRV, TXT, and A records from an mDNS response packet. */
export function parseMdnsResponse(packet: Buffer): ParsedMdnsResponse {
  const parsed: ParsedMdnsResponse = {
    ptrs: new Map(),
    srvs: new Map(),
    txts: new Map(),
    addresses: new Map(),
  };

  if (packet.length < 12) {
    return parsed;
  }

  const qdCount = packet.readUInt16BE(4);
  const totalRecords = packet.readUInt16BE(6) + packet.readUInt16BE(8) + packet.readUInt16BE(10);
  let offset = 12;

  for (let index = 0; index < qdCount; index += 1) {
    const question = readDnsName(packet, offset);

    if (!question || question.nextOffset + 4 > packet.length) {
      return parsed;
    }

    offset = question.nextOffset + 4;
  }

  for (let index = 0; index < totalRecords; index += 1) {
    const owner = readDnsName(packet, offset);

    if (!owner || owner.nextOffset + 10 > packet.length) {
      return parsed;
    }

    const headerOffset = owner.nextOffset;
    const type = packet.readUInt16BE(headerOffset);
    const rdLength = packet.readUInt16BE(headerOffset + 8);
    const rdataStart = headerOffset + 10;
    const rdataEnd = rdataStart + rdLength;

    if (rdataEnd > packet.length) {
      return parsed;
    }

    if (type === 12) {
      const target = readDnsName(packet, rdataStart);

      if (target) {
        const list = parsed.ptrs.get(owner.name) ?? [];

        list.push(target.name);
        parsed.ptrs.set(owner.name, list);
      }
    } else if (type === 33 && rdLength >= 7) {
      const port = packet.readUInt16BE(rdataStart + 4);
      const target = readDnsName(packet, rdataStart + 6);

      if (target && port > 0) {
        parsed.srvs.set(owner.name, { port, target: target.name });
      }
    } else if (type === 16) {
      const existing = parsed.txts.get(owner.name) ?? {};

      parsed.txts.set(owner.name, {
        ...existing,
        ...parseTxtRecord(packet.subarray(rdataStart, rdataEnd)),
      });
    } else if (type === 1 && rdLength === 4) {
      const ip = `${packet[rdataStart]}.${packet[rdataStart + 1]}.${packet[rdataStart + 2]}.${packet[rdataStart + 3]}`;
      const list = parsed.addresses.get(owner.name) ?? [];

      list.push(ip);
      parsed.addresses.set(owner.name, list);
    }

    offset = rdataEnd;
  }

  return parsed;
}

function tryNormalizeOrigin(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  try {
    return parseHomeAssistantOrigin(raw);
  } catch {
    return null;
  }
}

export function extractMdnsCandidates(packets: readonly Buffer[]): CandidateEntry[] {
  const ptrs = new Map<string, Set<string>>();
  const srvs = new Map<string, SrvRecord>();
  const txts = new Map<string, Record<string, string>>();
  const addresses = new Map<string, Set<string>>();

  for (const packet of packets) {
    const parsed = parseMdnsResponse(packet);

    for (const [owner, targets] of parsed.ptrs) {
      const set = ptrs.get(owner) ?? new Set<string>();

      for (const target of targets) {
        set.add(target);
      }

      ptrs.set(owner, set);
    }

    for (const [owner, srv] of parsed.srvs) {
      srvs.set(owner, srv);
    }

    for (const [owner, txt] of parsed.txts) {
      txts.set(owner, { ...txts.get(owner), ...txt });
    }

    for (const [owner, ips] of parsed.addresses) {
      const set = addresses.get(owner) ?? new Set<string>();

      for (const ip of ips) {
        set.add(ip);
      }

      addresses.set(owner, set);
    }
  }

  const candidates: CandidateEntry[] = [];
  const instanceNames = new Set<string>(ptrs.get(HA_MDNS_SERVICE));

  for (const name of srvs.keys()) {
    if (name.endsWith(`.${HA_MDNS_SERVICE}`)) {
      instanceNames.add(name);
    }
  }

  for (const instanceName of instanceNames) {
    const srv = srvs.get(instanceName);
    const txt = txts.get(instanceName) ?? {};
    const name = txt.location_name || undefined;
    const version = txt.version || undefined;
    const groupKey = txt.uuid ? `mdns-uuid:${txt.uuid.toLowerCase()}` : `mdns:${instanceName}`;
    const srvIps = srv
      ? [...(addresses.get(srv.target) ?? [])].filter((ip) => !ip.startsWith('169.254.'))
      : [];

    for (const urlCandidate of [txt.internal_url, txt.external_url, txt.base_url]) {
      const normalized = tryNormalizeOrigin(urlCandidate);

      if (normalized) {
        const hostname = new URL(normalized).hostname.replace(/^\[|\]$/g, '').toLowerCase();
        const matchesSrvTarget = srv && hostname === srv.target;

        candidates.push({
          origin: normalized,
          source: 'mdns',
          name,
          version,
          groupKey,
          ...(matchesSrvTarget && srvIps.length > 0 ? { resolvedIps: srvIps } : {}),
        });
      }
    }

    if (srv) {
      for (const ip of srvIps) {
        const normalized = tryNormalizeOrigin(`http://${ip}:${srv.port}`);

        if (normalized) {
          candidates.push({
            origin: normalized,
            source: 'mdns',
            name,
            version,
            groupKey,
          });
        }
      }

      const hostOrigin = tryNormalizeOrigin(`http://${srv.target}:${srv.port}`);

      if (hostOrigin) {
        candidates.push({
          origin: hostOrigin,
          source: 'mdns',
          name,
          version,
          groupKey,
          ...(srvIps.length > 0 ? { resolvedIps: srvIps } : {}),
        });
      }
    }
  }

  return candidates;
}

async function discoverMdns(timeoutMs: number): Promise<CandidateEntry[]> {
  const packets: Buffer[] = [];
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  return await new Promise<CandidateEntry[]>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;

      if (timer) {
        clearTimeout(timer);
      }

      try {
        socket.close();
      } catch {
        // Socket may already be closed.
      }

      resolve(extractMdnsCandidates(packets));
    };

    socket.on('message', (message) => {
      packets.push(Buffer.from(message));
    });

    socket.on('error', () => {
      finish();
    });

    socket.bind(0, '0.0.0.0', () => {
      try {
        socket.setMulticastTTL(255);
      } catch {
        // Ignore multicast TTL option errors on restricted platforms.
      }

      const query = buildMdnsPtrQuery();

      try {
        socket.send(query, MDNS_PORT, MDNS_ADDRESS, () => {
          // Wait for responses until timeout.
        });
      } catch {
        finish();

        return;
      }

      timer = setTimeout(finish, timeoutMs);
    });
  });
}

function ipToUint32(ip: string): number {
  const parts = ip.split('.').map(Number);

  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

function uint32ToIp(value: number): string {
  return `${(value >>> 24) & 255}.${(value >>> 16) & 255}.${(value >>> 8) & 255}.${value & 255}`;
}

function isPrivateLanIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  if (parts.length !== 4) {
    return false;
  }

  const [a, b] = parts as [number, number, number, number];

  if (a === 10 || (a === 192 && b === 168)) {
    return true;
  }

  return a === 172 && b >= 16 && b <= 31;
}

/**
 * Returns local LAN IPv4 addresses to probe on port 8123, clamping subnets wider than `/24`
 * to the host interface's `/24` block so discovery finishes quickly.
 */
export function collectSubnetHosts(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = os.networkInterfaces(),
): string[] {
  const subnetRanges = new Map<string, { start: number; end: number; priority: number }>();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      if (entry.address.startsWith('169.254.') || entry.address.startsWith('127.')) {
        continue;
      }

      const ipInt = ipToUint32(entry.address);
      const netmaskInt = entry.netmask ? ipToUint32(entry.netmask) : 0xffffff00;
      const effectiveMask = Math.max(netmaskInt, 0xffffff00);
      const network = (ipInt & effectiveMask) >>> 0;
      const broadcast = (network | (~effectiveMask >>> 0)) >>> 0;
      const key = `${uint32ToIp(network)}/${uint32ToIp(effectiveMask)}`;

      if (!subnetRanges.has(key) && broadcast - network >= 2) {
        subnetRanges.set(key, {
          start: network + 1,
          end: broadcast - 1,
          priority: isPrivateLanIpv4(entry.address) ? 0 : 1,
        });
      }
    }
  }

  const ordered = [...subnetRanges.values()]
    .sort((left, right) => left.priority - right.priority)
    .slice(0, MAX_SUBNETS_TO_SCAN);

  const hosts: string[] = [];

  for (const range of ordered) {
    for (let current = range.start; current <= range.end; current += 1) {
      hosts.push(uint32ToIp(current));
    }
  }

  return hosts;
}

function defaultCheckTcpPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (open: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (cursor < items.length) {
        const current = items[cursor];

        cursor += 1;

        if (current !== undefined) {
          await worker(current);
        }
      }
    }),
  );
}

/**
 * Confirms an origin serves Home Assistant's unauthenticated OAuth providers catalog
 * (`GET /auth/providers` -> HTTP 200 JSON `{ providers: [...] }`).
 */
export async function probeHomeAssistantAuth(
  origin: string,
  options: { fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<boolean> {
  const normalized = tryNormalizeOrigin(origin);

  if (!normalized) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 1200);

  try {
    const response = await (options.fetch ?? fetch)(new URL('/auth/providers', normalized), {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
    });

    if (!response.ok) {
      await response.body?.cancel();

      return false;
    }

    const reader = response.body?.getReader();

    if (!reader) {
      return false;
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const part = await reader.read();

      if (part.done) {
        break;
      }

      totalBytes += part.value.byteLength;

      if (totalBytes > MAX_PROVIDERS_BYTES) {
        await reader.cancel();

        return false;
      }

      chunks.push(part.value);
    }

    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;

    return (
      typeof payload === 'object' &&
      payload !== null &&
      Array.isArray((payload as { providers?: unknown }).providers) &&
      (payload as { providers: unknown[] }).providers.length > 0
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function classifyOriginSource(origin: string): DiscoverySource {
  const { hostname } = new URL(origin);

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'host.docker.internal') {
    return 'local';
  }

  return 'network';
}

function sourceRank(source: DiscoverySource): number {
  if (source === 'mdns') {
    return 0;
  }

  if (source === 'network') {
    return 1;
  }

  return 2;
}

const UUID_LOCAL_HOST = /^[0-9a-f]{32}\.local$/i;

function originPreferenceRank(origin: string): number {
  const url = new URL(origin);
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (net.isIPv4(hostname) && isPrivateLanIpv4(hostname)) {
    return 0;
  }

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === 'host.docker.internal'
  ) {
    return 3;
  }

  if (UUID_LOCAL_HOST.test(hostname)) {
    return 4;
  }

  if (hostname.endsWith('.local') || !hostname.includes('.')) {
    return 1;
  }

  return 2;
}

function compareOrigins(left: string, right: string): number {
  const rankDiff = originPreferenceRank(left) - originPreferenceRank(right);

  if (rankDiff !== 0) {
    return rankDiff;
  }

  return left.localeCompare(right);
}

function originEndpointPort(url: URL): string {
  if (url.port) {
    return url.port;
  }

  return url.protocol === 'https:' ? '443' : '80';
}

async function defaultResolveHostAddresses(hostname: string): Promise<readonly string[]> {
  const clean = hostname.replace(/^\[|\]$/g, '');

  if (net.isIP(clean) !== 0) {
    return [clean];
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const records = await Promise.race([
      dns.promises.lookup(clean, { all: true }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('DNS lookup timeout')), 400);
      }),
    ]);

    return [...new Set(records.map((record) => record.address))];
  } catch {
    return [];
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

interface InternalCandidate {
  origin: string;
  source: DiscoverySource;
  name?: string;
  version?: string;
  groupKeys: Set<string>;
  resolvedIps: Set<string>;
}

/**
 * Discovers reachable Home Assistant instances on the local network using mDNS
 * (`_home-assistant._tcp.local`), well-known hostnames, and a fast `/24` LAN port-8123 scan,
 * grouping multiple URLs that resolve to the same instance.
 */
export async function discoverHomeAssistantInstances(
  options: DiscoverOptions = {},
): Promise<DiscoveredHomeAssistant[]> {
  const mdnsTimeoutMs = options.mdnsTimeoutMs ?? 700;
  const tcpTimeoutMs = options.tcpTimeoutMs ?? 350;
  const probeTimeoutMs = options.probeTimeoutMs ?? 1200;
  const checkTcpPort = options.checkTcpPort ?? defaultCheckTcpPort;
  const resolveHostAddresses =
    options.resolveHostAddresses ?? (options.fetch ? async () => [] : defaultResolveHostAddresses);

  const subnetHosts = collectSubnetHosts(options.networkInterfaces?.());

  const [mdnsCandidates, openSubnetHosts] = await Promise.all([
    options.discoverMdnsCandidates ? options.discoverMdnsCandidates() : discoverMdns(mdnsTimeoutMs),
    (async () => {
      const open: string[] = [];

      await runWithConcurrency(subnetHosts, TCP_SCAN_CONCURRENCY, async (host) => {
        if (await checkTcpPort(host, DEFAULT_HA_PORT, tcpTimeoutMs)) {
          open.push(host);
        }
      });

      return open;
    })(),
  ]);

  const candidateMap = new Map<string, InternalCandidate>();

  const registerCandidate = (entry: CandidateEntry) => {
    const normalized = tryNormalizeOrigin(entry.origin);

    if (!normalized) {
      return;
    }

    const existing = candidateMap.get(normalized);

    if (!existing) {
      const groupKeys = new Set<string>();
      const resolvedIps = new Set<string>();

      if (entry.groupKey) {
        groupKeys.add(entry.groupKey);
      }

      for (const ip of entry.resolvedIps ?? []) {
        resolvedIps.add(ip);
      }

      candidateMap.set(normalized, {
        origin: normalized,
        source: entry.source,
        name: entry.name,
        version: entry.version,
        groupKeys,
        resolvedIps,
      });

      return;
    }

    if (entry.groupKey) {
      existing.groupKeys.add(entry.groupKey);
    }

    for (const ip of entry.resolvedIps ?? []) {
      existing.resolvedIps.add(ip);
    }

    if (entry.source === 'mdns' && existing.source !== 'mdns') {
      existing.source = 'mdns';
      existing.name = entry.name ?? existing.name;
      existing.version = entry.version ?? existing.version;

      return;
    }

    existing.name ??= entry.name;
    existing.version ??= entry.version;
  };

  for (const entry of mdnsCandidates) {
    registerCandidate(entry);
  }

  for (const host of openSubnetHosts) {
    const origin = `http://${host}:${DEFAULT_HA_PORT}`;

    registerCandidate({ origin, source: classifyOriginSource(origin) });
  }

  for (const origin of options.wellKnownOrigins ?? DEFAULT_WELL_KNOWN_ORIGINS) {
    registerCandidate({ origin, source: classifyOriginSource(origin) });
  }

  for (const origin of options.extraOrigins ?? []) {
    const normalized = tryNormalizeOrigin(origin);

    if (normalized) {
      registerCandidate({ origin: normalized, source: classifyOriginSource(normalized) });
    }
  }

  const verified: InternalCandidate[] = [];

  await runWithConcurrency([...candidateMap.values()], 16, async (candidate) => {
    const ok = await probeHomeAssistantAuth(candidate.origin, {
      fetch: options.fetch,
      timeoutMs: probeTimeoutMs,
    });

    if (ok) {
      verified.push(candidate);
    }
  });

  // Check local loopback only after other probes; prefer localhost over 127.0.0.1.
  if (options.includeLoopback ?? true) {
    const loopbackCandidates = ['http://localhost:8123', 'http://127.0.0.1:8123'];

    for (const loopback of loopbackCandidates) {
      if (verified.some((item) => item.origin === loopback)) {
        break;
      }

      if (
        await probeHomeAssistantAuth(loopback, { fetch: options.fetch, timeoutMs: probeTimeoutMs })
      ) {
        verified.push({
          origin: loopback,
          source: 'local',
          groupKeys: new Set(),
          resolvedIps: new Set(),
        });
        break;
      }
    }
  }

  if (verified.length === 0) {
    return [];
  }

  // Attach host:port endpoint keys to group aliases pointing to the same HA socket (e.g. LAN IP + .local hostname).
  await runWithConcurrency(verified, 16, async (candidate) => {
    const url = new URL(candidate.origin);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const port = originEndpointPort(url);

    if (net.isIP(hostname) !== 0) {
      candidate.groupKeys.add(`endpoint:${hostname}:${port}`);

      return;
    }

    for (const ip of candidate.resolvedIps) {
      candidate.groupKeys.add(`endpoint:${ip}:${port}`);
    }

    if (candidate.resolvedIps.size === 0) {
      const ips = await resolveHostAddresses(hostname);

      for (const ip of ips) {
        candidate.groupKeys.add(`endpoint:${ip}:${port}`);
      }
    }
  });

  // Union-Find merge candidates that share any mDNS instance key or resolved endpoint.
  const parent = verified.map((_item, index) => index);
  const findRoot = (index: number): number => {
    let root = index;

    while (parent[root] !== root) {
      root = parent[root]!;
    }

    let cursor = index;

    while (parent[cursor] !== root) {
      const next = parent[cursor]!;

      parent[cursor] = root;
      cursor = next;
    }

    return root;
  };
  const union = (left: number, right: number) => {
    const leftRoot = findRoot(left);
    const rightRoot = findRoot(right);

    if (leftRoot !== rightRoot) {
      parent[rightRoot] = leftRoot;
    }
  };

  const firstByKey = new Map<string, number>();

  for (let index = 0; index < verified.length; index += 1) {
    for (const key of verified[index]!.groupKeys) {
      const owner = firstByKey.get(key);

      if (owner === undefined) {
        firstByKey.set(key, index);
      } else {
        union(owner, index);
      }
    }
  }

  const components = new Map<number, InternalCandidate[]>();

  for (let index = 0; index < verified.length; index += 1) {
    const root = findRoot(index);
    const group = components.get(root) ?? [];

    group.push(verified[index]!);
    components.set(root, group);
  }

  const grouped: DiscoveredHomeAssistant[] = [];

  for (const members of components.values()) {
    const sortedMembers = [...members].sort((left, right) => {
      const sourceDiff = sourceRank(left.source) - sourceRank(right.source);

      if (sourceDiff !== 0) {
        return sourceDiff;
      }

      return compareOrigins(left.origin, right.origin);
    });

    const origins = [...new Set(sortedMembers.map((member) => member.origin))].sort(compareOrigins);
    const bestSource = sortedMembers[0]!.source;
    const name = sortedMembers.find((member) => member.name)?.name;
    const version = sortedMembers.find((member) => member.version)?.version;

    grouped.push({
      origin: origins[0]!,
      origins,
      source: bestSource,
      ...(name ? { name } : {}),
      ...(version ? { version } : {}),
    });
  }

  grouped.sort((left, right) => {
    const rankDiff = sourceRank(left.source) - sourceRank(right.source);

    if (rankDiff !== 0) {
      return rankDiff;
    }

    return left.origin.localeCompare(right.origin);
  });

  return grouped;
}
