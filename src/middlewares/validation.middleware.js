import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from './errorHandler.js';

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

// 회원가입 검증
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대소문자와 숫자를 포함해야 합니다'),
  
  body('name')
    .notEmpty()
    .withMessage('이름을 입력해주세요')
    .isLength({ max: 50 })
    .withMessage('이름은 50자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다'),
  
  body('user_id')  // user_id로 변경
    .notEmpty()
    .withMessage('사용자 ID를 입력해주세요')
    .isLength({ min: 4, max: 50 })
    .withMessage('사용자 ID는 4-50자 사이여야 합니다')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('사용자 ID는 영문, 숫자, 언더스코어만 사용 가능합니다')
    .custom(value => {
      if (value.startsWith('google_') || value.startsWith('kakao_')) {
        throw new Error('사용자 ID는 google_ 또는 kakao_로 시작할 수 없습니다');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .matches(/^010-\d{4}-\d{4}$/)
    .withMessage('올바른 휴대폰 번호 형식을 입력해주세요 (010-0000-0000)'),
  
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('올바른 날짜 형식을 입력해주세요'),
  
  // 에러 처리
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "VALIDATION_ERROR",
          reason: errors.array()[0].msg,
          data: null
        },
        success: null
      });
    }
    next();
  }
];

const validateUserLogin = [
  body('user_id')
    .notEmpty()
    .withMessage('아이디를 입력해주세요')
    .isLength({ min: 3, max: 50 })
    .withMessage('아이디는 3자 이상 50자 이하여야 합니다'),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "B002",
          reason: errors.array()[0].msg,
          data: errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg
          }))
        },
        success: null
      });
    }
    next();
  }
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



