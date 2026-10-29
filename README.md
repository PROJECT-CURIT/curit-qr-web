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

## QR 규칙

QR에는 가격, 재고, 매장 정보가 들어가지 않습니다. `https://서비스주소/q/{무작위토큰}`만 저장하며 웹은 토큰을 API에 전달해 최신 정보를 조회합니다.

- 굿즈: `매장 전시 상품(listing)` 하나당 QR 하나, 수량은 서버 재고로 관리
- 원화·단일 작품: 개별 실물 하나당 QR 하나, 재고는 1
- 같은 상품이 다른 매장에 전시되면 매장별 재고·성과를 구분하기 위해 다른 QR 발급

## 프로토타입과 운영의 차이

- 기본 API 설정은 실제 과금이 없는 데모 결제입니다.
- 휴대폰 번호는 주문 조회용 서명 쿠키에 연결되지만 통신사 본인인증은 하지 않습니다.
- 운영 전에는 토스페이먼츠 v2 서버 승인, NICE/KCB 등 본인확인, 개인정보 처리방침과 환불 정책을 별도로 연결해야 합니다.
- `.env`와 실제 키는 공개 저장소에 커밋하지 않습니다.

자세한 검토 결과는 [Figma 코드 점검](docs/figma-audit.md)을 참고하세요.

화면별 확인 범위는 [반응형 QA 기준](docs/responsive-qa.md)을 참고하세요.
