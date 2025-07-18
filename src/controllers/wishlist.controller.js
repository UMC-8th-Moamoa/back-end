import { catchAsync } from '../middlewares/errorHandler.js';
import { wishlistService } from '../services/wishlist.service.js';

/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: 위시리스트 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistCreateURL:
 *       type: object
 *       required:
 *         - insertType
 *         - url
 *         - isPublic
 *       properties:
 *         insertType:
 *           type: string
 *           enum: [URL]
 *           description: 입력 타입
 *         url:
 *           type: string
 *           format: uri
 *           description: 크롤링할 상품 URL
 *         isPublic:
 *           type: boolean
 *           description: 공개 여부
 *     WishlistCreateIMAGE:
 *       type: object
 *       required:
 *         - insertType
 *         - productName
 *         - price
 *         - imageUrl
 *         - isPublic
 *       properties:
 *         insertType:
 *           type: string
 *           enum: [IMAGE]
 *           description: 입력 타입
 *         productName:
 *           type: string
 *           maxLength: 100
 *           description: 상품명
 *         price:
 *           type: integer
 *           minimum: 1000
 *           maximum: 10000000
 *           description: 상품 가격
 *         imageUrl:
 *           type: string
 *           format: uri
 *           maxLength: 255
 *           description: S3 업로드 후 받은 public URL
 *         isPublic:
 *           type: boolean
 *           description: 공개 여부
 *     WishlistResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 위시리스트 ID
 *         userId:
 *           type: integer
 *           description: 사용자 ID
 *         productName:
 *           type: string
 *           description: 상품명
 *         price:
 *           type: integer
 *           description: 상품 가격
 *         productImageUrl:
 *           type: string
 *           description: 상품 이미지 URL
 *         fundingActive:
 *           type: boolean
 *           description: 펀딩 활성화 여부
 *         isPublic:
 *           type: boolean
 *           description: 공개 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 */

/**
 * @swagger
 * /api/wishlists:
 *   post:
 *     summary: 위시리스트 등록
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/WishlistCreateURL'
 *               - $ref: '#/components/schemas/WishlistCreateIMAGE'
 *           examples:
 *             URL 입력:
 *               summary: 자동 입력 (URL 크롤링)
 *               value:
 *                 insertType: "URL"
 *                 url: "https://www.example.com/product/airpods"
 *                 isPublic: true
 *             IMAGE 입력:
 *               summary: 수동 입력 (직접 입력)
 *               value:
 *                 insertType: "IMAGE"
 *                 productName: "애플 에어팟 프로"
 *                 price: 329000
 *                 imageUrl: "https://cdn.mysite.com/uploads/airpods.png"
 *                 isPublic: false
 *     responses:
 *       201:
 *         description: 위시리스트 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistResponse'
 *             example:
 *               id: 42
 *               userId: 5
 *               productName: "애플 에어팟 프로"
 *               price: 329000
 *               productImageUrl: "https://cdn.mysite.com/uploads/airpods.png"
 *               fundingActive: false
 *               isPublic: false
 *               createdAt: "2025-07-14T13:00:00.123Z"
 *               updatedAt: "2025-07-14T13:00:00.123Z"
 *       400:
 *         description: 필수값 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "insertType is required"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       422:
 *         description: 크롤링 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch product data from url"
 */
const createWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const wishlistData = req.body;

  try {
    const wishlist = await wishlistService.createWishlist(userId, wishlistData);
    res.status(201).json(wishlist);
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({ message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

/**
 * @swagger
 * /api/wishlists/{id}:
 *   patch:
 *     summary: 위시리스트 수정
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 위시리스트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 maxLength: 100
 *                 description: 상품명
 *               price:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 10000000
 *                 description: 상품 가격
 *               productImageUrl:
 *                 type: string
 *                 format: uri
 *                 maxLength: 255
 *                 description: 상품 이미지 URL
 *               isPublic:
 *                 type: boolean
 *                 description: 공개 여부
 *     responses:
 *       200:
 *         description: 위시리스트 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistResponse'
 *       400:
 *         description: 잘못된 입력 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (본인의 위시리스트가 아님)
 *       404:
 *         description: 위시리스트를 찾을 수 없음
 */
const updateWishlist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  try {
    const updatedWishlist = await wishlistService.updateWishlist(parseInt(id), userId, updateData);
    res.json(updatedWishlist);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

/**
 * @swagger
 * /api/wishlists/{id}:
 *   delete:
 *     summary: 위시리스트 삭제
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 위시리스트 ID
 *     responses:
 *       200:
 *         description: 위시리스트 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 위시리스트가 정상적으로 삭제되었습니다.
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (본인의 위시리스트가 아님)
 *       404:
 *         description: 위시리스트를 찾을 수 없음
 */
const deleteWishlist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await wishlistService.deleteWishlist(parseInt(id), userId);
    res.json({ 
      message: "위시리스트가 정상적으로 삭제되었습니다." 
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

/**
 * @swagger
 * /api/wishlists:
 *   get:
 *     summary: 나의 위시리스트 목록 조회
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, price_desc, price_asc]
 *           default: created_at
 *         description: 정렬 기준
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private]
 *         description: 공개 범위 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 페이지 크기
 *     responses:
 *       200:
 *         description: 위시리스트 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 위시리스트 ID
 *                       productName:
 *                         type: string
 *                         description: 상품명
 *                       price:
 *                         type: integer
 *                         description: 상품 가격
 *                       productImageUrl:
 *                         type: string
 *                         description: 상품 이미지 URL
 *                 page:
 *                   type: integer
 *                   description: 현재 페이지 번호
 *                 size:
 *                   type: integer
 *                   description: 페이지당 데이터 개수
 *                 totalPages:
 *                   type: integer
 *                   description: 전체 페이지 수
 *                 totalElements:
 *                   type: integer
 *                   description: 전체 데이터 수
 *       401:
 *         description: 인증 실패
 */
const getMyWishlists = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { sort = 'created_at', visibility, page = 1, size = 10 } = req.query;

  try {
    const result = await wishlistService.getMyWishlists(userId, {
      sort,
      visibility,
      page: parseInt(page),
      size: parseInt(size)
    });
    
    res.json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

export const wishlistController = {
  createWishlist,
  getMyWishlists,
  updateWishlist,
  deleteWishlist
};
