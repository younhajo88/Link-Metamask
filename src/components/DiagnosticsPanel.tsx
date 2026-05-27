import { Trash2 } from 'lucide-react';
import { detectBrowserHints } from '../diagnostics/browser';
import { formatLogDetails, type ActionLogEntry } from '../diagnostics/logger';

interface DiagnosticsPanelProps {
  logs: ActionLogEntry[];
  onClearLogs: () => void;
}

export function DiagnosticsPanel({ logs, onClearLogs }: DiagnosticsPanelProps) {
  const hints = detectBrowserHints();

  return (
    <section className="panel diagnostics-panel">
      <div className="panel-heading">
        <div>
          <h2>진단 로그</h2>
          <span>Request / Result / Error</span>
        </div>
        <button type="button" onClick={onClearLogs} disabled={logs.length === 0}>
          <Trash2 size={16} />
          Clear
        </button>
      </div>
      <div className="hint-row">
        <span>{hints.platform}</span>
        <span>{hints.browser}</span>
        <span>{hints.isMobile ? 'mobile' : 'desktop'}</span>
      </div>
      <div className="log-list">
        {logs.length === 0 ? (
          <p className="muted">아직 기록된 액션이 없습니다.</p>
        ) : (
          logs.map((log) => (
            <article key={log.id} className={`log-entry ${log.status}`}>
              <header>
                <strong>{log.action}</strong>
                <span>{log.status}</span>
                <time>{new Date(log.createdAt).toLocaleTimeString()}</time>
              </header>
              <pre>{formatLogDetails(log.details)}</pre>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
