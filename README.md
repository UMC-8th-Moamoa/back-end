# 🎁 Moamoa back-end 팀 협업 가이드

> 생일 선물 공동 구매 플랫폼
> 
> 
> 마음을 모아 기쁨을 나누는 서비스
> 

## 🌿 Git 브랜치 전략

| 브랜치 | 용도 | 병합대상 | 설명 |
| --- | --- | --- | --- |
| `main` | 배포용 안전 버전 | - | 실제 서비스에 배포되는 안정화된 코드 |
| `dev` | 개발 통합 브랜치 | `main` | 모든 기능이 통합되어 테스트되는 브랜치 |
| `feat/기능명` | 기능 개발 브랜치 | `dev` | 새로운 기능을 개발하는 브랜치 |
- PR은 `feat/*` → `develop`, 이후 QA 완료 시 `develop` → `main`

## 🏷️ 브랜치 네이밍 규칙

```bash
feat/기능명-세부설명

feat/auth-login          # 로그인 기능
feat/group-create        # 선물 그룹 생성
feat/group-join          # 선물 그룹 참여
feat/group-management    # 선물 그룹 관리
```

## 📁 프로젝트 구조

```bash
moamoa-back-end/
├── src/
│   ├── controllers/                # 요청 처리 핸들러
│   ├── services/                   # 핵심 비즈니스 로직
│   ├── repositories/               # 데이터 접근 계층
│   ├── dtos/                       # 데이터 전송 객체
│   ├── middlewares/                # 미들웨어 / 인증, 오류 처리 등
│   │   ├── errorHandler.js
│   │   └── validator.middleware.js
│   ├── routes/                     # API 라우팅
│   ├── utils/                      # 유틸리티 함수
│   └── config/                     # 환경설정, Swagger, Passport 등
│   │   ├── app.config.js
│   │   └── db.config.js
├── app.js                          # Express 앱 설정
├── prisma/                         # Prisma 설정
├── .env                            # 환경변수
├── .gitignore
├── package.json
├── package-lock.json
```

## 📝 코드 컨벤션

**🔸 JavaScript/Node.js 코드 컨벤션 (ESLint 기준)**

- 따옴표는 `'` (single quote)
- 들여쓰기는 2칸
- 세미콜론(`;`) 필수
- 함수: camelCase
- 상수: UPPER_SNAKE_CASE
- 클래스: PascalCase
- 주석은 `//` 단일 주석을 우선 사용

## 🔀 PR 규칙

### PR 제목 규칙

- [타입] 간단한 설명

```less
[기능] feat: 로그인 API 구현
[버그] fix: 응답 코드 오류 수정
[문서] docs: README 업데이트
```

### 타입 분류

```less
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 설정, 패키지 매니저 설정 등 기타 변경사항
```

## 🚨 주의사항 및 규칙

### DO ✅

- **항상 dev에서 최신 코드를 받고 브랜치 생성**
- **기능별로 브랜치를 세분화해서 작업**
- **의미 있는 커밋 메시지 작성**
- **작은 단위로 자주 커밋**
- **PR 전에 dev와 충돌 해결**

### DON'T ❌

- **main 브랜치에 직접 커밋하지 않기**
- **여러 기능을 하나의 브랜치에서 작업하지 않기**
- **의미 없는 커밋 메시지 (예: "수정", "테스트") 사용하지 않기**
- **리뷰 없이 dev나 main에 병합하지 않기**

## 🛠️ 자주 사용하는 Git 명령어

### 브랜치 관리

```bash
# 현재 브랜치 확인
git branch

# 원격 브랜치 포함 모든 브랜치 확인
git branch -a

# 브랜치 생성 및 이동
git checkout -b feat/new-feature

# 브랜치 이동
git checkout dev

# 브랜치 삭제 (로컬)
git branch -d feat/completed-feature

# 브랜치 삭제 (원격)
git push origin --delete feat/completed-feature
```

### 동기화

```bash
# 원격 저장소에서 최신 정보 가져오기
git fetch origin

# 현재 브랜치를 원격과 동기화
git pull origin 브랜치명

# 로컬 변경사항을 원격에 푸시
git push origin 브랜치명
```
