import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import mypageController from '../controllers/mypage.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mypage
 *   description: 마이페이지 API
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
 *           type: string
 *           format: date
 *           description: 사용자 생일
 *         followers_num:
 *           type: integer
 *           description: 팔로워 수
 *         followings_num:
 *           type: integer
 *           description: 팔로잉 수
 *         image:
 *           type: string
 *           description: 사진 URL
 *     MyInfoChange:
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
 *         email:
 *           type: string
 *           description: 이메일
 *         phone:
 *           type: string
 *           description: 전화번호
 *         image:
 *           type: string
 *           description: 아이템 사진 URL
 *     OtherInfo:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: 사용자 ID
 *         name:
 *           type: string
 *           description: 사용자 이름
 *         birthday:
 *           type: string
 *           format: date
 *           description: 사용자 생일
 *         followers_num:
 *           type: integer
 *           description: 팔로워 수
 *         followings_num:
 *           type: integer
 *           description: 팔로잉 수
 *         followers:
 *           type: boolean
 *           description: 나와의 팔로워 여부
 *         followings:
 *           type: boolean
 *           description: 나와의 팔로잉 여부
 *         image:
 *           type: string
 *           description: 사진 URL
 */

/**
 * @swagger
 * /api/mypage/mypage_info:
 *  get:
 *    summary: 마이페이지 본인정보 확인
 *    tags: [Mypage]
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
 *              user_id: "lesly"
 *              name: "박찬미"
 *              birthday: "2005-11-25"
 *              followers_num: 21
 *              followings_num: 30
 *              image: "https://example.com/item1.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      404:
 *        description: 일치하지 않는 사용자
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/mypage_info', 
  authenticateJWT,
  mypageController.getMyInfoList
);


/**
 * @swagger
 * /api/mypage/mypagechange_info:
 *  get:
 *    summary: 사용자 수정 페이지 확인
 *    tags: [Mypage]
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
 *        description: 본인 수정 페이지 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/MyInfoChange'
 *            example:
 *              success: true
 *              user_id: "lesly"
 *              name: "박찬미"
 *              birthday: "2005-11-25"
 *              email: "cksal1052@ewha.ac.kr"
 *              phone: "010-1234-5678"
 *              image: "https://example.com/item1.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      404:
 *        description: 일치하지 않는 사용자
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/mypagechange_info', 
  authenticateJWT,
  mypageController.getMyInfoChangeList
);

/**
 * @swagger
 * /api/mypage/otherpage_info:
 *  get:
 *    summary: 마이페이지 다른사람 확인
 *    tags: [Mypage]
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: user_id
 *       schema:
 *         type: string
 *       description: "조회할 아이디 (다른사람 아이디여야함)"
 *    responses:
 *      200: 
 *        description: 다른사람 상세정보 조회 성공
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/OtherInfo'
 *            example:
 *              success: true
 *              user_id: "lesly"
 *              name: "박찬미"
 *              birthday: "2005-11-25"
 *              followers_num: 21
 *              followings_num: 30
 *              followers: 21
 *              followings: true
 *              image: "https://example.com/item1.jpg"
 *      400:
 *        description: 잘못된 요청 (예 유효하지 않은 쿼리 파라미터 등)
 *      404:
 *        description: 일치하지 않는 사용자
 *      500:
 *        description: 서버 내부 오류
 */

router.get('/otherpage_info', 
  authenticateJWT,
  mypageController.getOtherInfoList
);

/**
 * @swagger
 * /api/shopping/choose_keyword:
 *   post:
 *     summary: 키워드 선택
 *     tags: [Mypage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - keyword
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 사용자 ID
 *               keyword:
 *                 type: array
 *                 items:
 *                   type: array
 *                 description: 키워드 내용
 *     responses:
 *       201:
 *         description: 키워드 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: 
 *                     success: true
 *                     user_id: "lesly"
 *                     keyword: ["먹거리", "주얼리", "옷"]
 *       400:
 *         description: 잘못된 요청
 *      
 */
router.post('/choose_keyword',
  authenticateJWT,
  mypageController.chooseKeyword
);


/**
 * @swagger
 * /api/shopping/block_user:
 *   post:
 *     summary: 사용자 차단
 *     tags: [Mypage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - keyword
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 사용자 ID
 *               target_id:
 *                 type: string
 *                 description: 차단할 상대 ID
 *               reason:
 *                 type: string
 *                 description: 차단하는 이유
 *     responses:
 *       201:
 *         description: 키워드 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: 
 *                     success: true
 *                     message: "차단이 완료되었습니다"
 *                     user_id: "lesly"
 *                     target_id: "minwoo123"
 *                     reason: "스팸 메시지를 보냄"
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 사용자 또는 대상 사용자 ID를 찾을 수 없음
 *       409:
 *         description: 이미 차단된 사용자
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/block_user',
  authenticateJWT,
  mypageController.blockUser
);

/**
 * @swagger
 * /api/customer_service:
 *   post:
 *     summary: 고객센터 글 등록
 *     tags: [Mypage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - title
 *               - content
 *               - private
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 작성자 ID
 *               title:
 *                 type: string
 *                 description: 고객센터 제목
 *               content:
 *                 type: string
 *                 description: 고객센터 내용
 *               private:
 *                 type: boolean
 *                 description: 비공개 여부
 *     responses:
 *       201:
 *         description: 고객센터 글 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "고객센터 글이 성공적으로 등록되었습니다."
 *                 service:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "lesly"
 *                       title:
 *                         type: string
 *                         example: "결제 내역이 확인되지 않습니다"
 *                       content:
 *                         type: string
 *                         example: "어제 결제했는데 내역이 표시되지 않아요."
 *                       category:
 *                         type: string
 *                         example: "결제"
 *                       private:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 사용자 정보를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/customer_service',
  authenticateJWT,
  mypageController.postCustomerService
);

/**
 * @swagger
 * /api/follow/request:
 *   post:
 *     summary: 팔로우 요청
 *     tags: [Mypage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - target_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 요청하는 사용자 ID
 *               target_id:
 *                 type: string
 *                 description: 팔로우 대상 사용자 ID
 *     responses:
 *       201:
 *         description: 팔로우 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "팔로우 요청이 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "lesly"
 *                     target_id:
 *                       type: string
 *                       example: "minwoo123"
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 대상 사용자를 찾을 수 없음
 *       409:
 *         description: 이미 팔로우한 사용자
 *       500:
 *         description: 서버 내부 오류
 */


router.post('/follow/request',
  authenticateJWT,
  mypageController.postFollowRequest
);


export default router;