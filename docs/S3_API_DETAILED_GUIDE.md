# S3 Presigned URL API 사용 가이드

## 📖 개요

이 문서는 S3 Presigned URL을 사용한 이미지 업로드 API의 상세 사용법을 설명합니다.

## 🔗 Swagger 문서

서버가 실행 중일 때 다음 URL에서 대화형 API 문서를 확인할 수 있습니다:
- **Swagger UI**: `http://localhost:3000/api-docs`

## 📁 S3 폴더 구조

```
moamoas-s3/
├── users/          # 사용자 관련 이미지 (프로필, 아바타 등)
└── wishlists/      # 위시리스트 관련 이미지 (상품, 선물 아이템 등)
```

## 🛠 API 엔드포인트

### 1. 사용자 이미지 업로드 URL 생성

**POST** `/api/upload/user-image/upload-url`

사용자 프로필 이미지, 아바타 등을 업로드하기 위한 Presigned URL을 생성합니다.

#### 요청 예시:
```bash
curl -X POST http://localhost:3000/api/upload/user-image/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "profile.jpg",
    "fileType": "image/jpeg"
  }'
```

#### 응답 예시:
```json
{
  "success": true,
  "message": "사용자 이미지 업로드 URL이 생성되었습니다.",
  "data": {
    "uploadUrl": "https://moamoas-s3.s3.amazonaws.com/users/550e8400-e29b-41d4-a716-446655440000_1723456789000.jpg?AWSAccessKeyId=...",
    "fileUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/550e8400-e29b-41d4-a716-446655440000_1723456789000.jpg",
    "key": "users/550e8400-e29b-41d4-a716-446655440000_1723456789000.jpg",
    "expires": "2025-08-12T10:35:00.000Z"
  }
}
```

### 2. 위시리스트 이미지 업로드 URL 생성

**POST** `/api/upload/wishlist-image/upload-url`

위시리스트 아이템, 상품 이미지 등을 업로드하기 위한 Presigned URL을 생성합니다.

#### 요청 예시:
```bash
curl -X POST http://localhost:3000/api/upload/wishlist-image/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "gift_item.png",
    "fileType": "image/png"
  }'
```

### 3. 이미지 삭제

**DELETE** `/api/upload/image`

S3에 업로드된 이미지를 삭제합니다.

#### 요청 예시:
```bash
curl -X DELETE http://localhost:3000/api/upload/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/550e8400-e29b-41d4-a716-446655440000_1723456789000.jpg"
  }'
```

#### 응답 예시:
```json
{
  "success": true,
  "message": "이미지가 성공적으로 삭제되었습니다."
}
```

### 4. 업로드 완료 확인 (선택사항)

**POST** `/api/upload/confirm`

클라이언트에서 업로드 완료 후 서버에 알림. 업로드 로그 기록 등에 사용.

#### 요청 예시:
```bash
curl -X POST http://localhost:3000/api/upload/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/550e8400-e29b-41d4-a716-446655440000_1723456789000.jpg",
    "fileName": "profile.jpg",
    "fileSize": 1024000
  }'
```

## 🔧 클라이언트 구현 예시

### JavaScript/Fetch 완전한 예시:

```javascript
class S3ImageUploader {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // 1. 업로드 URL 요청
  async getUploadUrl(fileName, fileType, category = 'user') {
    const endpoint = category === 'user' ? 
      '/api/upload/user-image/upload-url' : 
      '/api/upload/wishlist-image/upload-url';

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, fileType })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  }

  // 2. S3에 파일 직접 업로드
  async uploadToS3(uploadUrl, file) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.statusText}`);
    }
    
    return response;
  }

  // 3. 업로드 완료 확인 (선택사항)
  async confirmUpload(fileUrl, fileName, fileSize) {
    const response = await fetch(`${this.baseUrl}/api/upload/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl, fileName, fileSize })
    });
    
    return response.json();
  }

  // 4. 전체 업로드 프로세스
  async uploadImage(file, category = 'user') {
    try {
      // Step 1: 업로드 URL 요청
      console.log('1. Getting upload URL...');
      const { uploadUrl, fileUrl } = await this.getUploadUrl(
        file.name, 
        file.type, 
        category
      );
      
      // Step 2: S3에 직접 업로드
      console.log('2. Uploading to S3...');
      await this.uploadToS3(uploadUrl, file);
      
      // Step 3: 업로드 완료 확인 (선택사항)
      console.log('3. Confirming upload...');
      await this.confirmUpload(fileUrl, file.name, file.size);
      
      console.log('Upload completed successfully!');
      return fileUrl;
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // 이미지 삭제
  async deleteImage(imageUrl) {
    const response = await fetch(`${this.baseUrl}/api/upload/image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl })
    });
    
    return response.json();
  }
}

