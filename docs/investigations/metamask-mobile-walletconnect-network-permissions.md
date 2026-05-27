# MetaMask Mobile WalletConnect Network Permission Investigation

## Korean Summary

모바일 외부 브라우저에서 Reown AppKit + WalletConnect로 MetaMask 모바일 앱을 연결한 뒤, 브라우저를 새로고침하면 `Switch Network` 팝업이 뜨고 닫기 버튼이 반응하지 않으며 웹페이지는 `Idle` 상태로 보이는 문제가 관찰되었다.

사용자가 MetaMask 모바일 최초 연결 승인 화면에서 `Permissions > 활성화된 네트워크 사용 > 편집`으로 들어가 `Sepolia`와 `Polygon Amoy`만 체크한 뒤 연결하자, 새로고침 후에도 `Switch Network` 팝업이 뜨지 않고 `Connected` 상태가 유지되었다.

현재 가장 유력한 원인은 **MetaMask의 dApp별 network permission에 Sepolia가 빠진 상태에서, AppKit/Wagmi가 새로고침 시 Sepolia 중심으로 세션/네트워크 상태를 복원하려 하면서 충돌한 것**이다.

## Current Project Configuration

The app declares these supported chains:

- Sepolia
- Polygon Amoy

Relevant files:

- `src/wallet/chains.ts`
- `src/wallet/appKit.ts`

Current AppKit setup passes:

```ts
networks: supportedChains
```

`defaultNetwork` is not explicitly set yet. Because `supportedChains` is ordered as `[sepolia, polygonAmoy]`, AppKit/Wagmi may treat Sepolia as the first/default network during initial state and session restoration.

## Observed Behavior

1. User opens the test page in a mobile external browser.
2. User connects through Reown AppKit / WalletConnect to MetaMask mobile.
3. MetaMask mobile shows a connection approval screen for the project site.
4. The approval screen has:
   - Account info tab.
   - Permissions tab.
   - Permission text for account viewing / transaction proposal.
   - `활성화된 네트워크 사용` / enabled networks.
5. In enabled networks edit view:
   - Several networks are checked.
   - Polygon Amoy is checked.
   - Sepolia is not checked.
   - Other mainnets/testnets may be checked.
6. If the user connects in that state and refreshes the browser:
   - `Switch Network` popup appears.
   - The popup close button does not respond.
   - The web page can show `Idle`.
7. If the user edits permissions and checks only Sepolia + Polygon Amoy:
   - Connection succeeds.
   - Browser refresh does not show the `Switch Network` popup.
   - The web page remains `Connected`.

## Working Hypothesis

MetaMask's enabled network permission UI is not simply a mirror of the dApp's `supportedChains`.

The dApp declares:

```text
Sepolia
Polygon Amoy
```

But MetaMask asks the user which networks this site may use. If Sepolia is not granted to the dApp connection, AppKit/Wagmi can enter a mismatched state on refresh:

```text
App expects/restores Sepolia first
MetaMask dApp permission does not include Sepolia
WalletConnect/AppKit detects a network mismatch
Switch Network modal appears
Modal may become blocking/uncloseable
Wagmi account state may still show Idle
```

The user's successful test after manually checking Sepolia + Polygon Amoy strongly supports this hypothesis.

## Related Upstream Issues

These Reown AppKit issues appear related:

- https://github.com/reown-com/appkit/issues/5352
  - Mentions `Switch Network` dialog appearing on load after refresh.
  - Mentions close / disconnect buttons not working.
  - Mentions unsupported network behavior.
- https://github.com/reown-com/appkit/issues/4714
  - Mentions supported network state behaving differently after refresh.
  - Involves `allowUnsupportedChain`.
- https://github.com/reown-com/appkit/issues/3788
  - MetaMask Mobile + WalletConnect network switching and signing inconsistencies.
- https://github.com/reown-com/appkit/issues/4766
  - MetaMask Mobile network switch not reflecting reliably.
- https://github.com/reown-com/appkit/issues/4820
  - MetaMask Mobile connection instability on mobile browsers.

MetaMask references:

- https://metamask.io/news/metamask-feature-update-chain-permissions
- https://support.metamask.io/configure/networks/how-to-change-networks

## Current Recommendation

Do not immediately use `allowUnsupportedChain: true` as the first fix.

Reason: related issue #4714 suggests refresh behavior can still be confusing when unsupported chains are allowed. It may hide the Switch Network modal but leave the app displaying a misleading network state.

Preferred first response:

1. Explicitly set `defaultNetwork: sepolia` in AppKit.
2. Add first-connect guidance in the UI:
   - In MetaMask approval screen, open `Permissions`.
   - Edit `활성화된 네트워크 사용`.
   - Check `Sepolia` and `Polygon Amoy`.
3. Add diagnostics for:
   - Wagmi `isConnected`.
   - Wagmi `status`.
   - active `chainId`.
   - connector name.
   - whether `chainId` is one of the supported chains.
4. If the problem still reproduces after explicit permission guidance, consider:
   - `allowUnsupportedChain: true`.
   - Disabling transaction/sign actions unless the active chain is Sepolia or Polygon Amoy.
   - More explicit stale-session reset guidance.

