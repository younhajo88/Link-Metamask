# MetaMask Link Test

Frontend-only test page for MetaMask desktop extension and mobile MetaMask app connections through WalletConnect/Reown AppKit.

## Setup

1. Create a Reown project at https://cloud.reown.com.
2. Copy `.env.example` to `.env`.
3. Set `VITE_REOWN_PROJECT_ID`.
4. Optionally set custom RPC URLs for Sepolia or Polygon Amoy.
5. Run `npm install`.
6. Run `npm run dev`.

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

Ethereum Mainnet is included as a connection/default network to reduce mobile WalletConnect refresh-time network mismatch prompts. Transfer and signing test buttons are enabled only on Sepolia or Polygon Amoy.

Use testnets first. If mainnet behavior is added later, keep explicit confirmation and strong warnings around real transfers.

---

# MetaMask 연결 테스트

MetaMask 데스크톱 확장 프로그램과 WalletConnect/Reown AppKit을 통한 모바일 MetaMask 앱 연결을 검증하는 프론트엔드 전용 테스트 페이지입니다.

## 설정

1. https://cloud.reown.com 에서 Reown 프로젝트를 만듭니다.
2. `.env.example`을 `.env`로 복사합니다.
3. `VITE_REOWN_PROJECT_ID`를 설정합니다.
4. 필요하면 Sepolia 또는 Polygon Amoy RPC URL을 설정합니다.
5. `npm install`을 실행합니다.
6. `npm run dev`를 실행합니다.

## 데스크톱 테스트

MetaMask 확장 프로그램이 설치된 Chrome에서 로컬 URL을 엽니다.

- 지갑을 연결합니다.
- 주소, 커넥터, 체인, 잔액을 확인합니다.
- 테스트 네트워크를 전환합니다.
- `personal_sign`과 EIP-712 typed data 서명을 실행합니다.
- 전송 테스트는 테스트넷 자금으로만 먼저 실행합니다.

## 모바일 외부 브라우저 테스트

모바일 Safari, Chrome, Samsung Internet에서 개발 서버 URL을 엽니다.

- 개발 서버는 `--host 0.0.0.0`으로 실행됩니다. 휴대폰에서는 PC의 LAN IP 주소를 사용합니다.
- 지갑 연결을 누르고 Reown AppKit에서 MetaMask를 선택합니다.
- MetaMask 앱에서 연결을 승인합니다.
- 브라우저로 돌아와 계정, 커넥터, 체인 상태를 확인합니다.

## 세션 문제 해결

모바일 연결이 일관되지 않게 동작하면 다음을 순서대로 시도합니다.

- `Disconnect`를 누릅니다.
- `Clear Local State`를 누릅니다.
- MetaMask 앱 설정에서 이 테스트 페이지의 오래된 WalletConnect 세션을 제거합니다.
- 모바일 브라우저 페이지를 다시 열고 연결합니다.

## 안전

모바일 WalletConnect 새로고침 시 네트워크 불일치 팝업을 줄이기 위해 Ethereum Mainnet을 연결/기본 네트워크로 포함합니다. 다만 전송과 서명 테스트 버튼은 Sepolia 또는 Polygon Amoy에서만 활성화됩니다.

먼저 테스트넷을 사용하세요. 나중에 메인넷 액션을 추가한다면 실제 전송 전에 명시적인 확인과 강한 경고를 유지해야 합니다.
