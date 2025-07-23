import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import mypageController from '../controllers/mypage.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Mypage
 *     description: 마이페이지 API
 */
/**
 * @swagger
 * 
 * components:
 *   schemas:
 *     MyInfo:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: 사용자 ID
 *         name:
 *           type: string
 *           description: 사용자 이름
 *         birthday:
 *           type: date
 *           description: 사용자 생일
 *         followers_num:
 *           type: integer
 *           description: 팔로워 수
 *         following_num:
 *           type: integer
 *           description: 팔로잉 수
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
 */

/**
 * @swagger
 * /api/mypage/mapage_info:
 *  get:
 *    summary: 마이페이지 본인정보 확인
 *    tags: [mypage]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: user_id
 *       schema:
 *         type: string
 *       description: "조회할 아이디 (본인 아이디여야함)"
 *    responses:
 *      200: 
 *        description: 본인 상세정보 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/MyInfo'
 *            example:
 *              success: true
 *              MyInfo:
 *                - user_id: "lesly"
 *                  name: "박찬미"
 *                  birthday: "2005-11-25"
 *                  followers_num: 21
 *                  followings_num: 30
 *                  image: "https://example.com/item1.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
*       404:
 *        description: 일치하지 않는 사용자
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/mapage_info', 
  authenticateJWT,
  mypageController.getMyInfoList
);

export default router;
