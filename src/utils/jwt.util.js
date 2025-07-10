const jwt = require('jsonwebtoken');
const { TokenExpiredError, UnauthorizedError } = require('../middlewares/errorHandler');

class JWTUtil {
  // Access Token 생성
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  // Refresh Token 생성
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
  }

  // Access Token 검증
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Access token이 만료되었습니다');
      }
      throw new UnauthorizedError('유효하지 않은 토큰입니다');
    }
  }

  // Refresh Token 검증
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Refresh token이 만료되었습니다');
      }
      throw new UnauthorizedError('유효하지 않은 refresh token입니다');
    }
  }

  // 토큰 페어 생성 (Access + Refresh)
  static generateTokenPair(userId, email) {
    const payload = { userId, email };
    
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  // 토큰에서 사용자 ID 추출
  static extractUserIdFromToken(token) {
    try {
      const decoded = this.verifyAccessToken(token);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }
}


module.exports = JWTUtil;
