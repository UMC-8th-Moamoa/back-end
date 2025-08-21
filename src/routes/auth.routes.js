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
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: 비밀번호 재설정 인증 코드 확인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
 *               code:
 *                 type: string
 *                 description: 인증 코드
 *               token:
 *                 type: string
 *                 description: 인증 토큰
 *     responses:
 *       200:
 *         description: 인증 코드 확인 성공
 */
router.post('/verify-reset-code', userController.verifyPasswordResetCode);

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

/**
 * @swagger
 * /api/auth/user-id/{userId}/check:
 *   get:
 *     summary: 사용자 ID 중복 확인
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 ID 중복 여부 확인 성공
 */
router.get('/user-id/:userId/check', userController.checkUserId);

if (isKakaoEnabled()) {
  console.log('✅ 카카오 OAuth 라우트가 등록되었습니다.');
  
  /**
   * @swagger
   * /api/auth/kakao:
   *   get:
   *     summary: 카카오 로그인 시작
   *     tags: [Auth]
   *     description: 카카오 OAuth 인증 페이지로 리다이렉트
   *     responses:
   *       302:
   *         description: 카카오 인증 페이지로 리다이렉트
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
   *     summary: 카카오 로그인 콜백
   *     tags: [Auth]
   *     description: 카카오에서 인증 후 콜백을 받는 엔드포인트
   *     responses:
   *       302:
   *         description: 적절한 페이지로 리다이렉트 (프로필 완성 또는 성공)
   *       400:
   *         description: 인증 실패
   */
  router.get('/kakao/callback', 
    handleSocialCallback('kakao'),
    (req, res) => {
      try {
        const tokens = generateTokenPair(req.user.id, req.user.email, req.user.user_id);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        
        // 사용자 타입과 이름 상태에 따른 리다이렉트 결정
        const isKakaoUser = req.user.user_id.startsWith('kakao_');
        const hasValidName = req.user.name && req.user.name.trim() !== '' && req.user.name.trim() !== '.';
        
        let redirectPath;
        if (isKakaoUser) {
          // 카카오 전용 사용자는 무조건 프로필 완성 페이지로
          redirectPath = '/api/auth/kakao/complete-profile';
          console.log('👤 카카오 전용 사용자 - 프로필 완성 페이지로 리다이렉트');
        } else if (!hasValidName) {
          // 기존 사용자이지만 이름이 비정상적인 경우
          redirectPath = '/api/auth/kakao/complete-profile';
          console.log('⚠️ 기존 사용자이지만 이름이 비정상적 - 프로필 완성 페이지로 리다이렉트');
        } else {
          // 기존 사용자이고 이름이 정상적인 경우
          redirectPath = '/api/auth/kakao/success';
          console.log('✅ 기존 사용자 카카오 연동 - 성공 페이지로 리다이렉트');
        }
        
        // 쿠키에 토큰 설정
        res.cookie('accessToken', tokens.accessToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24시간
          sameSite: 'lax'
        });
        
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
          sameSite: 'lax'
        });
        
        // 적절한 페이지로 리다이렉트
        const redirectUrl = `${clientUrl}${redirectPath}`;
        console.log('🔗 카카오 콜백 리다이렉트:', redirectUrl);
        
        res.redirect(redirectUrl);
        
      } catch (error) {
        console.error('❌ 카카오 로그인 콜백 처리 중 오류:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`);
      }
    }
  );

  /**
   * @swagger
   * /api/auth/kakao/complete-profile:
   *   post:
   *     summary: 카카오 로그인 후 프로필 완성
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *                 description: 사용자 이름
   *               birthday:
   *                 type: string
   *                 format: date
   *                 description: 생일 (선택사항)
   *     responses:
   *       200:
   *         description: 프로필 완성 성공
   */
  router.post('/kakao/complete-profile', 
    authenticateJWT,
    catchAsync(async (req, res) => {
      const { name, birthday } = req.body;
      const userId = req.user.id;

      if (!name || name.trim() === '') {
        return res.error({
          errorCode: 'VALIDATION_ERROR',
          reason: '이름을 입력해주세요'
        });
      }

      try {
        // 사용자 정보 업데이트
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            name: name.trim(),
            birthday: birthday ? new Date(birthday) : null,
            updatedAt: new Date()
          },
          select: {
            id: true,
            user_id: true,
            email: true,
            name: true,
            birthday: true,
            photo: true,
            emailVerified: true
          }
        });

        console.log('✅ 사용자 프로필 완성:', {
          userId: updatedUser.id,
          user_id: updatedUser.user_id,
          name: updatedUser.name,
          birthday: updatedUser.birthday
        });

        res.success({
          message: '프로필이 완성되었습니다',
          user: updatedUser
        });

      } catch (error) {
        console.error('❌ 프로필 완성 실패:', error);
        res.error({
          errorCode: 'PROFILE_UPDATE_FAILED',
          reason: error.message
        });
      }
    })
  );

  // 카카오 연동 해제
  router.post('/kakao/unlink', 
    authenticateJWT,
    catchAsync(async (req, res) => {
      const userId = req.user.id;
      
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        }
      });
      
      if (!socialLogin) {
        throw new NotFoundError('연결된 카카오 계정이 없습니다');
      }
      
      await prisma.socialLogin.delete({
        where: { id: socialLogin.id }
      });
      
      res.success({
        message: '카카오 계정 연결이 해제되었습니다'
      });
    })
  );

} else {
  console.log('⚠️ 카카오 OAuth가 비활성화되어 있어 관련 라우트가 등록되지 않았습니다.');
}

// 소셜 로그인 상태 조회
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
    
    const supportedProviders = {
      kakao: isKakaoEnabled()
    };
    
    res.success({ 
      socialLogins,
      supportedProviders
    });
  })
);

// 기타 라우트들
router.post('/trigger-birthday-event', authenticateJWT, userController.triggerBirthdayEvent);

export default router;
