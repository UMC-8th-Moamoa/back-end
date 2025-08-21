import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: 포인트(몽코인) 관리 API
 */

/**
 * @swagger
 * /api/payment/balance:
 *   get:
 *     summary: 현재 사용자 보유 몽코인 조회
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 몽코인 잔액 조회 성공
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
 *                     balance:
 *                       type: integer
 *                       description: 보유 몽코인
 *                       example: 400
 *                     userId:
 *                       type: string
 *                       description: 사용자 ID
 *                       example: "testuser123"
 *                     name:
 *                       type: string
 *                       description: 사용자 이름
 *                       example: "홍길동"
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/balance', authenticateJWT, paymentController.getBalance);

export default router;