// 사용 예시
const uploader = new S3ImageUploader();

document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const imageUrl = await uploader.uploadImage(file, 'user');
      console.log('Uploaded image URL:', imageUrl);
      
      // 업로드된 이미지 표시
      document.getElementById('previewImage').src = imageUrl;
      
    } catch (error) {
      alert('업로드 실패: ' + error.message);
    }
  }
});
```

### React Hook 예시:

```jsx
import { useState, useCallback } from 'react';

const useS3Upload = (baseUrl = 'http://localhost:3000') => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (file, category = 'user') => {
    setUploading(true);
    setProgress(0);
    
    try {
      // 1. 업로드 URL 요청
      setProgress(25);
      const endpoint = category === 'user' ? 
        '/api/upload/user-image/upload-url' : 
        '/api/upload/wishlist-image/upload-url';
      
      const urlResponse = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });
      
      const { data } = await urlResponse.json();
      
      // 2. S3에 업로드
      setProgress(50);
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      if (!uploadResponse.ok) {
        throw new Error('업로드 실패');
      }
      
      // 3. 완료 확인
      setProgress(75);
      await fetch(`${baseUrl}/api/upload/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size
        })
      });
      
      setProgress(100);
      return data.fileUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [baseUrl]);

  return { uploadImage, uploading, progress };
};

// 컴포넌트에서 사용
const ImageUploadComponent = () => {
  const { uploadImage, uploading, progress } = useS3Upload();
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const url = await uploadImage(file, 'user');
        setImageUrl(url);
      } catch (error) {
        alert('업로드 실패: ' + error.message);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {uploading && (
        <div>
          <p>업로드 중... {progress}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
      {imageUrl && <img src={imageUrl} alt="업로드된 이미지" />}
    </div>
  );
};
```

## ⚠️ 제한사항 및 주의사항

### 파일 제한:
- **최대 파일 크기**: 5MB
- **지원 확장자**: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.gif`
- **지원 MIME 타입**: `image/png`, `image/jpg`, `image/jpeg`, `image/bmp`, `image/gif`

### 보안:
- **URL 만료 시간**: 5분 (업로드 URL은 5분 후 자동 만료)
- **ACL 설정**: `public-read` (업로드된 파일은 공개적으로 접근 가능)
- **파일 검증**: 서버에서 확장자 및 MIME 타입 검증

### 성능:
- **동시 업로드**: 여러 파일을 동시에 업로드 가능
- **서버 부하**: 파일이 서버를 거치지 않아 서버 리소스 절약
- **네트워크**: 클라이언트에서 S3로 직접 전송하여 더 빠른 업로드

## 🐛 문제 해결

### 자주 발생하는 오류:

1. **403 Forbidden**: 
   - AWS 자격 증명 확인
   - S3 버킷 권한 설정 확인

2. **400 Bad Request**:
   - 파일 확장자 및 MIME 타입 확인
   - 요청 파라미터 확인

3. **413 Payload Too Large**:
   - 파일 크기가 5MB 초과인지 확인

4. **URL Expired**:
   - Presigned URL은 5분간만 유효
   - 새로운 URL을 요청해야 함

### 디버깅 팁:
- 브라우저 개발자 도구의 네트워크 탭에서 요청/응답 확인
- 서버 로그에서 상세한 오류 메시지 확인
- Swagger UI를 통해 API 테스트

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.
