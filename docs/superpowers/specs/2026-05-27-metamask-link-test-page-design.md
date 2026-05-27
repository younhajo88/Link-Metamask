# MetaMask Link Test Page Design

## Goal

Build a frontend-only wallet test page that supports both desktop Chrome MetaMask extension connections and mobile external-browser connections to the MetaMask Android/iOS app through WalletConnect/Reown AppKit.

The page is for practical QA: connect a wallet, inspect state, run common wallet actions, and diagnose intermittent mobile session issues without adding a backend.

## Technical Approach

Use Vite, React, TypeScript, Wagmi, Viem, and Reown AppKit.

- Vite keeps the project lightweight and easy to run locally.
- React gives the test surface enough structure for separate panels and reusable controls.
- Wagmi and Viem provide stable Ethereum account, chain, transaction, and signing APIs.
- Reown AppKit provides WalletConnect mobile session support and wallet selection UI.

No custom backend is included. WalletConnect session traffic goes between the browser app, the WalletConnect/Reown relay, and MetaMask. The local app only manages UI state, wallet requests, configuration, and browser-side diagnostics.

## Features

The first version will include:

- Wallet connection panel
  - Desktop MetaMask extension connection.
  - Mobile WalletConnect connection through Reown AppKit.
  - Clear connected account, connector name, chain ID, and network name.
- Diagnostics panel
  - Current wallet state.
  - Last action, request intent, result, and error.
  - Browser/device hints based on user agent.
  - Session cleanup actions such as disconnect and local wallet state reset.
- Wallet action tests
  - Account and balance lookup.
  - Native coin transfer.
  - ERC-20 token transfer.
  - Network switch and add-chain flow.
  - `personal_sign`.
  - EIP-712 typed data signing.

## Safety

The page must default to test-friendly behavior.

- Prefer testnet defaults.
- Require manual recipient and amount input for transfers.
- Show the active chain before transfer or signing.
- Surface wallet rejection and chain mismatch errors clearly.
- Keep destructive session cleanup as explicit button actions.

## Configuration

Use frontend environment variables for values that differ by user or deployment:

- `VITE_REOWN_PROJECT_ID`
- Optional RPC URLs for supported chains.

Network and token examples live in source configuration files so they can later be replaced by a backend `/config` endpoint if needed.

## Future Backend Extension

If mobile session issues need long-term tracking, add a small backend later without changing wallet connection architecture.

Potential backend responsibilities:

- Serve network/token configuration.
- Store action logs and error reports.
- Compare results by device, browser, chain, and connector.

The backend will not relay wallet sessions or approve wallet actions.

## Testing

Verify:

- App builds successfully.
- Desktop Chrome with MetaMask extension can connect and run read/sign actions.
- Mobile external browsers can open WalletConnect/Reown flow to MetaMask app.
- Disconnect and local state reset make stale sessions easier to recover from.
- Error states are visible for rejection, missing project ID, unsupported chain, and failed RPC requests.
