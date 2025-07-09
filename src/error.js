// HTTP 400 - 잘못된 요청 (Bad Request)
export class BadRequestError extends Error {
  errorCode = "B001";
  statusCode = 400;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 400 - 유효성 검사 실패 (Validation Error)
export class ValidationError extends Error {
  errorCode = "B002";
  statusCode = 400;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 401 - 인증 안됨 (Unauthorized)
export class UnauthorizedError extends Error {
  errorCode = "A001";
  statusCode = 401;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 401 - 토큰 만료 (Token Expired)
export class TokenExpiredError extends Error {
  errorCode = "A002";
  statusCode = 401;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 403 - 권한 없음 (Forbidden)
export class ForbiddenError extends Error {
  errorCode = "F001";
  statusCode = 403;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 403 - 관리자 전용 (Admin Only)
export class AdminOnlyError extends Error {
  errorCode = "F002";
  statusCode = 403;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 404 - 없는 데이터 (Not Found)
export class NotFoundError extends Error {
  errorCode = "N001";
  statusCode = 404;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 404 - 사용자 없음 (User Not Found)
export class UserNotFoundError extends Error {
  errorCode = "N002";
  statusCode = 404;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 404 - 이벤트 없음 (Event Not Found)
export class EventNotFoundError extends Error {
  errorCode = "N003";
  statusCode = 404;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 409 - 중복 데이터 (Conflict)
export class ConflictError extends Error {
  errorCode = "C001";
  statusCode = 409;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 409 - 중복 사용자 이메일 (Duplicate User Email)
export class DuplicateUserEmailError extends Error {
  errorCode = "C002";
  statusCode = 409;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 409 - 중복 이벤트 (Duplicate Event)
export class DuplicateEventError extends Error {
  errorCode = "C003";
  statusCode = 409;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 500 - 서버 에러 (Internal Server Error)
export class InternalServerError extends Error {
  errorCode = "S001";
  statusCode = 500;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 500 - 데이터베이스 에러 (Database Error)
export class DatabaseError extends Error {
  errorCode = "S002";
  statusCode = 500;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}

// HTTP 500 - 결제 에러 (Payment Error)
export class PaymentError extends Error {
  errorCode = "S003";
  statusCode = 500;

  constructor(reason, data) {
    super(reason);
    this.reason = reason;
    this.data = data;
  }
}