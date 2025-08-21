import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: 결제 및 몽코인 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChargePackage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 패키지 ID
 *           example: "MC_10"
 *         name:
 *           type: string
 *           description: 패키지 이름
 *           example: "10MC"
 *         mongcoin:
 *           type: integer
 *           description: 충전될 몽코인 수량
 *           example: 10
 *         price:
 *           type: integer
 *           description: 실제 결제 가격
 *           example: 1000
 *         originalPrice:
 *           type: integer
 *           description: 원래 가격
 *           example: 1000
 *         discount:
 *           type: integer
 *           description: 할인 금액
 *           example: 0
 *         discountText:
 *           type: string
 *           nullable: true
 *           description: 할인 표시 텍스트
 *           example: "-₩500"
 *         isPurchased:
 *           type: boolean
 *           description: 이미 구매 여부
 *           example: false
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



/**
 * @swagger
 * /api/payment/charge:
 *   post:
 *     summary: 몽코인 충전하기
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *             properties:
 *               packageId:
 *                 type: string
 *                 description: 충전할 패키지 ID
 *                 example: "MC_10"
 *                 enum: ["MC_10", "MC_50", "MC_100", "MC_150", "MC_200"]
 *     responses:
 *       200:
 *         description: 몽코인 충전 성공
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
 *                       example: "몽코인 충전이 완료되었습니다!"
 *                     packageInfo:
 *                       $ref: '#/components/schemas/ChargePackage'
 *                     newBalance:
 *                       type: integer
 *                       description: 충전 후 잔액
 *                       example: 410
 *                     chargedAmount:
 *                       type: integer
 *                       description: 충전된 몽코인 수량
 *                       example: 10
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: 거래 ID
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: 거래 일시
 *       400:
 *         description: 잘못된 요청 (이미 구매한 패키지 등)
 *       404:
 *         description: 존재하지 않는 패키지
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/charge', authenticateJWT, paymentController.chargeMongcoin);

/**
 * @swagger
 * /api/payment/charge-history:
 *   get:
 *     summary: 충전 내역 조회
 *     description: 사용자의 몽코인 충전 내역을 최신순으로 조회합니다.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 조회할 내역 수
 *         example: 10
 *     responses:
 *       200:
 *         description: 충전 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "SUCCESS"
 *                 error:
 *                   type: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: 거래 ID
 *                             example: 123
 *                           packageId:
 *                             type: string
 *                             description: 패키지 ID
 *                             example: "MC_10"
 *                           packageName:
 *                             type: string
 *                             description: 패키지 이름
 *                             example: "10MC"
 *                           mongcoinAmount:
 *                             type: integer
 *                             description: 충전된 몽코인
 *                             example: 10
 *                           price:
 *                             type: integer
 *                             description: 결제 금액
 *                             example: 1000
 *                           status:
 *                             type: string
 *                             description: 거래 상태
 *                             example: "COMPLETED"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: 거래 일시
 *                             example: "2025-08-22T03:00:00.000Z"
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/charge-history', authenticateJWT, paymentController.getChargeHistory);

export default router;