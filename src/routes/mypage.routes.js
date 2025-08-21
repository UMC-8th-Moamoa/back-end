import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import mypageController from '../controllers/mypage.controller.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mypage
 *   description: 마이페이지 API
 */

/**
 * @swagger
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
 *           description: 상대가 나를 팔로우하는지 (is_follower)
 *         followings:
 *           type: boolean
 *           description: 내가 상대를 팔로우하는지 (is_following)
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
 *              followers: false
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
 * /api/mypage/profile-image:
 *   patch:
 *     summary: 프로필 이미지 업데이트
 *     description: 사용자가 S3에 업로드한 이미지 URL을 전달하면, 해당 이미지를 프로필 사진으로 저장
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 pattern: "^https?:\\/\\/.+\\.(jpg|jpeg|png|gif|bmp)$"
 *                 maxLength: 500
 *                 example: "https://s3.amazonaws.com/your-bucket/profile/1234.jpg"
 *                 description: S3에 업로드된 이미지의 URL (jpg, jpeg, png, gif, bmp 형식만 허용)
 *           example:
 *             imageUrl: "https://s3.amazonaws.com/your-bucket/profile/1234.jpg"
 *     responses:
 *       200:
 *         description: 프로필 이미지 업데이트 성공
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
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://s3.amazonaws.com/your-bucket/profile/1234.jpg"
 *                       description: 업데이트된 프로필 이미지 URL
 *                     message:
 *                       type: string
 *                       example: "프로필 이미지가 성공적으로 변경되었습니다."
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 imageUrl: "https://s3.amazonaws.com/your-bucket/profile/1234.jpg"
 *                 message: "프로필 이미지가 성공적으로 변경되었습니다."
 *       400:
 *         description: 잘못된 요청
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
 *                       example: "이미지 URL이 필요합니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *             examples:
 *               missing_url:
 *                 summary: 이미지 URL 누락
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B001"
 *                     reason: "이미지 URL이 필요합니다"
 *                     data: null
 *                   success: null
 *               invalid_format:
 *                 summary: 잘못된 URL 형식
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B001"
 *                     reason: "유효한 이미지 URL 형식이 아닙니다"
 *                     data: null
 *                   success: null
 *               invalid_extension:
 *                 summary: 지원하지 않는 파일 형식
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "B001"
 *                     reason: "jpg, jpeg, png, gif, bmp 형식의 이미지만 지원합니다"
 *                     data: null
 *                   success: null
 *       401:
 *         description: 인증 필요
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
 *         description: 사용자를 찾을 수 없음
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
 *                       example: "N002"
 *                     reason:
 *                       type: string
 *                       example: "사용자를 찾을 수 없습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *       500:
 *         description: 서버 내부 오류
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
router.patch('/profile-image',
  authenticateJWT,
  [
    body('imageUrl')
      .notEmpty()
      .withMessage('이미지 URL이 필요합니다')
      .isURL()
      .withMessage('유효한 URL 형식이어야 합니다')
      .matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|bmp)$/i)
      .withMessage('jpg, jpeg, png, gif, bmp 형식의 이미지만 지원합니다')
      .isLength({ max: 500 })
      .withMessage('URL은 500자를 초과할 수 없습니다')
      .custom((value) => {
        // XSS 방지를 위한 추가 검증
        if (value.includes('javascript:') || value.includes('data:')) {
          throw new Error('허용되지 않는 URL 형식입니다');
        }
        
        // AWS S3 URL 패턴 검증 (선택적 - 경고만 출력)
        const s3UrlPattern = /^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*$/;
        if (!s3UrlPattern.test(value)) {
          console.warn('S3 URL이 아닌 URL이 제공됨:', value);
          // 경고만 출력하고 통과시킴 (다른 스토리지 서비스도 허용)
        }
        
        return true;
      })
  ],
  // 유효성 검사 에러 처리 미들웨어
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "B001",
          reason: errors.array()[0].msg,
          data: errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg
          }))
        },
        success: null
      });
    }
    next();
  },
  mypageController.updateProfileImage
);

/**
 * @swagger
 * /api/mypage/customer_service:
 *   post:
 *     summary: 고객센터 문의 작성
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - privacyAgreed
 *             properties:
 *               title:
 *                 type: string
 *                 description: 문의 제목
 *                 example: "결제 내역이 확인되지 않습니다"
 *               content:
 *                 type: string
 *                 description: 문의 내용
 *                 example: "어제 카카오페이로 결제했는데 내역이 표시되지 않아요. 확인 부탁드립니다."
 *               privacyAgreed:
 *                 type: boolean
 *                 description: 개인정보 수집 동의 여부
 *                 example: true
 *     responses:
 *       201:
 *         description: 고객센터 문의 작성 성공
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
 *                     inquiry:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         title:
 *                           type: string
 *                           example: "결제 내역이 확인되지 않습니다"
 *                         content:
 *                           type: string
 *                           example: "어제 카카오페이로 결제했는데 내역이 표시되지 않아요. 확인 부탁드립니다."
 *                         userId:
 *                           type: string
 *                           example: "lesly_kim"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-08-15T10:30:00+09:00"
 *                     message:
 *                       type: string
 *                       example: "고객센터 문의가 성공적으로 등록되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
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
 * /api/mypage/customer_service:
 *   get:
 *     summary: 고객센터 문의 목록 조회
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수 (1-50)
 *     responses:
 *       200:
 *         description: 문의 목록 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/customer_service',
  authenticateJWT,
  mypageController.getCustomerServiceList
);

/**
 * @swagger
 * /api/mypage/customer_service/{inquiryId}:
 *   get:
 *     summary: 고객센터 문의 상세 조회
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 문의 ID
 *     responses:
 *       200:
 *         description: 문의 상세 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 문의 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/customer_service/:inquiryId',
  authenticateJWT,
  mypageController.getCustomerServiceDetail
);

/**
 * @swagger
 * /api/mypage/follow/request:
 *   post:
 *     summary: 팔로우 요청
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
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

/**
 * @swagger
 * /api/mypage/followers:
 *   get:
 *     summary: 내 팔로워 목록 조회
 *     description: 현재 로그인한 사용자를 팔로우하는 사용자들의 목록을 조회합니다.
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: 페이지 번호
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: 페이지당 항목 수
 *         example: 20
 *     responses:
 *       200:
 *         description: 팔로워 목록 조회 성공
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
 *                   example: "팔로워 목록 조회 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             description: 팔로워의 사용자 ID
 *                             example: "gold_user"
 *                           name:
 *                             type: string
 *                             description: 팔로워의 이름
 *                             example: "골드"
 *                           photo:
 *                             type: string
 *                             nullable: true
 *                             description: 팔로워의 프로필 사진 URL
 *                             example: "https://example.com/photo.jpg"
 *                           followed_at:
 *                             type: string
 *                             format: date-time
 *                             description: 팔로우한 날짜 (KST)
 *                             example: "2025-06-21T10:30:00+09:00"
 *                           is_following:
 *                             type: boolean
 *                             description: 내가 이 팔로워를 팔로우하는지 여부
 *                             example: true
 *                           is_mutual:
 *                             type: boolean
 *                             description: 맞팔 여부
 *                             example: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalCount:
 *                           type: integer
 *                           example: 55
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                         limit:
 *                           type: integer
 *                           example: 20
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "잘못된 페이지 매개변수입니다. (page >= 1, limit 1-50)"
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/followers',
  authenticateJWT,
  mypageController.getFollowersList
);

/**
 * @swagger
 * /api/mypage/followings:
 *   get:
 *     summary: 내 팔로잉 목록 조회
 *     description: 현재 로그인한 사용자가 팔로우하는 사용자들의 목록을 조회합니다.
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: 페이지 번호
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: 페이지당 항목 수
 *         example: 20
 *     responses:
 *       200:
 *         description: 팔로잉 목록 조회 성공
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
 *                   example: "팔로잉 목록 조회 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             description: 팔로잉하는 사용자의 ID
 *                             example: "chaoni_gold"
 *                           name:
 *                             type: string
 *                             description: 팔로잉하는 사용자의 이름
 *                             example: "금채원"
 *                           photo:
 *                             type: string
 *                             nullable: true
 *                             description: 팔로잉하는 사용자의 프로필 사진 URL
 *                             example: "https://example.com/photo.jpg"
 *                           followed_at:
 *                             type: string
 *                             format: date-time
 *                             description: 팔로우한 날짜 (KST)
 *                             example: "2025-06-21T10:30:00+09:00"
 *                           is_follower:
 *                             type: boolean
 *                             description: 이 사람이 나를 팔로우하는지 여부
 *                             example: true
 *                           is_mutual:
 *                             type: boolean
 *                             description: 맞팔 여부
 *                             example: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                         totalCount:
 *                           type: integer
 *                           example: 31
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                         limit:
 *                           type: integer
 *                           example: 20
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/followings',
  authenticateJWT,
  mypageController.getFollowingsList
);

/**
 * @swagger
 * /api/mypage/change_id:
 *   put:
 *     summary: 로그인용 사용자 ID 변경
 *     description: 마이페이지에서 현재 사용자의 로그인용 ID를 새로운 ID로 변경합니다. ID는 중복될 수 없으며, 특정 조건을 만족해야 합니다.
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newUserId
 *             properties:
 *               newUserId:
 *                 type: string
 *                 description: 새로운 로그인용 사용자 ID (4-20자, 영문/숫자/언더스코어만 허용)
 *                 pattern: "^[a-zA-Z0-9_]{4,20}$"
 *                 example: "new_user_id_2025"
 *           example:
 *             newUserId: "new_user_id_2025"
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
 *                     previousUserId:
 *                       type: string
 *                       description: 이전 사용자 ID
 *                       example: "chaon_gold"
 *                     newUserId:
 *                       type: string
 *                       description: 새로운 사용자 ID
 *                       example: "moa123"
 *                     message:
 *                       type: string
 *                       description: 성공 메시지
 *                       example: "사용자 ID가 성공적으로 변경되었습니다"
 *                     changedAt:
 *                       type: string
 *                       format: date-time
 *                       description: 변경 시간
 *                       example: "2025-08-13T10:30:00Z"
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 previousUserId: "chaon_gold"
 *                 newUserId: "moa123"
 *                 message: "사용자 ID가 성공적으로 변경되었습니다"
 *                 changedAt: "2025-08-13T10:30:00Z"
 *       400:
 *         description: 잘못된 요청
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
 *                       example: "V001"
 *                     reason:
 *                       type: string
 *                       example: "새로운 사용자 ID는 4-20자의 영문, 숫자, 언더스코어만 허용됩니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *             examples:
 *               invalid_format:
 *                 summary: 잘못된 ID 형식
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "V001"
 *                     reason: "새로운 사용자 ID는 4-20자의 영문, 숫자, 언더스코어만 허용됩니다"
 *                     data: null
 *                   success: null
 *               empty_user_id:
 *                 summary: ID 누락
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "V002"
 *                     reason: "새로운 사용자 ID를 입력해주세요"
 *                     data: null
 *                   success: null
 *               same_user_id:
 *                 summary: 동일한 ID
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "V003"
 *                     reason: "현재 ID와 동일합니다. 다른 ID를 입력해주세요"
 *                     data: null
 *                   success: null
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
 *       409:
 *         description: 중복된 사용자 ID
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
 *                       example: "D001"
 *                     reason:
 *                       type: string
 *                       example: "이미 사용 중인 사용자 ID입니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 *       500:
 *         description: 서버 내부 오류
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
 *                       example: "서버 내부 오류가 발생했습니다"
 *                     data:
 *                       type: null
 *                 success:
 *                   type: null
 */
