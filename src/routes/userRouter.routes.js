import express from 'express';
import userController from '../controllers/user.controller.js';
import { 
  authenticateJWT, 
  optionalAuthenticateJWT,
  requireEmailVerification,
  requireOwnership,
  requireAdmin
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
  validateRefreshToken,
  validateEmailCheck,
  validateUserUpdate,
  validatePagination
} from '../middlewares/validation.middleware.js';

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
 *         phone:
 *           type: string
 *           description: 전화번호
 *         birthday:
 *           type: string
 *           format: date
 *           description: 생일
 *         photo:
 *           type: string
 *           description: 프로필 사진 URL
 *         cash:
 *           type: integer
 *           description: 보유 캐시
 *         emailVerified:
 *           type: boolean
 *           description: 이메일 인증 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: 마지막 로그인 시간
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

// ============ 인증 관련 라우트 ============

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
router.post('/auth/register', validateUserRegistration, userController.register);

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
 */
router.get('/users/nickname/:nickname/check', validateNicknameCheck, userController.checkNickname);

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
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자명
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */

router.post('/auth/login', validateUserLogin, userController.login);

/**
 * @swagger
 * /api/auth/login/kakao:
 *   post:
 *     summary: 카카오 로그인
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 카카오 인증 페이지로 리다이렉트
 */
router.post('/auth/login/kakao', userController.kakaoLogin);

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
 */
router.post('/auth/verify-email', validateEmailVerification, userController.sendEmailVerification);

/**
 * @swagger
 * /api/auth/email/send-id:
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
 */
router.post('/auth/email/send-id', validateEmailVerificationCode, userController.verifyEmailCode);

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
 */
router.put('/users/password', authenticateJWT, validatePasswordChange, userController.changePassword);

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
 */
router.post('/users/find-id', userController.findUserId);

/**
 * @swagger
 * /api/users/find-password:
 *   post:
 *     summary: 비밀번호 찾기
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
 */
router.post('/users/find-password', validatePasswordResetRequest, userController.requestPasswordReset);

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
 */
router.post('/users/reset-password', validatePasswordReset, userController.resetPassword);

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
router.post('/auth/refresh', validateRefreshToken, userController.refreshToken);

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
router.get('/auth/me', authenticateJWT, userController.getMe);

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
router.post('/auth/logout', authenticateJWT, userController.logout);

// ============ 소셜 로그인 라우트 ============

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
router.get('/auth/google', userController.googleLogin);

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
router.get('/auth/google/callback', userController.handleSocialCallback('google'), userController.googleCallback);

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
router.get('/auth/kakao', userController.kakaoLogin);

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
router.get('/auth/kakao/callback', userController.handleSocialCallback('kakao'), userController.kakaoCallback);

// ============ 사용자 프로필 관리 라우트 ============

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 사용자 정보 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 이름
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: 생일
 *               photo:
 *                 type: string
 *                 description: 프로필 사진 URL
 *     responses:
 *       200:
 *         description: 정보 수정 성공
 */
router.put('/users/profile', authenticateJWT, validateUserUpdate, userController.updateProfile);

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     summary: 회원 탈퇴
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 */
router.delete('/users/profile', authenticateJWT, userController.deleteAccount);

// ============ 이메일 관련 라우트 ============

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
 *         description: 이메일 사용 가능 여부
 */
router.post('/auth/email/check', validateEmailCheck, userController.checkEmail);

// ============ 관리자 전용 라우트 ============

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 사용자 목록 조회 (관리자용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 */
router.get('/users', authenticateJWT, requireAdmin, validatePagination, userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 조회 (관리자용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 조회 성공
 */
router.get('/users/:id', authenticateJWT, requireAdmin, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정 (관리자용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: 정보 수정 성공
 */
router.put('/users/:id', authenticateJWT, requireAdmin, validateUserUpdate, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제 (관리자용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 삭제 성공
 */
router.delete('/users/:id', authenticateJWT, requireAdmin, userController.deleteUser);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: 사용자 통계 조회 (관리자용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계 조회 성공
 */
router.get('/users/stats', authenticateJWT, requireAdmin, userController.getUserStats);

export default router;
