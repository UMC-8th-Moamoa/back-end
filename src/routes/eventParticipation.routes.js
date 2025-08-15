import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import eventParticipationController from '../controllers/eventParticipation.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: EventParticipation
 *     description: 생일 이벤트 참여 API
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
 *         birthdayPersonName:
 *           type: string
 *           description: 생일자 이름
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: 이벤트 마감일
 *         status:
 *           type: string
 *           enum: [active, completed]
 *           description: 이벤트 상태
 *     
 *     CountdownInfo:
 *       type: object
 *       properties:
 *         timeRemaining:
 *           type: string
 *           description: 남은 시간 (HH:MM:SS 형식)
 *           example: "48:14:30"
 *         deadlineFormatted:
 *           type: string
 *           description: 포맷팅된 마감일
 *           example: "8월 23일 23:59"
 *     
 *     ParticipationInfo:
 *       type: object
 *       properties:
 *         currentUserParticipated:
 *           type: boolean
 *           description: 현재 사용자 참여 여부
 *         participationCount:
 *           type: integer
 *           description: 총 참여자 수
 *         hasWrittenLetter:
 *           type: boolean
 *           description: 편지 작성 여부
 *     
 *     ButtonStatus:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [NOT_PARTICIPATED, PARTICIPATED_NO_LETTER, PARTICIPATED_WITH_LETTER, EXPIRED, CLOSED, COMPLETED, CANCELLED, UNKNOWN]
 *           description: 버튼 상태 타입
 *         message:
 *           type: string
 *           description: 상태 메시지
 *         buttonText:
 *           type: string
 *           nullable: true
 *           description: 버튼 텍스트
 *         buttonAction:
 *           type: string
 *           enum: [PARTICIPATE, WRITE_LETTER, EDIT_LETTER, NONE]
 *           description: 버튼 액션
 *         isEnabled:
 *           type: boolean
 *           description: 버튼 활성화 여부
 *     
 *     ParticipationData:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 참여 ID
 *         eventId:
 *           type: integer
 *           description: 이벤트 ID
 *         userId:
 *           type: integer
 *           description: 사용자 ID
 *         amount:
 *           type: integer
 *           description: 참여 금액
 *         participationType:
 *           type: string
 *           enum: [WITH_MONEY, WITHOUT_MONEY]
 *           description: 참여 타입
 *         participatedAt:
 *           type: string
 *           format: date-time
 *           description: 참여 시간
 *     
 *     EventStatus:
 *       type: object
 *       properties:
 *         currentAmount:
 *           type: integer
 *           description: 현재 모인 금액
 *         participantCount:
 *           type: integer
 *           description: 총 참여자 수
 *     
 *     ParticipationInfoResponse:
 *       type: object
 *       properties:
 *         event:
 *           $ref: '#/components/schemas/EventInfo'
 *         countdown:
 *           $ref: '#/components/schemas/CountdownInfo'
 *         participation:
 *           $ref: '#/components/schemas/ParticipationInfo'
 *         buttonStatus:
 *           $ref: '#/components/schemas/ButtonStatus'
 *     
 *     ParticipationResponse:
 *       type: object
 *       properties:
 *         participation:
 *           $ref: '#/components/schemas/ParticipationData'
 *         event:
 *           $ref: '#/components/schemas/EventStatus'
 */

