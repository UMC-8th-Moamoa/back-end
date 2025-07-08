//http://localhost:3000/api-docs //-swagger 문서 확인



const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();



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
      description: '생일선물 공동구매 플랫폼의 RESTful API 문서.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '개발 서버'
      }
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
    message: 'API 서버 실행 중', 
    docs: 'http://localhost:3000/api-docs' 
  });
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`API 문서: http://localhost:${PORT}/api-docs`);
});

// 에러 핸들러
// 모든 에러를 처리하는 미들웨어
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).error({
    errorCode: err.errorCode || "unknown",
    reason: err.reason || err.message || null,
    data: err.data || null,
  });
});
