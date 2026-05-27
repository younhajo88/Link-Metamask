# Raw WalletConnect v2 테스트 탭 설계

## 목표

현재 AppKit/Wagmi 방식과 별도로, `@walletconnect/sign-client`를 직접 사용하는 Raw WalletConnect v2 테스트 탭을 추가한다.

목적은 MetaMask 모바일 + WalletConnect에서 발생하는 체인 권한, 세션 갱신, `session_update`, `chainChanged`, `disconnect`, 새로고침 복원 문제를 AppKit/Wagmi 추상화 없이 직접 관찰하는 것이다.

## 조사 요약

WalletConnect v2 Sign 프로토콜은 dApp과 지갑 사이에 암호화된 원격 signer 세션을 만든다. 세션은 relay 서버를 통해 payload를 주고받고, 사용자가 wallet에서 pairing/session proposal을 승인해야 성립한다.

Raw SignClient도 체인 없는 연결은 아니다. dApp은 session proposal에서 namespace를 전달해야 하며, namespace에는 사용할 `chains`, `methods`, `events`가 포함된다.

예시 구조:

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

연결이 승인되면 지갑은 실제 승인된 `session.namespaces`를 반환한다. 이 승인 결과가 중요하다. dApp이 요청한 체인과 MetaMask가 최종 승인한 체인은 다를 수 있으며, 이후 요청은 `signClient.request({ topic, chainId, request })`처럼 특정 `chainId`를 지정해서 보낸다.

## AppKit/Wagmi 확인 사항

공유 대화에서는 `createAppKit({ requiredNamespaces })`로 Sepolia와 Polygon Amoy를 required chain으로 강제할 수 있다는 제안이 있었다. 그러나 현재 프로젝트가 사용하는 `@reown/appkit@1.8.20`, `@reown/appkit-adapter-wagmi@1.8.20` 기준으로는 이 제안을 그대로 적용하면 안 된다.

로컬 타입과 번들 코드를 확인하면 현재 React AppKit의 `CreateAppKit` 옵션에는 `requiredNamespaces` 필드가 없다. 또한 Wagmi adapter의 WalletConnect connector는 연결 시 다음 흐름을 사용한다.

```ts
const namespaces = WcHelpersUtil.createNamespaces(caipNetworks, universalProviderConfigOverride);
await provider.connect({
  optionalNamespaces: namespaces,
});
```

즉 현재 AppKit/Wagmi 경로는 `networks: [mainnet, sepolia, polygonAmoy]`를 넣어도 WalletConnect proposal에서 해당 체인들이 `optionalNamespaces`로 들어갈 가능성이 높다. MetaMask 모바일에서 optional chain이 기본 체크 해제 상태로 보이면, 사용자가 체크하지 않은 체인은 승인된 `session.namespaces`에 포함되지 않을 수 있다.

`universalProviderConfigOverride`로 methods/chains/events/rpcMap/defaultChain을 덮어쓸 수는 있지만, 이 경로 역시 connector 내부에서는 `optionalNamespaces`로 전달된다. 따라서 “테스트넷들을 반드시 최초 승인 세션에 포함시키기”를 검증하려면 Raw WalletConnect v2에서 `requiredNamespaces`를 직접 넣는 실험이 필요하다.

## 핵심 차이

현재 AppKit/Wagmi 방식:

- 연결 UI와 상태 관리가 편하다.
- `account`, `connector`, `chainId`, supported networks가 강하게 묶인다.
- 새로고침 시 AppKit/Wagmi가 active chain을 검사하면서 `Switch Network` 모달을 띄울 수 있다.
- 세션 내부의 실제 승인 체인, `session_update`, `session_delete`를 보기 어렵다.

Raw WalletConnect v2 방식:

- SignClient 세션을 직접 만들고 복원한다.
- `session.namespaces.eip155.chains/accounts/methods/events`를 그대로 화면에 보여줄 수 있다.
- `session_update`, `session_event`, `session_delete`를 직접 로깅할 수 있다.
- 요청 시점에 명시적으로 `chainId`를 지정한다.
- 연결과 네트워크 액션을 UI에서 더 명확히 분리할 수 있다.
- 대신 wallet 선택 UI, QR/deeplink, reconnect, storage 상태 처리를 직접 설계해야 한다.

## 중요한 한계

Raw WalletConnect v2만 사용해도 chain namespace는 필요하다. 완전히 “체인 없는 지갑 연결”은 WalletConnect v2 구조와 맞지 않는다.

