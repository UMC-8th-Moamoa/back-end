import express from 'express';
import WishlistVoteController from '../controllers/wishlistVote.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WishlistVote
 *   description: 위시리스트 투표 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VotingWishlist:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 위시리스트 ID
 *         name:
 *           type: string
 *           description: 상품명
 *         price:
 *           type: integer
 *           description: 가격
 *         image:
 *           type: string
 *           description: 상품 이미지 URL
 *         totalVotes:
 *           type: integer
 *           description: 현재 총 투표 수
 *         userVoted:
 *           type: boolean
 *           description: 현재 사용자 투표 여부
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: 등록 일시
 *     
 *     VoteResult:
 *       type: object
 *       properties:
 *         itemId:
 *           type: integer
 *           description: 위시리스트 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 상품명
 *           example: "삼성 갤럭시버즈2 프로"
 *         price:
 *           type: integer
 *           description: 가격
 *           example: 100000
 *         image:
 *           type: string
 *           description: 상품 이미지 URL
 *           example: "https://example.com/product1.jpg"
 *         voteCount:
 *           type: integer
 *           description: 투표 수
 *           example: 6
 *         userVoted:
 *           type: boolean
 *           description: 현재 사용자 투표 여부
 *           example: true
 *     
 *     VoteRequest:
 *       type: object
 *       required:
 *         - wishlistIds
 *       properties:
 *         wishlistIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: 투표할 위시리스트 ID 배열
 *           example: [1, 3, 5]
 */

/**
 * @swagger
 * /api/birthdays/events/{eventId}/wishlist/vote:
 *   get:
 *     summary: 투표할 위시리스트 목록 조회
 *     description: 특정 이벤트의 위시리스트 목록을 투표용으로 조회합니다.
 *     tags: [WishlistVote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 이벤트 ID
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
 *                   type: object
 *                   properties:
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         birthdayPersonName:
 *                           type: string
 *                     wishlists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VotingWishlist'
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (이벤트 참여자가 아님)
 *       404:
 *         description: 이벤트를 찾을 수 없음
 *   post:
 *     summary: 위시리스트 투표하기
 *     description: 선택된 위시리스트들에 투표합니다. 기존 투표는 덮어씌워집니다.
 *     tags: [WishlistVote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 이벤트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteRequest'
 *     responses:
 *       200:
 *         description: 투표 완료
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */

/**
 * @swagger
 * /api/birthdays/events/{eventId}/wishlist/vote/results:
 *   get:
 *     summary: 투표 결과 조회
 *     description: 위시리스트 투표 결과를 조회합니다. (간단한 버전 - 투표 수만 포함)
 *     tags: [WishlistVote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 이벤트 ID
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
 *                   type: object
 *                   properties:
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 123
 *                         birthdayPersonName:
 *                           type: string
 *                           example: "김생일"
 *                     userHasVoted:
 *                       type: boolean
 *                       description: 사용자 투표 참여 여부
 *                       example: true
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VoteResult'
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 event:
 *                   id: 123
 *                   birthdayPersonName: "김생일"
 *                 userHasVoted: true
 *                 results:
 *                   - itemId: 1
 *                     name: "삼성 갤럭시버즈2 프로"
 *                     price: 100000
 *                     image: "https://example.com/product1.jpg"
 *                     voteCount: 6
 *                     userVoted: true
 *                   - itemId: 2
 *                     name: "아이폰 케이스"
 *                     price: 50000
 *                     image: "https://example.com/product2.jpg"
 *                     voteCount: 3
 *                     userVoted: false
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 이벤트를 찾을 수 없음
 */



// 투표할 위시리스트 목록 조회  
router.get('/events/:eventId/wishlist/vote', authenticateJWT, WishlistVoteController.getVotingWishlists);

// 위시리스트 투표하기
router.post('/events/:eventId/wishlist/vote', authenticateJWT, WishlistVoteController.voteForWishlists);

// 투표 결과 조회
router.get('/events/:eventId/wishlist/vote/results', authenticateJWT, WishlistVoteController.getVoteResults);

export default router;