import { useState } from 'react';
import { ActionsPanel } from './components/ActionsPanel';
import { ConnectionPanel } from './components/ConnectionPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { StatusPanel } from './components/StatusPanel';
import type { ActionLogEntry } from './diagnostics/logger';
import { createActionLog, pushActionLog } from './diagnostics/logger';
import { useWcSessionMonitor } from './diagnostics/useWcSessionMonitor';
import { appVersion } from './version';

export function App() {
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);

  function addLog(entry: ActionLogEntry) {
    setLogs((current) => pushActionLog(current, entry));
  }

  useWcSessionMonitor(addLog);

  function clearLocalState() {
    localStorage.clear();
    sessionStorage.clear();
    addLog(createActionLog('clear_local_state', 'success', { cleared: true }));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">MetaMask Link Test</p>
          <h1>MetaMask 연결 테스트</h1>
          <p>
            데스크톱 확장 프로그램과 모바일 WalletConnect 연결을 같은 화면에서 검증합니다.
          </p>
        </div>
        <div className="hero-meter" aria-hidden="true">
          <span>Extension</span>
          <span>WalletConnect</span>
          <span>Diagnostics</span>
        </div>
      </header>
      <div className="dashboard-grid">
        <ConnectionPanel onClearLocalState={clearLocalState} />
        <StatusPanel />
        <ActionsPanel onLog={addLog} />
        <DiagnosticsPanel logs={logs} onClearLogs={() => setLogs([])} />
      </div>
      <footer className="app-footer">
        <span>Version {appVersion.version}</span>
        <span>Commit {appVersion.commit}</span>
        <span>Built {new Date(appVersion.buildTime).toLocaleString()}</span>
      </footer>
    </main>
  );
}
