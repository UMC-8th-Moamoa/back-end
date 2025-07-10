const passport = require('passport');
const JWTUtil = require('../utils/jwt.util');
const { UnauthorizedError, ForbiddenError, TokenExpiredError } = require('./errorHandler');

// JWT 토큰 검증 미들웨어
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new UnauthorizedError('인증이 필요합니다'));
    }

    
    req.user = user;
    next();
  })(req, res, next);
};

// 선택적 JWT 인증 (토큰이 있으면 검증, 없어도 통과)
const optionalAuthenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // 토큰이 없어도 통과
  }

  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      req.user = user;
    }
    
    next();
  })(req, res, next);
};

// Local 로그인 미들웨어
const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new UnauthorizedError('이메일 또는 비밀번호가 잘못되었습니다'));
    }

    req.user = user;
    next();
  })(req, res, next);
};

// 자신의 리소스인지 확인하는 미들웨어
const checkResourceOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('인증이 필요합니다'));
    }

    // URL 파라미터, 쿼리 파라미터, 요청 바디에서 사용자 ID 확인
    const resourceUserId = req.params[userIdField] || 
                          req.query[userIdField] || 
                          req.body[userIdField];

    if (!resourceUserId) {
      return next(new ForbiddenError('리소스 접근 권한이 없습니다'));
    }

    // 문자열로 비교 (DB에서 오는 ID와 JWT의 ID 타입이 다를 수 있음)
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return next(new ForbiddenError('자신의 리소스만 접근할 수 있습니다'));
    }

    next();
  };
};

// 친구 관계 확인 미들웨어
const checkFriendship = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('인증이 필요합니다'));
    }

    const targetUserId = req.params.userId || req.body.userId;
    if (!targetUserId) {
      return next(new ForbiddenError('대상 사용자 ID가 필요합니다'));
    }

    // 자신의 리소스는 항상 접근 가능
    if (req.user.id.toString() === targetUserId.toString()) {
      return next();
    }

    // 친구 관계 확인
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            requesterId: req.user.id,
            receiverId: parseInt(targetUserId),
            status: 'ACCEPTED'
          },
          {
            requesterId: parseInt(targetUserId),
            receiverId: req.user.id,
            status: 'ACCEPTED'
          }
        ]
      }
    });

    if (!friendship) {
      return next(new ForbiddenError('친구만 접근할 수 있습니다'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 토큰 새로고침 미들웨어
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new UnauthorizedError('Refresh token이 필요합니다'));
    }

    // Refresh token 검증
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);
    
    // 사용자 존재 확인
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return next(new UnauthorizedError('유효하지 않은 사용자입니다'));
    }

    // 새로운 토큰 쌍 생성
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);
    
    req.tokens = tokens;
    req.user = user;
    next();

  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError('토큰 갱신에 실패했습니다'));
  }
};

module.exports = {
  authenticateJWT,
  optionalAuthenticateJWT,
  authenticateLocal,
  checkResourceOwnership,
  checkFriendship,
  refreshToken
};
