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
    .optional()
    .isMobilePhone('ko-KR')
    .withMessage('올바른 휴대폰 번호를 입력해주세요'),
  
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 14 || age > 100) {
        throw new Error('나이는 14세 이상 100세 이하여야 합니다');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요'),
  
  handleValidationErrors
];

// 프로필 업데이트 유효성 검사
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('이름은 2자 이상 20자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다'),
  
  body('phone')
    .optional()
    .isMobilePhone('ko-KR')
    .withMessage('올바른 휴대폰 번호를 입력해주세요'),
  
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  
  handleValidationErrors
];

// 위시리스트 관련 유효성 검사
const validateWishlist = [
  body('productName')
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1자 이상 100자 이하여야 합니다'),
  
  body('price')
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('가격은 1,000원 이상 10,000,000원 이하여야 합니다'),
  
  body('productImageUrl')
    .isURL()
    .withMessage('올바른 이미지 URL을 입력해주세요'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다'),
  
  handleValidationErrors
];

// 생일 이벤트 관련 유효성 검사
const validateBirthdayEvent = [
  body('title')
    .isLength({ min: 2, max: 100 })
    .withMessage('제목은 2자 이상 100자 이하여야 합니다'),
  
  body('targetAmount')
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('목표 금액은 1,000원 이상 10,000,000원 이하여야 합니다'),
  
  body('deadline')
    .isISO8601()
    .withMessage('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    .custom((value) => {
      const deadline = new Date(value);
      const today = new Date();
      
      if (deadline <= today) {
        throw new Error('마감일은 현재 날짜보다 이후여야 합니다');
      }
      return true;
    }),
  
  body('wishlistId')
    .isInt({ min: 1 })
    .withMessage('유효한 위시리스트 ID를 입력해주세요'),
  
  body('birthdayPersonId')
    .isInt({ min: 1 })
    .withMessage('유효한 생일 주인공 ID를 입력해주세요'),
  
  handleValidationErrors
];

// 이벤트 참여 관련 유효성 검사
const validateEventParticipation = [
  body('amount')
    .isInt({ min: 1000, max: 1000000 })
    .withMessage('참여 금액은 1,000원 이상 1,000,000원 이하여야 합니다'),
  
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('메시지는 500자 이하여야 합니다'),
  
  handleValidationErrors
];

// ID 파라미터 유효성 검사
const validateId = [
  param('id')
    .isInt({ min: 1 })
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

// 검색 관련 유효성 검사
const validateSearch = [
  query('keyword')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('검색어는 1자 이상 50자 이하여야 합니다'),
  
  query('category')
    .optional()
    .isIn(['all', 'users', 'events', 'wishlists'])
    .withMessage('카테고리는 all, users, events, wishlists 중 하나여야 합니다'),
  
  handleValidationErrors
];

// 친구 요청 관련 유효성 검사
const validateFriendRequest = [
  body('receiverId')
    .isInt({ min: 1 })
    .withMessage('유효한 수신자 ID를 입력해주세요'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateWishlist,
  validateBirthdayEvent,
  validateEventParticipation,
  validateId,
  validatePagination,
  validateSearch,
  validateFriendRequest,
  handleValidationErrors

};


