# 📌 Presigned URL 업로드 가이드

## 🎯 개요

Presigned URL 방식을 사용하면 클라이언트가 서버를 거치지 않고 직접 S3에 파일을 업로드할 수 있습니다.

### 장점
- ✅ 서버 부하 감소
- ✅ 더 빠른 업로드 속도
- ✅ 대용량 파일도 안전하게 업로드 가능
- ✅ Nginx, Express 업로드 제한과 무관

## 📋 API 엔드포인트

### 1. Presigned URL 생성
- `POST /api/upload/user-image/upload-url` - 사용자 이미지
- `POST /api/upload/wishlist-image/upload-url` - 위시리스트 이미지  
- `POST /api/upload/shopping-image/upload-url` - 쇼핑 이미지

### 2. 업로드 검증
- `POST /api/upload/verify` - 파일 존재 여부 확인
- `POST /api/upload/confirm` - 업로드 완료 확인 (DB 저장용)

### 3. 파일 삭제
- `DELETE /api/upload/image` - S3 파일 삭제

## 🚀 사용 방법

### Step 1: Presigned URL 요청
```javascript
const requestBody = {
  fileName: "profile.jpg",
  fileType: "image/jpeg"
};

const response = await fetch('/api/upload/user-image/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
});

const { data } = await response.json();
// data.uploadUrl - 업로드용 URL
// data.fileUrl - 최종 파일 접근 URL
// data.method - 'PUT'
// data.contentType - 'image/jpeg'
// data.expires - URL 만료 시간
```

### Step 2: S3에 직접 업로드
```javascript
const file = document.getElementById('fileInput').files[0];

const uploadResponse = await fetch(data.uploadUrl, {
  method: data.method, // 'PUT'
  headers: {
    'Content-Type': data.contentType
  },
  body: file
});

if (uploadResponse.ok) {
  console.log('업로드 성공!');
  console.log('파일 URL:', data.fileUrl);
} else {
  console.error('업로드 실패:', uploadResponse.status);
}
```

### Step 3: 업로드 확인 (선택사항)
```javascript
// 파일 존재 여부만 확인
await fetch('/api/upload/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileUrl: data.fileUrl })
});

// 또는 DB에 정보 저장과 함께 확인
await fetch('/api/upload/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileUrl: data.fileUrl,
    fileName: file.name,
    expectedSize: file.size
  })
});
```

## 🛠️ React 컴포넌트 예시

```jsx
import React, { useState } from 'react';

const PresignedUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // 1. Presigned URL 요청
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
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (uploadResponse.ok) {
        setUploadedUrl(data.fileUrl);
        
        // 3. 서버에 업로드 완료 알림 (선택사항)
        await fetch('/api/upload/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: data.fileUrl,
            fileName: file.name,
            expectedSize: file.size
          })
        });
        
        alert('업로드 성공!');
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? '업로드 중...' : '업로드'}
      </button>
      
      {uploadedUrl && (
        <div>
          <p>업로드 완료!</p>
          <img src={uploadedUrl} alt="업로드된 이미지" style={{maxWidth: '200px'}} />
          <p><a href={uploadedUrl} target="_blank">파일 보기</a></p>
        </div>
      )}
    </div>
  );
};

export default PresignedUploader;
```

## 📱 진행률 표시 업로드

```javascript
const uploadWithProgress = async (file, onProgress) => {
  // 1. Presigned URL 요청
  const urlResponse = await fetch('/api/upload/user-image/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type
    })
  });

  const { data } = await urlResponse.json();

  // 2. XMLHttpRequest로 진행률 추적하며 업로드
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(data.fileUrl);
      } else {
        reject(new Error('업로드 실패'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('네트워크 오류'));
    });

    xhr.open('PUT', data.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

// 사용 예시
const [progress, setProgress] = useState(0);

const handleUploadWithProgress = async () => {
  try {
    const fileUrl = await uploadWithProgress(file, setProgress);
    console.log('업로드 완료:', fileUrl);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

## 🔒 보안 고려사항

1. **URL 만료 시간**: Presigned URL은 5분 후 만료됩니다
2. **파일 크기 제한**: 최대 10MB (설정 가능)
3. **파일 형식 제한**: 이미지 파일만 허용 (png, jpg, jpeg, bmp, gif)
4. **폴더 제한**: 지정된 폴더(users, wishlists, shopping)에만 업로드 가능

## 🚨 에러 처리

```javascript
const handleUploadErrors = async () => {
  try {
    // ... 업로드 로직
  } catch (error) {
    if (error.status === 400) {
      console.error('잘못된 요청:', error.message);
    } else if (error.status === 413) {
      console.error('파일 크기 초과');
    } else if (error.status === 500) {
      console.error('서버 오류');
    } else {
      console.error('네트워크 오류');
    }
  }
};
```

## 📊 쇼핑 이미지 업로드 (카테고리별)

```javascript
const uploadShoppingImage = async (file, category) => {
  const response = await fetch('/api/upload/shopping-image/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      category: category // 'font', 'paper', 'seal' 중 하나
    })
  });

  const { data } = await response.json();
  
  // 이후 업로드 과정은 동일
  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });

  return data.fileUrl;
};
```

## 🗑️ 파일 삭제

```javascript
const deleteImage = async (imageUrl) => {
  const response = await fetch('/api/upload/image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });

  if (response.ok) {
    console.log('파일 삭제 완료');
  } else {
    console.error('파일 삭제 실패');
  }
};
```

---

이 가이드를 참고하여 Presigned URL 방식으로 안전하고 효율적인 파일 업로드를 구현하세요! 🚀