router.put('/change_id', 
  authenticateJWT, 
  mypageController.changeUserId
);

/**
 * @swagger
 * /api/mypage/followings/{userId}/unfollow:
 *   delete:
 *     summary: 팔로잉 목록에서 특정 사용자 언팔로우
 *     description: 팔로잉 목록에서 특정 사용자를 언팔로우합니다.
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-zA-Z0-9_]{4,20}$"
 *         description: 언팔로우할 사용자 ID
 *         example: "chaoni_gold"
 *     responses:
 *       200:
 *         description: 언팔로우 성공
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
 *                   example: "팔로우가 취소되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_user_id:
 *                       type: string
 *                       example: "lesly"
 *                     target_user_id:
 *                       type: string
 *                       example: "chaoni_gold"
 *                     isFollowing:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.delete('/followings/:userId/unfollow',
  authenticateJWT,
  mypageController.deleteFollowing
);

/**
 * @swagger
 * /api/mypage/followers/{userId}/remove:
 *   delete:
 *     summary: 팔로워 제거 (차단 기능)
 *     description: |
 *       나를 팔로우하는 특정 사용자를 팔로워 목록에서 제거합니다. 
 *       이는 해당 사용자가 나에게 선물을 보내지 못하도록 하는 차단 기능입니다.
 *       
 *       **주의**: 이 기능은 상대방의 팔로우를 강제로 취소시킵니다.
 *     tags: [Mypage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-zA-Z0-9_]{4,20}$"
 *         description: 제거할 팔로워의 사용자 ID
 *         example: "annoying_user"
 *     responses:
 *       200:
 *         description: 팔로워 제거 성공
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
 *                   example: "팔로워가 제거되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_user_id:
 *                       type: string
 *                       description: 현재 사용자 ID
 *                       example: "lesly"
 *                     removed_follower_id:
 *                       type: string
 *                       description: 제거된 팔로워 사용자 ID
 *                       example: "annoying_user"
 *                     isFollower:
 *                       type: boolean
 *                       description: 팔로워 상태 (제거 후 false)
 *                       example: false
 *             example:
 *               success: true
 *               message: "팔로워가 제거되었습니다."
 *               data:
 *                 current_user_id: "lesly"
 *                 removed_follower_id: "annoying_user"
 *                 isFollower: false
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               invalid_user_id:
 *                 summary: 잘못된 사용자 ID
 *                 value:
 *                   success: false
 *                   message: "유효하지 않은 사용자 ID입니다. (4-20자, 영문/숫자/언더스코어만 허용)"
 *               self_remove:
 *                 summary: 자기 자신 제거 시도
 *                 value:
 *                   success: false
 *                   message: "자기 자신을 팔로워에서 제거할 수 없습니다."
 *               not_follower:
 *                 summary: 팔로워가 아닌 사용자
 *                 value:
 *                   success: false
 *                   message: "해당 사용자가 나를 팔로우하지 않습니다."
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.delete('/followers/:userId/remove',
  authenticateJWT,
  mypageController.removeFollower
);

export default router;