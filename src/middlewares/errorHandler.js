// 기본 커스텀 에러 클래스
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "UNKNOWN_ERROR", data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.reason = message;
    this.data = data;
    this.isOperational = true;
  }
}

// 400번대 에러 - 클라이언트 요청 오류

// HTTP 400 - 잘못된 요청
class BadRequestError extends AppError {
  constructor(message = "잘못된 요청입니다", data = null) {
    super(message, 400, "B001", data);
  }
}

// HTTP 400 - 유효성 검사 실패
class ValidationError extends AppError {
  constructor(message = "입력값이 올바르지 않습니다", data = null) {
    super(message, 400, "B002", data);
  }
}

// HTTP 401 - 인증 필요
class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다", data = null) {
    super(message, 401, "A001", data);
  }
}

// HTTP 401 - 토큰 만료
class TokenExpiredError extends AppError {
  constructor(message = "토큰이 만료되었습니다", data = null) {
    super(message, 401, "A002", data);
  }
}

// HTTP 403 - 권한 없음
class ForbiddenError extends AppError {
  constructor(message = "권한이 없습니다", data = null) {
    super(message, 403, "F001", data);
  }
}

// HTTP 403 - 관리자 전용
class AdminOnlyError extends AppError {
  constructor(message = "관리자만 접근할 수 있습니다", data = null) {
    super(message, 403, "F002", data);
  }
}

// 404번대 에러 - 리소스 없음

// HTTP 404 - 일반 리소스 없음
class NotFoundError extends AppError {
  constructor(message = "요청한 리소스를 찾을 수 없습니다", data = null) {
    super(message, 404, "N001", data);
  }
}

// HTTP 404 - 사용자 없음
class UserNotFoundError extends AppError {
  constructor(message = "사용자를 찾을 수 없습니다", data = null) {
    super(message, 404, "N002", data);
  }
}

// HTTP 404 - 선물 없음
class GiftNotFoundError extends AppError {
  constructor(message = "선물을 찾을 수 없습니다", data = null) {
    super(message, 404, "N003", data);
  }
}

// 409번대 에러 - 중복/충돌

// HTTP 409 - 일반 중복
class ConflictError extends AppError {
  constructor(message = "이미 존재하는 데이터입니다", data = null) {
    super(message, 409, "C001", data);
  }
}

// HTTP 409 - 중복 이메일
class DuplicateEmailError extends AppError {
  constructor(message = "이미 사용 중인 이메일입니다", data = null) {
    super(message, 409, "C002", data);
  }
}

// HTTP 409 - 중복 참여
class DuplicateParticipationError extends AppError {
  constructor(message = "이미 참여한 선물입니다", data = null) {
    super(message, 409, "C003", data);
  }
}

// 500번대 에러 - 서버 내부 오류

// HTTP 500 - 서버 내부 오류
class InternalServerError extends AppError {
  constructor(message = "서버 내부 오류가 발생했습니다", data = null) {
    super(message, 500, "S001", data);
  }
}

// HTTP 500 - 데이터베이스 오류
class DatabaseError extends AppError {
  constructor(message = "데이터베이스 오류가 발생했습니다", data = null) {
    super(message, 500, "S002", data);
  }
}

// HTTP 500 - 결제 오류
class PaymentError extends AppError {
  constructor(message = "결제 처리 중 오류가 발생했습니다", data = null) {
    super(message, 500, "S003", data);
  }
}

// 에러 핸들러 및 유틸리티

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
  console.error(`에러 코드: ${errorCode}`);
  console.error(`에러 메시지: ${message}`);
  
  if (err.data) {
    console.error(`에러 데이터:`, err.data);
  }

  // 에러 응답
  res.status(statusCode).error({
    errorCode: errorCode,
    reason: message,
    data: err.data || null,
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

// 에러 코드 상수
const ERROR_CODES = {
  // 400번대
  BAD_REQUEST: "B001",
  VALIDATION_ERROR: "B002",
  UNAUTHORIZED: "A001",
  TOKEN_EXPIRED: "A002",
  FORBIDDEN: "F001",
  ADMIN_ONLY: "F002",
  
  // 404번대
  NOT_FOUND: "N001",
  USER_NOT_FOUND: "N002",
  GIFT_NOT_FOUND: "N003",
  
  // 409번대
  CONFLICT: "C001",
  DUPLICATE_EMAIL: "C002",
  DUPLICATE_PARTICIPATION: "C003",
  
  // 500번대
  INTERNAL_SERVER_ERROR: "S001",
  DATABASE_ERROR: "S002",
  PAYMENT_ERROR: "S003"
};

module.exports = {
  // 기본 에러 클래스
  AppError,
  
  // 400번대 에러
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  TokenExpiredError,
  ForbiddenError,
  AdminOnlyError,
  
  // 404번대 에러
  NotFoundError,
  UserNotFoundError,
  GiftNotFoundError,
  
  // 409번대 에러
  ConflictError,
  DuplicateEmailError,
  DuplicateParticipationError,
  
  // 500번대 에러
  InternalServerError,
  DatabaseError,
  PaymentError,
  
  // 유틸리티
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  ERROR_CODES
};