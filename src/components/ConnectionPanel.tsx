import { lazy, Suspense } from 'react';
import { Eraser, LogOut, Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { isProjectIdConfigured } from '../wallet/appKit';

const AppKitConnectButton = lazy(() => import('./AppKitConnectButton'));

interface ConnectionPanelProps {
  onClearLocalState: () => void;
}

export function ConnectionPanel({ onClearLocalState }: ConnectionPanelProps) {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const injectedConnector = connectors.find((connector) => connector.type === 'injected') ?? connectors[0];

  return (
    <section className="panel connection-panel">
      <div className="panel-heading">
        <div>
          <h2>지갑 연결</h2>
          <span>Extension / WalletConnect</span>
        </div>
        <span className={isConnected ? 'state-pill connected' : 'state-pill'}>
          {isConnected ? 'Connected' : 'Idle'}
        </span>
      </div>

      {!isProjectIdConfigured && (
        <p className="warning-text">
          WalletConnect 모바일 연결에는 .env의 VITE_REOWN_PROJECT_ID 설정이 필요합니다.
        </p>
      )}

      <div className="button-row">
        {isProjectIdConfigured ? (
          <Suspense
            fallback={
              <button type="button" className="primary-button" disabled>
                <Wallet size={17} />
                Loading Wallet
              </button>
            }
          >
            <AppKitConnectButton />
          </Suspense>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            disabled={!injectedConnector}
          >
            <Wallet size={17} />
            Connect MetaMask
          </button>
        )}
        <button type="button" onClick={() => disconnect()} disabled={!isConnected}>
          <LogOut size={17} />
          Disconnect
        </button>
        <button type="button" onClick={onClearLocalState}>
          <Eraser size={17} />
          Clear Local State
        </button>
      </div>
    </section>
  );
}
