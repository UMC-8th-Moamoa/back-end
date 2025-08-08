import express from 'express';
import MyBirthdayController from '../controllers/myBirthday.controller.js';
import MyBirthdayWishlistController from '../controllers/myBirthdayWishlist.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MyBirthday
 *   description: 내 생일 이벤트 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Participant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 참여자 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 참여자 이름
 *           example: "김친구"
 *         photo:
 *           type: string
 *           description: 참여자 프로필 사진 URL
 *           example: "https://example.com/photo1.jpg"
 *         participatedAt:
 *           type: string
 *           format: date-time
 *           description: 참여 일시
 *           example: "2025-07-20T10:30:00Z"
 *     
 *     CurrentEventResponse:
 *       type: object
 *       properties:
 *         eventId:
 *           type: integer
 *           description: 이벤트 ID
 *           example: 123
 *         totalAmount:
 *           type: integer
 *           description: 모인 총 금액 (원)
 *           example: 80000
 *         participantCount:
 *           type: integer
 *           description: 참여자 수
 *           example: 6
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Participant'
 *           description: 참여자 목록
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: 이벤트 마감일시
 *           example: "2025-07-30T23:59:59Z"
 *         daysRemaining:
 *           type: integer
 *           description: 남은 일수
 *           example: 4
 *         birthdayDate:
 *           type: string
 *           format: date
 *           description: 생일 날짜
 *           example: "2025-07-30"
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: 이벤트 상태
 *           example: "active"
 *
 *     WishlistItem:
 *       type: object
 *       properties:
 *         itemId:
 *           type: integer
 *           description: 위시리스트 아이템 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 아이템명
 *           example: "삼성 갤럭시버즈2 프로"
 *         price:
 *           type: integer
 *           description: 가격
 *           example: 100000
 *         image:
 *           type: string
 *           description: 아이템 이미지 URL
 *           example: "https://example.com/product1.jpg"
 *         isSelected:
 *           type: boolean
 *           description: 선택 여부
 *           example: false
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: 등록 일시
 *           example: "2025-07-15T09:30:00Z"
 *         voteCount:
 *           type: integer
 *           description: 투표 수
 *           example: 3
 *     
 *     WishlistPagination:
 *       type: object
 *       properties:
 *         hasNext:
 *           type: boolean
 *           description: 다음 페이지 존재 여부
 *           example: true
 *         nextCursor:
 *           type: string
 *           nullable: true
 *           description: 다음 페이지 커서
 *           example: "eyJpZCI6MjAsImNyZWF0ZWRBdCI6IjIwMjUtMDctMTVUMDk6MzA6MDBaIn0="
 *         totalCount:
 *           type: integer
 *           description: 전체 아이템 수
 *           example: 12
 *     
 *     MyBirthdayWishlistResponse:
 *       type: object
 *       properties:
 *         currentAmount:
 *           type: integer
 *           description: 현재 모금액
 *           example: 80000
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: 위시리스트 아이템 목록
 *         pagination:
 *           $ref: '#/components/schemas/WishlistPagination'
 *         selectedItems:
 *           type: array
 *           items:
 *             type: integer
 *           description: 선택된 아이템 ID 목록
 *           example: [2]
 *         totalSelectedAmount:
 *           type: integer
 *           description: 선택된 아이템들의 총 금액
 *           example: 50000
 *         remainingAmount:
 *           type: integer
 *           description: 남은 금액 (현재모금액 - 선택아이템총액)
 *           example: 30000
 */

