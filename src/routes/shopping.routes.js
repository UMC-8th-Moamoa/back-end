import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import shoppingController from '../controllers/shopping.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shopping
 *   description: 아이템 쇼핑 API
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
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
 *         item:
 *           type: array # 'item'은 배열
 *           description: 아이템 목록
 *           items:
 *             $ref: '#/components/schemas/Item'
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
 *            - font
 *            - paper
 *            - envelope
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
 *              item:
 *                - item_no: 1
 *                    name: "굴림"
 *                    price: 100
 *                    image: "https://example.com/item1.jpg"
 *                - item_no: 2
 *                    name: "고딕"
 *                    price: 100
 *                    image: "https://example.com/item2.jpg"
 *      400:
 *      description: 잘못된 요청 (예: 유효하지 않은 쿼리 파라미터 등)
 * 
 *      500:
 *      description: 서버 내부 오류
 */
router.get('/item_list', 
  shoppingController.getShoppingItems
);

export default router;