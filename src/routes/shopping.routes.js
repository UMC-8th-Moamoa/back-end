import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import shoppingController from '../controllers/shopping.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Shopping
 *     description: 아이템 쇼핑 API
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     ItemListEntry:
 *       type: object
 *       properties:
 *         item_no:
 *           type: integer
 *           description: 아이템 고유 번호
 *         name:
 *           type: string
 *           description: 아이템 이름
 *         price:
 *           type: integer
 *           description: 아이템 가격
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
 *    
 *     ItemDetailEntry:
 *       type: object
 *       properties:
 *         item_no:
 *           type: integer
 *           description: 아이템 고유 번호
 *         name:
 *           type: string
 *           description: 아이템 이름
 *         detail:
 *           type: string
 *           description: 아이템 상세정보
 *         price:
 *           type: integer
 *           description: 아이템 가격
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
 * 
 *     HoldItemEntry:
 *       type: object
 *       properties:
 *         holditem_no:
 *           type: integer
 *           description: 구매한 아이템 고유 번호
 *         category:
 *           type: string
 *           description: 아이템 카테고리
 *         item_no:
 *           type: integer
 *           description: 아이템 고유 번호
 *         name:
 *           type: string
 *           description: 아이템 이름
 *         price:
 *           type: integer
 *           description: 아이템 가격
 *         user_id:
 *           type: string
 *           description: 사용자 ID
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
 *         description:
 *           type: string
 *           description: 아이템 설명
 *         event:
 *           type: boolean
 *           description: 이벤트 아이템 여부
 *         purchasedAt:
 *           type: string
 *           format: date-time
 *           description: 구매 일시
 *
 *     ItemListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *           example: true
 *         num:
 *           type: integer
 *           description: 아이템 배열의 총 개수
 *           example: 2
 *         itemListEntry:
 *           type: array # 'item'은 배열
 *           description: 아이템 목록
 *           items:
 *             $ref: '#/components/schemas/ItemListEntry'
 * 
 *     ItemDetailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *           example: true
 *         itemDetailEntry:
 *           $ref: '#/components/schemas/ItemDetailEntry'
 *           description: 아이템 상세 정보
 *           
 *     ItemBuyResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: 구매 결과 메시지
 *           example: "아이템 구매 성공"
 *           
 *     UserItemResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *           example: true
 *         userItems:
 *           type: array
 *           description: 사용자 보유 아이템 목록
 *           items:
 *             $ref: '#/components/schemas/HoldItemEntry'
 */

/**
 * @swagger
 * /api/shopping/item_list:
 *  get:
 *    summary: 전체 아이템 목록을 조회
 *    tags: [Shopping]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: category
 *       schema:
 *         type: string
 *         enum:
 *           - font
 *           - paper
 *           - seal
 *       description: "조회할 아이템 카테고리 (font, paper, seal 중 하나)"
 *     - in: query
 *       name: num
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 10
 *       description: "조회할 아이템 개수"
 *    responses:
 *      200: 
 *        description: 아이템 목록 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ItemListResponse'
 *            example:
 *              success: true
 *              num: 2
 *              itemListEntry:
 *                - item_no: 1
 *                  name: "굴림"
 *                  price: 100
 *                  image: "https://example.com/item1.jpg"
 *                - item_no: 2
 *                  name: "고딕"
 *                  price: 100
 *                  image: "https://example.com/item2.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      500:
 *        description: 서버 내부 오류
 */
router.get('/item_list', 
  authenticateJWT,
  shoppingController.getItemList
);

/**
 * @swagger
 * /api/shopping/item_detail:
 *  get:
 *    summary: 아이템 상세정보 조회 (ID만 사용)
 *    tags: [Shopping]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: id
 *       schema:
 *         type: integer
 *         minimum: 1
 *       required: true
 *       description: "상세정보를 확인할 아이템의 고유 ID"
 *    responses:
 *      200: 
 *        description: 아이템 상세정보 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ItemDetailResponse'
 *            example:
 *              success: true
 *              itemDetailEntry:
 *                item_no: 1
 *                name: "굴림체"
 *                detail: "기본 굴림체 폰트입니다"
 *                price: 100
 *                image: "https://example.com/gulim.jpg"
 *      400:
 *        description: 잘못된 요청 (유효하지 않은 ID)
 *      404:
 *        description: 아이템을 찾을 수 없음
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/item_detail', 
  authenticateJWT,
  shoppingController.getItemDetail
);

/**
 * @swagger
 * /api/shopping/item_buy:
 *   post:
 *     summary: 아이템구매
 *     tags: [Shopping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - user_id
 *               - item_no
 *               - price
 *               - event
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [font, paper, seal]
 *                 description: 카테고리(font,paper,seal)
 *               user_id:
 *                 type: string
 *                 description: 사용자 ID
 *               item_no:
 *                 type: integer
 *                 description: 아이템 번호
 *               price:
 *                 type: integer
 *                 description: 가격
 *               event:
 *                 type: boolean
 *                 description: 이벤트 여부
 *           example:
 *             category: "font"
 *             user_id: "user123"
 *             item_no: 1
 *             price: 100
 *             event: false
 *     responses:
 *       200:
 *         description: 구매 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   $ref: '#/components/schemas/ItemBuyResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/item_buy',
  authenticateJWT,
  shoppingController.buyItem 
);

/**
 * @swagger
 * /api/shopping/user_item:
 *  get:
 *    summary: 사용자 보관함 - 구매한 아이템 목록 조회
 *    description: 현재 로그인한 사용자가 구매한 아이템들의 목록을 조회합니다. 아이템 이름, 카테고리, 가격, 구매일시 등의 상세 정보가 포함됩니다.
 *    tags: [Shopping]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: num
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *       description: "조회할 아이템 개수 (기본값: 전체)"
 *       example: 10
 *    responses:
 *      200: 
 *        description: 사용자 보유 아이템 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                resultType:
 *                  type: string
 *                  example: SUCCESS
 *                error:
 *                  type: null
 *                  example: null
 *                success:
 *                  $ref: '#/components/schemas/UserItemResponse'
 *            example:
 *              resultType: "SUCCESS"
 *              error: null
 *              success:
 *                success: true
 *                userItems:
 *                  - holditem_no: 1
 *                    category: "font"
 *                    item_no: 4
 *                    name: "Pretendard"
 *                    price: 0
 *                    user_id: "user123"
 *                    image: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/shopping/Pretendard.png"
 *                    description: "모아모아의 기본 서체로 누구나 편안하게 읽을 수 있습니다."
 *                    event: true
 *                    purchasedAt: "2024-01-15T10:30:00.000Z"
 *                  - holditem_no: 2
 *                    category: "seal"
 *                    item_no: 12
 *                    name: "한국 하트"
 *                    price: 0
 *                    user_id: "user123"
 *                    image: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/shopping/heart.png"
 *                    description: "빨간 하트로 사랑의 마음을 가장 직접적으로 전할 수 있습니다."
 *                    event: true
 *                    purchasedAt: "2024-01-14T15:20:00.000Z"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      401:
 *        description: 인증 필요 - 로그인이 필요합니다
 *      404:
 *        description: 사용자를 찾을 수 없음
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/user_item', 
  authenticateJWT,
  shoppingController.getUserItemList
);

export default router;