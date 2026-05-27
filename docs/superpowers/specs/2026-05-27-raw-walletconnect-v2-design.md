# Raw WalletConnect v2 Test Tab Design

## Goal

Add a Raw WalletConnect v2 test tab alongside the current AppKit/Wagmi implementation.

The goal is to observe MetaMask Mobile + WalletConnect behavior without AppKit/Wagmi state abstractions: approved chains, session namespaces, `session_update`, `session_event`, `session_delete`, refresh restoration, and chain permission changes.

## Research Summary

WalletConnect Sign creates an encrypted remote signer session between a dApp and wallet through a relay server. A dApp initializes `@walletconnect/sign-client`, creates a session proposal, and waits for wallet approval.

Raw WalletConnect v2 is still namespace-based. A dApp must request chains, methods, and events in `requiredNamespaces` or `optionalNamespaces`.

Example:

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1'],
    methods: [
      'eth_sendTransaction',
      'personal_sign',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
    ],
    events: ['chainChanged', 'accountsChanged'],
  },
}
```

After approval, the wallet returns the actual approved `session.namespaces`. Requests are then sent with an explicit chain context:

```ts
await signClient.request({
  topic: session.topic,
  chainId: 'eip155:1',
  request: {
    method: 'personal_sign',
    params: [message, address],
  },
});
```

## AppKit/Wagmi Finding

The shared Claude conversation suggested forcing Sepolia and Polygon Amoy into required chains by passing `requiredNamespaces` to `createAppKit`. With the current project dependencies, `@reown/appkit@1.8.20` and `@reown/appkit-adapter-wagmi@1.8.20`, that suggestion should not be applied blindly.

The local type definitions for React AppKit's `CreateAppKit` options do not expose a `requiredNamespaces` field. The Wagmi adapter's WalletConnect connector also connects through this flow:

```ts
const namespaces = WcHelpersUtil.createNamespaces(caipNetworks, universalProviderConfigOverride);
await provider.connect({
  optionalNamespaces: namespaces,
});
```

This means the current AppKit/Wagmi path likely sends configured networks as `optionalNamespaces`, even when `networks: [mainnet, sepolia, polygonAmoy]` is configured. If MetaMask Mobile displays optional chains as unchecked by default, chains left unchecked by the user may not appear in the approved `session.namespaces`.

`universalProviderConfigOverride` can override methods, chains, events, rpcMap, and defaultChain, but this path is still passed to the connector as `optionalNamespaces`. To verify mandatory initial approval for testnet chains, the Raw WalletConnect v2 tab should directly create proposals with `requiredNamespaces`.

## Key Difference From AppKit/Wagmi

Current AppKit/Wagmi mode:

- Convenient wallet UI and React hooks.
- Strong coupling between `account`, `connector`, `chainId`, and configured networks.
- Can show Switch Network UI during session restoration.
- Makes it harder to inspect raw session namespace updates.

Raw WalletConnect v2 mode:

- Direct SignClient session creation and restoration.
- Direct display of `session.namespaces.eip155.chains/accounts/methods/events`.
- Direct logging of `session_update`, `session_event`, and `session_delete`.
- Explicit `chainId` per request.
- Better separation between wallet connection and chain-specific actions.
- Requires custom UI for URI, QR/deeplink, reconnect, and session storage handling.

## Important Constraint

Raw WalletConnect v2 cannot make a fully chain-free wallet session. WalletConnect v2 sessions are defined by namespaces, and namespaces include chains, methods, and events.

What Raw mode can do is make the boundary explicit:

```text
WalletConnect session
  -> approved chains/accounts/methods/events

Read-only chain queries
  -> Viem public clients, independent from wallet active chain

Wallet actions
  -> signClient.request with explicit chainId