/**
 * @swagger
 * /api/birthdays/me/event:
 *   get:
 *     summary: 현재 진행 중인 내 생일 이벤트 정보 조회
 *     description: 생일자(본인)의 현재 진행 중인 이벤트 정보를 조회합니다. 홈 화면에서 모인 금액, 참여자 목록 등을 표시하는데 사용됩니다.
 *     tags: [MyBirthday]
 *     security:
 *       - bearerAuth: []
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
 *                   $ref: '#/components/schemas/CurrentEventResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 eventId: 123
 *                 totalAmount: 80000
 *                 participantCount: 6
 *                 participants:
 *                   - id: 1
 *                     name: "김친구"
 *                     photo: "https://example.com/photo1.jpg"
 *                     participatedAt: "2025-07-20T10:30:00Z"
 *                   - id: 2
 *                     name: "이친구"
 *                     photo: "https://example.com/photo2.jpg"
 *                     participatedAt: "2025-07-21T14:20:00Z"
 *                 deadline: "2025-07-30T23:59:59Z"
 *                 daysRemaining: 4
 *                 birthdayDate: "2025-07-30"
 *                 status: "active"
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
 *       404:
 *         description: 진행 중인 이벤트 없음
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
 *                       example: "N001"
 *                     reason:
 *                       type: string
 *                       example: "현재 진행 중인 생일 이벤트가 없습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *       500:
 *         description: 서버 오류
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
 *                       example: "S001"
 *                     reason:
 *                       type: string
 *                       example: "서버 내부 오류가 발생했습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 */

/**
 * @swagger
 * /api/birthdays/me/event/wishlist:
 *   get:
 *     summary: 내 생일 이벤트 위시리스트 조회
 *     description: 생일자의 위시리스트에서 선물로 선택할 수 있는 아이템 목록을 조회합니다.
 *     tags: [MyBirthday]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [CREATED_AT, VOTE_COUNT, PRICE_DESC, PRICE_ASC]
 *           default: CREATED_AT
 *         description: 정렬 기준
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 다음 페이지 커서
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 한 번에 가져올 항목 수
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
 *                   $ref: '#/components/schemas/MyBirthdayWishlistResponse'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 currentAmount: 80000
 *                 products:
 *                   - itemId: 1
 *                     name: "삼성 갤럭시버즈2 프로"
 *                     price: 100000
 *                     image: "https://example.com/product1.jpg"
 *                     isSelected: false
 *                     addedAt: "2025-07-15T09:30:00Z"
 *                     voteCount: 3
 *                   - itemId: 2
 *                     name: "아이폰 케이스"
 *                     price: 50000
 *                     image: "https://example.com/product2.jpg"
 *                     isSelected: true
 *                     addedAt: "2025-07-10T14:20:00Z"
 *                     voteCount: 2
 *                 pagination:
 *                   hasNext: true
 *                   nextCursor: "eyJpZCI6MjAsImNyZWF0ZWRBdCI6IjIwMjUtMDctMTVUMDk6MzA6MDBaIn0="
 *                   totalCount: 12
 *                 selectedItems: [2]
 *                 totalSelectedAmount: 50000
 *                 remainingAmount: 30000
 *       400:
 *         description: 잘못된 파라미터
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
 *                       example: "sortBy는 다음 값 중 하나여야 합니다: CREATED_AT, VOTE_COUNT, PRICE_DESC, PRICE_ASC"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
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
 *       404:
 *         description: 진행 중인 이벤트 없음
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
 *                       example: "N001"
 *                     reason:
 *                       type: string
 *                       example: "현재 진행 중인 생일 이벤트가 없습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *       500:
 *         description: 서버 오류
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
 *                       example: "S001"
 *                     reason:
 *                       type: string
 *                       example: "서버 내부 오류가 발생했습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 */

// 현재 진행 중인 내 생일 이벤트 정보 조회
router.get('/me/event', authenticateJWT, MyBirthdayController.getCurrentEvent);

// 내 생일 이벤트 위시리스트 조회
// 내 생일 이벤트 위시리스트 조회
router.get('/me/event/wishlist', authenticateJWT, MyBirthdayWishlistController.getMyBirthdayWishlist);

// 위시리스트 상품 선택
router.put('/me/event/wishlist/select', authenticateJWT, MyBirthdayWishlistController.selectWishlistProducts);

// 정산 가능 여부 확인
router.post('/me/event/wishlist/confirm', authenticateJWT, MyBirthdayWishlistController.confirmBudget);

// 구글폼 정산 링크 제공
router.get('/me/event/formlink', authenticateJWT, MyBirthdayWishlistController.getSettlementFormLink);

export default router;