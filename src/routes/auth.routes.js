import express from 'express';
import passport from 'passport';
import prisma from '../config/prismaClient.js';

import { 
  authenticateLocal, 
  authenticateJWT, 
  refreshToken 
} from '../middlewares/auth.middleware.js';

import { 
  validateUserRegistration, 
  validateUserLogin 
} from '../middlewares/validation.middleware.js';

import { 
  DuplicateEmailError,
  catchAsync 
} from '../middlewares/errorHandler.js';

import JWTUtil from '../utils/jwt.util.js';
import PasswordUtil from '../utils/password.util.js';

const router = express.Router();

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
 *                 maxLength: 20
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
router.post('/register', validateUserRegistration, catchAsync(async (req, res) => {
  const { email, password, name, phone, birthday } = req.body;

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new DuplicateEmailError();
  }

  // 비밀번호 해싱
  const hashedPassword = await PasswordUtil.hashPassword(password);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      birthday: birthday ? new Date(birthday) : null
    },
    select: {
      id: true,
      email: true,
      name: true,
      photo: true,
      createdAt: true
    }
  });

  // JWT 토큰 생성
  const tokens = JWTUtil.generateTokenPair(user.id, user.email);

  res.status(201).success({
    user,
    tokens
  });
}));

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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
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
router.post('/login', validateUserLogin, authenticateLocal, catchAsync(async (req, res) => {
  const user = req.user;
  
  // 민감한 정보 제거
  const { password, socialLogins, ...userWithoutPassword } = user;
  
  // JWT 토큰 생성
  const tokens = JWTUtil.generateTokenPair(user.id, user.email);

  res.success({
    user: userWithoutPassword,
    tokens
  });
}));

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
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 */
router.post('/refresh', refreshToken, catchAsync(async (req, res) => {
  res.success({
    tokens: req.tokens
  });
}));

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 필요
 */
router.get('/me', authenticateJWT, catchAsync(async (req, res) => {
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
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          sentFriendRequests: true,
          receivedFriendRequests: true,
          wishlists: true,
          birthdayEvents: true
        }
      }
    }
  });

  res.success(user);
}));

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
router.post('/logout', authenticateJWT, catchAsync(async (req, res) => {
  // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됨
  res.success({
    message: '로그아웃되었습니다'
  });
}));

// ============ OAuth 로그인 ============

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
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

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
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  catchAsync(async (req, res) => {
    const user = req.user;
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  })
);

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
router.get('/kakao',
  passport.authenticate('kakao')
);

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
router.get('/kakao/callback',
  passport.authenticate('kakao', { session: false }),
  catchAsync(async (req, res) => {
    const user = req.user;
    const tokens = JWTUtil.generateTokenPair(user.id, user.email);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  })
);

export default router;