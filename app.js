import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

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

// API 라우트들
import authRoutes from './src/routes/auth.routes.js';
// import userRoutes from './src/routes/user.routes.js';
// import eventRoutes from './src/routes/event.routes.js';

app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/events', eventRoutes);

// 에러 처리
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;