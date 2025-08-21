import express from 'express';
import { createServer } from 'http';
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

// WebSocket 초기화 import
import { initializeSocket } from './src/utils/websocket/notificationSocket.js';

// 자동 이벤트 서비스 import
import './src/services/autoEvent.service.js';

// Express 앱 생성
const app = express();

// HTTP 서버 생성 (WebSocket을 위해)
const httpServer = createServer(app);

// WebSocket 서버 초기화
initializeSocket(httpServer);

// 미들웨어 설정

// 로깅 미들웨어
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// 보안 미들웨어
// helmet 설정을 수정하세요
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));
// Express 앱에 헬스체크 엔드포인트 추가
app.get('/health', (req, res) => {
  // 데이터베이스 연결 상태 확인
  const dbStatus = checkDatabaseConnection();
  
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    memory: process.memoryUsage(),
    database: dbStatus
  };

  if (dbStatus.status === 'error') {
    return res.status(503).json({
      ...healthStatus,
      status: 'error'
    });
  }

  res.status(200).json(healthStatus);
});

// 데이터베이스 연결 확인 함수 (예시)
function checkDatabaseConnection() {
  try {
    // 실제 DB 연결 상태 확인 로직
    // MongoDB: mongoose.connection.readyState
    // MySQL: connection.ping()
    return { status: 'ok', connected: true };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

// PM2와의 연동을 위한 ready 신호
/*
if (process.env.NODE_ENV === 'production') {
  if (process.send) {
    process.send('ready');
  }
}
*/

if (process.env.NODE_ENV === 'production') {
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}

// CORS 설정
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://54.180.138.131:3000',  // 가상서버 URL 추가
    'http://localhost:3000',
    'https://www.moamoas.com',
    'https://moamoa-front-end.vercel.app',
    'https://moamoa-front-45ga96k6u-hyejun-koos-projects.vercel.app', // 실제 프런트엔드 도메인 추가
    /^https:\/\/moamoa-front.*\.vercel\.app$/, // Vercel 프리뷰 도메인 패턴
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  maxAge: 86400 // 24시간 preflight 캐싱
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
    version: '1.0.0',
    websocket: {
      enabled: true,
      endpoint: `ws://localhost:${process.env.PORT || 3000}`
    }
  });
});

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? '연결됨' : '설정 필요',
    websocket: 'active'
  });
});

// API 라우트들 - 존재하는 파일들만 import
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import uploadRoutes from './src/routes/upload.route.js';

import wishlistRoutes from './src/routes/wishlist.routes.js';
import letterRoutes from './src/routes/letter.routes.js';

import notificationRoutes from './src/routes/notification.routes.js';

import moaRoutes from './src/routes/moa.routes.js';
import letterHomeRoutes from './src/routes/letterHome.routes.js';
import upcomingBirthdayRoutes from './src/routes/upcomingBirthday.routes.js';
import birthdayRoutes from './src/routes/birthday.routes.js';
import calendarRoutes from './src/routes/calendar.routes.js';

import userSearchRoutes from './src/routes/userSearch.routes.js';

import myBirthdayRoutes from './src/routes/myBirthday.routes.js';
import birthdayEventRoutes from './src/routes/birthdayEvent.routes.js';
import eventParticipationRoutes from './src/routes/eventParticipation.routes.js';
import wishlistVoteRoutes from './src/routes/wishlistVote.routes.js';

import eventShareRoutes from './src/routes/eventShare.routes.js';

import purchaseProofRoutes from './src/routes/purchaseProof.routes.js';

import shoppingRoutes from './src/routes/shopping.routes.js';
import mypageRoutes from './src/routes/mypage.routes.js';

import demoRoutes from './src/routes/demo.routes.js';

import eventCompletionRoutes from './src/routes/eventCompletion.routes.js';
import donationRoutes from './src/routes/donation.routes.js';
import aiRoutes from './src/routes/aiRoutes.js';

import eventForceRoutes from './src/routes/eventForce.routes.js';

import paymentRoutes from './src/routes/payment.routes.js';

// 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/api/wishlists', wishlistRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/demo', demoRoutes);
app.use('/ai', aiRoutes);
app.use('/ai/wishlists', wishlistRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/moas', moaRoutes);
app.use('/api/home', letterHomeRoutes);
app.use('/api/birthdays', upcomingBirthdayRoutes)
app.use('/api/users', birthdayRoutes);
app.use('/api/calendar', calendarRoutes);

app.use('/api/users', userSearchRoutes);

app.use('/api/birthdays', myBirthdayRoutes);
app.use('/api/birthdays', birthdayEventRoutes);
app.use('/api/birthdays', eventParticipationRoutes);
app.use('/api/birthdays', wishlistVoteRoutes);

app.use('/api/birthdays', eventShareRoutes);

app.use('/api/birthdays', purchaseProofRoutes);

app.use('/api/shopping', shoppingRoutes);
app.use('/api/mypage', mypageRoutes);

// 이벤트 완료 처리 라우트
app.use('/api/birthdays/me/event', eventCompletionRoutes);
app.use('/api/donations', donationRoutes);

// 디버그 라우트 추가
import debugRoutes from './debug-routes.js';
app.use('/debug', debugRoutes);

// 이벤트 강제 종료
app.use('/api/test', eventForceRoutes);

app.use('/api/payment', paymentRoutes);


// 에러 처리
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 서버 실행 부분
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 🚀 HTTP 서버 시작 (WebSocket 포함)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📝 환경: ${NODE_ENV}`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 헬스체크: http://localhost:${PORT}/health`);
  console.log(`🔔 알림 API: http://localhost:${PORT}/api/notifications`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(`📅 달력 API: http://localhost:${PORT}/api/calendar/birthdays`);
  console.log(`🎁 구매인증 API: http://localhost:${PORT}/api/birthday-events/{eventId}/proof`);
});

// 에러 핸들링
httpServer.on('error', (error) => {
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
  httpServer.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT 신호 수신. 서버를 정리합니다...');
  httpServer.close(() => {
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

