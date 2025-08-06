# 🔍 이미지 분석 API 가이드

## 📋 개요

이미지 분석 API는 AI를 활용하여 이미지를 분석하고, 자동으로 위시리스트에 상품을 등록하는 기능을 제공합니다.

### 🔄 처리 과정

1. **이미지 분석**: BLIP2 AI 모델로 이미지 캡션 생성
2. **번역**: 영어 캡션을 한국어로 번역
3. **키워드 추출**: 핵심 키워드 2-3개 추출
4. **상품 검색**: 네이버 쇼핑 API로 관련 상품 검색
5. **자동 등록**: 검색 성공 시 위시리스트에 자동 저장
6. **결과 반환**: 위시리스트 정보 및 분석 결과 제공

## 🚀 API 사용법

### 엔드포인트
```
POST /api/wishlists/analyze
```

### 인증
```
Authorization: Bearer {JWT_TOKEN}
```

### 요청 본문
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "isPublic": false
}
```

### 매개변수

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `imageUrl` | string | ✅ | - | 분석할 이미지의 URL |
| `isPublic` | boolean | ❌ | false | 위시리스트 공개 여부 |

## 📊 응답 형식

### ✅ 성공 응답 (상품 검색 성공 + 위시리스트 등록)

**상태 코드**: `201 Created`

```json
{
  "success": true,
  "message": "이미지 분석 완료 및 위시리스트에 성공적으로 등록되었습니다",
  "wishlist": {
    "id": 42,
    "userId": 5,
    "productName": "토트넘 유니폼",
    "price": 89000,
    "productImageUrl": "https://shopping-phinf.pstatic.net/main_123456/12345678.jpg",
    "fundingActive": false,
    "isPublic": false,
    "createdAt": "2025-08-06T10:30:00.123Z",
    "updatedAt": "2025-08-06T10:30:00.123Z"
  },
  "analysisData": {
    "caption_en": "tottenham away kit",
    "caption_ko": "토트넘 원정 유니폼",
    "extractedKeywords": ["토트넘 유니폼"],
    "searchKeyword": "토트넘 유니폼",
    "analyzedAt": "2025-08-06T10:30:00.000Z"
  }
}
```

### ⚠️ 검색 결과 없음 (위시리스트 등록 안됨)

**상태 코드**: `200 OK`

```json
{
  "success": false,
  "message": "검색 결과가 없으므로, 위시리스트에 저장되지 않았습니다",
  "analysisData": {
    "caption_en": "some unclear object",
    "caption_ko": "불분명한 물체",
    "extractedKeywords": ["물체"],
    "searchKeyword": "물체",
    "analyzedAt": "2025-08-06T10:30:00.000Z"
  }
}
```

### ❌ 에러 응답

#### 400 Bad Request
```json
{
  "error": "imageUrl is required"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 500 Internal Server Error
```json
{
  "error": "AI 분석 서버에 연결할 수 없습니다"
}
```

## 🧪 Postman 테스트 방법

### 1. 인증 토큰 준비

먼저 로그인 API를 호출하여 JWT 토큰을 획득합니다:

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

응답에서 `accessToken`을 복사합니다.

### 2. 이미지 분석 API 호출

#### 새 요청 생성
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/wishlists/analyze`

#### Headers 설정
```
Authorization: Bearer {복사한_토큰}
Content-Type: application/json
```

#### Body 설정 (raw JSON)

**토트넘 유니폼 테스트**:
```json
{
  "imageUrl": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500",
  "isPublic": false
}
```

**신발 테스트**:
```json
{
  "imageUrl": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
  "isPublic": true
}
```

### 3. 응답 확인

#### ✅ 성공 시 (검색 성공 + 위시리스트 등록)
- `"success": true`
- `"message": "이미지 분석 완료 및 위시리스트에 성공적으로 등록되었습니다"`
- `"wishlist"`: 등록된 위시리스트 정보
- `"analysisData"`: AI 분석 결과 상세 정보

#### ⚠️ 검색 실패 시
- `"success": false`
- `"message": "검색 결과가 없으므로, 위시리스트에 저장되지 않았습니다"`
- `"analysisData"`: AI 분석은 성공했지만 상품 검색 실패

이렇게 `success` 플래그로 성공/실패를 명확히 구분할 수 있습니다!

## 🔧 문제 해결

### AI 분석 서버 연결 실패
```bash
# BLIP2 AI 서버 실행
cd blip2_ai
python app.py
```

### 네이버 API 에러
`.env` 파일에서 네이버 API 키 확인:
```env
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 인증 실패
- JWT 토큰이 만료되었는지 확인
- Authorization 헤더 형식 확인: `Bearer {token}`

## 💡 키워드 추출 개선사항

### 기존 문제점
```
"토트넘 원정 유니폼 원정 유니폼, 토트넘, 축구 유니폼, 더 유닛, 축구 유니폼, 축구 유니폼"
→ ["토트넘", "유니폼", "원정", "축구", "유닛"] (5개, 불필요한 단어 포함)
```

### 개선된 결과
```
"토트넘 원정 유니폼 원정 유니폼, 토트넘, 축구 유니폼, 더 유닛, 축구 유니폼, 축구 유니폼"
→ ["토트넘 유니폼"] (1개, 핵심 조합)
```

### 개선 특징
- 🔄 **중복 제거**: 반복되는 구문 자동 제거
- 🎯 **스마트 조합**: 브랜드 + 카테고리 자동 결합
- 🚫 **불용어 필터링**: '키트', '유닛' 등 불필요한 단어 제거
- 📊 **우선순위 정렬**: 브랜드명, 카테고리명 우선 선택
- 🎯 **개수 제한**: 2-3개로 제한하여 정확한 검색

## 📈 사용 팁

1. **고화질 이미지 사용**: 더 정확한 AI 분석을 위해 선명한 이미지 권장
2. **단일 상품**: 여러 상품이 함께 있는 이미지보다 단일 상품 이미지가 더 정확
3. **정면 촬영**: 측면이나 각도보다는 정면 촬영된 이미지가 좋음
4. **브랜드 로고**: 브랜드 로고가 잘 보이는 이미지일 때 더 정확한 검색

이제 '토트넘 유니폼' 같은 핵심 키워드만 깔끔하게 추출하여 더 정확한 상품 검색이 가능합니다! 🎉
