import jwt from 'jsonwebtoken';
import { UnauthorizedError, TokenExpiredError } from '../middlewares/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '14d';

/**
 * 액세스 토큰 생성
 * @param {number} userId - 사용자 ID (user_pk)
 * @param {string} email - 사용자 이메일
 * @param {string} userIdAlias - 사용자 별칭 (user_id)
 * @returns {string} - JWT 액세스 토큰
 */
export const generateAccessToken = (userId, email, userIdAlias = null) => {
  const payload = {
    userId,
    email,
    userIdAlias,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'moamoa-platform',
    audience: 'moamoa-users'
  });
};

/**
 * 리프레시 토큰 생성
 * @param {number} userId - 사용자 ID (user_pk)
 * @param {string} email - 사용자 이메일
 * @param {string} userIdAlias - 사용자 별칭 (user_id)
 * @returns {string} - JWT 리프레시 토큰
 */
export const generateRefreshToken = (userId, email, userIdAlias = null) => {
  const payload = {
    userId,
    email,
    userIdAlias,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'moamoa-platform',
    audience: 'moamoa-users'
  });
};

/**
 * 토큰 쌍 생성 (액세스 토큰 + 리프레시 토큰)
 * @param {number} userId - 사용자 ID (user_pk)
 * @param {string} email - 사용자 이메일
 * @param {string} userIdAlias - 사용자 별칭 (user_id)
 * @returns {Object} - 토큰 쌍 객체
 */
export const generateTokenPair = (userId, email, userIdAlias = null) => {
  const accessToken = generateAccessToken(userId, email, userIdAlias);
  const refreshToken = generateRefreshToken(userId, email, userIdAlias);

  return {
    accessToken,
    refreshToken
  };
};

  
/**
 * 액세스 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'moamoa-platform',
      audience: 'moamoa-users'
    });

    if (decoded.type !== 'access') {
      throw new UnauthorizedError('유효하지 않은 액세스 토큰입니다');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('만료된 액세스 토큰입니다');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('유효하지 않은 액세스 토큰입니다');
    }
    throw error;
  }
};

/**
 * 리프레시 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'moamoa-platform',
      audience: 'moamoa-users'
    });

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('만료된 리프레시 토큰입니다');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다');
    }
    throw error;
  }
};


/**
 * 토큰에서 사용자 ID 추출
 * @param {string} token - 토큰
 * @returns {number} - 사용자 ID
 */
export const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
};

/**
 * 토큰 만료 시간 확인
 * @param {string} token - 토큰
 * @returns {Date|null} - 만료 시간 또는 null
 */
export const getTokenExpirationDate = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * 토큰이 만료되었는지 확인
 * @param {string} token - 토큰
 * @returns {boolean} - 만료 여부
 */
export const isTokenExpired = (token) => {
  const expirationDate = getTokenExpirationDate(token);
  if (!expirationDate) {
    return true;
  }
  return new Date() >= expirationDate;
};

/**
 * 이메일 인증 토큰 생성
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증 코드
 * @returns {string} - 이메일 인증 토큰
 */
export const generateEmailVerificationToken = (email, code) => {
  const payload = {
    email,
    code,
    type: 'email_verification'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '10m', // 10분
    issuer: 'moamoa-platform',
    audience: 'moamoa-users'
  });
};

/**
 * 이메일 인증 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'moamoa-platform',
      audience: 'moamoa-users'
    });

    if (decoded.type !== 'email_verification') {
      throw new UnauthorizedError('유효하지 않은 이메일 인증 토큰입니다');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('만료된 이메일 인증 토큰입니다');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('유효하지 않은 이메일 인증 토큰입니다');
    }
    throw error;
  }
};

/**
 * 비밀번호 재설정 토큰 생성
 * @param {string} email - 사용자 이메일
 * @param {number} userId - 사용자 ID
 * @returns {string} - 비밀번호 재설정 토큰
 */
export const generatePasswordResetToken = (email, userId) => {
  const payload = {
    email,
    userId,
    type: 'password_reset'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30m', // 30분
    issuer: 'moamoa-platform',
    audience: 'moamoa-users'
  });
};

/**
 * 비밀번호 재설정 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - 디코딩된 페이로드
 */
export const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'moamoa-platform',
      audience: 'moamoa-users'
    });

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('유효하지 않은 비밀번호 재설정 토큰입니다');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('만료된 비밀번호 재설정 토큰입니다');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('유효하지 않은 비밀번호 재설정 토큰입니다');
    }
    throw error;
  }
};




export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  getUserIdFromToken,
  getTokenExpirationDate,
  isTokenExpired,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
};
