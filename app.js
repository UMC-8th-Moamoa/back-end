
require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

// Passport 설정 불러오기
const passport = require('./src/config/passport.config');

const { globalErrorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');

// 로깅 미들웨어
app.use(morgan('combined'));

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
        url: `http://localhost:${process.env.PORT || 3000}/api`,
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

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'UMC 8기 Moamoa - 생일선물 공동구매 플랫폼 API 서버', 
    docs: `http://localhost:${process.env.PORT || 3000}/api-docs`,
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API 라우트들
const authRoutes = require('./src/routes/auth.routes');
// const userRoutes = require('./src/routes/user.routes');
// const eventRoutes = require('./src/routes/event.routes');

app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/events', eventRoutes);

// 404 에러 처리
app.use(notFoundHandler);

// 글로벌 에러 핸들러
app.use(globalErrorHandler);

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 UMC Moamoa 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
  console.log(`🌍 환경: ${process.env.NODE_ENV}`);
  console.log(`💾 데이터베이스: ${process.env.DATABASE_URL ? '연결됨' : '설정 필요'}`);
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

module.exports = app;