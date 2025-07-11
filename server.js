import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ 
  path: '.env.development',
  override: true 
});

// 기본값 설정
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'moamoa-dev-jwt-secret-key';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'moamoa-dev-refresh-secret-key';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';
if (!process.env.JWT_REFRESH_EXPIRES_IN) process.env.JWT_REFRESH_EXPIRES_IN = '30d';
if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = 'moamoa-dev-session-secret';
if (!process.env.CLIENT_URL) process.env.CLIENT_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 환경변수 설정 후에 동적으로 app.js 로드
const { default: app } = await import('./app.js');

// 서버 설정
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// 서버 시작
app.listen(PORT, () => {
  console.log(`UMC Moamoa 서버 실행 중: ${API_BASE_URL}`);
  console.log(`API 문서: ${API_BASE_URL}/api-docs`);
  console.log(`환경: ${process.env.NODE_ENV}`);
  console.log(`데이터베이스: ${process.env.DATABASE_URL ? '연결됨' : '설정 필요'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});