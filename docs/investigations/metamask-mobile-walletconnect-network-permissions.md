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

## English Summary

The current evidence suggests the refresh-time `Switch Network` popup is caused by a mismatch between the app's supported/default network expectations and MetaMask Mobile's per-dApp enabled network permissions. When the user explicitly grants Sepolia and Polygon Amoy during the MetaMask connection approval flow, refresh works and the app remains connected.

The next safest change is to document and guide the required permission selection, explicitly set AppKit's default network, and improve diagnostics before trying broader unsupported-chain behavior.
