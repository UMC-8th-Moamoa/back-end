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
  const tokens = generateTokenPair(user.id, user.email);

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
router.post('/refresh', validateRefreshToken, refreshToken, catchAsync(async (req, res) => {
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
      emailVerified: true,
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
 *                 description: 인증할 이메일
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.post('/verify-email', validateEmailVerification, catchAsync(async (req, res) => {
  const { email } = req.body;

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  // 이미 인증된 사용자인지 확인
  if (user.emailVerified) {
    return res.success({
      message: '이미 인증된 이메일입니다'
    });
  }

  // 6자리 인증 코드 생성
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 인증 토큰 생성 (10분 유효)
  const verificationToken = generateEmailVerificationToken(email, verificationCode);

  // TODO: 실제 이메일 발송 로직 구현
  // await sendVerificationEmail(email, verificationCode);

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`이메일 인증 코드 (${email}): ${verificationCode}`);
  }

  res.success({
    message: '인증 코드가 발송되었습니다',
    // 개발 환경에서만 토큰 반환
    ...(process.env.NODE_ENV === 'development' && { verificationToken })
  });
}));

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
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 인증 성공
 *       400:
 *         description: 잘못된 인증 코드
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.post('/email/send-code', validateEmailVerificationCode, catchAsync(async (req, res) => {
  const { email, code } = req.body;

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  // 개발 환경에서는 간단한 코드 검증
  if (process.env.NODE_ENV === 'development') {
    // 실제 환경에서는 Redis나 DB에 저장된 코드와 비교
    const isValidCode = code.length === 6 && /^\d{6}$/.test(code);
    
    if (!isValidCode) {
      throw new ValidationError('유효하지 않은 인증 코드입니다');
    }
  }

  // 이메일 인증 상태 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true }
  });

  res.success({
    message: '이메일 인증이 완료되었습니다'
  });
}));

/**
 * @swagger
 * /api/users/nickname/{nickname}/check:
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
 *         description: 닉네임 사용 가능 여부
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
 *                     available:
 *                       type: boolean
 *                       description: 사용 가능 여부
 *                     message:
 *                       type: string
 *                       description: 결과 메시지
 */
router.get('/nickname/:nickname/check', validateNicknameCheck, catchAsync(async (req, res) => {
  const { nickname } = req.params;

  // 현재 스키마에는 nickname 필드가 없으므로 name으로 대체
  const existingUser = await prisma.user.findFirst({
    where: { name: nickname }
  });

  const available = !existingUser;

  res.success({
    available,
    message: available ? '사용 가능한 닉네임입니다' : '이미 사용 중인 닉네임입니다'
  });
}));

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: 비밀번호 변경
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
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 현재 비밀번호
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호
 *               confirmPassword:
 *                 type: string
 *                 description: 새 비밀번호 확인
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 */
router.put('/password', authenticateJWT, validatePasswordChange, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 현재 사용자 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  // 비밀번호 변경 검증
  await validatePasswordChangeUtil(currentPassword, newPassword, user.password);

  // 새 비밀번호 해싱
  const hashedNewPassword = await hashPassword(newPassword);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword }
  });

  res.success({
    message: '비밀번호가 성공적으로 변경되었습니다'
  });
}));

/**
 * @swagger
 * /api/users/find-id:
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
 *                 description: 휴대폰 번호
 *     responses:
 *       200:
 *         description: 아이디 찾기 성공
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
 *                     email:
 *                       type: string
 *                       description: 마스킹된 이메일
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.post('/find-id', catchAsync(async (req, res) => {
  const { name, phone } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      name,
      phone
    },
    select: {
      email: true
    }
  });

  if (!user) {
    throw new NotFoundError('일치하는 사용자 정보를 찾을 수 없습니다');
  }

  // 이메일 마스킹 (예: test@example.com -> te**@example.com)
  const email = user.email;
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
  const maskedEmail = `${maskedLocal}@${domain}`;

  res.success({
    email: maskedEmail,
    message: '등록된 이메일 주소입니다'
  });
}));

/**
 * @swagger
 * /api/users/find-password:
 *   post:
 *     summary: 비밀번호 찾기 (재설정 링크 발송)
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
 *         description: 재설정 링크 발송 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.post('/find-password', validatePasswordResetRequest, catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new NotFoundError('등록되지 않은 이메일입니다');
  }

  // 비밀번호 재설정 토큰 생성
  const resetToken = generatePasswordResetToken(email, user.id);

  // TODO: 실제 이메일 발송 로직 구현
  // await sendPasswordResetEmail(email, resetToken);

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`비밀번호 재설정 토큰 (${email}): ${resetToken}`);
  }

  res.success({
    message: '비밀번호 재설정 링크가 이메일로 발송되었습니다',
    // 개발 환경에서만 토큰 반환
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
}));

/**
 * @swagger
 * /api/users/reset-password:
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
 *                 description: 비밀번호 재설정 토큰
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호
 *               confirmPassword:
 *                 type: string
 *                 description: 새 비밀번호 확인
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 유효하지 않은 토큰
 */
router.post('/reset-password', validatePasswordReset, catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  // 토큰 검증
  const decoded = verifyPasswordResetToken(token);

  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  // 새 비밀번호 해싱
  const hashedNewPassword = await hashPassword(newPassword);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword }
  });

  res.success({
    message: '비밀번호가 성공적으로 재설정되었습니다'
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