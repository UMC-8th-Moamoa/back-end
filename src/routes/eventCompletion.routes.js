import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import eventCompletionController from '../controllers/eventCompletion.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: EventCompletion
 *     description: 이벤트 완료 후 처리 API
 */

/**
 * @swagger
 * /api/birthdays/me/event/status:
 *   get:
 *     summary: 이벤트 완료 후 처리 상태 조회
 *     tags: [EventCompletion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
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
 *                     totalReceivedAmount:
 *                       type: integer
 *                       example: 80000
 *                     selectedItemsAmount:
 *                       type: integer
 *                       example: 80000
 *                     remainingAmount:
 *                       type: integer
 *                       example: 0
 *                     status:
 *                       type: string
 *                       enum: [EXACT_MATCH, HAS_REMAINING]
 *                       example: "EXACT_MATCH"
 *                     message:
 *                       type: string
 *                       example: "친구들의 마음을 받았어요!"
 *                     canViewLetters:
 *                       type: boolean
 *                       example: true
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 totalReceivedAmount: 80000
 *                 selectedItemsAmount: 80000
 *                 remainingAmount: 0
 *                 status: "EXACT_MATCH"
 *                 message: "친구들의 마음을 받았어요!"
 *                 canViewLetters: true
 */
router.get('/status', authenticateJWT, eventCompletionController.getEventStatus);

/**
 * @swagger
 * /api/birthdays/me/event/remaining:
 *   get:
 *     summary: 남은 금액 처리 선택 화면 조회
 *     tags: [EventCompletion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
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
 *                     totalReceivedAmount:
 *                       type: integer
 *                       example: 70000
 *                     selectedItemsAmount:
 *                       type: integer
 *                       example: 60000
 *                     remainingAmount:
 *                       type: integer
 *                       example: 10000
 *                     message:
 *                       type: string
 *                       example: "10,000원이 남았어요"
 *                     description:
 *                       type: string
 *                       example: "어떤 용도로 사용할지 선택해주세요"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           label:
 *                             type: string
 *                       example:
 *                         - type: "DONATE"
 *                           label: "기부하기"
 *                         - type: "CONVERT_TO_COIN"
 *                           label: "몽코인으로 전환하기"
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 totalReceivedAmount: 70000
 *                 selectedItemsAmount: 60000
 *                 remainingAmount: 10000
 *                 message: "10,000원이 남았어요"
 *                 description: "어떤 용도로 사용할지 선택해주세요"
 *                 options:
 *                   - type: "DONATE"
 *                     label: "기부하기"
 *                   - type: "CONVERT_TO_COIN"
 *                     label: "몽코인으로 전환하기"
 */
router.get('/remaining', authenticateJWT, eventCompletionController.getRemainingOptions);

/**
 * @swagger
 * /api/birthdays/me/event/preview:
 *   get:
 *     summary: 몽코인 전환 미리보기
 *     tags: [EventCompletion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
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
 *                     conversionRate:
 *                       type: number
 *                       example: 1.2
 *                     message:
 *                       type: string
 *                       example: "전환되는 몽코인은 100원 단위까지 전환되며 나머지 금액은 올림 되어 적용됩니다"
 *                     description:
 *                       type: string
 *                       example: "10,000원 = 12MC"
 *                     minimumUnit:
 *                       type: integer
 *                       example: 100
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 conversionRate: 1.2
 *                 message: "전환되는 몽코인은 100원 단위까지 전환되며 나머지 금액은 올림 되어 적용됩니다"
 *                 description: "10,000원 = 12MC"
 *                 minimumUnit: 100
 */
router.get('/preview', authenticateJWT, eventCompletionController.getConversionPreview);

/**
 * @swagger
 * /api/birthdays/me/event/donate:
 *   post:
 *     summary: 기부 처리
 *     tags: [EventCompletion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: integer
 *                 example: 1
 *           example:
 *             organizationId: 1
 *     responses:
 *       200:
 *         description: 성공
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
 *                     organizationName:
 *                       type: string
 *                       example: "굿네이버스"
 *                     donatedAmount:
 *                       type: integer
 *                       example: 10000
 *                     message:
 *                       type: string
 *                       example: "굿네이버스에 기부했어요"
 *                     description:
 *                       type: string
 *                       example: "기부금을 전달하고 있어요"
 *                     donatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-12T16:30:00Z"
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 organizationName: "굿네이버스"
 *                 donatedAmount: 10000
 *                 message: "굿네이버스에 기부했어요"
 *                 description: "기부금을 전달하고 있어요"
 *                 donatedAt: "2025-08-12T16:30:00Z"
 */
router.post('/donate', authenticateJWT, eventCompletionController.processDonation);

/**
 * @swagger
 * /api/birthdays/me/event/convert:
 *   post:
 *     summary: 몽코인 전환 처리
 *     tags: [EventCompletion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
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
 *                     convertedAmount:
 *                       type: integer
 *                       example: 10000
 *                     convertedCoins:
 *                       type: integer
 *                       example: 12
 *                     message:
 *                       type: string
 *                       example: "12MC로 전환되었습니다"
 *                     description:
 *                       type: string
 *                       example: "상점에서 원하는 아이템으로 교환해 보세요"
 *                     convertedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-12T16:30:00Z"
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 convertedAmount: 10000
 *                 convertedCoins: 12
 *                 message: "12MC로 전환되었습니다"
 *                 description: "상점에서 원하는 아이템으로 교환해 보세요"
 *                 convertedAt: "2025-08-12T16:30:00Z"
 */
router.post('/convert', authenticateJWT, eventCompletionController.convertToCoins);

export default router;
