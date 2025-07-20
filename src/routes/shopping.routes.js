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
 *           type: string
 *           description: 아이템 고유 번호
 *         user_id:
 *           type: integer
 *           description: 사용자 ID
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
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
 *           type: array
 *           description: 아이템 목록
 *           items:
 *             $ref: '#/components/schemas/ItemDetailEntry'
 *     ItemBuyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *           example: true
 *         itemDetailEntry:
 *           type: array
 *           description: 아이템 목록
 *           items:
 *             $ref: '#/components/schemas/HoldItemEntry'
 *     UserItemResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *           example: true
 *         itemDetailEntry:
 *           type: array
 *           description: 아이템 목록
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
 *           - envelope
 *       description: "조회할 아이템 카테고리 (font, paper, envelope 중 하나)"
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
 *    summary: 하나의 아이템 상세보기
 *    tags: [Shopping]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: category
 *       schema:
 *         type: string
 *         enum:
 *            - font
 *            - paper
 *            - envelope
 *       description: "조회할 아이템 카테고리 (font, paper, envelope 중 하나)"
 *     - in: query
 *       name: id
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 20
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
 *                - item_no: 1
 *                  name: "굴림"
 *                  detail: "굴림체입니다"
 *                  price: 100
 *                  image: "https://example.com/item1.jpg"
 *                - item_no: 2
 *                  name: "고딕"
 *                  detail: "고딕체입니다"
 *                  price: 100
 *                  image: "https://example.com/item2.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/item_detail', 
  authenticateJWT,
  shoppingController.getItemList
);

/**
 * @swagger
 * /api/shopping/item_buy:
 *   post:
 *     summary: 아이템구매
 *     tags: [Auth]
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
 *                 description: 카테고리(font,paper,envelope)
 *               user_id:
 *                 type: string
 *                 minLength: 
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
 *     responses:
 *       201:
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
 *      
 */
router.post('/item_buy',
  authenticateJWT,
  shoppingController.buyItem 
);

/**
 * @swagger
 * /api/shopping/user_item:
 *  get:
 *    summary: 구매한 아이템 상세보기
 *    tags: [Shopping]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: num
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 10
 *       description: "페이징"
 *    responses:
 *      200: 
 *        description: 구매한 아이템 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/HoldItemEntry'
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/user_item', 
  authenticateJWT,
  shoppingController.getUserItemList
);
export default router;