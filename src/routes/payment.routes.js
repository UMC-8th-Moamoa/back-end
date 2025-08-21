import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: 몽코인 결제 및 충전 관리 API
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
 *           example: "MC_150"
 *         name:
 *           type: string
 *           description: 패키지 이름
 *           example: "150MC"
 *         mongcoin:
 *           type: integer
 *           description: 충전될 몽코인 수량
 *           example: 150
 *         price:
 *           type: integer
 *           description: 실제 결제 가격 (원)
 *           example: 12000
 *         originalPrice:
 *           type: integer
 *           description: 원래 가격 (원)
 *           example: 15000
 *         discount:
 *           type: integer
 *           description: 할인 금액 (원)
 *           example: 3000
 *         discountText:
 *           type: string
 *           nullable: true
 *           description: 할인 표시 텍스트
 *           example: "-₩3,000"
 *     
 *     ChargeSuccessResponse:
 *       type: object
 *       properties:
 *         resultType:
 *           type: string
 *           example: "SUCCESS"
 *         error:
 *           type: null
 *         success:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "몽코인 충전이 완료되었습니다!"
 *             packageInfo:
 *               $ref: '#/components/schemas/ChargePackage'
 *             newBalance:
 *               type: integer
 *               description: 충전 후 총 몽코인 잔액
 *               example: 650
 *             chargedAmount:
 *               type: integer
 *               description: 이번에 충전된 몽코인 수량
 *               example: 150
 *             transaction:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 거래 ID
 *                   example: 29
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: 거래 생성 시간
 *                   example: "2025-08-22T04:38:45.254Z"
 *     
 *     BalanceResponse:
 *       type: object
 *       properties:
 *         resultType:
 *           type: string
 *           example: "SUCCESS"
 *         error:
 *           type: null
 *         success:
 *           type: object
 *           properties:
 *             balance:
 *               type: integer
 *               description: 현재 보유 몽코인
 *               example: 650
 *             userId:
 *               type: string
 *               description: 사용자 ID
 *               example: "testuser123"
 *             name:
 *               type: string
 *               description: 사용자 이름
 *               example: "홍길동"
 *     
 *     ChargeHistoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 거래 ID
 *           example: 29
 *         packageId:
 *           type: string
 *           description: 충전한 패키지 ID
 *           example: "MC_150"
 *         packageName:
 *           type: string
 *           description: 패키지 이름
 *           example: "150MC"
 *         mongcoinAmount:
 *           type: integer
 *           description: 충전된 몽코인 수량
 *           example: 150
 *         price:
 *           type: integer
 *           description: 결제 금액 (원)
 *           example: 12000
 *         status:
 *           type: string
 *           description: 거래 상태
 *           example: "COMPLETED"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 거래 일시
 *           example: "2025-08-22T04:38:45.254Z"
 */

/**
 * @swagger
 * /api/payment/balance:
 *   get:
 *     summary: 현재 사용자 몽코인 잔액 조회
 *     description: 로그인한 사용자의 현재 몽코인 잔액을 조회합니다.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 몽코인 잔액 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BalanceResponse'
 *       401:
 *         description: 인증 실패 - 로그인이 필요합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "FAIL"
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: "UNAUTHORIZED"
 *                     reason:
 *                       type: string
 *                       example: "유효한 토큰이 필요합니다"
 *                 success:
 *                   type: null
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/balance', authenticateJWT, paymentController.getBalance);

/**
 * @swagger
 * /api/payment/charge:
 *   post:
 *     summary: 몽코인 충전하기
 *     description: |
 *       선택한 패키지로 몽코인을 충전합니다.
 *       
 *       **사용 가능한 패키지:**
 *       - MC_10: 10MC - ₩1,000 (할인 없음)
 *       - MC_50: 50MC - ₩4,500 (₩500 할인)
 *       - MC_100: 100MC - ₩8,500 (₩1,500 할인)
 *       - MC_150: 150MC - ₩12,000 (₩3,000 할인)
 *       - MC_200: 200MC - ₩15,000 (₩5,000 할인)
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
 *                 enum: ["MC_10", "MC_50", "MC_100", "MC_150", "MC_200"]
 *                 example: "MC_150"
 *           examples:
 *             basic_package:
 *               summary: 기본 패키지 (10MC)
 *               value:
 *                 packageId: "MC_10"
 *             popular_package:
 *               summary: 인기 패키지 (150MC)
 *               value:
 *                 packageId: "MC_150"
 *             premium_package:
 *               summary: 프리미엄 패키지 (200MC)
 *               value:
 *                 packageId: "MC_200"
 *     responses:
 *       200:
 *         description: 몽코인 충전 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChargeSuccessResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "FAIL"
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     reason:
 *                       type: string
 *                       example: "충전 패키지 ID가 필요합니다"
 *                 success:
 *                   type: null
 *       404:
 *         description: 존재하지 않는 패키지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "FAIL"
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: "PACKAGE_NOT_FOUND"
 *                     reason:
 *                       type: string
 *                       example: "존재하지 않는 충전 패키지입니다"
 *                 success:
 *                   type: null
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
 *     summary: 몽코인 충전 내역 조회
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
 *         description: 조회할 내역 수 (최대 50개)
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
 *                         $ref: '#/components/schemas/ChargeHistoryItem'
 *                       example:
 *                         - id: 29
 *                           packageId: "MC_150"
 *                           packageName: "150MC"
 *                           mongcoinAmount: 150
 *                           price: 12000
 *                           status: "COMPLETED"
 *                           createdAt: "2025-08-22T04:38:45.254Z"
 *                         - id: 28
 *                           packageId: "MC_100"
 *                           packageName: "100MC"
 *                           mongcoinAmount: 100
 *                           price: 8500
 *                           status: "COMPLETED"
 *                           createdAt: "2025-08-21T10:15:30.123Z"
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/charge-history', authenticateJWT, paymentController.getChargeHistory);

export default router;