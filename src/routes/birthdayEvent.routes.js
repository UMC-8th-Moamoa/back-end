import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import birthdayEventController from '../controllers/birthdayEvent.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: BirthdayEvent
 *     description: 생일 이벤트 상세 정보 조회 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EventInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 이벤트 ID
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: 이벤트 마감일
 *         status:
 *           type: string
 *           enum: [active, completed]
 *           description: 이벤트 상태
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 이벤트 생성일
 *     
 *     BirthdayPersonInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 생일자 ID
 *         name:
 *           type: string
 *           description: 생일자 이름
 *         photo:
 *           type: string
 *           nullable: true
 *           description: 생일자 프로필 사진 URL
 *         birthday:
 *           type: string
 *           format: date-time
 *           description: 생일자 생일
 *     
 *     CountdownInfo:
 *       type: object
 *       properties:
 *         daysRemaining:
 *           type: integer
 *           description: 남은 일수
 *         formattedDaysRemaining:
 *           type: string
 *           description: 포맷팅된 남은 일수 (예. D-7)
 *         isBirthdayToday:
 *           type: boolean
 *           description: 오늘이 생일인지 여부
 *     
 *     Participant:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: 참여자 ID
 *         userName:
 *           type: string
 *           description: 참여자 이름
 *         userPhoto:
 *           type: string
 *           nullable: true
 *           description: 참여자 프로필 사진 URL
 *         participatedAt:
 *           type: string
 *           format: date-time
 *           description: 참여 시간
 *     
 *     ParticipantsInfo:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: 전체 참여자 수
 *         currentUserParticipated:
 *           type: boolean
 *           description: 현재 사용자 참여 여부
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Participant'
 *     
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 위시리스트 아이템 ID
 *         name:
 *           type: string
 *           description: 상품명
 *         price:
 *           type: integer
 *           description: 상품 가격
 *         image:
 *           type: string
 *           nullable: true
 *           description: 상품 이미지 URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 위시리스트 등록일
 *     
 *     WishlistInfo:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: 전체 위시리스트 아이템 수
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: 모든 위시리스트 아이템 (스와이프)
 *     
 *     BirthdayEventResponse:
 *       type: object
 *       properties:
 *         event:
 *           $ref: '#/components/schemas/EventInfo'
 *         birthdayPerson:
 *           $ref: '#/components/schemas/BirthdayPersonInfo'
 *         countdown:
 *           $ref: '#/components/schemas/CountdownInfo'
 *         participants:
 *           $ref: '#/components/schemas/ParticipantsInfo'
 *         wishlist:
 *           $ref: '#/components/schemas/WishlistInfo'
 */

/**
 * @swagger
 * /api/birthdays/events/{eventId}:
 *   get:
 *     summary: 생일 이벤트 상세 정보 조회
 *     description: 특정 생일 이벤트의 상세 정보를 조회합니다. 참여자, 카운트다운, 모든 위시리스트가 포함됩니다.
 *     tags: [BirthdayEvent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 생일 이벤트 ID
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
 *                   $ref: '#/components/schemas/BirthdayEventResponse'
 *             examples:
 *               success:
 *                 summary: 성공적인 응답
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     event:
 *                       id: 1
 *                       deadline: "2025-08-23T23:59:59Z"
 *                       status: "active"
 *                       createdAt: "2025-08-17T00:00:00Z"
 *                     birthdayPerson:
 *                       id: 2
 *                       name: "김민수"
 *                       photo: "https://example.com/profile.jpg"
 *                       birthday: "2001-08-23T00:00:00Z"
 *                     countdown:
 *                       daysRemaining: 7
 *                       formattedDaysRemaining: "D-7"
 *                       isBirthdayToday: false
 *                     participants:
 *                       totalCount: 3
 *                       currentUserParticipated: true
 *                       list:
 *                         - userId: 3
 *                           userName: "이영희"
 *                           userPhoto: "https://example.com/user3.jpg"
 *                           participatedAt: "2025-07-16T14:30:00Z"
 *                     wishlist:
 *                       totalCount: 5
 *                       items:
 *                         - id: 1
 *                           name: "데디카 플렉시스드 오트"
 *                           price: 35000
 *                           image: "https://example.com/wishlist1.jpg"
 *                           createdAt: "2025-07-10T10:00:00Z"
 *               empty_wishlist:
 *                 summary: 위시리스트가 없는 경우
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     event:
 *                       id: 1
 *                       deadline: "2025-08-23T23:59:59Z"
 *                       status: "active"
 *                       createdAt: "2025-08-17T00:00:00Z"
 *                     birthdayPerson:
 *                       id: 2
 *                       name: "김민수"
 *                       photo: "https://example.com/profile.jpg"
 *                       birthday: "2001-08-23T00:00:00Z"
 *                     countdown:
 *                       daysRemaining: 7
 *                       formattedDaysRemaining: "D-7"
 *                       isBirthdayToday: false
 *                     participants:
 *                       totalCount: 3
 *                       currentUserParticipated: true
 *                       list: []
 *                     wishlist: null
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음 (팔로우 관계 없음)
 *       404:
 *         description: 이벤트를 찾을 수 없음
 *       400:
 *         description: 유효성 검사 실패
 */
router.get('/events/:eventId', authenticateJWT, birthdayEventController.getEventDetail);

export default router;