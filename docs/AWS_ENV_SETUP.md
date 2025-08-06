# =================================
# AWS 배포용 환경변수 설정 가이드
# =================================

# 1. 데이터베이스 설정
DATABASE_URL="postgresql://username:password@host:port/database_name"
# 예시: DATABASE_URL="postgresql://myuser:mypass@localhost:5432/mydb"

# 2. JWT 인증 설정
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-complex"
JWT_EXPIRES_IN="7d"

# 3. 네이버 쇼핑 API (필수)
NAVER_CLIENT_ID="your_naver_client_id"
NAVER_CLIENT_SECRET="your_naver_client_secret"

# 4. BLIP2 AI 서버 URL (중요!)
# 로컬 개발용
BLIP2_SERVER_URL="http://localhost:5000"
# AWS 배포용 (같은 서버)
BLIP2_SERVER_URL="http://127.0.0.1:5000"
# AWS 배포용 (별도 서버) - 실제 IP로 교체 필요
BLIP2_SERVER_URL="http://your-ai-server-ip:5000"

# 5. 서버 설정
NODE_ENV="production"
PORT="3000"

# 6. CORS 설정 (프론트엔드 도메인)
FRONTEND_URL="https://your-frontend-domain.com"

# 7. 파일 업로드 (S3 등 사용 시)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="ap-northeast-2"
S3_BUCKET_NAME="your-bucket-name"

# 8. 로그 레벨
LOG_LEVEL="info"

# 9. API 제한 설정
RATE_LIMIT_WINDOW_MS="900000"  # 15분
RATE_LIMIT_MAX_REQUESTS="100"   # 15분당 100개 요청

# 10. 세션 설정 (사용 시)
SESSION_SECRET="your-session-secret-key"

# 11. 이메일 서비스 (사용 시)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"
