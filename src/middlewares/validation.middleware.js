const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// 유효성 검사 결과 처리하는 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return next(new ValidationError('입력값이 올바르지 않습니다', errorMessages));
  }
  
  next();
};

// 사용자 관련 유효성 검사
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대소문자와 숫자를 포함해야 합니다'),
  
  body('name')
    .isLength({ min: 2, max: 20 })
    .withMessage('이름은 2자 이상 20자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다'),
  
  body('phone')
    .isMobilePhone('ko-KR')
    .withMessage('올바른 휴대폰 번호를 입력해주세요'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요'),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요'),
  
  handleValidationErrors
];

// ... 추가 예정

// ID 파라미터 유효성 검사
const validateId = [
  param('id')
    .isNumeric()
    .withMessage('유효한 ID를 입력해주세요'),
  
  handleValidationErrors
];

// 페이지네이션 유효성 검사
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1~100 사이여야 합니다'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateId,
  validatePagination,
  handleValidationErrors
};