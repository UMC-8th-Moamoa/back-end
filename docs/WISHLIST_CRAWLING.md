# 위시리스트 네이버 쇼핑 API 크롤링 기능

기존 `POST /api/wishlists` 엔드포인트에서 `insertType: "URL"`을 사용할 때 네이버 쇼핑 API를 통해 실제 상품 정보를 자동으로 크롤링하는 기능이 구현되었습니다.

## 🚀 기능 개요

### 자동 입력 (`insertType: "URL"`)
URL을 제공하면 다음 과정을 통해 상품 정보를 자동으로 추출합니다:

1. **URL 분석**: 제공된 URL에서 검색어 추출
2. **네이버 쇼핑 API 검색**: 추출된 검색어로 상품 검색
3. **상품 정보 저장**: 검색 결과의 첫 번째 상품 정보를 위시리스트에 저장

### 수동 입력 (`insertType: "IMAGE"`)
기존과 동일하게 상품 정보를 직접 입력합니다.

## 📋 실제 사용법 (Postman)

### 1. 먼저 로그인하여 JWT 토큰 획득

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

응답에서 `accessToken`을 복사하여 다음 요청들에 사용하세요.

### 2. URL 자동 입력 방식

```
POST http://localhost:3000/api/wishlists
Content-Type: application/json
Authorization: Bearer {위에서 받은 accessToken}

{
  "insertType": "URL",
  "url": "https://www.coupang.com/vp/products/1234567890",
  "isPublic": true
}
```

### 3. 수동 입력 방식

```
POST http://localhost:3000/api/wishlists
Content-Type: application/json
Authorization: Bearer {위에서 받은 accessToken}

{
  "insertType": "IMAGE",
  "productName": "애플 에어팟 프로",
  "price": 329000,
  "imageUrl": "https://example.com/airpods.jpg",
  "isPublic": true
}
```

## 🔍 URL 검색어 추출 방식

시스템은 다음 순서로 URL에서 검색어를 추출합니다:

### 1. URL 파라미터에서 추출
- `?query=검색어`
- `?q=검색어`
- `?keyword=검색어`
- `?search=검색어`
- `?prdNm=상품명`
- `?product=상품명`

### 2. URL 경로에서 추출
- `/products/nike-air-max` → "nike air max"
- `/item/apple-iphone` → "apple iphone"

### 3. 도메인명에서 브랜드 추출
- `coupang.com` → "쿠팡"
- `gmarket.co.kr` → "지마켓"
- `auction.co.kr` → "옥션"
- 기타 도메인 → 도메인명 첫 부분

### 4. 기본값
- 위 방법들로 검색어를 찾을 수 없는 경우 → "인기상품"

## 🛠️ 환경 설정

### 환경 변수 설정 (`.env.development` 파일)

```bash
API_BASE_URL=http://localhost:3000
DATABASE_URL=mysql://root:qkrwnsgus04*@localhost:3306/moamoa_dev
NAVER_CLIENT_ID=8wMUcBiqD_7kwyK4bgSl
NAVER_CLIENT_SECRET=Tett8vPlcr
```

## 📊 응답 형식

### 성공 응답 예시
```json
{
  "id": 42,
  "userId": 5,
  "productName": "애플 에어팟 프로 2세대",
  "price": 329000,
  "productImageUrl": "https://shopping-phinf.pstatic.net/main_1234567/12345678.jpg",
  "fundingActive": false,
  "isPublic": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### 오류 응답 예시
```json
{
  "message": "Failed to fetch product data from url"
}
```

## 🔧 주요 파일

- `src/services/naverShopping.service.js` - 네이버 쇼핑 API 서비스
- `src/services/wishlist.service.js` - 위시리스트 서비스 (크롤링 로직 포함)
- `src/controllers/wishlist.controller.js` - 위시리스트 컨트롤러
- `src/routes/wishlist.routes.js` - 위시리스트 라우트

## 🚨 주의사항

1. **인증 필요**: 모든 위시리스트 API는 유효한 JWT 토큰이 필요합니다.
2. **API 할당량**: 네이버 쇼핑 API는 일일 할당량이 있으므로 과도한 요청을 피해주세요.
3. **URL 형식**: 복잡한 URL의 경우 검색어 추출이 정확하지 않을 수 있습니다.
4. **네트워크 오류**: 네이버 API 서버 문제로 크롤링이 실패할 수 있습니다.

## 📋 Postman 테스트 예시

### 실제 쇼핑몰 URL 테스트
```json
// 쿠팡 URL
{
  "insertType": "URL",
  "url": "https://www.coupang.com/vp/products/6137140317",
  "isPublic": true
}

// 지마켓 URL
{
  "insertType": "URL", 
  "url": "https://item.gmarket.co.kr/Item?goodscode=2249786629",
  "isPublic": true
}

// 네이버 쇼핑 URL
{
  "insertType": "URL",
  "url": "https://shopping.naver.com/home/p/10085846486?query=아이폰15",
  "isPublic": true
}
```

## � 사용 팁

1. **로그인 토큰**: 로그인 API로 받은 `accessToken`을 `Authorization: Bearer {token}` 헤더에 포함
2. **URL 형식**: 실제 쇼핑몰 URL을 사용하면 더 정확한 검색 결과를 얻을 수 있습니다
3. **검색어 확인**: 서버 로그에서 추출된 검색어를 확인할 수 있습니다
