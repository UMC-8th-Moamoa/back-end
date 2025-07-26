import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 설정 및 미들웨어 import
import passport from './src/config/passport.config.js';
import { globalErrorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';

// Express 앱 생성
const app = express();

// 미들웨어 설정

// 로깅 미들웨어
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// 기본 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 커스텀 응답 메서드
app.use((req, res, next) => {
  res.success = (success) => {
    return res.json({ resultType: "SUCCESS", error: null, success });
  };

  res.error = ({ errorCode = "unknown", reason = null, data = null }) => {
    return res.json({
      resultType: "FAIL",
      error: { errorCode, reason, data },
      success: null,
    });
  };

  next();
});

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '생일선물 공동구매 플랫폼 API',
      version: '1.0.0',
      description: 'UMC 8기 Moamoa 팀 - 생일선물 공동구매 플랫폼의 RESTful API 문서',
    },
    servers: [
      {
        url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api`,
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  res.json({ 
    message: 'UMC 8기 Moamoa - 생일선물 공동구매 플랫폼 API 서버', 
    docs: `${baseUrl}/api-docs`,
    health: `${baseUrl}/health`,
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? '연결됨' : '설정 필요'
  });
});

// API 라우트들 - 존재하는 파일들만 import
import authRoutes from './src/routes/auth.routes.js';
//import userRoutes from './src/routes/user.routes.js';

import wishlistRoutes from './src/routes/wishlist.routes.js';
import letterRoutes from './src/routes/letter.routes.js';

import moaRoutes from './src/routes/moa.route.js';
import birthdayRoutes from './src/routes/birthday.route.js';
import calendarRoutes from './src/routes/calendar.route.js';
import purchaseProofRoutes from './src/routes/purchaseProof.route.js';

import shoppingRoutes from './src/routes/shopping.routes.js';

// 라우트 등록
app.use('/api/auth', authRoutes);
//app.use('/api', userRoutes);

app.use('/api/wishlists', wishlistRoutes);
app.use('/api/letters', letterRoutes);

app.use('/api/moas', moaRoutes);
app.use('/api/users', birthdayRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/birthday-events', purchaseProofRoutes);

app.use('/api/shopping', shoppingRoutes);

// 에러 처리
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 서버 실행 부분
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📝 환경: ${NODE_ENV}`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 헬스체크: http://localhost:${PORT}/health`);
  console.log(`📅 달력 API: http://localhost:${PORT}/api/calendar/birthdays`);
  console.log(`🎁 구매인증 API: http://localhost:${PORT}/api/birthday-events/{eventId}/proof`);
});

// 에러 핸들링
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT}이 이미 사용 중입니다`);
    process.exit(1);
  } else {
    console.error('❌ 서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
});

// 시스템 종료 시 정리
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호 수신. 서버를 정리합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT 신호 수신. 서버를 정리합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});
