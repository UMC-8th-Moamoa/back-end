import express from 'express';
import CalendarController from '../controllers/calendar.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: 달력 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Friend:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 친구 ID
 *         name:
 *           type: string
 *           description: 친구 이름
 *         photo:
 *           type: string
 *           description: 프로필 사진 URL
 *         hasActiveEvent:
 *           type: boolean
 *           description: 활성 생일 이벤트 여부
 *     
 *     BirthdayDate:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: 생일 날짜 (YYYY-MM-DD)
 *         friends:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Friend'
 *           description: 해당 날짜에 생일인 친구들
 *         eventCount:
 *           type: integer
 *           description: 활성 이벤트 수
 *     
 *     CalendarResponse:
 *       type: object
 *       properties:
 *         year:
 *           type: integer
 *           description: 조회한 연도
 *         month:
 *           type: integer
 *           description: 조회한 월
 *         birthdays:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BirthdayDate'
 *           description: 생일 정보 목록
 *     
 *     BirthdayDetailFriend:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 친구 ID
 *         name:
 *           type: string
 *           description: 친구 이름
 *     
 *     BirthdayDetailItem:
 *       type: object
 *       properties:
 *         friend:
 *           $ref: '#/components/schemas/BirthdayDetailFriend'
 *     
 *     BirthdayDetailResponse:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: 조회한 날짜 (YYYY-MM-DD)
 *         birthdays:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BirthdayDetailItem'
 *           description: 해당 날짜에 생일인 친구들
 */

/**
 * @swagger
 * /api/calendar/birthdays:
 *   get:
 *     summary: 특정 월의 팔로우한 사용자들 생일 달력 조회
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2015
 *           maximum: 2035
 *         description: "조회할 연도 (기본값: 현재 연도)"
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: "조회할 월 (기본값: 현재 월)"
 *     responses:
 *       200:
 *         description: 달력 조회 성공
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
 *                     calendar:
 *                       $ref: '#/components/schemas/CalendarResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 calendar:
 *                   year: 2025
 *                   month: 8
 *                   birthdays:
 *                     - date: "2025-08-23"
 *                       friends:
 *                         - id: 2
 *                           name: "김민수"
 *                           photo: "https://example.com/photo.jpg"
 *                           hasActiveEvent: true
 *                       eventCount: 1
 *       400:
 *         description: 잘못된 요청 (DTO 검증 실패)
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/birthdays', 
  authenticateJWT,
  CalendarController.getBirthdays
);

/**
 * @swagger
 * /api/calendar/birthdays/{date}:
 *   get:
 *     summary: 특정 날짜의 생일 및 이벤트 상세 정보 조회
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\\d{4}-\\d{2}-\\d{2}$'
 *         description: "조회할 날짜 (YYYY-MM-DD 형식)"
 *         example: "2025-08-23"
 *     responses:
 *       200:
 *         description: 날짜별 생일 상세 조회 성공
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
 *                   $ref: '#/components/schemas/BirthdayDetailResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 date: "2025-08-23"
 *                 birthdays:
 *                   - friend:
 *                       id: 2
 *                       name: "김민수"
 *       400:
 *         description: 잘못된 요청 (DTO 검증 실패)
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 해당 날짜에 생일인 사용자가 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/birthdays/:date', 
  authenticateJWT,
  CalendarController.getBirthdaysByDate
);

export default router;