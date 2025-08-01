// src/routes/user.routes.js
import express from 'express';
import userController from '../controllers/userController.controllers.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 닉네임 중복 확인
router.get('/nickname/:nickname/check', userController.checkNickname);

// 아이디 찾기
router.post('/find-id', userController.findUserId);

// 비밀번호 찾기 (재설정 요청)
router.post('/find-password', userController.requestPasswordReset);

// 비밀번호 재설정
router.post('/reset-password', userController.resetPassword);

// 이메일 중복 확인
router.post('/email/check', userController.checkEmail);

// 이메일 인증 코드 발송
router.post('/verify-email', userController.sendEmailVerification);

// 이메일 인증 코드 확인
router.post('/email/send-code', userController.verifyEmailCode);

// 비밀번호 변경 (로그인 필요)
router.put('/password', authenticateJWT, userController.changePassword);

// 프로필 수정 (로그인 필요)
router.put('/profile', authenticateJWT, userController.updateProfile);

// 회원 탈퇴 (로그인 필요)
router.delete('/profile', authenticateJWT, userController.deleteAccount);

export default router;
