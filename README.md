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

- `http://localhost:5173/?qr=demo-mug-white-gray`
- `http://localhost:5173/?qr=demo-bowl-set-2026`
- `http://localhost:5173/?qr=demo-dessert-plate`

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

GitHub Pages 배포는 직접 접속도 HTTP 200을 유지하도록 `/curit-qr-web/?qr={token}` 형식을 사용합니다. 이전 `/curit-qr-web/q/{token}` 주소도 읽을 수 있지만 신규 QR에는 사용하지 않습니다. API 주소와 브라우저 공개용 Supabase anon 키는 저장소 변수 `VITE_API_BASE_URL`, `VITE_SUPABASE_ANON_KEY`로 주입합니다. `service_role` 또는 secret 키는 절대 프런트엔드에 넣지 않습니다.

## QR 규칙

QR에는 가격, 재고, 매장 정보가 들어가지 않습니다. `https://서비스주소/?qr={무작위토큰}`만 저장하며 웹은 토큰을 API에 전달해 최신 정보를 조회합니다.

- 굿즈: `매장 전시 상품(listing)` 하나당 QR 하나, 수량은 서버 재고로 관리
- 원화·단일 작품: 개별 실물 하나당 QR 하나, 재고는 1
- 같은 상품이 다른 매장에 전시되면 매장별 재고·성과를 구분하기 위해 다른 QR 발급

## 결제와 주문 세션

- 기본값은 실제 과금이 없는 데모 결제입니다.
- 운영은 토스페이먼츠 SDK v2 결제창과 서버 승인 API를 사용합니다. 성공 URL의 금액을 그대로 신뢰하지 않고 서버 pending 주문과 다시 대조합니다.
- 공식 문서용 `test_gck_*` 위젯 키는 `setAmount → renderPaymentWindow → paymentRequest → requestPayment` 순서로 호출합니다. 시연 화면의 카드·간편결제 선택보다 토스 테스트 결제창의 최종 선택이 우선되며, 운영 상점의 `test_ck_*`/`live_ck_*` 키에서는 선택한 간편결제를 직접 연결합니다.
- 구매자가 결제창을 닫으면 주문서로 복귀하고, 서버의 미결제 주문을 `cancelled`로 전환합니다. 이 단계에서는 재고와 정산 원장을 변경하지 않습니다.
- QR 웹과 API가 서로 다른 도메인에 배포돼도 동작하도록 주문 조회 세션은 무작위 Bearer token을 사용하며 서버에는 해시만 저장합니다.
- 휴대폰 입력은 주문 연락처 확인입니다. SMS OTP나 통신사 본인확인을 붙이기 전까지 ‘휴대폰 본인인증’으로 표기하면 안 됩니다.
- 토스 시크릿 키는 API/Edge Function에만 저장하고 공개 저장소와 Vite 환경변수에는 넣지 않습니다.

자세한 검토 결과는 [Figma 코드 점검](docs/figma-audit.md)을 참고하세요.

화면별 확인 범위는 [반응형 QA 기준](docs/responsive-qa.md)을 참고하세요.

## 소규모 현장 계좌이체

`?buy=kendama`, `?buy=dango-keyring`은 기존 주문 API와 분리된 현장 구매 안내입니다. 상품·수량 확인 후 고객이 은행 앱에서 직접 이체하고, 판매자가 실제 입금과 수령을 확인합니다. 웹은 결제 완료나 주문·재고 차감을 자동으로 기록하지 않습니다.

배포 설정 `FIELD_SALE_CONFIG`에는 `public/field-sale/config.json`과 같은 구조의 JSON을 입력합니다. `bank`는 `{ "name": "은행", "account": "계좌번호", "holder": "예금주" }`, 각 상품의 `price`는 원 단위 정수, `quantity`는 판매 가능한 수량입니다. 계좌 정보는 구매자에게 공개되므로 본인 동의를 받은 수취 정보만 사용합니다. 실제 계좌는 소스 이력에 커밋하지 않습니다. 이 변수가 없거나 가격·계좌가 비어 있으면 송금 안내를 열지 않습니다. 수량 0은 판매 마감 표시입니다.