다만 Raw 방식은 다음을 명확히 분리할 수 있다.

```text
WalletConnect session
  -> 승인된 체인/계정/메서드 목록

Read-only 조회
  -> Viem public client로 각 체인 RPC 직접 조회

Wallet action
  -> 승인된 chainId인지 확인 후 signClient.request 실행
```

## 제안 UI 구조

기존 화면에 탭을 추가한다.

```text
AppKit/Wagmi 탭
  현재 구현 유지

Raw WalletConnect v2 탭
  SignClient 직접 연결/요청/이벤트 진단
```

Raw 탭 구성:

1. 연결 프로파일 선택
   - `Strict Testnets`: requiredNamespaces에 mainnet + Sepolia + Polygon Amoy 모두 요청.
   - `Mainnet Required + Testnets Optional`: requiredNamespaces는 mainnet, optionalNamespaces는 Sepolia + Polygon Amoy.
   - `Mainnet Only Baseline`: mainnet만 요청해서 안정성 기준선 확인.

2. 연결 패널
   - `Create Session Proposal`
   - QR/URI 표시
   - MetaMask mobile deeplink 버튼
   - 연결 승인 대기 상태
   - 연결 해제
   - 로컬 세션 삭제

3. 승인된 세션 패널
   - topic
   - pairing topic
   - expiry
   - approved chains
   - approved accounts
   - approved methods
   - approved events

4. 요청 테스트 패널
   - `personal_sign` with selected chainId
   - EIP-712 typed data sign
   - native transaction request
   - ERC-20 transfer request
   - `wallet_switchEthereumChain`
   - `wallet_addEthereumChain`

5. 이벤트 로그
   - `session_event`
   - `session_update`
   - `session_delete`
   - `session_expire`
   - request result/error
   - browser visibility / app return timestamp

## 세션 프로파일 설계

### Profile A: Strict Testnets

목적: 최초 승인 시 테스트 체인을 반드시 포함시키면 안정적인지 검증한다.

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1', 'eip155:11155111', 'eip155:80002'],
    methods: evmMethods,
    events: evmEvents,
  },
}
```

예상:

- 사용자가 최초 연결 permissions에서 필요한 체인을 모두 승인해야 한다.
- 승인된 세션에 Sepolia/Amoy가 포함되어 있으면 switch/sign/transaction 요청이 안정적일 가능성이 높다.
- MetaMask가 특정 체인을 거부하면 세션 생성 자체가 실패하거나 일부 승인 결과를 확인할 수 있다.

### Profile B: Mainnet Required + Testnets Optional

목적: 연결 안정성은 mainnet으로 확보하고, 테스트넷은 optional로 요청했을 때 MetaMask가 어떻게 승인하는지 확인한다.

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

예상:

- 연결은 잘 될 가능성이 높다.
- 실제 승인된 chains에 Sepolia/Amoy가 들어오는지 관찰할 수 있다.
- optional이 빠진 상태에서 나중에 switch/add 요청 시 세션이 끊기는지 비교할 수 있다.

### Profile C: Mainnet Only Baseline

목적: 최소 세션에서 새로고침/복원 안정성을 확인한다.

```ts
requiredNamespaces: {
  eip155: {
    chains: ['eip155:1'],
    methods: evmMethods,
    events: evmEvents,
  },
}
```

예상:

- refresh-time 연결 안정성 기준선으로 사용한다.
- Sepolia/Amoy 요청은 승인 체인에 없으므로 실행 전 차단하거나, add/switch 실험용으로만 사용한다.

## 요청 실행 규칙

Raw 탭에서는 요청 전 항상 세션 승인 상태를 검사한다.

```text
요청하려는 chainId가 session.namespaces.eip155.chains에 있음
  -> signClient.request 실행

없음
  -> "현재 세션에 승인되지 않은 체인" 표시
  -> wallet_addEthereumChain / wallet_switchEthereumChain 실험 버튼 제공
  -> 성공/실패 후 session_update 발생 여부 관찰
```

이 방식은 “MetaMask는 승인했는데 프론트 세션이 갱신되지 않는가?”를 직접 확인하게 해준다.

## 네트워크 추가/전환 실험

각 테스트 체인에 대해 `wallet_addEthereumChain` payload를 정의한다.

Sepolia:

```ts
{
  chainId: '0xaa36a7',
  chainName: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}
