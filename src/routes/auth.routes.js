import express from 'express';
import { PrismaClient } from '@prisma/client';

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
  ValidationError
} from '../middlewares/errorHandler.js';

import { generateTokenPair } from '../utils/jwt.util.js';
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
router.post('/email/send-id', validateEmailVerification, userController.sendEmailVerification);

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

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth 로그인 시작
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Google 인증 페이지로 리다이렉트
 */
router.get('/google', (req, res, next) => {
  import('passport').then(({ default: passport }) => {
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })(req, res, next);
  });
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 클라이언트로 리다이렉트 (토큰 포함)
 */
router.get('/google/callback', handleSocialCallback('google'), catchAsync(async (req, res) => {
  const user = req.user;
  const tokens = generateTokenPair(user.id, user.email);
  
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
}));

/**
 * @swagger
 * /api/auth/kakao:
 *   get:
 *     summary: Kakao OAuth 로그인 시작
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Kakao 인증 페이지로 리다이렉트
 */
router.get('/kakao', (req, res, next) => {
  import('passport').then(({ default: passport }) => {
    passport.authenticate('kakao')(req, res, next);
  });
});

/**
 * @swagger
 * /api/auth/kakao/callback:
 *   get:
 *     summary: Kakao OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 클라이언트로 리다이렉트 (토큰 포함)
 */
router.get('/kakao/callback', handleSocialCallback('kakao'), catchAsync(async (req, res) => {
  const user = req.user;
  const tokens = generateTokenPair(user.id, user.email);
  
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
}));

export default router;