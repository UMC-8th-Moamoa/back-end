# 생일자 위시리스트 상품 선택 API 명세서

## 개요
생일자가 자신의 위시리스트 상품 중에서 실제로 구매할 상품들을 선택하는 API입니다.

---

## 1. 위시리스트 상품 선택 (일괄 처리)

### `PUT /api/birthdays/me/event/wishlist/select`

생일자가 위시리스트 상품들을 선택합니다. 기존 선택은 모두 해제되고 새로 선택됩니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Request Body
```json
{
  "wishlistIds": [2, 3, 5]
}
```

**단일 상품 선택:**
```json
{
  "wishlistIds": [2]
}
```

**모든 선택 해제:**
```json
{
  "wishlistIds": []
}
```

#### Response
**성공 (200)**
```json
{
  "success": true,
  "data": {
    "wishlistId": [2, 3, 5],
    "totalSelectedAmount": 4500000,
    "currentAmount": 60000,
    "remainingAmount": -4440000
  }
}
```

**실패 (400) - 잘못된 요청**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "wishlistIds는 배열이어야 합니다"
  }
}
```

**실패 (404) - 존재하지 않는 위시리스트**
```json
{
  "success": false,
  "error": {
    "code": "WISHLIST_NOT_FOUND",
    "message": "존재하지 않는 위시리스트 상품이 포함되어 있습니다"
  }
}
```

---

## 2. 선택한 상품들 정산 가능 여부 확인

### EndPoint

---

```bash
POST /api/birthdays/me/event/wishlist/confirm
```

### Request Header

---

```bash
Authorization: Bearer {token}
```

### 설명

---

선택한 위시리스트 상품의 정산 가능 여부 확인

### Request Body

---

```json
{
  "wishlistIds": [1, 2]
}
```

### Response Body (예산 충족 시)

---

```json
{
  "success": true,
  "data": {
    "confirmedProducts": [
      {
        "id": 1,
        "name": "삼성 갤럭시버즈2 프로",
        "price": 100000
      },
      {
        "id": 2,
        "name": "아이폰 케이스",
        "price": 50000
      }
    ],
    "totalSelectedAmount": 150000,
    "currentAmount": 200000,
    "remainingAmount": 50000
  }
}
```

### Response Body (생일자가 추가 부담 필요)

---

```json
{
  "success": false,
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "예산이 초과되었습니다",
    "data": {
      "selectedProducts": [1, 2],
      "totalSelectedAmount": 150000,
      "currentAmount": 80000,
      "shortfallAmount": 70000
    }
  }
}
```

---

## 3. 구글폼 정산 링크 제공

### `GET /api/birthdays/me/event/formlink`

생일자에게 정산을 위한 구글폼 링크를 제공합니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Response
**성공 (200)**
```json
{
  "success": true,
  "data": {
    "googleFormUrl": "https://forms.gle/example123456",
    "message": "구글폼을 통해 정산을 진행해주세요",
    "eventId": 1,
    "selectedProducts": [
      {
        "wishlistId": 2,
        "productName": "맥북 에어 M3",
        "price": 1690000
      }
    ],
    "totalSelectedAmount": 1690000,
    "currentAmount": 60000,
    "instructions": "구글폼에서 선택한 상품 정보와 계좌 정보를 입력하면 관리자가 출금을 처리해드립니다."
  }
}
```

**실패 (400) - 선택된 상품 없음**
```json
{
  "success": false,
  "error": {
    "code": "NO_SELECTED_PRODUCTS",
    "message": "정산할 선택된 상품이 없습니다"
  }
}
```

---

## 공통 에러 응답

**인증 실패 (401)**
```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "UNAUTHORIZED",
    "reason": "인증이 필요합니다"
  }
}
```

**완료된 이벤트 없음 (404)**
```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "EVENT_NOT_FOUND",
    "reason": "완료된 생일 이벤트가 없습니다"
  }
}
```

**서버 오류 (500)**
```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "INTERNAL_SERVER_ERROR",
    "reason": "서버 내부 오류가 발생했습니다"
  }
}
```
