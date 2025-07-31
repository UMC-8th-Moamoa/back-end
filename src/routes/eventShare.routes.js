import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import eventShareController from '../controllers/eventShare.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: EventShare
 *     description: 생일 이벤트 공유 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShareRequest:
 *       type: object
 *       required:
 *         - contentType
 *         - expiresAt
 *       properties:
 *         contentType:
 *           type: string
 *           enum: [URL]
 *           description: 콘텐츠 타입
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: 공유 링크 만료 시간
 *     
 *     ShareResponse:
 *       type: object
 *       properties:
 *         shareUrl:
 *           type: string
 *           description: 공유 URL
 *           example: "https://moamoa.app/events/1/join?token=abc123xyz"
 *         shareText:
 *           type: string
 *           description: 공유 텍스트
 *           example: "김민수님의 생일 모아모아에 참여해주세요!\n마감: 8월 23일"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: 만료 시간
 *     
 *     SharedEventInfo:
 *       type: object
 *       properties:
 *         eventId:
 *           type: integer
 *           description: 이벤트 ID
 *         birthdayPersonName:
 *           type: string
 *           description: 생일자 이름
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: 이벤트 마감일
 *         status:
 *           type: string
 *           description: 이벤트 상태
 */

/**
 * @swagger
 * /api/birthdays/events/{eventId}/share:
 *   post:
 *     summary: 이벤트 공유용 URL 생성
 *     description: 생일 이벤트 공유를 위한 고유 URL을 생성합니다.
 *     tags: [EventShare]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 1
 *         description: 생일 이벤트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareRequest'
 *           example:
 *             contentType: "URL"
 *             expiresAt: "2025-08-23T23:59:59Z"
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
 *                   $ref: '#/components/schemas/ShareResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 shareUrl: "https://moamoa.app/events/1/join?token=abc123xyz"
 *                 shareText: "김민수님의 생일 모아모아에 참여해주세요!\n마감: 8월 23일"
 *                 expiresAt: "2025-08-23T23:59:59Z"
 *       400:
 *         description: 유효성 검사 실패
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
 *                       example: "B001"
 *                     reason:
 *                       type: string
 *                       example: "만료 시간은 현재 시간보다 미래여야 합니다."
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 이벤트를 찾을 수 없음
 */

/**
 * @swagger
 * /api/birthdays/events/shared/{token}:
 *   get:
 *     summary: 공유 링크로 이벤트 정보 조회
 *     description: 공유 토큰을 통해 이벤트 정보를 조회합니다. (공유 링크 접속 시 사용)
 *     tags: [EventShare]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 공유 토큰
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
 *                   $ref: '#/components/schemas/SharedEventInfo'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 eventId: 1
 *                 birthdayPersonName: "김민수"
 *                 deadline: "2025-08-23T23:59:59Z"
 *                 status: "active"
 *       400:
 *         description: 유효하지 않은 토큰
 *       404:
 *         description: 유효하지 않거나 만료된 공유 링크
 */

// 이벤트 공유 URL 생성
router.post('/events/:eventId/share', 
  authenticateJWT, 
  eventShareController.createShareUrl
);

// 공유 링크로 이벤트 정보 조회 (인증 불필요)
router.get('/events/shared/:token', 
  eventShareController.getEventByShareToken
);

export default router;