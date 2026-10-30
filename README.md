# CURI:T QR Web

매장에 전시된 작품·굿즈의 QR을 스캔한 방문객이 작가의 이야기와 상품 정보를 보고 주문하는 모바일 웹입니다. Figma Make 프로토타입의 시각 디자인을 이식하되, 가격·재고·주문은 `curit-api`가 결정하도록 보안 경계를 수정했습니다.

## 로컬 실행

먼저 `curit-api`를 `http://localhost:4100`에서 실행한 뒤 다음 명령을 사용합니다.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

대표 QR URL:

- `http://localhost:5173/q/demo-mug-white-gray`
- `http://localhost:5173/q/demo-bowl-set-2026`
- `http://localhost:5173/q/demo-dessert-plate`

## 검증

```bash
pnpm typecheck
pnpm test
pnpm build
```

반응형 화면은 다음 기준으로 확인합니다.

- 소형 모바일: 360×800
- 일반 모바일·앱 WebView: 390×844
- 태블릿: 768×1024
- 데스크톱: 1440×900 이상

현재 결과물은 모바일 브라우저, 설치형 PWA, 앱 내부 WebView에서 같은 화면을 사용하는 반응형 웹입니다. iOS·Android 네이티브 앱 화면 자체가 필요한 경우에는 `curit-mobile`에서 별도로 WebView 셸 또는 네이티브 UI를 구현해야 합니다.

GitHub Pages 배포는 `/curit-qr-web/q/{token}` 하위 경로에서도 새로고침이 유지되도록 `404.html` SPA fallback과 `VITE_BASE_PATH`를 사용합니다. API 주소는 저장소 변수 `VITE_API_BASE_URL`로 주입합니다.

## QR 규칙

QR에는 가격, 재고, 매장 정보가 들어가지 않습니다. `https://서비스주소/q/{무작위토큰}`만 저장하며 웹은 토큰을 API에 전달해 최신 정보를 조회합니다.

- 굿즈: `매장 전시 상품(listing)` 하나당 QR 하나, 수량은 서버 재고로 관리
- 원화·단일 작품: 개별 실물 하나당 QR 하나, 재고는 1
- 같은 상품이 다른 매장에 전시되면 매장별 재고·성과를 구분하기 위해 다른 QR 발급

## 결제와 주문 세션

- 기본값은 실제 과금이 없는 데모 결제입니다.
- 운영은 토스페이먼츠 SDK v2 결제창과 서버 승인 API를 사용합니다. 성공 URL의 금액을 그대로 신뢰하지 않고 서버 pending 주문과 다시 대조합니다.
- QR 웹과 API가 서로 다른 도메인에 배포돼도 동작하도록 주문 조회 세션은 무작위 Bearer token을 사용하며 서버에는 해시만 저장합니다.
- 휴대폰 입력은 주문 연락처 확인입니다. SMS OTP나 통신사 본인확인을 붙이기 전까지 ‘휴대폰 본인인증’으로 표기하면 안 됩니다.
- 토스 시크릿 키는 API/Edge Function에만 저장하고 공개 저장소와 Vite 환경변수에는 넣지 않습니다.

자세한 검토 결과는 [Figma 코드 점검](docs/figma-audit.md)을 참고하세요.

화면별 확인 범위는 [반응형 QA 기준](docs/responsive-qa.md)을 참고하세요.
