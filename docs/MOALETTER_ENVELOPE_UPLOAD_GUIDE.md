# 📮 모아레터 편지봉투 이미지 업로드 가이드

## 🎯 개요
모아레터에서 편지봉투에 붙일 우표 이미지를 업로드하는 최신 방식입니다.

## ✨ 주요 변경사항

### 🔴 기존 방식 (Deprecated)
```javascript
// ❌ 기존: 어떻게 업로드했는지 불명확
const letter = {
  envelopeImageUrl: "https://somewhere.com/image.jpg" // 출처 불명
}
```

### 🔵 최신 방식 (Recommended)
```javascript
// ✅ 새로운 방식: 체계적인 업로드 + 검증
// 1단계: Presigned URL 생성
// 2단계: 클라이언트에서 직접 S3 업로드
// 3단계: 편지 작성 시 검증된 URL 사용
```

## 🛠 API 사용법

### 1️⃣ 편지봉투 이미지 업로드 URL 생성

**POST** `/api/upload/letter-envelope/upload-url`

```json
{
  "fileName": "my_stamp.png",
  "fileType": "image/png"
}
```

**응답:**
```json
{
  "success": true,
  "message": "편지봉투 이미지 업로드 URL이 생성되었습니다.",
  "data": {
    "uploadUrl": "https://moamoas-s3.s3.amazonaws.com/letters/envelopes/uuid_timestamp.png?...",
    "fileUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/letters/envelopes/uuid_timestamp.png",
    "key": "letters/envelopes/uuid_timestamp.png",
    "expires": "2025-08-20T15:30:00.000Z"
  }
}
```

### 2️⃣ 클라이언트에서 S3에 직접 업로드

```javascript
const uploadEnvelopeImage = async (file) => {
  try {
    // 1. Presigned URL 생성
    const response = await fetch('/api/upload/letter-envelope/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type
      })
    });

    const { data } = await response.json();
    
    // 2. S3에 직접 업로드
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (uploadResponse.ok) {
      console.log('✅ 업로드 성공:', data.fileUrl);
      return data.fileUrl; // 이 URL을 편지 작성 시 사용
    }
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
  }
};
```

### 3️⃣ 편지 작성/수정 시 사용

```javascript
const createLetter = async (letterData, envelopeImageFile) => {
  let envelopeImageUrl = null;
  
  // 우표 이미지가 있으면 먼저 업로드
  if (envelopeImageFile) {
    envelopeImageUrl = await uploadEnvelopeImage(envelopeImageFile);
  }
  
  // 편지 생성
  const letterPayload = {
    ...letterData,
    envelopeImageUrl // 업로드된 이미지 URL 사용
  };
  
  const response = await fetch('/api/letters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(letterPayload)
  });
  
  return response.json();
};
```

## 📂 S3 폴더 구조

```
moamoas-s3/
├── users/                    # 사용자 프로필 이미지
├── wishlists/                # 위시리스트 이미지
├── shopping/                 # 쇼핑 아이템 이미지
│   ├── font/
│   ├── paper/
│   └── seal/
└── letters/                  # 📮 새로 추가
    └── envelopes/            # 편지봉투 우표 이미지
        ├── uuid1_timestamp.png
        ├── uuid2_timestamp.jpg
        └── ...
```

## 🔒 보안 및 제한사항

- **업로드 URL 유효기간**: 15분
- **지원 파일 형식**: PNG, JPG, JPEG, BMP, GIF
- **최대 파일 크기**: 5MB
- **폴더 경로**: `letters/envelopes/` 고정

## 🧪 Postman 테스트

### 1단계: URL 생성
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/upload/letter-envelope/upload-url`
- **Body** (raw JSON):
```json
{
  "fileName": "test_stamp.png",
  "fileType": "image/png"
}
```

### 2단계: S3 업로드
- **Method**: `PUT`  
- **URL**: `{응답에서 받은 uploadUrl}`
- **Headers**: `Content-Type: image/png`
- **Body**: Binary 파일 선택

### 3단계: 편지 작성
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/letters`
- **Body**:
```json
{
  "birthdayEventId": 1,
  "senderId": 1,
  "receiverId": 2,
  "content": "생일 축하해!",
  "letterPaperId": 1,
  "envelopeId": 1,
  "envelopeImageUrl": "{2단계 응답의 fileUrl}"
}
```

## 💡 마이그레이션 가이드

기존 편지 시스템을 사용 중이라면:

1. **프론트엔드 수정**: 편지 작성 폼에서 이미지 업로드 로직을 위 방식으로 변경
2. **기존 데이터**: 현재 `envelopeImageUrl`은 그대로 유지 (호환성)
3. **새로운 편지**: 모든 새 편지는 이 방식으로 업로드

## ❓ 문제 해결

### CORS 오류 발생 시
S3 버킷에 다음 CORS 설정이 적용되어 있는지 확인:
```json
[
  {
    "AllowedOrigins": ["http://localhost:5174", "https://www.moamoas.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 업로드 실패 시
1. 파일 크기 확인 (5MB 이하)
2. 파일 형식 확인 (이미지 파일만)
3. URL 만료 확인 (15분 이내 사용)

---

🎉 **이제 모아레터 우표 이미지 업로드가 최신 방식으로 업그레이드되었습니다!**