```

Polygon Amoy:

```ts
{
  chainId: '0x13882',
  chainName: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}
```

주의: `wallet_addEthereumChain` 성공은 MetaMask에 네트워크가 추가되었음을 뜻할 수 있지만, 기존 WalletConnect 세션의 approved namespace가 갱신되었음을 보장하지 않는다. 따라서 add/switch 후 반드시 `session_update`와 `session.namespaces` 변화를 기록한다.

## 데이터 모델

```ts
interface RawWalletConnectState {
  clientReady: boolean;
  activeSession?: SessionTypes.Struct;
  selectedProfile: 'strict-testnets' | 'mainnet-required-testnets-optional' | 'mainnet-only';
  pendingUri?: string;
  approvedChains: string[];
  approvedAccounts: string[];
  approvedMethods: string[];
  approvedEvents: string[];
  events: RawWalletConnectEvent[];
}

interface RawWalletConnectEvent {
  id: string;
  type:
    | 'connect_start'
    | 'session_approved'
    | 'session_update'
    | 'session_event'
    | 'session_delete'
    | 'request_start'
    | 'request_success'
    | 'request_error';
  details: unknown;
  createdAt: string;
}
```

## 구현 경계

새 파일 후보:

- `src/raw-walletconnect/client.ts`
  - SignClient 생성, 이벤트 등록, 세션 복원.
- `src/raw-walletconnect/namespaces.ts`
  - required/optional namespace profile 생성.
- `src/raw-walletconnect/requests.ts`
  - `signClient.request` helper.
- `src/raw-walletconnect/chains.ts`
  - CAIP-2 chain IDs, EIP-3085 add chain payloads.
- `src/components/RawWalletConnectPanel.tsx`
  - Raw 탭 전체 UI.
- `src/components/RawSessionDetails.tsx`
  - 승인된 세션 표시.
- `src/components/RawRequestPanel.tsx`
  - 요청 테스트 UI.
- `src/components/RawEventLog.tsx`
  - 이벤트 로그.

기존 AppKit/Wagmi 구현은 유지한다. Raw 탭은 비교 실험용으로 독립 구현한다.

## 검증 시나리오

1. Profile A로 최초 연결
   - MetaMask permissions에서 mainnet/Sepolia/Amoy가 어떻게 표시되는지 기록.
   - 승인 후 새로고침해도 세션이 복원되는지 확인.

2. Profile B로 최초 연결
   - Sepolia가 optional로 승인되는지 확인.
   - 승인된 chains에 Sepolia가 없을 때 Sepolia request를 차단하는지 확인.
   - `wallet_switchEthereumChain` 승인 후 `session_update`가 오는지 확인.

3. Profile C로 최초 연결
   - mainnet-only 세션의 refresh 안정성 확인.
   - Sepolia add/switch 요청 후 연결이 끊기는지 확인.

4. MetaMask 앱에서 세션 삭제
   - Raw 탭이 `session_delete`를 받고 상태를 reset하는지 확인.

5. 브라우저 새로고침
   - `signClient.session.getAll()`로 세션 복원.
   - 승인된 namespace가 화면에 그대로 표시되는지 확인.

## 결론

Raw WalletConnect v2 방식도 체인 namespace를 피할 수는 없다. 그러나 AppKit/Wagmi보다 세션 내부 상태와 이벤트를 직접 볼 수 있으므로, 지금 겪는 문제의 원인이 MetaMask permission, WalletConnect session namespace, Reown/AppKit, Wagmi connector 중 어디인지 분리해낼 수 있다.

따라서 다음 구현은 기존 AppKit/Wagmi를 대체하는 것이 아니라, 비교 진단용 `Raw WalletConnect v2` 탭을 추가하는 방향이 가장 안전하다.

## 참고 문서

- Reown Sign Dapp Usage: https://docs.reown.com/advanced/api/sign/dapp-usage
- Reown Namespaces Guide: https://docs.reown.com/advanced/multichain/polkadot/namespaces-guide
- Reown WalletConnect Modal Options: https://docs.reown.com/advanced/walletconnectmodal/options
- MetaMask Chain Permissions: https://metamask.io/news/metamask-feature-update-chain-permissions
- MetaMask Mobile issue #6670: https://github.com/MetaMask/metamask-mobile/issues/6670
- MetaMask Mobile WalletConnect deeplink issue #5212: https://github.com/MetaMask/metamask-mobile/issues/5212
