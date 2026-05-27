# MetaMask Link Test Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frontend-only MetaMask wallet test page for desktop extension and mobile WalletConnect/Reown AppKit flows.

**Architecture:** Use a Vite React TypeScript app with focused modules for wallet configuration, diagnostics, wallet actions, and UI panels. Reown AppKit owns wallet connection UX, Wagmi owns React wallet state, and Viem owns Ethereum RPC/transaction/signing primitives.

**Tech Stack:** Vite, React, TypeScript, Wagmi, Viem, Reown AppKit, Vitest, Testing Library.

---

## File Structure

- Create: `package.json` - scripts and dependencies.
- Create: `index.html` - Vite HTML entry.
- Create: `vite.config.ts` - React and Vitest configuration.
- Create: `tsconfig.json` - TypeScript config.
- Create: `.env.example` - Reown project ID and optional RPC settings.
- Create: `src/main.tsx` - React entrypoint.
- Create: `src/App.tsx` - page composition.
- Create: `src/styles.css` - responsive app styling.
- Create: `src/wallet/chains.ts` - supported chains and token examples.
- Create: `src/wallet/appKit.ts` - Wagmi and Reown AppKit setup.
- Create: `src/wallet/actions.ts` - balance, transfer, network, and signing helpers.
- Create: `src/wallet/actions.test.ts` - unit tests for pure wallet action helpers.
- Create: `src/diagnostics/logger.ts` - browser-side action log state.
- Create: `src/diagnostics/logger.test.ts` - logger unit tests.
- Create: `src/diagnostics/browser.ts` - browser/device hint detection.
- Create: `src/components/ConnectionPanel.tsx` - connect/disconnect/session controls.
- Create: `src/components/StatusPanel.tsx` - connected account, chain, connector, balance state.
- Create: `src/components/ActionsPanel.tsx` - wallet test forms.
- Create: `src/components/DiagnosticsPanel.tsx` - action/error log display and reset tools.
- Create: `README.md` - setup, Reown project ID, and mobile testing notes.

---

### Task 1: Scaffold the Vite React App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "metamask-link",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run"
  },
  "dependencies": {
    "@reown/appkit": "^1.8.20",
    "@reown/appkit-adapter-wagmi": "^1.8.20",
    "@tanstack/react-query": "^5.100.14",
    "viem": "^2.51.2",
    "wagmi": "^3.6.16",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^6.0.2",
    "typescript": "^6.0.3",
    "vite": "^8.0.14",
    "vitest": "^4.1.7"
  }
}
```

- [ ] **Step 2: Create the Vite entry files**

`index.html`

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MetaMask Link Test</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`vite.config.ts`

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
```

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

- [ ] **Step 3: Create the initial React shell**

`src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">MetaMask Link Test</p>
        <h1>MetaMask 연결 테스트</h1>
        <p>
          데스크톱 확장 프로그램과 모바일 WalletConnect 연결을 같은 화면에서 검증합니다.
        </p>
      </header>
    </main>
  );
}
```

`src/styles.css`

```css
:root {
  color: #17202a;
  background: #f5f7fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.hero {
  margin-bottom: 24px;
}

.eyebrow {
  color: #256f78;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
}

h1 {
  font-size: 34px;
  line-height: 1.15;
  margin: 0 0 12px;
}

p {
  line-height: 1.6;
}
```

- [ ] **Step 4: Install dependencies and verify the shell**

Run: `npm install`

Run: `npm run build`

Expected: TypeScript and Vite build finish without errors and create `dist/`.

---

### Task 2: Configure Wagmi and Reown AppKit

**Files:**
- Create: `.env.example`
- Create: `src/wallet/chains.ts`
- Create: `src/wallet/appKit.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add environment example**

`.env.example`

```env
VITE_REOWN_PROJECT_ID=replace-with-reown-project-id
VITE_SEPOLIA_RPC_URL=
VITE_POLYGON_AMOY_RPC_URL=
```

- [ ] **Step 2: Add supported chains and token examples**

`src/wallet/chains.ts`

```ts
import { polygonAmoy, sepolia } from 'wagmi/chains';

export const supportedChains = [sepolia, polygonAmoy] as const;

export type SupportedChainId = (typeof supportedChains)[number]['id'];

export const tokenExamples: Record<
  SupportedChainId,
  Array<{ symbol: string; address: `0x${string}`; decimals: number }>
> = {
  [sepolia.id]: [],
  [polygonAmoy.id]: [],
};

