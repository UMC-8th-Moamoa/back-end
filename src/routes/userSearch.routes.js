import express from 'express';
import userSearchController from '../controllers/userSearch.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserSearch
 *   description: 사용자 검색 및 검색 기록 관리 API
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 사용자 검색
 *     tags: [UserSearch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: 검색어 (사용자 이름 또는 사용자 ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: 검색 결과 개수
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 페이지 번호
 *     responses:
 *       200:
 *         description: 검색 성공
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           userId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           photo:
 *                             type: string
 *                             nullable: true
 *                           birthday:
 *                             type: string
 *                             format: date
 *                             nullable: true
 *                           isFollowing:
 *                             type: boolean
 *                           isFollower:
 *                             type: boolean
 *                           followersCount:
 *                             type: integer
 *                           followingCount:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/search', authenticateJWT, userSearchController.searchUsers);

/**
 * @swagger
 * /api/users/search/history:
 *   get:
 *     summary: 검색 기록 조회
 *     tags: [UserSearch]
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
 *         description: 조회할 검색 기록 수
 *     responses:
 *       200:
 *         description: 검색 기록 조회 성공
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
 *                     searchHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           searchTerm:
 *                             type: string
 *                           searchedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/search/history', authenticateJWT, userSearchController.getSearchHistory);

/**
 * @swagger
 * /api/users/search/history/{historyId}:
 *   delete:
 *     summary: 검색 기록 삭제
 *     tags: [UserSearch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 삭제할 검색 기록 ID
 *     responses:
 *       200:
 *         description: 검색 기록 삭제 성공
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
 *                       example: 검색 기록이 삭제되었습니다
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 검색 기록을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.delete('/search/history/:historyId', authenticateJWT, userSearchController.deleteSearchHistory);

export default router;
