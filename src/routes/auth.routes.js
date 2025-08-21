import express from 'express';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { 
  authenticateLocal, 
  authenticateJWT, 
  refreshToken,
  handleSocialCallback
} from '../middlewares/auth.middleware.js';

import { 
  validateUserRegistration, 
  validateUserLogin,
  validateEmailVerification,
  validateEmailVerificationCode,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateNicknameCheck,
  validateRefreshToken
} from '../middlewares/validation.middleware.js';

import { 
  DuplicateEmailError,
  catchAsync,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  BadRequestError
} from '../middlewares/errorHandler.js';

import { generateTokenPair } from '../utils/jwt.util.js';
import userController from '../controllers/userController.controllers.js';
import KakaoController from '../controllers/kakao.controller.js';

const router = express.Router();
const prisma = new PrismaClient();

// 카카오 OAuth가 설정되어 있는지 확인하는 함수
const isKakaoEnabled = () => {
  return !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 사용자 인증 관리 API
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - user_id
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 비밀번호
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: 이름
 *               user_id:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 50
 *                 description: 사용자 ID
 *               phone:
 *                 type: string
 *                 description: 휴대폰 번호
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: 생일
 *     responses:
 *       201:
 *         description: 회원가입 성공
 */
router.post('/register', validateUserRegistration, userController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - password
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 아이디
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
router.post('/login', validateUserLogin, userController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 리프레시 토큰
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 */
router.post('/refresh', validateRefreshToken, userController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 */
router.get('/me', authenticateJWT, userController.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
router.post('/logout', authenticateJWT, userController.logout);

/**
 * @swagger
 * /api/auth/email/check:
 *   post:
 *     summary: 이메일 중복 확인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 확인할 이메일
 *     responses:
 *       200:
 *         description: 이메일 중복 확인 결과
 */
router.post('/email/check', userController.checkEmail);

/**
 * @swagger
 * /api/auth/email/verify-email:
 *   post:
 *     summary: 이메일 인증 코드 발송
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 인증 코드를 받을 이메일
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 */
router.post('/email/verify-email', validateEmailVerification, userController.sendEmailVerification);

/**
 * @swagger
 * /api/auth/email/send-code:
 *   post:
 *     summary: 이메일 인증 코드 확인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
 *               code:
 *                 type: string
 *                 description: 인증 코드
 *     responses:
 *       200:
 *         description: 인증 코드 확인 성공
 */
router.post('/email/send-code', validateEmailVerificationCode, userController.verifyEmailCode);

/**
 * @swagger
 * /api/auth/find-id:
 *   post:
 *     summary: 아이디 찾기
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: 이름
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *     responses:
 *       200:
 *         description: 아이디 찾기 성공
 */
router.post('/find-id', userController.findUserId);

/**
 * @swagger
 * /api/auth/find-password:
 *   post:
 *     summary: 비밀번호 찾기 (재설정 요청)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 이메일 발송 성공
 */
router.post('/find-password', validatePasswordResetRequest, userController.requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: 재설정 토큰
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호
 *               confirmPassword:
 *                 type: string
 *                 description: 새 비밀번호 확인
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 */
router.post('/reset-password', validatePasswordReset, userController.resetPassword);

/**
 * @swagger
 * /api/auth/nickname/{nickname}/check:
 *   get:
 *     summary: 닉네임 중복 확인
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: nickname
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 닉네임
 *     responses:
 *       200:
 *         description: 닉네임 중복 여부 확인 성공
 */
router.get('/nickname/:nickname/check', validateNicknameCheck, userController.checkNickname);

// ===========================================
// 카카오 로그인 관련 라우트들
// ===========================================

// 카카오 로그인 라우트들 (조건부 등록)
if (isKakaoEnabled()) {
  console.log('✅ 카카오 OAuth 라우트가 등록되었습니다.');
  
  // 기존 Passport 방식 카카오 로그인
  /**
   * @swagger
   * /api/auth/kakao:
   *   get:
   *     summary: 카카오 로그인 시작 (Passport 방식)
   *     tags: [Auth]
   *     description: 카카오 OAuth 인증 페이지로 리다이렉트
   *     responses:
   *       302:
   *         description: 카카오 인증 페이지로 리다이렉트
   *       503:
   *         description: 카카오 로그인이 비활성화됨
   */
  router.get('/kakao', 
    passport.authenticate('kakao', {
      scope: ['profile_nickname', 'profile_image', 'account_email']
    })
  );

  /**
   * @swagger
   * /api/auth/kakao/callback:
   *   get:
   *     summary: 카카오 로그인 콜백 (Passport 방식)
   *     tags: [Auth]
   *     description: 카카오에서 인증 후 콜백을 받는 엔드포인트
   *     responses:
   *       302:
   *         description: 클라이언트 앱으로 리다이렉트 (토큰 포함)
   *       400:
   *         description: 인증 실패
   */
  router.get('/kakao/callback', 
    handleSocialCallback('kakao'),
    (req, res) => {
      try {
        // JWT 토큰 생성
        const tokens = generateTokenPair(req.user.id, req.user.email, req.user.user_id);
        
        // 클라이언트 URL 설정
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        
        // 토큰을 쿼리 파라미터로 전달하여 리다이렉트
        const redirectUrl = `${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('카카오 로그인 콜백 처리 중 오류:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`);
      }
    }
  );

  // 새로운 직접 구현 방식 카카오 로그인
  /**
   * @swagger
   * /api/auth/kakao-direct:
   *   get:
   *     summary: 카카오 로그인 시작 (직접 구현)
   *     tags: [Auth]
   *     description: 카카오 OAuth 인증 페이지로 리다이렉트 (Passport 대신 직접 구현)
   *     responses:
   *       302:
   *         description: 카카오 인증 페이지로 리다이렉트
   */
  router.get('/kakao-direct', KakaoController.startKakaoLogin);

  /**
   * @swagger
   * /api/auth/kakao/callback-direct:
   *   get:
   *     summary: 카카오 로그인 콜백 (직접 구현)
   *     tags: [Auth]
   *     description: 카카오에서 인증 후 콜백을 받는 엔드포인트
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: 카카오에서 발급한 인가 코드
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: CSRF 방지용 state 값
   *     responses:
   *       302:
   *         description: 클라이언트 앱으로 리다이렉트 (토큰 포함)
   *       400:
   *         description: 인증 실패
   */
  router.get('/kakao/callback-direct', KakaoController.handleKakaoCallback);

  /**
   * @swagger
   * /api/auth/kakao/refresh:
   *   post:
   *     summary: 카카오 토큰 갱신
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 토큰 갱신 성공
   */
  router.post('/kakao/refresh', authenticateJWT, KakaoController.refreshKakaoToken);

  /**
   * @swagger
   * /api/auth/kakao/unlink:
   *   post:
   *     summary: 카카오 계정 연동 해제
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 연동 해제 성공
   */
  router.post('/kakao/unlink', 
    authenticateJWT,
    catchAsync(async (req, res) => {
      const userId = req.user.id;
      
      // 카카오 소셜 로그인 정보 조회
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        }
      });
      
      if (!socialLogin) {
        throw new NotFoundError('연결된 카카오 계정이 없습니다');
      }
      
      // 소셜 로그인 정보 삭제
      await prisma.socialLogin.delete({
        where: { id: socialLogin.id }
      });
      
      res.success({
        message: '카카오 계정 연결이 해제되었습니다'
      });
    })
  );

  /**
   * @swagger
   * /api/auth/kakao/sync:
   *   post:
   *     summary: 카카오 사용자 정보 동기화
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 정보 동기화 성공
   */
  router.post('/kakao/sync', authenticateJWT, KakaoController.syncKakaoUserInfo);

  /**
   * @swagger
   * /api/auth/kakao/status:
   *   get:
   *     summary: 카카오 연동 상태 확인
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 연동 상태 조회 성공
   */
  router.get('/kakao/status', authenticateJWT, KakaoController.getKakaoConnectionStatus);

  /**
   * @swagger
   * /api/auth/kakao/auth-url:
   *   get:
   *     summary: 카카오 인증 URL 생성
   *     tags: [Auth]
   *     parameters:
   *       - in: query
   *         name: redirect_uri
   *         schema:
   *           type: string
   *         description: 커스텀 리다이렉트 URI
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: 커스텀 state 값
   *     responses:
   *       200:
   *         description: 인증 URL 생성 성공
   */
  router.get('/kakao/auth-url', KakaoController.getKakaoAuthURL);

  /**
   * @swagger
   * /api/auth/kakao/test:
   *   get:
   *     summary: 카카오 로그인 테스트 (개발용)
   *     tags: [Auth]
   *     description: 개발 환경에서만 사용 가능한 테스트 엔드포인트
   *     responses:
   *       200:
   *         description: 테스트 정보 제공
   *       403:
   *         description: 프로덕션 환경에서는 사용 불가
   */
  router.get('/kakao/test', KakaoController.testKakaoLogin);

} else {
  console.log('⚠️ 카카오 OAuth가 비활성화되어 있어 관련 라우트가 등록되지 않았습니다.');
}

/**
 * @swagger
 * /api/auth/trigger/birthdayevent:
 *   post:
 *     summary: 생일 이벤트 수동 생성 트리거 (개발/테스트용)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 생일 이벤트 생성 트리거 성공
 */
router.post('/trigger-birthday-event', authenticateJWT, userController.triggerBirthdayEvent);

/**
 * @swagger
 * /api/auth/social/status:
 *   get:
 *     summary: 소셜 로그인 연결 상태 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 연결 상태 조회 성공
 */
router.get('/social/status', 
  authenticateJWT,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const socialLogins = await prisma.socialLogin.findMany({
      where: { userId },
      select: {
        provider: true,
        createdAt: true
      }
    });
    
    // 지원되는 소셜 로그인 서비스 정보 추가
    const supportedProviders = {
      kakao: isKakaoEnabled()
    };
    
    res.success({ 
      socialLogins,
      supportedProviders
    });
  })
);

/**
 * @swagger
 * /api/auth/social/providers:
 *   get:
 *     summary: 지원되는 소셜 로그인 서비스 조회
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 지원되는 소셜 로그인 서비스 목록
 */
router.get('/social/providers', 
  catchAsync(async (req, res) => {
    const providers = {
      kakao: {
        enabled: isKakaoEnabled(),
        name: '카카오',
        loginUrl: isKakaoEnabled() ? '/api/auth/kakao' : null,
        directLoginUrl: isKakaoEnabled() ? '/api/auth/kakao-direct' : null
      }
    };
    
    res.success({ providers });
  })
);

export default router;