export function getChainName(chainId?: number) {
  return supportedChains.find((chain) => chain.id === chainId)?.name ?? 'Unknown';
}
```

- [ ] **Step 3: Add AppKit and Wagmi config**

`src/wallet/appKit.ts`

```ts
import { QueryClient } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';
import { polygonAmoy, sepolia } from 'wagmi/chains';
import { supportedChains } from './chains';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;

if (!projectId || projectId === 'replace-with-reown-project-id') {
  console.warn('VITE_REOWN_PROJECT_ID is not configured. WalletConnect will not work.');
}

export const queryClient = new QueryClient();

export const wagmiAdapter = new WagmiAdapter({
  networks: supportedChains,
  projectId: projectId ?? '',
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
    [polygonAmoy.id]: http(import.meta.env.VITE_POLYGON_AMOY_RPC_URL || undefined),
  },
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: supportedChains,
  projectId: projectId ?? '',
  metadata: {
    name: 'MetaMask Link Test',
    description: 'Desktop extension and mobile WalletConnect test page',
    url: window.location.origin,
    icons: [`${window.location.origin}/favicon.svg`],
  },
  features: {
    analytics: false,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
```

- [ ] **Step 4: Wrap the app with providers**

Modify `src/main.tsx` to:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import './styles.css';
import { App } from './App';
import { queryClient, wagmiConfig } from './wallet/appKit';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 5: Verify configuration compiles**

Run: `npm run build`

Expected: Build passes. If AppKit package APIs changed, adjust imports using the installed package docs and keep the same module boundary.

---

### Task 3: Add Diagnostics Utilities

**Files:**
- Create: `src/diagnostics/logger.ts`
- Create: `src/diagnostics/logger.test.ts`
- Create: `src/diagnostics/browser.ts`

- [ ] **Step 1: Write logger tests**

`src/diagnostics/logger.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { createActionLog, pushActionLog } from './logger';

describe('diagnostics logger', () => {
  it('adds newest entries first and keeps the configured limit', () => {
    const first = createActionLog('connect', 'success', { connector: 'walletConnect' });
    const second = createActionLog('sign', 'error', { message: 'Rejected' });

    const log = pushActionLog(pushActionLog([], first, 1), second, 1);

    expect(log).toHaveLength(1);
    expect(log[0].action).toBe('sign');
    expect(log[0].status).toBe('error');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- src/diagnostics/logger.test.ts`

Expected: FAIL because `src/diagnostics/logger.ts` does not exist yet.

- [ ] **Step 3: Implement logger**

`src/diagnostics/logger.ts`

```ts
export type ActionLogStatus = 'idle' | 'pending' | 'success' | 'error';

export interface ActionLogEntry {
  id: string;
  action: string;
  status: ActionLogStatus;
  details: unknown;
  createdAt: string;
}

export function createActionLog(
  action: string,
  status: ActionLogStatus,
  details: unknown,
): ActionLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    status,
    details,
    createdAt: new Date().toISOString(),
  };
}

export function pushActionLog(
  entries: ActionLogEntry[],
  entry: ActionLogEntry,
  limit = 30,
): ActionLogEntry[] {
  return [entry, ...entries].slice(0, limit);
}

export function toErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
```

- [ ] **Step 4: Implement browser hints**

`src/diagnostics/browser.ts`

```ts
export interface BrowserHints {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  browser: 'safari' | 'chrome' | 'samsung-internet' | 'other';
  isMobile: boolean;
}

export function detectBrowserHints(userAgent = navigator.userAgent): BrowserHints {
  const ua = userAgent.toLowerCase();
  const isAndroid = ua.includes('android');
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSamsung = ua.includes('samsungbrowser');
  const isChrome = ua.includes('chrome') || ua.includes('crios');
  const isSafari = ua.includes('safari') && !isChrome && !isSamsung;

  return {
    platform: isIos ? 'ios' : isAndroid ? 'android' : ua ? 'desktop' : 'unknown',
    browser: isSamsung ? 'samsung-internet' : isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
    isMobile: isIos || isAndroid,
  };
}
```

- [ ] **Step 5: Verify diagnostics tests**

Run: `npm test -- src/diagnostics/logger.test.ts`

Expected: PASS.

---

### Task 4: Add Wallet Action Helpers

**Files:**
- Create: `src/wallet/actions.ts`
- Create: `src/wallet/actions.test.ts`

- [ ] **Step 1: Write action helper tests**

`src/wallet/actions.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { erc20Abi, prepareNativeTransfer, prepareTypedData } from './actions';

describe('wallet action helpers', () => {
  it('prepares a native transfer request', () => {
    const request = prepareNativeTransfer('0x0000000000000000000000000000000000000001', '0.01');

    expect(request.to).toBe('0x0000000000000000000000000000000000000001');
    expect(request.value).toBe(10_000_000_000_000_000n);
  });

  it('exposes an ERC-20 transfer ABI fragment', () => {
    expect(erc20Abi[0].name).toBe('transfer');
  });

  it('prepares typed data with the active chain id', () => {
    const typedData = prepareTypedData(11155111, '0x0000000000000000000000000000000000000001');

    expect(typedData.domain.chainId).toBe(11155111);
    expect(typedData.message.wallet).toBe('0x0000000000000000000000000000000000000001');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- src/wallet/actions.test.ts`

Expected: FAIL because `src/wallet/actions.ts` does not exist yet.

- [ ] **Step 3: Implement helper functions**

`src/wallet/actions.ts`

```ts
import { parseEther, parseUnits } from 'viem';

export const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function prepareNativeTransfer(to: `0x${string}`, amountEth: string) {
  return {
    to,
    value: parseEther(amountEth),
  };
}

export function prepareTokenTransferArgs(to: `0x${string}`, amount: string, decimals: number) {
  return [to, parseUnits(amount, decimals)] as const;
}

export function preparePersonalSignMessage(address: `0x${string}`) {
  return `MetaMask Link Test signature request for ${address} at ${new Date().toISOString()}`;
}

export function prepareTypedData(chainId: number, address: `0x${string}`) {
  return {
    domain: {
      name: 'MetaMask Link Test',
      version: '1',
      chainId,
    },
    types: {
      TestMessage: [
        { name: 'wallet', type: 'address' },
        { name: 'purpose', type: 'string' },
      ],
    },
    primaryType: 'TestMessage',
    message: {
      wallet: address,
      purpose: 'Verify EIP-712 signing from the test page',
    },
  } as const;
}
```

- [ ] **Step 4: Verify action tests**

Run: `npm test -- src/wallet/actions.test.ts`

Expected: PASS.

---

### Task 5: Build the Main UI Panels

**Files:**
- Create: `src/components/ConnectionPanel.tsx`
- Create: `src/components/StatusPanel.tsx`
- Create: `src/components/DiagnosticsPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create connection panel**

`src/components/ConnectionPanel.tsx`

```tsx
import { useAppKit } from '@reown/appkit/react';
import { useDisconnect } from 'wagmi';

interface ConnectionPanelProps {
  onClearLocalState: () => void;
}

export function ConnectionPanel({ onClearLocalState }: ConnectionPanelProps) {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>지갑 연결</h2>
        <span>Extension / WalletConnect</span>
      </div>
      <div className="button-row">
        <button type="button" className="primary-button" onClick={() => open()}>
          Connect Wallet
        </button>
        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
        <button type="button" onClick={onClearLocalState}>
          Clear Local State
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create status panel**

`src/components/StatusPanel.tsx`

```tsx
import { useAccount, useBalance, useChainId } from 'wagmi';
import { getChainName } from '../wallet/chains';

export function StatusPanel() {
  const account = useAccount();
  const chainId = useChainId();
  const balance = useBalance({ address: account.address });

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>현재 상태</h2>
        <span>{account.isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <dl className="status-grid">
        <div>
          <dt>Address</dt>
          <dd>{account.address ?? '-'}</dd>
        </div>
        <div>
          <dt>Connector</dt>
          <dd>{account.connector?.name ?? '-'}</dd>
        </div>
        <div>
          <dt>Chain</dt>
          <dd>{chainId ? `${getChainName(chainId)} (${chainId})` : '-'}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>{balance.data ? `${balance.data.formatted} ${balance.data.symbol}` : '-'}</dd>
        </div>
      </dl>
    </section>
  );
}
```

- [ ] **Step 3: Create diagnostics panel**

`src/components/DiagnosticsPanel.tsx`

```tsx
import type { ActionLogEntry } from '../diagnostics/logger';
import { detectBrowserHints } from '../diagnostics/browser';

interface DiagnosticsPanelProps {
  logs: ActionLogEntry[];
  onClearLogs: () => void;
}

export function DiagnosticsPanel({ logs, onClearLogs }: DiagnosticsPanelProps) {
  const hints = detectBrowserHints();

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>진단 로그</h2>
        <button type="button" onClick={onClearLogs}>Clear Logs</button>
      </div>
      <div className="hint-row">
        <span>{hints.platform}</span>
        <span>{hints.browser}</span>
      </div>
      <div className="log-list">
        {logs.length === 0 ? (
          <p className="muted">아직 기록된 액션이 없습니다.</p>
        ) : (
          logs.map((log) => (
            <article key={log.id} className={`log-entry ${log.status}`}>
              <strong>{log.action}</strong>
              <span>{log.status}</span>
              <time>{log.createdAt}</time>
              <pre>{JSON.stringify(log.details, null, 2)}</pre>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Compose panels in `App.tsx`**

Modify `src/App.tsx` to:

```tsx
import { useState } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { StatusPanel } from './components/StatusPanel';
import type { ActionLogEntry } from './diagnostics/logger';
import { createActionLog, pushActionLog } from './diagnostics/logger';

export function App() {
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);

  function addLog(entry: ActionLogEntry) {
    setLogs((current) => pushActionLog(current, entry));
  }

  function clearLocalState() {
    localStorage.clear();
    sessionStorage.clear();
    addLog(createActionLog('clear_local_state', 'success', { cleared: true }));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">MetaMask Link Test</p>
        <h1>MetaMask 연결 테스트</h1>
        <p>
          데스크톱 확장 프로그램과 모바일 WalletConnect 연결을 같은 화면에서 검증합니다.
        </p>
      </header>
      <div className="dashboard-grid">
        <ConnectionPanel onClearLocalState={clearLocalState} />
        <StatusPanel />
        <DiagnosticsPanel logs={logs} onClearLogs={() => setLogs([])} />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Add panel styles**

Append to `src/styles.css`:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(23, 32, 42, 0.06);
}

.panel-heading {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-heading h2 {
  font-size: 18px;
  margin: 0;
}

.panel-heading span {
  color: #5f6f82;
  font-size: 13px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  border: 1px solid #b8c7d6;
  border-radius: 6px;
  background: #ffffff;
  color: #17202a;
  cursor: pointer;
  min-height: 40px;
  padding: 8px 12px;
}

.primary-button {
  background: #256f78;
  border-color: #256f78;
  color: #ffffff;
}

.status-grid {
  display: grid;
  gap: 12px;
  margin: 0;
}

.status-grid div {
  min-width: 0;
}

.status-grid dt {
  color: #5f6f82;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.status-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.hint-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.hint-row span {
  background: #e8f2f3;
  border-radius: 999px;
  color: #256f78;
  font-size: 12px;
  padding: 4px 8px;
}

.log-list {
  display: grid;
  gap: 10px;
}

.muted {
  color: #5f6f82;
}

.log-entry {
  border: 1px solid #d9e2ec;
  border-radius: 6px;
  padding: 10px;
}

.log-entry pre {
  background: #f5f7fb;
  border-radius: 6px;
  margin: 8px 0 0;
  overflow: auto;
  padding: 10px;
  white-space: pre-wrap;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100% - 24px, 1180px);
    padding-top: 20px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Verify UI build**

Run: `npm run build`

Expected: PASS.

---

### Task 6: Add Wallet Action Test Forms

**Files:**
- Create: `src/components/ActionsPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create actions panel**

`src/components/ActionsPanel.tsx`

```tsx
import { useState } from 'react';
import { useAccount, useChainId, useSendTransaction, useSignMessage, useSignTypedData, useSwitchChain, useWriteContract } from 'wagmi';
import { erc20Abi, prepareNativeTransfer, preparePersonalSignMessage, prepareTokenTransferArgs, prepareTypedData } from '../wallet/actions';
import { supportedChains } from '../wallet/chains';
import { createActionLog, toErrorDetails, type ActionLogEntry } from '../diagnostics/logger';

interface ActionsPanelProps {
  onLog: (entry: ActionLogEntry) => void;
}

export function ActionsPanel({ onLog }: ActionsPanelProps) {
  const account = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');

  async function runAction(action: string, callback: () => Promise<unknown>) {
    onLog(createActionLog(action, 'pending', { chainId, address: account.address }));
    try {
      const result = await callback();
      onLog(createActionLog(action, 'success', result));
    } catch (error) {
      onLog(createActionLog(action, 'error', toErrorDetails(error)));
    }
  }

  return (
    <section className="panel actions-panel">
      <div className="panel-heading">
        <h2>기능 테스트</h2>
        <span>{chainId ? `Chain ${chainId}` : 'No chain'}</span>
      </div>

      <div className="form-grid">
        <label>
          Recipient
          <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x..." />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.01" />
        </label>
        <label>
          Token Address
          <input value={tokenAddress} onChange={(event) => setTokenAddress(event.target.value)} placeholder="0x..." />
        </label>
        <label>
          Token Decimals
          <input value={tokenDecimals} onChange={(event) => setTokenDecimals(event.target.value)} placeholder="18" />
        </label>
      </div>

      <div className="button-row">
        {supportedChains.map((chain) => (
          <button
            key={chain.id}
            type="button"
            onClick={() => runAction('switch_chain', () => switchChainAsync({ chainId: chain.id }))}
          >
            Switch {chain.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            runAction('native_transfer', () =>
              sendTransactionAsync(prepareNativeTransfer(recipient as `0x${string}`, amount)),
            )
          }
        >
          Send Native
        </button>
        <button
          type="button"
          onClick={() =>
            runAction('erc20_transfer', () =>
              writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'transfer',
                args: prepareTokenTransferArgs(recipient as `0x${string}`, amount, Number(tokenDecimals)),
              }),
            )
          }
        >
          Send ERC-20
        </button>
        <button
          type="button"
          onClick={() =>
            runAction('personal_sign', () =>
              signMessageAsync({ message: preparePersonalSignMessage(account.address as `0x${string}`) }),
            )
          }
        >
          Personal Sign
        </button>
        <button
          type="button"
          onClick={() =>
            runAction('typed_data_sign', () =>
              signTypedDataAsync(prepareTypedData(chainId, account.address as `0x${string}`)),
            )
          }
        >
          Typed Data Sign
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add actions panel to `App.tsx`**

Modify `src/App.tsx` to include:

```tsx
import { ActionsPanel } from './components/ActionsPanel';
```

Then render it in `.dashboard-grid`:

```tsx
<ActionsPanel onLog={addLog} />
```

- [ ] **Step 3: Add action form styles**

Append to `src/styles.css`:

```css
.actions-panel {
  grid-column: 1 / -1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

label {
  color: #34495e;
  display: grid;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
}

input {
  border: 1px solid #b8c7d6;
  border-radius: 6px;
  min-height: 40px;
  padding: 8px 10px;
  width: 100%;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Verify action UI build**

Run: `npm run build`

Expected: PASS.

---

### Task 7: Add Documentation and Manual QA Checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write setup and testing documentation**

`README.md`

```md
# MetaMask Link Test

Frontend-only test page for MetaMask desktop extension and mobile MetaMask app connections through WalletConnect/Reown AppKit.

## Setup

1. Create a Reown project at https://cloud.reown.com.
2. Copy `.env.example` to `.env`.
3. Set `VITE_REOWN_PROJECT_ID`.
4. Run `npm install`.
5. Run `npm run dev`.

## Desktop Test

Open the local URL in Chrome with the MetaMask extension installed.

- Connect wallet.
- Confirm address, connector, chain, and balance.
- Switch test networks.
- Run `personal_sign` and EIP-712 typed data signing.
- Use transfer tests only with testnet funds.

## Mobile External Browser Test

Open the dev server URL from Safari, Chrome, or Samsung Internet on the mobile device.

- The dev server uses `--host 0.0.0.0`; use the PC LAN IP address from the phone.
- Connect wallet and choose MetaMask through Reown AppKit.
- Approve the connection in the MetaMask app.
- Return to the browser and confirm account, connector, and chain state.

## Session Troubleshooting

If mobile connection behaves inconsistently:

- Tap `Disconnect`.
- Tap `Clear Local State`.
- In MetaMask app settings, remove old WalletConnect sessions for this test page.
- Reopen the mobile browser page and connect again.

## Safety

Use testnets first. The page can request real transfers if connected to a mainnet and valid transaction fields are entered.
```

- [ ] **Step 2: Run final verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Start the dev server for browser verification**

Run: `npm run dev`

Expected: Vite prints a local and network URL. Use the network URL for mobile testing.

---

## Self-Review

- Spec coverage: The plan covers frontend-only architecture, desktop extension, mobile WalletConnect/Reown AppKit, diagnostics, session cleanup, wallet actions, testnet defaults, and future backend extension boundaries.
- Placeholder scan: No unfinished placeholder markers are present.
- Type consistency: `ActionLogEntry`, `createActionLog`, `pushActionLog`, wallet action helper names, and component props are defined before use.