// 위시리스트 생성 유효성 검사
const validateWishlistCreation = [
  body('insertType')
    .isIn(['URL', 'IMAGE'])
    .withMessage('insertType은 URL 또는 IMAGE여야 합니다'),
  
  body('isPublic')
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다'),

  // insertType이 URL인 경우
  body('url')
    .if(body('insertType').equals('URL'))
    .isURL()
    .withMessage('올바른 URL을 입력해주세요'),

  // insertType이 IMAGE인 경우
  body('productName')
    .if(body('insertType').equals('IMAGE'))
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1자 이상 100자 이하여야 합니다')
    .trim(),
  
  body('price')
    .if(body('insertType').equals('IMAGE'))
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('가격은 1,000원 이상 10,000,000원 이하여야 합니다'),
  
  body('imageUrl')
    .if(body('insertType').equals('IMAGE'))
    .isURL()
    .withMessage('올바른 이미지 URL을 입력해주세요')
    .isLength({ max: 255 })
    .withMessage('이미지 URL은 255자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

// 위시리스트 수정 유효성 검사
const validateWishlistUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 위시리스트 ID를 입력해주세요'),
  
  body('productName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1자 이상 100자 이하여야 합니다')
    .trim(),
  
  body('price')
    .optional()
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('가격은 1,000원 이상 10,000,000원 이하여야 합니다'),
  
  body('productImageUrl')
    .optional()
    .isURL()
    .withMessage('올바른 이미지 URL을 입력해주세요')
    .isLength({ max: 255 })
    .withMessage('이미지 URL은 255자를 초과할 수 없습니다'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다'),
  
  // 최소 하나의 필드는 수정되어야 함
  body()
    .custom((value, { req }) => {
      const updateFields = ['productName', 'price', 'productImageUrl', 'isPublic'];
      const hasUpdate = updateFields.some(field => req.body[field] !== undefined);
      
      if (!hasUpdate) {
        throw new Error('수정할 필드를 최소 하나 이상 입력해주세요');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// 위시리스트 조회 쿼리 유효성 검사
const validateWishlistQuery = [
  query('sort')
    .optional()
    .isIn(['created_at', 'price_desc', 'price_asc'])
    .withMessage('sort는 created_at, price_desc, price_asc 중 하나여야 합니다'),
  
  query('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('visibility는 public 또는 private이어야 합니다'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다'),
  
  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지 크기는 1~100 사이여야 합니다'),
  
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

// 편지 등록 유효성 검사
const validateLetterCreation = [
  body('birthdayEventId')
    .isInt({ min: 1 })
    .withMessage('유효한 생일 이벤트 ID를 입력해주세요'),
  
  body('senderId')
    .isInt({ min: 1 })
    .withMessage('유효한 발신자 ID를 입력해주세요'),
  
  body('receiverId')
    .isInt({ min: 1 })
    .withMessage('유효한 수신자 ID를 입력해주세요'),
  
  body('content')
    .isLength({ min: 1, max: 5000 })
    .withMessage('편지 내용은 1자 이상 5000자 이하여야 합니다')
    .trim(),
  
  body('letterPaperId')
    .isInt({ min: 1 })
    .withMessage('유효한 편지지 ID를 입력해주세요'),
  
  body('envelopeId')
    .isInt({ min: 1 })
    .withMessage('유효한 편지봉투 ID를 입력해주세요'),
  
  body('envelopeImageUrl')
    .optional()
    .isURL()
    .withMessage('올바른 이미지 URL을 입력해주세요')
    .isLength({ max: 255 })
    .withMessage('이미지 URL은 255자를 초과할 수 없습니다'),
  
  handleValidationErrors
];

// 편지 수정 유효성 검사
const validateLetterUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 편지 ID를 입력해주세요'),

  body('content')
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage('편지 내용은 1자 이상 5000자 이하여야 합니다')
    .trim(),
  
  body('letterPaperId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 편지지 ID를 입력해주세요'),
  
  body('envelopeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 편지봉투 ID를 입력해주세요'),
  
  body('envelopeImageUrl')
    .optional()
    .isURL()
    .withMessage('올바른 이미지 URL을 입력해주세요')
    .isLength({ max: 255 })
    .withMessage('이미지 URL은 255자를 초과할 수 없습니다'),

  // 최소 하나의 필드는 수정되어야 함
  body()
    .custom((value, { req }) => {
      const updateFields = ['content', 'letterPaperId', 'envelopeId', 'envelopeImageUrl'];
      const hasUpdate = updateFields.some(field => req.body[field] !== undefined);
      
      if (!hasUpdate) {
        throw new Error('수정할 필드를 최소 하나 이상 입력해주세요');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// 비밀번호 변경 유효성 검사
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('현재 비밀번호를 입력해주세요'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('새 비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('새 비밀번호는 대소문자와 숫자를 포함해야 합니다'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('비밀번호 확인이 일치하지 않습니다');
      }
      return true;
    }),
  
  handleValidationErrors
];

// 이메일 인증 요청 유효성 검사
const validateEmailVerification = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요')
    .normalizeEmail(),
  
  handleValidationErrors
];

// 이메일 인증 코드 확인 유효성 검사
const validateEmailVerificationCode = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요')
    .normalizeEmail(),
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('인증 코드는 6자리여야 합니다')
    .isNumeric()
    .withMessage('인증 코드는 숫자만 입력 가능합니다'),
  
  handleValidationErrors
];

// 비밀번호 재설정 요청 유효성 검사
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요')
    .normalizeEmail(),
  
  handleValidationErrors
];

// 비밀번호 재설정 유효성 검사
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('재설정 토큰이 필요합니다'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('새 비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('새 비밀번호는 대소문자와 숫자를 포함해야 합니다'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('비밀번호 확인이 일치하지 않습니다');
      }
      return true;
    }),
  
  handleValidationErrors
];

// 닉네임 확인 유효성 검사
const validateNicknameCheck = [
  param('nickname')
    .isLength({ min: 2, max: 20 })
    .withMessage('닉네임은 2자 이상 20자 이하여야 합니다')
    .matches(/^[가-힣a-zA-Z0-9_]+$/)
    .withMessage('닉네임은 한글, 영문, 숫자, 언더스코어만 입력 가능합니다'),
  
  handleValidationErrors
];

// 리프레시 토큰 유효성 검사
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('리프레시 토큰이 필요합니다')
    .isJWT()
    .withMessage('올바른 토큰 형식이 아닙니다'),
  
  handleValidationErrors
];

export {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateWishlistCreation,
  validateWishlistUpdate,
  validateWishlistQuery,
  validateBirthdayEvent,
  validateEventParticipation,
  validateLetterCreation,
  validateLetterUpdate,
  validateId,
  validatePagination,
  validateSearch,
  validateFriendRequest,
  validatePasswordChange,
  validateEmailVerification,
  validateEmailVerificationCode,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateNicknameCheck,
  validateRefreshToken,
  validateSendPasswordCode,
  handleValidationErrors
};
