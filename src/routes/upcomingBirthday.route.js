import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import upcomingBirthdayController from '../controllers/upcomingBirthday.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Birthday
 *     description: 생일 관련 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FriendInfo:
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
 *           nullable: true
 *           description: 친구 프로필 사진 URL
 *     
 *     BirthdayInfo:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: 생일 날짜 (YYYY-MM-DD)
 *         displayDate:
 *           type: string
 *           description: 표시용 날짜 (예. 8월 23일)
 *         dDay:
 *           type: integer
 *           description: 남은 일수 (0. 당일, 1. 내일, ...)
 *     
 *     UpcomingBirthdayItem:
 *       type: object
 *       properties:
 *         friend:
 *           $ref: '#/components/schemas/FriendInfo'
 *         birthday:
 *           $ref: '#/components/schemas/BirthdayInfo'
 *         eventId:
 *           type: integer
 *           description: 자동 생성된 생일 이벤트 ID
 *     
 *     SwipePaginationInfo:
 *       type: object
 *       properties:
 *         hasNext:
 *           type: boolean
 *           description: 다음 페이지 존재 여부 (오른쪽 스와이프 가능)
 *         hasPrev:
 *           type: boolean
 *           description: 이전 페이지 존재 여부 (왼쪽 스와이프 가능)
 *         nextCursor:
 *           type: string
 *           nullable: true
 *           description: 다음 페이지 커서 (Base64 인코딩)
 *         prevCursor:
 *           type: string
 *           nullable: true
 *           description: 이전 페이지 커서 (Base64 인코딩)
 *         totalCount:
 *           type: integer
 *           description: 현재 페이지의 데이터 개수
 *     
 *     UpcomingBirthdaysResponse:
 *       type: object
 *       properties:
 *         upcomingBirthdays:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UpcomingBirthdayItem'
 *         pagination:
 *           $ref: '#/components/schemas/SwipePaginationInfo'
 */

/**
 * @swagger
 * /api/birthdays/upcoming:
 *   get:
 *     summary: 다가오는 친구의 생일 목록 조회 (스와이프)
 *     description: |
 *       홈 화면에서 팔로우한 친구들 중 7일 이내에 생일이 있는 친구들의 목록을 스와이프 형식으로 3개씩 조회합니다.
 *       - 기본적으로 3개씩 표시되며, 좌우 스와이프로 페이지네이션이 가능합니다.
 *       - 자동으로 생일 7일 전에 이벤트가 생성됩니다.
 *     tags: [Birthday]
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
 *         description: 한 번에 조회할 친구 수 (1-10명, 기본 3명)
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
 *                   $ref: '#/components/schemas/UpcomingBirthdaysResponse'
 *             examples:
 *               first_page:
 *                 summary: 첫 번째 페이지 (3명의 친구)
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     upcomingBirthdays:
 *                       - friend:
 *                           id: 5
 *                           name: "김민수"
 *                           photo: "https://example.com/profile/kimminsu.jpg"
 *                         birthday:
 *                           date: "2001-08-23"
 *                           displayDate: "8월 23일"
 *                           dDay: 0
 *                         eventId: 12
 *                       - friend:
 *                           id: 8
 *                           name: "이영희"
 *                           photo: "https://example.com/profile/leeyounghi.jpg"
 *                         birthday:
 *                           date: "2001-08-24"
 *                           displayDate: "8월 24일"
 *                           dDay: 1
 *                         eventId: 15
 *                       - friend:
 *                           id: 12
 *                           name: "박철수"
 *                           photo: "https://example.com/profile/parkchulsoo.jpg"
 *                         birthday:
 *                           date: "2001-08-27"
 *                           displayDate: "8월 27일"
 *                           dDay: 4
 *                         eventId: 18
 *                     pagination:
 *                       hasNext: true
 *                       hasPrev: false
 *                       nextCursor: "eyJpZCI6MTIsImREYXkiOjQsImRhdGUiOiIyMDAxLTA4LTI3In0="
 *                       prevCursor: null
 *                       totalCount: 3
 *               next_page:
 *                 summary: 다음 페이지 (오른쪽 스와이프)
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     upcomingBirthdays:
 *                       - friend:
 *                           id: 15
 *                           name: "최은정"
 *                           photo: "https://example.com/profile/choieunjung.jpg"
 *                         birthday:
 *                           date: "2001-08-29"
 *                           displayDate: "8월 29일"
 *                           dDay: 6
 *                         eventId: 21
 *                     pagination:
 *                       hasNext: false
 *                       hasPrev: true
 *                       nextCursor: null
 *                       prevCursor: "eyJpZCI6MTUsImREYXkiOjYsImRhdGUiOiIyMDAxLTA4LTI5In0="
 *                       totalCount: 1
 *               empty:
 *                 summary: 빈 결과 (7일 이내 생일 친구 없음)
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     upcomingBirthdays: []
 *                     pagination:
 *                       hasNext: false
 *                       hasPrev: false
 *                       nextCursor: null
 *                       prevCursor: null
 *                       totalCount: 0
 *       401:
 *         description: 인증 실패
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
 *                       example: "A001"
 *                     reason:
 *                       type: string
 *                       example: "인증이 필요합니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
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
 *                       example: "limit은 1-10 사이의 숫자여야 합니다."
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 */
router.get('/upcoming', authenticateJWT, upcomingBirthdayController.getUpcomingBirthdays);

export default router;