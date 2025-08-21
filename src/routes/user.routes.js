// src/routes/user.routes.js
import express from 'express';
import userController from '../controllers/userController.controllers.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *         - purpose
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 인증할 이메일 주소
 *           example: user@example.com
 *         purpose:
 *           type: string
 *           enum: [signup, reset]
 *           description: 인증 목적 (signup-회원가입, reset-비밀번호재설정)
 *           example: signup
 *     
 *     EmailVerificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 인증 코드가 발송되었습니다
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: 인증 코드가 발송되었습니다
 *             verificationToken:
 *               type: string
 *               description: 인증 토큰 (개발 환경에서만 제공)
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             expiresIn:
 *               type: string
 *               description: 만료 시간 (개발 환경에서만 제공)
 *               example: 10m
 *             debugCode:
 *               type: string
 *               description: 인증 코드 (개발 환경에서만 제공)
 *               example: "123456"
 *     
 *     EmailCodeVerificationRequest:
 *       type: object
 *       required:
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 인증할 이메일 주소 (선택사항)
 *           example: user@example.com
 *         code:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: 6자리 인증 코드
 *           example: "123456"
 *         purpose:
 *           type: string
 *           enum: [signup, reset]
 *           description: 인증 목적 (선택사항)
 *           example: signup
 *         token:
 *           type: string
 *           description: 인증 토큰 (선택사항)
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     
 *     EmailCheckRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 중복 확인할 이메일 주소
 *           example: user@example.com
 *     
 *     FindUserIdRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 아이디를 찾을 이메일 주소
 *           example: user@example.com
 *         phone:
 *           type: string
 *           description: 아이디를 찾을 전화번호
 *           example: 010-1234-5678
 *     
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 비밀번호를 재설정할 이메일 주소
 *           example: user@example.com
 *     
 *     PasswordResetConfirm:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: 비밀번호 재설정 토큰
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           description: 새로운 비밀번호
 *           example: newPassword123!
 *   
 *   responses:
 *     EmailSent:
 *       description: 이메일 발송 성공
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationResponse'
 *     
 *     EmailVerified:
 *       description: 이메일 인증 성공
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: 이메일 인증이 완료되었습니다
 *               data:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: 이메일 인증이 완료되었습니다
 *     
 *     DuplicateEmail:
 *       description: 이미 가입된 이메일
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: 이미 가입된 이메일입니다
 *               code:
 *                 type: string
 *                 example: C002
 */

/**
 * @swagger
 * /api/users/nickname/{nickname}/check:
 *   get:
 *     summary: 닉네임 중복 확인
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: nickname
 *         required: true
 *         schema:
 *           type: string
 *         description: 중복 확인할 닉네임
 *     responses:
 *       200:
 *         description: 닉네임 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 */
// 닉네임 중복 확인
router.get('/nickname/:nickname/check', userController.checkNickname);

/**
 * @swagger
 * /api/users/user-id/{userId}/check:
 *   get:
 *     summary: 사용자 ID 중복 확인
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 중복 확인할 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 ID 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: 사용 가능한 아이디입니다
 */
// 사용자 ID 중복 확인
router.get('/user-id/:userId/check', userController.checkUserId);

/**
 * @swagger
 * /api/users/email/check:
 *   post:
 *     summary: 이메일 중복 확인
 *     tags: [Users, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailCheckRequest'
 *     responses:
 *       200:
 *         description: 이메일 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: 사용 가능한 이메일입니다
 *       400:
 *         description: 잘못된 요청
 */
// 이메일 중복 확인
router.post('/email/check', userController.checkEmail);

/**
 * @swagger
 * /api/users/email/verify-email:
 *   post:
 *     summary: 이메일 인증 코드 발송
 *     description: |
 *       지정된 이메일 주소로 6자리 인증 코드를 발송합니다.
 *       
 *       **목적별 동작:**
 *       - `signup`: 회원가입용 - 이미 가입된 이메일인 경우 오류 반환
 *       - `reset`: 비밀번호 재설정용 - 가입되지 않은 이메일인 경우 오류 반환
 *       
 *       **개발 환경에서는** 실제 이메일 발송과 함께 디버깅을 위한 추가 정보를 응답에 포함합니다.
 *     tags: [Users, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *           examples:
 *             signup:
 *               summary: 회원가입용 인증 코드 발송
 *               value:
 *                 email: newuser@example.com
 *                 purpose: signup
 *             reset:
 *               summary: 비밀번호 재설정용 인증 코드 발송
 *               value:
 *                 email: existinguser@example.com
 *                 purpose: reset
 *     responses:
 *       200:
 *         $ref: '#/components/responses/EmailSent'
 *       400:
 *         description: 잘못된 요청 (잘못된 purpose 값)
 *       409:
 *         $ref: '#/components/responses/DuplicateEmail'
 *       404:
 *         description: 사용자를 찾을 수 없음 (reset 목적 시)
 *       500:
 *         description: 이메일 발송 실패
 */
// 이메일 인증 코드 발송
router.post('/email/verify-email', userController.sendEmailVerification);