```

## Proposed UI

Add tabs:

```text
AppKit/Wagmi
Raw WalletConnect v2
```

Raw tab sections:

1. Namespace profile selector
   - `Strict Testnets`
   - `Mainnet Required + Testnets Optional`
   - `Mainnet Only Baseline`

2. Connection panel
   - Create session proposal
   - Show URI
   - Open MetaMask mobile deeplink
   - Wait for approval
   - Disconnect
   - Clear local session

3. Approved session panel
   - topic
   - pairing topic
   - expiry
   - approved chains
   - approved accounts
   - approved methods
   - approved events

4. Request panel
   - `personal_sign`
   - EIP-712 typed data sign
   - native transaction
   - ERC-20 transfer
   - `wallet_switchEthereumChain`
   - `wallet_addEthereumChain`

5. Event log
   - `session_event`
   - `session_update`
   - `session_delete`
   - request result/error
   - browser visibility/app-return timestamps

## Namespace Profiles

### Strict Testnets

Purpose: verify whether initial approval of all target chains prevents refresh/switch issues.

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1', 'eip155:11155111', 'eip155:80002'],
    methods: evmMethods,
    events: evmEvents,
  },
}
```

### Mainnet Required + Testnets Optional

Purpose: keep connection stable through mainnet while observing whether MetaMask approves optional testnet chains.

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1'],
    methods: evmMethods,
    events: evmEvents,
  },
},
optionalNamespaces: {
  eip155: {
    chains: ['eip155:11155111', 'eip155:80002'],
    methods: evmMethods,
    events: evmEvents,
  },
}
```

### Mainnet Only Baseline

Purpose: establish a refresh/reconnect baseline.

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1'],
    methods: evmMethods,
    events: evmEvents,
  },
}
```

## Request Rules

Before each request:

```text
If target chain is in session.namespaces.eip155.chains:
  send signClient.request

If target chain is not approved:
  show "chain not approved in current session"
  optionally run wallet_addEthereumChain / wallet_switchEthereumChain experiment
  log whether session_update arrives afterwards
```

## Add/Switch Chain Experiment

Define EIP-3085 chain metadata for Sepolia and Polygon Amoy.

After `wallet_addEthereumChain` or `wallet_switchEthereumChain`, the Raw tab must check whether:

- MetaMask approved the request,
- `session_update` arrived,
- `session.namespaces.eip155.chains` changed,
- the session stayed connected after returning to browser,
- refresh still restores the session.

## File Boundaries

Candidate files:

- `src/raw-walletconnect/client.ts`
- `src/raw-walletconnect/namespaces.ts`
- `src/raw-walletconnect/requests.ts`
- `src/raw-walletconnect/chains.ts`
- `src/components/RawWalletConnectPanel.tsx`
- `src/components/RawSessionDetails.tsx`
- `src/components/RawRequestPanel.tsx`
- `src/components/RawEventLog.tsx`

Keep the current AppKit/Wagmi implementation intact. Raw mode is a comparison/diagnostic path, not an immediate replacement.

## Validation Scenarios

1. Strict Testnets initial connection.
2. Mainnet Required + Testnets Optional initial connection.
3. Mainnet Only baseline.
4. Add/switch Sepolia when Sepolia was not approved initially.
5. Add/switch Amoy when Amoy was not approved initially.
6. Refresh after each scenario.
7. Delete the session from MetaMask and confirm `session_delete` state reset.

## Conclusion

Raw WalletConnect v2 still requires chain namespaces, but it gives direct visibility into the actual session and events. It is the right diagnostic layer to determine whether the failure lives in MetaMask permissions, WalletConnect namespace/session updates, Reown AppKit, or Wagmi connector state.

## References

- Reown Sign Dapp Usage: https://docs.reown.com/advanced/api/sign/dapp-usage
- Reown Namespaces Guide: https://docs.reown.com/advanced/multichain/polkadot/namespaces-guide
- Reown WalletConnect Modal Options: https://docs.reown.com/advanced/walletconnectmodal/options
- MetaMask Chain Permissions: https://metamask.io/news/metamask-feature-update-chain-permissions
- MetaMask Mobile issue #6670: https://github.com/MetaMask/metamask-mobile/issues/6670
- MetaMask Mobile WalletConnect deeplink issue #5212: https://github.com/MetaMask/metamask-mobile/issues/5212