## Why The Frontend Shows A Switch Network Popup

The `Switch Network` popup is shown by the frontend-side wallet UX layer, not by the blockchain itself.

At the protocol/product level, plain wallet connection does not inherently need a network:

```text
connect wallet
  -> get account/address permission

read balances or token state
  -> frontend can query any configured RPC directly with Viem/public clients

send transaction or request chain-scoped signing
  -> wallet must know which chain context the request belongs to
```

For this test page, network is most important at the moment of requesting wallet actions:

- native coin transfer,
- ERC-20 transfer,
- `wallet_switchEthereumChain`,
- `wallet_addEthereumChain`,
- chain-bound typed data signing,
- any request that depends on the wallet provider's active `eth_chainId`.

However, Reown AppKit + Wagmi model wallet connection as a chain-aware provider state. AppKit is configured with:

```ts
createAppKit({
  networks: [sepolia, polygonAmoy],
})
```

That `networks` option is not just a list of RPCs the frontend can read from. AppKit treats it as the dApp's supported network set. Wagmi also tracks `account`, `connector`, and `chainId` together through hooks like:

- `useAccount`,
- `useChainId`,
- `useWalletClient`,
- `useSendTransaction`,
- `useSwitchChain`.

On refresh, AppKit/Wagmi restore the previous WalletConnect session and evaluate whether the wallet provider's current/restored chain is compatible with the configured `networks`. If the restored chain, granted network permissions, or inferred default chain do not line up, AppKit can show a `Switch Network` modal immediately on page load.

This is why the app can appear `Idle` while a `Switch Network` modal is open:

```text
WalletConnect/AppKit internal session state exists
Wagmi account state has not fully restored or is blocked
AppKit network guard evaluates first/default network compatibility
Switch Network modal appears before the app has a clean connected state
```

This popup is therefore not proof that network is required for address-level connection. It is a consequence of using a chain-aware wallet UX framework that couples connection, session restoration, and active-chain validation.

## Better Mental Model For This Test Page

The test page should separate wallet connection from chain-specific actions:

```text
Connection panel
  - connect wallet
  - show address
  - show connector/session state
  - do not treat network mismatch as fatal by itself

Read/query panel
  - query Sepolia via a Sepolia public RPC client
  - query Polygon Amoy via a Polygon Amoy public RPC client
  - do not rely on MetaMask's active chain for read-only state

Wallet action panel
  - show current wallet chainId
  - switch to Sepolia only when the user asks for Sepolia transaction/sign test
  - switch to Polygon Amoy only when the user asks for Amoy transaction/sign test
  - block or warn before transaction/sign actions if the wallet chain is wrong
```

This design avoids surprising page-load network switching. The user sees network switching only when running a network-scoped wallet action.

## Possible Design Direction

The current AppKit/Wagmi approach is simple but can trigger network guards early:

```text
AppKit networks = Sepolia + Polygon Amoy
WalletConnect session restore happens on refresh
AppKit checks active/restored chain
Switch Network modal can appear before the user runs an action
```

A more test-friendly structure is:

1. Keep AppKit for wallet connection UX.
2. Keep Wagmi for wallet account and wallet action hooks.
3. Add Viem public clients per supported chain for read-only state.
4. Treat unsupported wallet chain as a warning, not a broken connection.
5. Only call `switchChain` when the user intentionally runs a chain-specific test.

This makes the UI reflect the real distinction:

```text
wallet connection != active network selection
read-only chain query != wallet provider active chain
transaction/sign request == wallet provider active chain matters
```

This is likely a better long-term design for this project than relying on AppKit's automatic Switch Network modal during session restoration.

## Next Things To Verify

- Does `defaultNetwork: sepolia` change the MetaMask approval network checklist?
- Does MetaMask pre-check networks based on its own enabled network state rather than AppKit `networks`?
- Does explicitly checking Sepolia + Polygon Amoy remain stable after:
  - browser refresh,
  - browser close/reopen,
  - MetaMask app restart,
  - clearing browser local state,
  - deleting WalletConnect sessions from MetaMask?
- Does the bug reproduce when only Polygon Amoy is checked and Sepolia is not checked?
- Does the bug reproduce when Sepolia is checked but Polygon Amoy is not checked?
- Can the UI be refactored so page refresh restores wallet connection without immediately requiring a supported active chain?
- Can read-only balance/token checks be moved to Viem public clients so they are independent from MetaMask's active chain?

## English Summary

The current evidence suggests the refresh-time `Switch Network` popup is caused by a mismatch between the app's supported/default network expectations and MetaMask Mobile's per-dApp enabled network permissions. When the user explicitly grants Sepolia and Polygon Amoy during the MetaMask connection approval flow, refresh works and the app remains connected.

The next safest change is to document and guide the required permission selection, explicitly set AppKit's default network, and improve diagnostics before trying broader unsupported-chain behavior.

The broader architectural learning is that wallet connection and network-specific wallet actions should be modeled separately. The frontend can query chain state through its own RPC clients, while MetaMask's active chain only becomes essential when sending transactions, switching networks, or requesting chain-scoped signatures.
