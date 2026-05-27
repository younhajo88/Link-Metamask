import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createActionLog, type ActionLogEntry } from './logger';

/**
 * WalletConnect 세션 이벤트를 모니터링하여 진단 로그로 출력합니다.
 * session_update가 실제로 오는지 확인하기 위한 진단 도구입니다.
 */
export function useWcSessionMonitor(onLog: (entry: ActionLogEntry) => void) {
  const { connector, isConnected } = useAccount();
  const onLogRef = useRef(onLog);
  onLogRef.current = onLog;

  useEffect(() => {
    if (!isConnected || !connector) return;
    if (connector.id !== 'walletConnect') return;

    let cleanup: (() => void) | undefined;

    async function attach() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let provider: any;
      try {
        provider = await connector!.getProvider();
      } catch {
        return;
      }
      if (!provider) return;

      const log = (action: string, details: unknown) => {
        onLogRef.current(createActionLog(action, 'success', details));
        console.log(`[WC] ${action}`, details);
      };

      // 현재 세션 정보 출력
      const session = provider.session;
      if (session) {
        log('wc:session_snapshot', {
          topic: session.topic,
          chains: session.namespaces?.eip155?.chains ?? [],
          accounts: session.namespaces?.eip155?.accounts ?? [],
          methods: session.namespaces?.eip155?.methods ?? [],
          expiry: session.expiry,
        });
      }

      // UniversalProvider 이벤트
      const providerEvents = [
        'session_update',
        'session_delete',
        'session_event',
        'session_expire',
        'disconnect',
        'chainChanged',
        'accountsChanged',
      ] as const;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlers: Array<{ target: any; event: string; fn: (...args: any[]) => void }> = [];

      for (const event of providerEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (...args: any[]) => log(`wc:${event}`, { args });
        provider.on(event, fn);
        handlers.push({ target: provider, event, fn });
      }

      // SignClient 이벤트 (더 저수준)
      const client = provider.client;
      if (client) {
        const clientEvents = [
          'session_update',
          'session_delete',
          'session_event',
          'session_expire',
        ] as const;

        for (const event of clientEvents) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fn = (...args: any[]) => log(`wc:signClient:${event}`, { args });
          client.on(event, fn);
          handlers.push({ target: client, event, fn });
        }
      }

      cleanup = () => {
        for (const { target, event, fn } of handlers) {
          try {
            target.off(event, fn);
          } catch {
            // provider already destroyed
          }
        }
      };
    }

    attach();

    return () => {
      cleanup?.();
    };
  }, [isConnected, connector]);
}
