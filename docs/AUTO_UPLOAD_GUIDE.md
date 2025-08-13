# 자동 이미지 업로드 API 테스트 가이드

## 🚀 새로운 자동 업로드 API

이제 **파일만 보내면 자동으로 S3에 업로드**되는 간편한 API가 추가되었습니다!

## 📋 API 목록

### 1. 사용자 이미지 자동 업로드
**URL**: `POST /api/upload/user-image/auto`
**Content-Type**: `multipart/form-data`

#### Postman 설정:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/upload/user-image/auto`
- **Body**: 
  - **form-data** 선택
  - **Key**: `image` (File 타입)
  - **Value**: 이미지 파일 선택

#### 응답 예시:
```json
{
  "success": true,
  "message": "이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "imageUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg",
    "fileName": "profile.jpg",
    "fileSize": 1024000,
    "key": "users/uuid_timestamp.jpg",
    "uploadedAt": "2025-08-12T12:00:00.000Z"
  }
}
```

### 2. 위시리스트 이미지 자동 업로드
**URL**: `POST /api/upload/wishlist-image/auto`
**Content-Type**: `multipart/form-data`

#### Postman 설정:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/upload/wishlist-image/auto`
- **Body**: 
  - **form-data** 선택
  - **Key**: `image` (File 타입)
  - **Value**: 이미지 파일 선택

### 3. 다중 이미지 자동 업로드
**URL**: `POST /api/upload/multiple-images/auto?folder=users`
**Content-Type**: `multipart/form-data`

#### Postman 설정:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/upload/multiple-images/auto?folder=users`
  - **Query Parameter**: 
    - Key: `folder`
    - Value: `users` 또는 `wishlists`
- **Body**: 
  - **form-data** 선택
  - **Key**: `images` (File 타입, Multiple files 체크)
  - **Value**: 여러 이미지 파일 선택 (최대 5개)

#### 응답 예시:
```json
{
  "success": true,
  "message": "3개의 이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "images": [
      {
        "imageUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid1_timestamp.jpg",
        "fileName": "image1.jpg",
        "fileSize": 1024000,
        "key": "users/uuid1_timestamp.jpg"
      },
      {
        "imageUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid2_timestamp.png",
        "fileName": "image2.png",
        "fileSize": 2048000,
        "key": "users/uuid2_timestamp.png"
      }
    ],
    "totalCount": 3,
    "uploadedAt": "2025-08-12T12:00:00.000Z"
  }
}
```

## 🔄 두 가지 방식 비교

### Presigned URL 방식 (기존)
- **장점**: 서버 리소스 절약, 더 빠른 업로드
- **사용법**: 2단계 (URL 생성 → 클라이언트에서 S3 직접 업로드)
- **적합한 경우**: 대용량 파일, 많은 동시 업로드

### 자동 업로드 방식 (신규)
- **장점**: 간단한 사용법, 한 번의 요청으로 완료
- **사용법**: 1단계 (파일 전송 → 서버에서 자동 처리)
- **적합한 경우**: 작은 파일, 간단한 구현

## 🛠️ Postman Collection 업데이트

기존 Collection에 다음 요청들을 추가하세요:

### 자동 업로드 요청들
1. **사용자 이미지 자동 업로드**
   - POST `/api/upload/user-image/auto`
   - Body: form-data, Key: `image` (File)

2. **위시리스트 이미지 자동 업로드**
   - POST `/api/upload/wishlist-image/auto`
   - Body: form-data, Key: `image` (File)

3. **다중 이미지 자동 업로드**
   - POST `/api/upload/multiple-images/auto?folder=users`
   - Body: form-data, Key: `images` (Multiple Files)

## ⚠️ 에러 처리

### 400 Bad Request
```json
{
  "success": false,
  "message": "이미지 파일이 필요합니다."
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "message": "파일 크기가 5MB를 초과했습니다."
}
```

### 413 Too Many Files
```json
{
  "success": false,
  "message": "최대 5개의 파일만 업로드할 수 있습니다."
}
```

## 🎯 사용 권장사항

1. **단일 이미지**: `/auto` API 사용 (간편함)
2. **대용량 파일**: `/upload-url` API 사용 (성능)
3. **다중 이미지**: `/multiple-images/auto` API 사용
4. **프로덕션 환경**: 필요에 따라 두 방식 모두 제공

이제 원하는 방식으로 이미지 업로드를 구현할 수 있습니다! 🎉
