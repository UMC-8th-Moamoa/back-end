# 배포 체크리스트 - 이메일 서비스

## 1. 서비스 이메일 계정 준비
- [ ] Gmail 또는 비즈니스 이메일 계정 생성
- [ ] 2단계 인증 활성화
- [ ] 앱 비밀번호 생성

## 2. 배포 플랫폼 환경 변수 설정
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=실제서비스이메일@gmail.com
SMTP_PASS=실제앱비밀번호
SMTP_FROM_NAME=MOA MOA
SMTP_FROM_EMAIL=실제서비스이메일@gmail.com
NODE_ENV=production
```

## 3. 테스트
- [ ] 배포 후 `GET /api/test/email/status` 호출하여 상태 확인
- [ ] 실제 이메일 주소로 `POST /api/test/email/test` 테스트
- [ ] 회원가입 플로우 전체 테스트

## 4. 모니터링
- [ ] 이메일 발송 로그 모니터링
- [ ] 이메일 발송 실패율 체크
- [ ] Gmail 계정 사용량 모니터링

## 5. 고급 옵션 (선택사항)
- [ ] AWS SES로 이전 검토
- [ ] 이메일 템플릿 개선
- [ ] 발송량 제한 설정
