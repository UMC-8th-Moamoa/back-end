import passport from 'passport';
import { verifyRefreshToken, generateTokenPair } from '../utils/jwt.util.js';
import { PrismaClient } from '@prisma/client';
import { 
  UnauthorizedError, 
  TokenExpiredError,
  UserNotFoundError,
  ForbiddenError,
  BadRequestError
} from './errorHandler.js';

const prisma = new PrismaClient();

/**
 * 로컬 인증 미들웨어 (이메일/비밀번호 로그인)
 */
export const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (error, user, info) => {
    if (error) {
      return next(error);
    }
    
    if (!user) {
      return next(new UnauthorizedError('로그인에 실패했습니다'));
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * JWT 인증 미들웨어
 */
export const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error) {
      return next(error);
    }
    
    if (!user) {
      return next(new UnauthorizedError('유효한 토큰이 필요합니다'));
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * 선택적 JWT 인증 미들웨어 (토큰이 있으면 인증, 없어도 통과)
 */
export const optionalAuthenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error) {
      return next(error);
    }
    
    req.user = user || null;
    next();
  })(req, res, next);
};

/**
 * 리프레시 토큰 검증 및 새 토큰 발급 미들웨어
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new UnauthorizedError('리프레시 토큰이 필요합니다');
    }
    
    // 리프레시 토큰 검증
    const decoded = verifyRefreshToken(refreshToken);
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // 새 토큰 쌍 생성
    const tokens = generateTokenPair(user.id, user.email, user.user_id);
    
    req.tokens = tokens;
    req.user = user;
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('인증이 필요합니다');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        // 향후 role 필드 추가 시 사용
        // role: true
      }
    });
    
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // 현재는 관리자 역할이 별도로 없으므로 주석 처리
    // if (user.role !== 'ADMIN') {
    //   throw new ForbiddenError('관리자 권한이 필요합니다');
    // }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 이메일 인증 필수 미들웨어
 */
export const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('인증이 필요합니다');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        emailVerified: true
      }
    });
    
    if (!user) {
      throw new UserNotFoundError();
    }
    
    if (!user.emailVerified) {
      throw new UnauthorizedError('이메일 인증이 필요합니다');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 본인 확인 미들웨어 (리소스 소유자만 접근 가능)
 */
export const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('인증이 필요합니다');
      }
      
      const resourceUserId = parseInt(req.params[userIdParam]);
      
      // parseInt 결과 검증 추가
      if (isNaN(resourceUserId)) {
        throw new BadRequestError('유효하지 않은 사용자 ID입니다');
      }
      
      if (req.user.id !== resourceUserId) {
        throw new UnauthorizedError('본인만 접근 가능합니다');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 사용자 정보 주입 미들웨어 (DB에서 최신 정보 가져오기)
 */
export const injectUserInfo = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        photo: true,
        cash: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 세션 기반 인증 미들웨어
 */
export const authenticateSession = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  next(new UnauthorizedError('세션 인증이 필요합니다'));
};

/**
 * 소셜 로그인 제공업체가 활성화되어 있는지 확인하는 함수
 */
const isProviderEnabled = (provider) => {
  switch (provider) {
    case 'kakao':
      return !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);
    default:
      return false;
  }
};

/**
 * 소셜 로그인 콜백 처리 미들웨어
 */
export const handleSocialCallback = (provider) => {
  return (req, res, next) => {
    // 제공업체가 활성화되어 있는지 확인
    if (!isProviderEnabled(provider)) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent(`${provider} 로그인이 현재 비활성화되어 있습니다`)}`);
    }

    // 해당 전략이 passport에 등록되어 있는지 확인
    if (!passport._strategies[provider]) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent(`${provider} 로그인 설정이 올바르지 않습니다`)}`);
    }

    passport.authenticate(provider, { session: false }, (error, user, info) => {
      if (error) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
      }
      
      if (!user) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent(`${provider} 로그인에 실패했습니다`)}`);
      }
      
      req.user = user;
      next();
    })(req, res, next);
  };
};

export default {
  authenticateLocal,
  authenticateJWT,
  optionalAuthenticateJWT,
  refreshToken,
  requireAdmin,
  requireEmailVerification,
  requireOwnership,
  injectUserInfo,
  authenticateSession,
  handleSocialCallback
};