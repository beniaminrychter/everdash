import { OAuthFlowError } from './oauth-flow-error';
import { parseHomeAssistantOrigin } from './origin';

interface Socket {
  addEventListener: (type: string, listener: (event: { data: unknown }) => void) => void;
  send: (data: string) => void;
  close: () => void;
}

export interface IdentityOptions {
  socketFactory?: (url: string) => Socket;
  timeoutMs?: number;
}

export function verifyAdmin(
  origin: string,
  accessToken: string,
  options: IdentityOptions = {},
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    let socket: Socket | undefined;
    let done = false;
    let phase = 0;
    const timeout: { timer?: ReturnType<typeof setTimeout> } = {};
    function finish(id?: string, error?: Error) {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout.timer);
      try {
        socket?.close();
      } catch {
        /* cleanup is best effort */
      }
      if (id) {
        resolve({ id });
      } else {
        reject(error ?? new Error('Home Assistant identity verification failed.'));
      }
    }
    timeout.timer = setTimeout(() => finish(), options.timeoutMs ?? 10_000);
    try {
      const url = new URL('/api/websocket', parseHomeAssistantOrigin(origin));
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = options.socketFactory
        ? options.socketFactory(url.toString())
        : new WebSocket(url.toString());
      socket.addEventListener('error', () => finish());
      socket.addEventListener('close', () => finish());
      socket.addEventListener('message', (event: { data: unknown }) => {
        try {
          if (typeof event.data !== 'string' || Buffer.byteLength(event.data) > 65536) {
            finish();
            return;
          }
          const frame: unknown = JSON.parse(event.data);
          if (!frame || typeof frame !== 'object' || Array.isArray(frame)) {
            finish();
            return;
          }
          const data = frame as Record<string, unknown>;
          if (phase === 0 && data.type === 'auth_required') {
            phase = 1;
            socket?.send(JSON.stringify({ type: 'auth', access_token: accessToken }));
          } else if (phase === 1 && data.type === 'auth_ok') {
            phase = 2;
            socket?.send(JSON.stringify({ id: 1, type: 'auth/current_user' }));
          } else if (
            phase === 2 &&
            data.type === 'result' &&
            data.id === 1 &&
            data.success === true &&
            data.result &&
            typeof data.result === 'object' &&
            !Array.isArray(data.result)
          ) {
            const user = data.result as Record<string, unknown>;
            if (typeof user.id !== 'string' || !user.id.trim()) {
              finish();
              return;
            }

            if (user.is_admin !== true) {
              finish(undefined, new OAuthFlowError('NOT_ADMIN'));
              return;
            }

            finish(user.id);
          } else {
            finish();
          }
        } catch {
          finish();
        }
      });
    } catch {
      finish();
    }
  });
}
