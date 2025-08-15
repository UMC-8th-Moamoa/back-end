import express from 'express';
import letterHomeController from '../controllers/letterHome.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LetterHome
 *   description: 편지 홈 화면 관리 API
 */

/**
 * @swagger
 * /api/home/letters:
 *   get:
 *     summary: 홈 화면 편지 목록 조회 (스와이프)
 *     tags: [LetterHome]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         description: 한 번에 가져올 편지의 개수
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 페이지네이션을 위한 커서 값 (Base64 인코딩)
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *         description: 스와이프 방향
 *     responses:
 *       200:
 *         description: 편지 목록 조회 성공
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
 *                     letters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           birthdayEventId:
 *                             type: integer
 *                             example: 12
 *                           birthdayPersonName:
 *                             type: string
 *                             example: "김민수"
 *                           birthdayPersonPhoto:
 *                             type: string
 *                             example: "https://example.com/photo.jpg"
 *                           birthday:
 *                             type: string
 *                             format: date
 *                             example: "2025-08-23"
 *                           hasLetter:
 *                             type: boolean
 *                             example: true
 *                           letterId:
 *                             type: integer
 *                             nullable: true
 *                             example: 33
 *                           lastModified:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2025-08-21T10:30:00Z"
 *                           daysLeft:
 *                             type: integer
 *                             example: 3
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                           example: "eyJpZCI6MTgsImNyZWF0ZWRBdCI6IjIwMjUtMDctMjFUMTQ6MjA6MDBaIn0%3D"
 *                         prevCursor:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/letters', 
  authenticateJWT,
  letterHomeController.getLetters
);

export default router;