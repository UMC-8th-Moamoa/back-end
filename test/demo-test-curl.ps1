# 데모 데이 기능 테스트용 curl 명령어들
# Windows PowerShell에서 실행 가능

# ============================================
# 1. 데모 이벤트 생성 (로그인 필요)
# ============================================
# 먼저 JWT 토큰을 얻어야 합니다
# $token = "YOUR_JWT_TOKEN_HERE"

echo "1. 데모 이벤트 생성 테스트"
# curl -X POST "http://localhost:3000/api/demo/events" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "{}"

echo ""
echo "============================================"
echo ""

# ============================================
# 2. 공유 링크로 데모 이벤트 조회 (비회원 가능)
# ============================================
# $shareLink = "GENERATED_SHARE_LINK"

echo "2. 공유 링크로 데모 이벤트 조회 (비회원)"
# curl -X GET "http://localhost:3000/api/demo/events/$shareLink/public"

echo ""
echo "============================================"
echo ""

# ============================================
# 3. 데모 편지 작성 (비회원 가능)
# ============================================
echo "3. 데모 편지 작성 (비회원)"
# curl -X POST "http://localhost:3000/api/demo/events/$shareLink/letters" -H "Content-Type: application/json" -d '{\"writerName\": \"테스트 작성자\", \"content\": \"안녕하세요! 데모 데이를 위한 테스트 편지입니다.\"}'

echo ""
echo "============================================"
echo ""

# ============================================
# 4. 내 데모 편지들 조회 (로그인 필요)
# ============================================
echo "4. 내 데모 편지들 조회"
# curl -X GET "http://localhost:3000/api/demo/letters?page=1&size=10" -H "Authorization: Bearer $token"

echo ""
echo "============================================"
echo ""

# ============================================
# 5. 내 데모 이벤트 조회 (로그인 필요)
# ============================================
echo "5. 내 데모 이벤트 조회"
# curl -X GET "http://localhost:3000/api/demo/events/my" -H "Authorization: Bearer $token"

echo ""
echo "============================================"
echo "테스트 실행 방법:"
echo "1. 위의 주석 처리된 curl 명령어들의 주석을 제거하세요"
echo "2. YOUR_JWT_TOKEN_HERE를 실제 JWT 토큰으로 변경하세요"
echo "3. GENERATED_SHARE_LINK를 실제 생성된 공유 링크로 변경하세요"
echo "4. PowerShell에서 이 파일을 실행하세요: .\test\demo-test-curl.ps1"
echo "============================================"
