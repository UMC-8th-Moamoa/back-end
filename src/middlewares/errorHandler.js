// src/middlewares/errorHandler.js

// 커스텀 에러 클래스
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "UNKNOWN_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message = "입력값이 올바르지 않습니다") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(message = "요청한 리소스를 찾을 수 없습니다") {
    super(message, 404, "NOT_FOUND");
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class AuthorizationError extends AppError {
  constructor(message = "권한이 없습니다") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

class ConflictError extends AppError {
  constructor(message = "이미 존재하는 데이터입니다") {
    super(message, 409, "CONFLICT_ERROR");
  }
}

// 글로벌 에러 핸들러
const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // 기본값 설정
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "UNKNOWN_ERROR";
  const message = err.message || "서버 오류가 발생했습니다";

  // 에러 로깅
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.error(`에러: ${message}`);

  // 에러 응답
  res.status(statusCode).error({
    errorCode: errorCode,
    reason: message,
    data: null,
  });
};

// 404 에러 처리
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`${req.originalUrl} 경로를 찾을 수 없습니다`);
  next(error);
};

// 비동기 함수 에러 처리 래퍼
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  AuthorizationError,
  ConflictError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};