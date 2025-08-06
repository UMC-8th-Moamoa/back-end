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
  validatePasswordChange,
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
  ValidationError
} from '../middlewares/errorHandler.js';

import { generateTokenPair, generateEmailVerificationToken, verifyEmailVerificationToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt.util.js';
import { hashPassword, comparePassword, validatePasswordChange as validatePasswordChangeUtil } from '../utils/password.util.js';
import userController from '../controllers/userController.controllers.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 사용자 인증 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 사용자 ID
 *         email:
 *           type: string
 *           description: 이메일
 *         name:
 *           type: string
 *           description: 이름
 *         photo:
 *           type: string
 *           description: 프로필 사진 URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         tokens:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               description: JWT 액세스 토큰
 *             refreshToken:
 *               type: string
 *               description: JWT 리프레시 토큰
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 존재하는 이메일
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 인증 실패
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
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
router.get('/nickname/:nickname/check', userController.checkNickname);

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
router.post('/find-password', userController.requestPasswordReset);

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
router.post('/reset-password', userController.resetPassword);

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
 * /api/auth/verify-email:
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
router.post('/verify-email', userController.sendEmailVerification);

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
router.post('/email/send-code', userController.verifyEmailCode);

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
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: 카카오에서 전달받은 인가 코드
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: 인증 실패 시 에러 코드
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: 인증 실패 시 에러 설명
 *     responses:
 *       302:
 *         description: 클라이언트 앱으로 리다이렉트 (토큰 포함)
 *       400:
 *         description: 인증 실패
 */
router.get('/kakao/callback', 
  handleSocialCallback('kakao'),
  catchAsync(async (req, res) => {
    try {
      // JWT 토큰 생성
      const tokens = generateTokenPair(req.user.id, req.user.email);
      
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
  })
);

/**
 * @swagger
 * /api/auth/kakao/unlink:
 *   post:
 *     summary: 카카오 계정 연결 해제
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: 사용자의 카카오 소셜 로그인 연결을 해제
 *     responses:
 *       200:
 *         description: 연결 해제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 카카오 계정 연결이 해제되었습니다
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 연결된 카카오 계정이 없음
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
 * /api/auth/social/status:
 *   get:
 *     summary: 소셜 로그인 연결 상태 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: 사용자의 소셜 로그인 연결 상태를 조회
 *     responses:
 *       200:
 *         description: 연결 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     socialLogins:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                             example: kakao
 *                           createdAt:
 *                             type: string
 *                             format: date-time
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
    
    res.success({ socialLogins });
  })
);

export default router;