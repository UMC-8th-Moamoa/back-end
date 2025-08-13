# S3 Presigned URL 업로드 가이드

## 개요
S3 Presigned URL 방식으로 이미지 업로드를 구현했습니다. 클라이언트가 서버를 거치지 않고 직접 S3에 업로드할 수 있어 더 효율적입니다.

## 폴더 구조
```
moamoas-s3/
├── users/          # 사용자 관련 이미지
└── wishlists/      # 위시리스트 관련 이미지
```

## API 엔드포인트

### 1. 사용자 이미지 업로드 URL 생성
```
POST /api/upload/user-image/upload-url
```

**요청 Body:**
```json
{
  "fileName": "profile.jpg",
  "fileType": "image/jpeg"
}
```

**응답:**
```json
{
  "success": true,
  "message": "사용자 이미지 업로드 URL이 생성되었습니다.",
  "data": {
    "uploadUrl": "https://moamoas-s3.s3.amazonaws.com/users/uuid_timestamp.jpg?AWSAccessKeyId=...",
    "fileUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg",
    "key": "users/uuid_timestamp.jpg",
    "expires": "2025-08-12T10:30:00.000Z"
  }
}
```

### 2. 위시리스트 이미지 업로드 URL 생성
```
POST /api/upload/wishlist-image/upload-url
```

**요청 Body:**
```json
{
  "fileName": "wishlist_item.png",
  "fileType": "image/png"
}
```

### 3. 이미지 삭제
```
DELETE /api/upload/image
```

**요청 Body:**
```json
{
  "imageUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
}
```

### 4. 업로드 완료 확인 (선택사항)
```
POST /api/upload/confirm
```

**요청 Body:**
```json
{
  "fileUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg",
  "fileName": "profile.jpg",
  "fileSize": 1024000
}
```

## 클라이언트 사용법

### 1. JavaScript/Fetch 예시
```javascript
// 1단계: 업로드 URL 요청
const getUploadUrl = async (fileName, fileType) => {
  const response = await fetch('/api/upload/user-image/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileType })
  });
  
  const data = await response.json();
  return data.data;
};

// 2단계: 파일을 S3에 직접 업로드
const uploadToS3 = async (file) => {
  const { uploadUrl, fileUrl } = await getUploadUrl(file.name, file.type);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (uploadResponse.ok) {
    console.log('업로드 성공:', fileUrl);
    return fileUrl;
  } else {
    throw new Error('업로드 실패');
  }
};

// 사용 예시
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const fileUrl = await uploadToS3(file);
      console.log('업로드된 파일 URL:', fileUrl);
    } catch (error) {
      console.error('업로드 실패:', error);
    }
  }
});
```

### 2. React 예시
```jsx
import { useState } from 'react';

const ImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // 1. 업로드 URL 요청
      const urlResponse = await fetch('/api/upload/user-image/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });
      
      const { data } = await urlResponse.json();
      
      // 2. S3에 직접 업로드
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      if (uploadResponse.ok) {
        setImageUrl(data.fileUrl);
        console.log('업로드 성공:', data.fileUrl);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} accept="image/*" />
      {uploading && <p>업로드 중...</p>}
      {imageUrl && <img src={imageUrl} alt="업로드된 이미지" />}
    </div>
  );
};
```

## 장점

### Presigned URL 방식의 장점:
1. **서버 리소스 절약**: 파일이 서버를 거치지 않음
2. **더 빠른 업로드**: 클라이언트에서 S3로 직접 업로드
3. **확장성**: 대용량 파일이나 많은 동시 업로드 처리 가능
4. **비용 절약**: 서버 대역폭 사용량 감소

### 기존 방식과 비교:
| 구분 | 기존 방식 | Presigned URL 방식 |
|------|-----------|-------------------|
| 업로드 경로 | 클라이언트 → 서버 → S3 | 클라이언트 → S3 |
| 서버 부하 | 높음 | 낮음 |
| 업로드 속도 | 보통 | 빠름 |
| 파일 크기 제한 | 서버 메모리 제약 | S3 제약만 적용 |

## 보안 고려사항

1. **URL 만료 시간**: 5분으로 설정 (필요시 조정 가능)
2. **파일 크기 제한**: 5MB로 제한
3. **파일 형식 검증**: 서버에서 확장자 및 MIME 타입 검증
4. **ACL 설정**: public-read로 설정되어 업로드된 파일은 공개

## 환경 변수 설정
```
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key  
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=moamoas-s3
```

## 라우터 등록
app.js에 업로드 라우터를 추가해야 합니다:
```javascript
import uploadRouter from './src/routes/upload.route.js';

app.use('/api/upload', uploadRouter);
```
