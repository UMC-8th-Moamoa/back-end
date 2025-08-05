import { catchAsync } from '../middlewares/errorHandler.js';
import { wishlistService } from '../services/wishlist.service.js';
import { naverShoppingService } from '../services/naverShopping.service.js';
import { naverBestProductsService } from '../services/naverBestProducts.service.js';

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
 *     summary: 위시리스트 등록 (네이버 쇼핑 API 크롤링 지원)
 *     description: |
 *       위시리스트를 등록합니다. 두 가지 방식을 지원합니다:
 *       
 *       1. **URL 자동 입력**: 상품 URL을 제공하면 네이버 쇼핑 API를 통해 자동으로 상품 정보를 크롤링합니다.
 *       2. **수동 입력**: 상품 정보를 직접 입력합니다.
 *       
 *       URL 자동 입력 시 다음과 같은 방식으로 검색어를 추출합니다:
 *       - URL 파라미터에서 query, q, keyword, search 등의 값 추출
 *       - URL 경로에서 상품명 추출
 *       - 도메인명에서 브랜드명 추출
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
 *               summary: 자동 입력 (네이버 쇼핑 API 크롤링)
 *               value:
 *                 insertType: "URL"
 *                 url: "https://shopping.naver.com/home/p/12345678"
 *                 isPublic: true
 *             쿠팡 URL:
 *               summary: 쿠팡 상품 URL 예시
 *               value:
 *                 insertType: "URL"
 *                 url: "https://www.coupang.com/vp/products/1234567890"
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

/**
 * @swagger
 * /api/wishlists/popular:
 *   get:
 *     summary: 네이버 쇼핑 베스트 상품 상위 10개 조회
 *     description: |
 *       네이버 쇼핑 베스트 상품 페이지를 직접 크롤링하여 실시간 인기 상품 상위 10개의 데이터를 가져옵니다.
 *       상품명, 상품가격, 상품이미지, 순위 데이터를 제공합니다.
 *       
 *       크롤링 방식:
 *       1. **Puppeteer**: 브라우저 자동화로 동적 콘텐츠 크롤링
 *       2. **Axios + Cheerio**: 정적 HTML 파싱 (빠른 대안)
 *       3. **더미 데이터**: 크롤링 실패 시 대체 데이터 제공
 *       
 *       실제 네이버 쇼핑 베스트 상품 페이지에서 데이터를 가져오므로 실시간 인기 상품을 확인할 수 있습니다.
 *     tags: [Wishlists]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: 가져올 상품 개수 (최대 20개)
 *         example: 10
 *     responses:
 *       200:
 *         description: 베스트 상품 목록 조회 성공
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
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                             description: 상품명
 *                           price:
 *                             type: integer
 *                             description: 상품 가격
 *                           productImageUrl:
 *                             type: string
 *                             description: 상품 이미지 URL
 *                           url:
 *                             type: string
 *                             description: 상품 페이지 URL
 *                           mallName:
 *                             type: string
 *                             description: 쇼핑몰명
 *                           rank:
 *                             type: integer
 *                             description: 베스트 상품 순위
 *                     total:
 *                       type: integer
 *                       description: 조회된 상품 개수
 *                     source:
 *                       type: string
 *                       description: 데이터 출처
 *                     crawledAt:
 *                       type: string
 *                       format: date-time
 *                       description: 크롤링 수행 시간
 *                     warning:
 *                       type: string
 *                       description: 경고 메시지 (더미 데이터 사용 시)
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 products:
 *                   - productName: "삼성 갤럭시 S24 Ultra 256GB"
 *                     price: 1570000
 *                     productImageUrl: "https://shopping-phinf.pstatic.net/..."
 *                     url: "https://shopping.naver.com/product/..."
 *                     mallName: "네이버쇼핑"
 *                     rank: 1
 *                   - productName: "애플 아이폰 15 Pro 128GB"
 *                     price: 1550000
 *                     productImageUrl: "https://shopping-phinf.pstatic.net/..."
 *                     url: "https://shopping.naver.com/product/..."
 *                     mallName: "네이버쇼핑"
 *                     rank: 2
 *                 total: 10
 *                 source: "네이버 쇼핑 베스트 상품"
 *                 crawledAt: "2025-08-05T12:34:56.789Z"
 *       400:
 *         description: 크롤링 실패
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
 *                       example: "CRAWLING_FAILED"
 *                     reason:
 *                       type: string
 *                       example: "베스트 상품 데이터를 가져올 수 없습니다"
 *                     data:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
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
 *                       example: "INTERNAL_ERROR"
 *                     reason:
 *                       type: string
 *                       example: "베스트 상품 조회 중 오류가 발생했습니다"
 *                 success:
 *                   type: null
 */
const getPopularProducts = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const requestedLimit = Math.min(parseInt(limit), 20); // 최대 20개로 제한

  try {
    console.log(`�️ 베스트 상품 ${requestedLimit}개 조회 요청`);
    
    // 네이버 쇼핑 베스트 상품 크롤링
    const products = await naverBestProductsService.getBestProducts(requestedLimit);
    
    if (!products || products.length === 0) {
      return res.error({
        errorCode: "NO_PRODUCTS_FOUND",
        reason: "베스트 상품을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
        data: { requestedLimit }
      });
    }

    // 응답 데이터 구성 (유효성 검사 추가)
    const responseProducts = products
      .filter(product => {
        // 유효한 상품명인지 검사 (최소 2글자 이상, 숫자만으로 구성된 이름 제외)
        const isValidName = product.productName && 
          product.productName.length >= 2 && 
          !['정가', '할인율', '원', '할인', '무료배송', '리뷰'].includes(product.productName) &&
          !/^[\d,\.원\s]+$/.test(product.productName) && // 숫자, 쉼표, 원만으로 구성된 이름 제외
          product.productName !== product.price.toString();
        
        // 유효한 가격인지 검사 (1000원 이상)
        const isValidPrice = product.price && product.price >= 1000;
        
        if (!isValidName) {
          console.log(`❌ 유효하지 않은 상품명: "${product.productName}"`);
        }
        if (!isValidPrice) {
          console.log(`❌ 유효하지 않은 가격: ${product.price}원`);
        }
        
        return isValidName && isValidPrice;
      })
      .map((product, index) => ({
        productName: product.productName,
        price: product.price,
        productImageUrl: product.productImageUrl || '',
        url: product.url || '',
        mallName: product.mallName || '네이버쇼핑',
        rank: index + 1,
        category: product.category || '기타'
      }));

    console.log(`✅ 유효한 베스트 상품 ${responseProducts.length}개 조회 완료`);
    
    // 유효한 상품이 없으면 에러 반환
    if (responseProducts.length === 0) {
      return res.error({
        errorCode: "NO_VALID_PRODUCTS",
        reason: "유효한 베스트 상품을 찾을 수 없습니다. API에서 올바르지 않은 데이터를 반환했습니다.",
        data: { 
          requestedLimit,
          rawProductsCount: products.length,
          invalidProducts: products.map(p => ({ name: p.productName, price: p.price }))
        }
      });
    }
    
    res.success({
      products: responseProducts,
      total: responseProducts.length,
      source: 'naver_api',
      categories: [...new Set(responseProducts.map(p => p.category))],
      crawledAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('베스트 상품 조회 실패:', error);
    
    return res.error({
      errorCode: "CRAWLING_FAILED",
      reason: error.message || "베스트 상품 조회 중 오류가 발생했습니다",
      data: { requestedLimit }
    });
  }
});

export const wishlistController = {
  createWishlist,
  getMyWishlists,
  updateWishlist,
  deleteWishlist,
  getPopularProducts
};