/**
 * @swagger
 * /api/users/email/send-code:
 *   post:
 *     summary: 이메일 인증 코드 확인
 *     description: |
 *       사용자가 입력한 6자리 인증 코드를 검증합니다.
 *       
 *       **검증 방식:**
 *       - 개발 환경: 토큰 기반 검증 (더 엄격한 검증)
 *       - 운영 환경: 코드 형식 검증 (6자리 숫자 확인)
 *       
 *       **필수 필드:** `code`만 필수이며, 나머지는 선택사항입니다.
 *     tags: [Users, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailCodeVerificationRequest'
 *           examples:
 *             simple:
 *               summary: 간단한 코드 확인 (운영 환경)
 *               value:
 *                 code: "123456"
 *             full:
 *               summary: 전체 정보 포함 (개발 환경)
 *               value:
 *                 email: user@example.com
 *                 code: "123456"
 *                 purpose: signup
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         $ref: '#/components/responses/EmailVerified'
 *       400:
 *         description: 잘못된 인증 코드 또는 만료된 토큰
 *       422:
 *         description: 인증 코드가 일치하지 않음
 */
// 이메일 인증 코드 확인
router.post('/email/send-code', userController.verifyEmailCode);

/**
 * @swagger
 * /api/users/find-id:
 *   post:
 *     summary: 아이디 찾기
 *     description: |
 *       이메일 또는 전화번호를 통해 사용자 아이디를 찾습니다.
 *       찾은 아이디는 사용자의 이메일로 발송됩니다.
 *       
 *       **참고:** 이메일 또는 전화번호 중 하나는 반드시 입력해야 합니다.
 *     tags: [Users, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FindUserIdRequest'
 *           examples:
 *             email:
 *               summary: 이메일로 아이디 찾기
 *               value:
 *                 email: user@example.com
 *             phone:
 *               summary: 전화번호로 아이디 찾기
 *               value:
 *                 phone: 010-1234-5678
 *     responses:
 *       200:
 *         description: 아이디 찾기 성공 (이메일 발송됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 회원님의 이메일로 아이디를 전송했습니다.
 *       400:
 *         description: 이메일이나 전화번호 중 하나를 입력해주세요
 *       404:
 *         description: 가입 이력이 없는 이메일/전화번호
 */
// 아이디 찾기
router.post('/find-id', userController.findUserId);

/**
 * @swagger
 * /api/users/find-password:
 *   post:
 *     summary: 비밀번호 재설정 요청
 *     description: |
 *       비밀번호 재설정을 위한 링크를 사용자의 이메일로 발송합니다.
 *       발송된 링크를 통해 새로운 비밀번호를 설정할 수 있습니다.
 *     tags: [Users, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 링크 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 비밀번호 재설정 링크가 이메일로 발송되었습니다
 *                     resetToken:
 *                       type: string
 *                       description: 재설정 토큰 (개발 환경에서만 제공)
 *                     expiresIn:
 *                       type: string
 *                       description: 만료 시간 (개발 환경에서만 제공)
 *                       example: 30m
 *       404:
 *         description: 등록되지 않은 이메일
 *       500:
 *         description: 이메일 발송 실패
 */
// 비밀번호 찾기 (재설정 요청)
router.post('/find-password', userController.requestPasswordReset);

/**
 * @swagger
 * /api/users/verify-reset-code:
 *   post:
 *     summary: 비밀번호 재설정 인증 코드 확인
 *     description: |
 *       비밀번호 재설정을 위한 인증 코드를 확인합니다.
 *       인증 코드 확인 후 새로운 비밀번호를 설정할 수 있습니다.
 *     tags: [Users, Email]
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
 *                 description: 이메일 (선택사항)
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6자리 인증 코드
 *               token:
 *                 type: string
 *                 description: 인증 토큰 (선택사항)
 *           examples:
 *             simple:
 *               summary: 간단한 코드 확인
 *               value:
 *                 email: user@example.com
 *                 code: "123456"
 *             with_token:
 *               summary: 토큰과 함께 확인
 *               value:
 *                 code: "123456"
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: 인증 코드 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: 인증 코드가 확인되었습니다. 새로운 비밀번호를 입력해주세요.
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       400:
 *         description: 잘못된 인증 코드 또는 만료된 토큰
 *       422:
 *         description: 인증 코드가 일치하지 않음
 */
// 비밀번호 재설정 인증 코드 확인
router.post('/verify-reset-code', userController.verifyPasswordResetCode);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     description: |
 *       비밀번호 재설정 토큰을 사용하여 새로운 비밀번호로 변경합니다.
 *       토큰은 비밀번호 재설정 요청 시 이메일로 발송된 링크에 포함되어 있습니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetConfirm'
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 비밀번호가 성공적으로 재설정되었습니다
 *       400:
 *         description: 잘못된 토큰 또는 만료된 토큰
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// 비밀번호 재설정
router.post('/reset-password', userController.resetPassword);

// 비밀번호 변경 (로그인 필요)
router.put('/password', authenticateJWT, userController.changePassword);

// 프로필 수정 (로그인 필요)
router.put('/profile', authenticateJWT, userController.updateProfile);

// 회원 탈퇴 (로그인 필요)
router.delete('/profile', authenticateJWT, userController.deleteAccount);

export default router;
