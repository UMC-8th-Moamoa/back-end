import express from 'express';
import BirthdayController from '../controllers/birthday.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Birthday
 *   description: 생일 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BirthdayUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 사용자 ID
 *         name:
 *           type: string
 *           description: 사용자 이름
 *         birthday:
 *           type: string
 *           format: date-time
 *           description: 사용자 생일
 *     
 *     BirthdayCountdown:
 *       type: object
 *       properties:
 *         daysRemaining:
 *           type: integer
 *           description: 생일까지 남은 일수
 *         formattedDaysRemaining:
 *           type: string
 *           description: UI 표시용 포맷 (D-226)
 *         birthdayThisYear:
 *           type: string
 *           format: date-time
 *           description: 올해(또는 다음) 생일 날짜
 *         isBirthdayToday:
 *           type: boolean
 *           description: 오늘이 생일인지 여부
 *         isBirthdayPassed:
 *           type: boolean
 *           description: 올해 생일이 지났는지 여부
 *         message:
 *           type: string
 *           description: UI 표시용 메시지
 *     
 *     BirthdayCountdownResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/BirthdayUser'
 *         countdown:
 *           $ref: '#/components/schemas/BirthdayCountdown'
 */

/**
 * @swagger
 * /api/users/me/birthday-countdown:
 *   get:
 *     summary: 사용자 생일 카운트다운 조회
 *     description: 현재 로그인한 사용자의 생일까지 남은 일수와 관련 정보를 조회합니다.
 *     tags: [Birthday]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 생일 카운트다운 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: null
 *                 success:
 *                   $ref: '#/components/schemas/BirthdayCountdownResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 user:
 *                   id: 1
 *                   name: "민수"
 *                   birthday: "1995-03-15T00:00:00.000Z"
 *                 countdown:
 *                   daysRemaining: 34
 *                   formattedDaysRemaining: "D-34"
 *                   birthdayThisYear: "2025-08-23T00:00:00.000Z"
 *                   isBirthdayToday: false
 *                   isBirthdayPassed: false
 *                   message: "민수님의 생일"
 *       400:
 *         description: 생일 정보 미등록
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/me/birthday-countdown', 
  authenticateJWT,
  BirthdayController.getBirthdayCountdown
);

export default router;