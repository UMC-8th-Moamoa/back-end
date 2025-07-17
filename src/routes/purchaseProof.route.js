import express from 'express';
import PurchaseProofController from '../controllers/purchaseProof.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PurchaseProof
 *   description: 구매 인증 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseProofRequest:
 *       type: object
 *       required:
 *         - proofImages
 *         - message
 *       properties:
 *         proofImages:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: "구매 인증 이미지 URL 배열 (최대 5개)"
 *           example: ["https://example.com/proof1.jpg"]
 *         message:
 *           type: string
 *           maxLength: 500
 *           description: "감사 메시지"
 *           example: "너무 감사해요:)"
 *     
 *     PurchaseProofInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 구매 인증 ID
 *         eventId:
 *           type: integer
 *           description: 이벤트 ID
 *         proofImages:
 *           type: array
 *           items:
 *             type: string
 *           description: 구매 인증 이미지 URL 배열
 *     
 *     MessageRecipient:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 수신자 ID
 *         name:
 *           type: string
 *           description: 수신자 이름
 *         messageId:
 *           type: integer
 *           description: 메시지 ID
 *     
 *     ThankYouMessageInfo:
 *       type: object
 *       properties:
 *         totalSent:
 *           type: integer
 *           description: 총 발송 수
 *         message:
 *           type: string
 *           description: 감사 메시지 내용
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: 발송 시간
 *         recipients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MessageRecipient'
 *           description: 수신자 목록
 *     
 *     PurchaseProofResponse:
 *       type: object
 *       properties:
 *         purchaseProof:
 *           $ref: '#/components/schemas/PurchaseProofInfo'
 *         thankYouMessage:
 *           $ref: '#/components/schemas/ThankYouMessageInfo'
 */

/**
 * @swagger
 * /api/birthday-events/{eventId}/proof:
 *   post:
 *     summary: 선물 구매 인증 등록
 *     tags: [PurchaseProof]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 이벤트 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseProofRequest'
 *           example:
 *             proofImages: ["https://example.com/proof1.jpg"]
 *             message: "너무 감사해요:)"
 *     responses:
 *       201:
 *         description: 구매 인증 등록 성공
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
 *                   $ref: '#/components/schemas/PurchaseProofResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 purchaseProof:
 *                   id: 1
 *                   eventId: 1
 *                   proofImages: ["https://example.com/proof1.jpg"]
 *                 thankYouMessage:
 *                   totalSent: 5
 *                   message: "너무 감사해요:)"
 *                   sentAt: "2024-08-24T14:00:00Z"
 *                   recipients:
 *                     - id: 2
 *                       name: "이영희"
 *                       messageId: 101
 *                     - id: 3
 *                       name: "박민수"
 *                       messageId: 102
 *       400:
 *         description: 잘못된 요청 (유효성 검사 실패)
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음 (생일 주인공만 가능)
 *       404:
 *         description: 존재하지 않는 이벤트
 *       409:
 *         description: 이미 구매 인증이 등록된 이벤트
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/:eventId/proof', 
  authenticateJWT,           // JWT 인증 필수
  PurchaseProofController.createPurchaseProof
);

export default router;