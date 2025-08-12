# 🎯 데모 데이 기능 테스트 가이드

## 📋 테스트 준비사항

### 1. 서버 실행 확인
```bash
npm run dev
```
서버가 http://localhost:3000에서 실행되고 있어야 합니다.

### 2. 데이터베이스 확인
- MySQL 서버가 실행 중인지 확인
- `moamoa_dev` 데이터베이스에 `DemoEvent`, `DemoLetter` 테이블이 생성되었는지 확인

### 3. JWT 토큰 준비
실제 사용자로 로그인하여 JWT 토큰을 얻어야 합니다.

---

## 🧪 테스트 방법들

### 방법 1: Node.js 테스트 스크립트 사용
```bash
cd test
node demo-test.js
```
**주의**: 파일 내의 `TEST_JWT_TOKEN` 변수를 실제 토큰으로 변경해야 합니다.

### 방법 2: PowerShell Curl 스크립트 사용
```bash
.\test\demo-test-curl.ps1
```
**주의**: 파일 내의 주석을 제거하고 토큰과 공유 링크를 실제 값으로 변경해야 합니다.

### 방법 3: Postman 사용
1. `test/demo-postman-collection.json` 파일을 Postman에 import
2. Collection Variables에서 `jwtToken`을 실제 토큰으로 변경
3. 순서대로 API 테스트 실행

### 방법 4: Swagger UI 사용
1. 브라우저에서 http://localhost:3000/api-docs 접속
2. Demo 섹션에서 각 API 테스트
3. Authorize 버튼을 클릭하여 JWT 토큰 입력

---

## 🎯 테스트 시나리오

### 시나리오 1: 기본 플로우
1. **데모 이벤트 생성** (로그인 필요)
   - POST `/api/demo/events`
   - 응답에서 `shareLink`와 `shareUrl` 확인

2. **공유 링크 유효성 확인** (비회원 접근)
   - GET `/api/demo/events/{shareLink}/public`
   - 이벤트 정보와 사용자 이름 확인

3. **편지 작성** (비회원 접근)
   - POST `/api/demo/events/{shareLink}/letters`
   - 작성자 이름과 편지 내용 입력

4. **편지 목록 확인** (로그인 필요)
   - GET `/api/demo/letters?page=1&size=10`
   - 작성된 편지들이 조회되는지 확인

### 시나리오 2: 에러 처리 테스트
1. **중복 이벤트 생성** 시도
   - 같은 사용자로 두 번째 이벤트 생성
   - 400 에러 응답 확인

2. **잘못된 공유 링크** 접근
   - 존재하지 않는 shareLink로 접근
   - 404 에러 응답 확인

3. **빈 편지 내용** 전송
   - writerName이나 content가 빈 값일 때
   - 400 에러 응답 확인

### 시나리오 3: 실제 사용 플로우 (데모 데이 상황)
1. **발표자**: 데모 이벤트 생성
2. **발표자**: 생성된 공유 URL을 청중들에게 공유
3. **청중들**: 공유 URL 접속하여 편지 작성
4. **발표자**: 실시간으로 들어오는 편지들 확인

---

## 🔍 확인해야 할 주요 포인트

### 1. 공유 링크 생성
- ✅ nanoid로 10자리 고유 ID 생성되는지
- ✅ 완전한 URL 형태로 반환되는지 (`http://localhost:3000/demo/{shareLink}`)

### 2. 비회원 접근
- ✅ JWT 토큰 없이 공유 링크 조회 가능한지
- ✅ JWT 토큰 없이 편지 작성 가능한지

### 3. 데이터 검증
- ✅ 작성자 이름 50자 제한
- ✅ 편지 내용 5000자 제한
- ✅ 빈 값 입력 시 에러 처리

### 4. 권한 관리
- ✅ 자신의 데모 이벤트와 편지만 조회 가능한지
- ✅ 다른 사용자의 편지에 접근 시 403 에러

### 5. 응답 형식
- ✅ 모든 응답이 일관된 형식인지
- ✅ 에러 응답도 표준 형식인지

---

## 🚨 문제 해결

### 서버 시작 오류
```bash
# 패키지 설치 확인
npm install

# 환경 변수 확인
# .env 파일에 DATABASE_URL, FRONTEND_URL 설정 확인
```

### 데이터베이스 오류
```bash
# 마이그레이션 다시 실행
npx prisma db push

# 데이터베이스 연결 확인
npx prisma studio
```

### JWT 토큰 오류
- 실제 로그인 API를 통해 유효한 토큰 획득
- 토큰 만료 시간 확인

---

## 📱 프론트엔드 연동 테스트

데모 데이 당일 프론트엔드와 연동할 때:
1. 공유 URL 형식: `http://localhost:3000/demo/{shareLink}`
2. 프론트엔드에서 shareLink 파라미터 추출
3. 해당 shareLink로 이벤트 정보 조회
4. 편지 작성 폼 제공
5. 편지 작성 완료 후 성공 메시지 표시

---

## 🎉 데모 데이 발표 시 체크리스트

- [ ] 서버 정상 실행 확인
- [ ] 데모 이벤트 미리 생성
- [ ] 공유 URL QR코드 준비
- [ ] 실시간으로 편지 확인할 수 있는 화면 준비
- [ ] 네트워크 환경 확인 (WiFi, 모바일 데이터)
- [ ] 백업 계획 준비
