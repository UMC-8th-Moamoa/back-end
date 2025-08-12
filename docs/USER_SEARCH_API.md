# 사용자 검색 API 명세서

## 개요
홈화면에서 다른 사용자들을 이름이나 로그인용 ID로 검색하여 찾을 수 있는 기능을 위한 API입니다.
UI에서 보이는 것처럼 검색 기록 관리 기능을 지원합니다.

---

## 1. 사용자 검색 API

### EndPoint
```bash
GET /api/users/search
```

### Request Header
```bash
Authorization: Bearer {token}
```

### 설명
사용자 이름이나 사용자 ID로 다른 사용자들을 검색

### Query Parameters
| 이름 | 타입 | 필수 | 설명 | 기본값 |
| --- | --- | --- | --- | --- |
| q | string | O | 검색어 (사용자 이름 또는 사용자 ID) | - |
| limit | int | X | 검색 결과 개수 | 10 |
| page | int | X | 페이지 번호 | 1 |

### Response Body

**성공 응답**
```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "users": [
      {
        "id": 123,
        "userId": "chaoni_gold",
        "name": "금채원",
        "photo": "https://example.com/profiles/profile1.jpg",
        "birthday": "1995-03-15",
        "isFollowing": false,
        "isFollower": false,
        "followersCount": 45,
        "followingCount": 32
      },
      {
        "id": 456,
        "userId": "kms_min",
        "name": "김민수", 
        "photo": null,
        "birthday": "1997-07-22",
        "isFollowing": true,
        "isFollower": false,
        "followersCount": 28,
        "followingCount": 67
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**검색 결과 없음**
```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "users": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalCount": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## 2. 검색 기록 조회 API

### EndPoint
```bash
GET /api/users/search/history
```

### Request Header
```bash
Authorization: Bearer {token}
```

### 설명
사용자의 최근 검색 기록을 조회

### Query Parameters
| 이름 | 타입 | 필수 | 설명 | 기본값 |
| --- | --- | --- | --- | --- |
| limit | int | X | 조회할 검색 기록 수 | 10 |

### Response Body
```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "searchHistory": [
      {
        "id": 1,
        "searchTerm": "금채원",
        "searchedAt": "2025-08-11T10:30:00Z"
      },
      {
        "id": 2,
        "searchTerm": "chaoni_gold",
        "searchedAt": "2025-08-11T09:15:00Z"
      },
      {
        "id": 3,
        "searchTerm": "김민수",
        "searchedAt": "2025-08-10T16:45:00Z"
      }
    ]
  }
}
```

---

## 3. 검색 기록 삭제 API

### EndPoint
```bash
DELETE /api/users/search/history/{historyId}
```

### Request Header
```bash
Authorization: Bearer {token}
```

### 설명
특정 검색 기록을 삭제

### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| historyId | int | O | 삭제할 검색 기록 ID |

### Response Body
```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "message": "검색 기록이 삭제되었습니다"
  }
}
```

---

## 공통 에러 응답

### 400 Bad Request - 잘못된 요청
```json
{
  "resultType": "ERROR",
  "error": {
    "errorCode": "VALIDATION_ERROR",
    "reason": "검색어는 1자 이상 입력해야 합니다"
  },
  "success": null
}
```

### 401 Unauthorized - 인증 필요
```json
{
  "resultType": "ERROR",
  "error": {
    "errorCode": "AUTHENTICATION_ERROR",
    "reason": "로그인이 필요합니다"
  },
  "success": null
}
```

### 404 Not Found - 검색 기록 없음
```json
{
  "resultType": "ERROR",
  "error": {
    "errorCode": "NOT_FOUND",
    "reason": "검색 기록을 찾을 수 없습니다"
  },
  "success": null
}
```

### 500 Internal Server Error - 서버 오류
```json
{
  "resultType": "ERROR",
  "error": {
    "errorCode": "SERVER_ERROR",
    "reason": "서버 내부 오류가 발생했습니다"
  },
  "success": null
}
```

---

## 구현 세부사항

### 1. 검색 로직
- **검색 대상**: 사용자 이름(`name`)과 사용자 ID(`user_id`) 모두에서 부분 일치 검색
- **검색 방식**: 대소문자 구분 없이 검색 (MySQL LIKE 연산자 사용)
- **제외 대상**: 현재 로그인한 사용자, 탈퇴한 사용자, 비활성 계정 제외

### 2. 검색 기록 관리
- **저장 시점**: 실제 검색 API 호출 시점에 검색어 저장
- **중복 처리**: 동일 검색어 재검색 시 최신 시간으로 업데이트
- **보관 제한**: 최대 50개 검색 기록 유지 (초과시 오래된 것부터 삭제)

### 3. 응답 데이터 설명
- `isFollowing`: 현재 사용자가 해당 사용자를 팔로우하는지 여부
- `isFollower`: 해당 사용자가 현재 사용자를 팔로우하는지 여부  
- `birthday`: 생일 정보 (프라이버시 설정에 따라 null일 수 있음)
- `photo`: 프로필 사진 URL (없으면 null)

### 4. 데이터베이스 스키마 (새로 생성 필요)
```sql
CREATE TABLE SearchHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  searchTerm VARCHAR(50) NOT NULL,
  searchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_searched_at (userId, searchedAt DESC)
);
```

---

## 테스트 시나리오

### 기본 검색 테스트
```bash
# 이름으로 검색
GET /api/users/search?q=금채원

# 사용자 ID로 검색  
GET /api/users/search?q=chaoni_gold

# 부분 검색
GET /api/users/search?q=금
```

### 검색 기록 관리 테스트
```bash
# 검색 기록 조회
GET /api/users/search/history

# 특정 검색 기록 삭제
DELETE /api/users/search/history/1
```

### 에러 케이스 테스트
```bash
# 빈 검색어
GET /api/users/search?q=

# 인증 없이 요청
GET /api/users/search?q=test
```