/**
 * @swagger
 * /api/birthdays/events/{eventId}/participation:
 *   get:
 *     summary: 이벤트 참여 화면 정보 조회
 *     description: 모아 참여하기 화면에 필요한 정보를 조회합니다. (마감시간, 이벤트 정보 등)
 *     tags: [EventParticipation]
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
 *                   $ref: '#/components/schemas/ParticipationInfoResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 event:
 *                   id: 1
 *                   birthdayPersonName: "김민수"
 *                   deadline: "2025-08-23T23:59:59Z"
 *                   status: "active"
 *                 countdown:
 *                   timeRemaining: "48:14:30"
 *                   deadlineFormatted: "8월 23일 23:59"
 *                 participation:
 *                   currentUserParticipated: false
 *                   participationCount: 5
 *                   hasWrittenLetter: false
 *                 buttonStatus:
 *                   type: "NOT_PARTICIPATED"
 *                   message: "이벤트에 참여해보세요"
 *                   buttonText: "모아 참여하기"
 *                   buttonAction: "PARTICIPATE"
 *                   isEnabled: true
 *             examples:
 *               not_participated:
 *                 summary: 참여하지 않은 상태
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     event:
 *                       id: 1
 *                       birthdayPersonName: "김민수"
 *                       deadline: "2025-08-23T23:59:59Z"
 *                       status: "active"
 *                     countdown:
 *                       timeRemaining: "48:14:30"
 *                       deadlineFormatted: "8월 23일 23:59"
 *                     participation:
 *                       currentUserParticipated: false
 *                       participationCount: 5
 *                       hasWrittenLetter: false
 *                     buttonStatus:
 *                       type: "NOT_PARTICIPATED"
 *                       message: "이벤트에 참여해보세요"
 *                       buttonText: "모아 참여하기"
 *                       buttonAction: "PARTICIPATE"
 *                       isEnabled: true
 *               participated_no_letter:
 *                 summary: 참여했지만 편지 미작성
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     event:
 *                       id: 1
 *                       birthdayPersonName: "김민수"
 *                       deadline: "2025-08-23T23:59:59Z"
 *                       status: "active"
 *                     countdown:
 *                       timeRemaining: "48:14:30"
 *                       deadlineFormatted: "8월 23일 23:59"
 *                     participation:
 *                       currentUserParticipated: true
 *                       participationCount: 6
 *                       hasWrittenLetter: false
 *                     buttonStatus:
 *                       type: "PARTICIPATED_NO_LETTER"
 *                       message: "편지를 작성해주세요"
 *                       buttonText: "편지 작성하러 가기"
 *                       buttonAction: "WRITE_LETTER"
 *                       isEnabled: true
 *               participated_with_letter:
 *                 summary: 참여 및 편지 작성 완료
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     event:
 *                       id: 1
 *                       birthdayPersonName: "김민수"
 *                       deadline: "2025-08-23T23:59:59Z"
 *                       status: "active"
 *                     countdown:
 *                       timeRemaining: "48:14:30"
 *                       deadlineFormatted: "8월 23일 23:59"
 *                     participation:
 *                       currentUserParticipated: true
 *                       participationCount: 6
 *                       hasWrittenLetter: true
 *                     buttonStatus:
 *                       type: "PARTICIPATED_WITH_LETTER"
 *                       message: "편지 작성 완료"
 *                       buttonText: "편지 수정하기"
 *                       buttonAction: "EDIT_LETTER"
 *                       isEnabled: true
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 이벤트를 찾을 수 없음
 *   post:
 *     summary: 생일 이벤트 참여 (송금/송금없이)
 *     description: 생일 이벤트에 금액과 함께 또는 금액 없이 참여합니다.
 *     tags: [EventParticipation]
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
 *             type: object
 *             required:
 *               - participationType
 *               - amount
 *             properties:
 *               participationType:
 *                 type: string
 *                 enum: [WITH_MONEY, WITHOUT_MONEY]
 *                 description: 참여 타입
 *               amount:
 *                 type: number
 *                 description: 참여 금액 (WITH_MONEY시 1원 이상, WITHOUT_MONEY시 0)
 *           examples:
 *             with_money:
 *               summary: 송금하고 참여하기
 *               value:
 *                 participationType: "WITH_MONEY"
 *                 amount: 30000
 *             without_money:
 *               summary: 송금 없이 참여하기
 *               value:
 *                 participationType: "WITHOUT_MONEY"
 *                 amount: 0
 *     responses:
 *       200:
 *         description: 참여 성공
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
 *                   $ref: '#/components/schemas/ParticipationResponse'
 *             examples:
 *               with_money:
 *                 summary: 송금하고 참여 성공
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     participation:
 *                       id: 123
 *                       eventId: 1
 *                       userId: 3
 *                       amount: 30000
 *                       participationType: "WITH_MONEY"
 *                       participatedAt: "2025-07-16T15:30:00Z"
 *                     event:
 *                       currentAmount: 150000
 *                       participantCount: 6
 *               without_money:
 *                 summary: 송금 없이 참여 성공
 *                 value:
 *                   resultType: "SUCCESS"
 *                   error: null
 *                   success:
 *                     participation:
 *                       id: 124
 *                       eventId: 1
 *                       userId: 3
 *                       amount: 0
 *                       participationType: "WITHOUT_MONEY"
 *                       participatedAt: "2025-07-16T15:30:00Z"
 *                     event:
 *                       currentAmount: 150000
 *                       participantCount: 6
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
 *                       example: "금액을 입력해 주세요"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *             examples:
 *               amount_required:
 *                 summary: 금액 미입력
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B001"
 *                     reason: "금액을 입력해 주세요"
 *                     data: null
 *                   success: null
 *               already_participated:
 *                 summary: 이미 참여한 경우
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B002"
 *                     reason: "이미 참여한 이벤트입니다"
 *                     data: null
 *                   success: null
 *               event_expired:
 *                 summary: 마감된 이벤트
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B003"
 *                     reason: "마감된 이벤트입니다"
 *                     data: null
 *                   success: null
 *               own_event:
 *                 summary: 본인 생일 이벤트 참여 시도
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B005"
 *                     reason: "본인의 생일 이벤트에는 참여할 수 없습니다"
 *                     data: null
 *                   success: null
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음 (팔로우 관계 없음)
 *       404:
 *         description: 이벤트를 찾을 수 없음
 */

// 이벤트 참여 화면 정보 조회
router.get('/events/:eventId/participation', 
  authenticateJWT, 
  eventParticipationController.getParticipationInfo
);

// 이벤트 참여 (송금하고/송금없이)
router.post('/events/:eventId/participation', 
  authenticateJWT, 
  eventParticipationController.participateInEvent
);

export default router;