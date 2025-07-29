import express from 'express';
import MoaController from '../controllers/moa.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Moas
 *   description: 모아모아(생일 이벤트) 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MoaItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 생일 이벤트 ID
 *         birthdayPersonName:
 *           type: string
 *           description: 생일 주인공 이름
 *         birthdayPersonPhoto:
 *           type: string
 *           description: 생일 주인공 프로필 사진 URL
 *         participationStatus:
 *           type: string
 *           enum: [participating, not_participating]
 *           description: 현재 사용자의 참여 상태
 *         eventStatus:
 *           type: string
 *           enum: [active, completed]
 *           description: 이벤트 진행 상태
 *     
 *     MoaPagination:
 *       type: object
 *       properties:
 *         Next:
 *           type: boolean
 *           description: 다음 페이지 존재 여부
 *         Prev:
 *           type: boolean
 *           description: 이전 페이지 존재 여부
 *         nextCursor:
 *           type: string
 *           nullable: true
 *           description: 다음 페이지 커서
 *         prevCursor:
 *           type: string
 *           nullable: true
 *           description: 이전 페이지 커서
 *     
 *     MoaResponse:
 *       type: object
 *       properties:
 *         moas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MoaItem'
 *         pagination:
 *           $ref: '#/components/schemas/MoaPagination'
 */

/**
 * @swagger
 * /api/moas:
 *   get:
 *     summary: 사용자가 참여한 모아모아 목록 조회 (스와이프)
 *     description: 사용자가 참여했거나 참여할 수 있는 생일 이벤트 목록을 커서 기반 페이지네이션으로 조회합니다.
 *     tags: [Moas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 1
 *         description: 한 번에 가져올 모아의 개수
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 페이지네이션을 위한 커서 값 (Base64 인코딩된 JSON)
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *         description: 스와이프 방향 (next = 오른쪽, prev = 왼쪽)
 *     responses:
 *       200:
 *         description: 모아모아 목록 조회 성공
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
 *                   $ref: '#/components/schemas/MoaResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 moas:
 *                   - id: 1
 *                     birthdayPersonName: "김민수"
 *                     birthdayPersonPhoto: "https://example.com/photo.jpg"
 *                     participationStatus: "participating"
 *                     eventStatus: "active"
 *                 pagination:
 *                   Next: true
 *                   Prev: false
 *                   nextCursor: "eyJpZCI6MSwiY3JlYXRlZEF0IjoiMjAyNS0wOC0yM1QxMjowMDowMFoifQ=="
 *                   prevCursor: null
 *       400:
 *         description: 잘못된 요청 (DTO 검증 실패)
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/', 
  authenticateJWT,
  MoaController.getMoas
);

export default router;