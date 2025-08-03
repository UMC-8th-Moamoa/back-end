// notification.routes.js
import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { NotificationListRequestDTO, NotificationReadRequestDTO } from '../dtos/notification.dto.js';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         message:
 *           type: string
 *           example: "30,000원을 채원님의 모아에 저장했어요"
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-25T09:41:00Z"
 *     
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NotificationItem'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             size:
 *               type: integer
 *               example: 10
 *             totalElements:
 *               type: integer
 *               example: 15
 *             totalPages:
 *               type: integer
 *               example: 2
 *             hasNext:
 *               type: boolean
 *               example: true
 *             hasPrevious:
 *               type: boolean
 *               example: false
 *         hasUnreadNotifications:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 사용자의 알림 목록을 페이지네이션으로 조회합니다
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 한 페이지당 알림 개수
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
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
 *                   $ref: '#/components/schemas/NotificationListResponse'
 *       400:
 *         description: 잘못된 요청 (DTO 검증 실패)
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/', 
  authenticateJWT,
  NotificationListRequestDTO.getValidationRules(),
  handleValidationErrors,
  NotificationController.getNotifications
);

/**
 * @swagger
 * /api/notifications/unread-status:
 *   get:
 *     summary: 읽지 않은 알림 상태 확인
 *     description: 사용자에게 읽지 않은 알림이 있는지 확인합니다 (빨간색 동그라미 표시 여부)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 상태 확인 성공
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
 *                   type: object
 *                   properties:
 *                     hasUnreadNotifications:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/unread-status', 
  authenticateJWT,
  NotificationController.getUnreadNotificationStatus
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: 특정 알림 읽음 처리
 *     description: 특정 알림을 읽음 처리합니다
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 읽음 처리할 알림 ID
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
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
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "알림이 읽음 처리되었습니다."
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 알림 ID)
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 해당 알림을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.patch('/:notificationId/read', 
  authenticateJWT,
  NotificationReadRequestDTO.getValidationRules(),
  handleValidationErrors,
  NotificationController.markNotificationAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: 모든 알림 읽음 처리
 *     description: 사용자의 모든 읽지 않은 알림을 읽음 처리합니다
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 알림 읽음 처리 성공
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
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "5개의 알림이 읽음 처리되었습니다."
 *                     updatedCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.patch('/read-all', 
  authenticateJWT,
  NotificationController.markAllNotificationsAsRead
);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: 새로운 알림 생성 (시스템 내부용)
 *     description: 새로운 알림을 생성합니다 (관리자 또는 시스템 호출용)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 123
 *               message:
 *                 type: string
 *                 example: "30,000원을 채원님의 모아에 저장했어요"
 *     responses:
 *       200:
 *         description: 알림 생성 성공
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
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "알림이 성공적으로 생성되었습니다."
 *                     notification:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 124
 *                         message:
 *                           type: string
 *                           example: "30,000원을 채원님의 모아에 저장했어요"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-31T10:30:00Z"
 *       400:
 *         description: 잘못된 요청 (필수 필드 누락)
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/', 
  authenticateJWT,
  NotificationController.createNotification
);

export default router;