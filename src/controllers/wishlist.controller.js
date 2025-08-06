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

/**
 * @swagger
 * /api/wishlists/analyze:
 *   post:
 *     summary: 이미지 분석을 통한 상품 추천 및 위시리스트 자동 등록
 *     description: |
 *       업로드된 이미지를 AI로 분석하여 상품명을 추출하고, 
 *       네이버 쇼핑 API를 통해 관련 상품을 추천한 후 자동으로 위시리스트에 등록합니다.
 *       
 *       처리 과정:
 *       1. **이미지 분석**: BLIP2 AI 모델을 통해 이미지 캡션 생성
 *       2. **번역**: 영어 캡션을 한국어로 번역
 *       3. **키워드 추출**: 핵심 키워드 2-3개 추출
 *       4. **상품 검색**: 네이버 쇼핑 API로 관련 상품 검색
 *       5. **자동 등록**: 검색 성공 시 위시리스트에 자동 저장
 *       6. **결과 반환**: 위시리스트 정보 및 분석 결과 제공
 *       
 *       **주의사항**: 검색 결과가 없으면 위시리스트에 저장되지 않습니다.
 *     tags: [Wishlists]
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
 *                 description: 분석할 이미지의 URL (S3 업로드 후 받은 URL)
 *                 example: "https://your-s3-bucket.s3.amazonaws.com/uploads/image.jpg"
 *           examples:
 *             신발 이미지:
 *               summary: 신발 이미지 분석 예시
 *               value:
 *                 imageUrl: "https://example-bucket.s3.amazonaws.com/shoes.jpg"
 *             의류 이미지:
 *               summary: 의류 이미지 분석 예시
 *               value:
 *                 imageUrl: "https://example-bucket.s3.amazonaws.com/tshirt.jpg"
 *     responses:
 *       200:
 *         description: 이미지 분석 및 상품 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 caption_en:
 *                   type: string
 *                   description: AI가 생성한 영어 캡션
 *                   example: "white nike running shoes"
 *                 caption_ko:
 *                   type: string
 *                   description: 한국어로 번역된 캡션
 *                   example: "흰색 나이키 운동화"
 *                 extractedKeywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: AI 캡션에서 추출된 핵심 키워드들 (3-5개)
 *                   example: ["나이키", "운동화", "흰색"]
 *                 result:
 *                   type: object
 *                   description: 추천 상품 정보
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: 상품명
 *                       example: "나이키 에어맥스 90 화이트"
 *                     price:
 *                       type: string
 *                       description: 상품 가격
 *                       example: "129000"
 *                     image:
 *                       type: string
 *                       description: 상품 이미지 URL
 *                       example: "https://shopping-phinf.pstatic.net/main_123456/12345678.jpg"
 *                     link:
 *                       type: string
 *                       description: 상품 상세 페이지 링크
 *                       example: "https://shopping.naver.com/catalog/12345678"
 *                     mallName:
 *                       type: string
 *                       description: 쇼핑몰명
 *                       example: "네이버쇼핑"
 *                 searchKeyword:
 *                   type: string
 *                   description: 실제 네이버 쇼핑 검색에 사용된 키워드 (추출된 핵심 키워드들의 조합)
 *                   example: "나이키 운동화 흰색"
 *                 analyzedAt:
 *                   type: string
 *                   format: date-time
 *                   description: 분석 수행 시간
 *                   example: "2025-08-06T10:30:00.000Z"
 *             example:
 *               caption_en: "white nike running shoes"
 *               caption_ko: "흰색 나이키 운동화"
 *               extractedKeywords: ["나이키", "운동화", "흰색"]
 *               result:
 *                 title: "나이키 에어맥스 90 화이트"
 *                 price: "129000"
 *                 image: "https://shopping-phinf.pstatic.net/main_123456/12345678.jpg"
 *                 link: "https://shopping.naver.com/catalog/12345678"
 *                 mallName: "네이버쇼핑"
 *               searchKeyword: "나이키 운동화 흰색"
 *               analyzedAt: "2025-08-06T10:30:00.000Z"
 *       400:
 *         description: 잘못된 요청 (imageUrl 누락 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "imageUrl is required"
 *             examples:
 *               imageUrl 누락:
 *                 summary: imageUrl이 제공되지 않은 경우
 *                 value:
 *                   error: "imageUrl is required"
 *               잘못된 URL:
 *                 summary: 유효하지 않은 imageUrl인 경우
 *                 value:
 *                   error: "Invalid imageUrl format"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "AI 분석 서버에 연결할 수 없습니다"
 *             examples:
 *               AI 서버 연결 실패:
 *                 summary: BLIP2 AI 서버 연결 실패
 *                 value:
 *                   error: "AI 분석 서버에 연결할 수 없습니다"
 *               네이버 API 오류:
 *                 summary: 네이버 쇼핑 API 오류
 *                 value:
 *                   error: "상품 검색 중 오류가 발생했습니다"
 *               일반 서버 오류:
 *                 summary: 기타 서버 오류
 *                 value:
 *                   error: "서버 에러"
 */
const getPopularProducts = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const requestedLimit = Math.min(parseInt(limit), 20); // 최대 20개로 제한

  try {
    console.log(`🛍️ 베스트 상품 ${requestedLimit}개 조회 요청`);
    
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

// 한국어 캡션에서 핵심 키워드 추출 함수
const extractKeywords = (caption) => {
  if (!caption || typeof caption !== 'string') {
    return [];
  }

  // 1. 기본 전처리 및 중복 구문 제거
  let processed = caption
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'()[\]{}]/g, ' ') // 특수문자 제거
    .replace(/\s+/g, ' '); // 연속된 공백을 하나로

  // 1-1. 중복되는 구문 패턴 제거 (예: "축구 유니폼, 축구 유니폼, 축구 유니폼" -> "축구 유니폼")
  const phrases = processed.split(',').map(p => p.trim()).filter(p => p.length > 0);
  const uniquePhrases = [...new Set(phrases)];
  processed = uniquePhrases.join(' ');

  // 2. 불용어 리스트 확장
  const stopWords = new Set([
    // 기본 불용어
    '이', '그', '저', '것', '들', '의', '가', '을', '를', '에', '와', '과', '도', '로', '으로',
    '는', '은', '이다', '있다', '없다', '하다', '되다', '같다', '다른', '새로운', '좋은', '나쁜',
    '크다', '작다', '많다', '적다', '높다', '낮다', '빠르다', '느리다', '예쁘다', '못생기다',
    '있는', '없는', '하는', '되는', '같은', '다른', '새로운', '오래된', '깨끗한', '더러운',
    '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
    '개', '명', '마리', '병', '잔', '그릇', '접시', '상자', '봉지', '포장',
    '매우', '정말', '진짜', '너무', '아주', '꽤', '상당히', '조금', '약간', '살짝',
    '위에', '아래에', '옆에', '앞에', '뒤에', '안에', '밖에', '사이에', '근처에',
    '그리고', '또한', '하지만', '그러나', '따라서', '그래서', '왜냐하면', '만약', '비록',
    // AI 캡션에서 자주 나오는 불필요한 단어들
    '더', '키트', '킷', '유닛', '것들', '아이템', '제품', '상품', '물건'
  ]);

  // 3. 단어 분리 및 필터링
  const words = processed
    .split(' ')
    .filter(word => {
      return word.length >= 2 && // 2글자 이상
             !stopWords.has(word) && // 불용어가 아님
             !/^\d+$/.test(word) && // 숫자만으로 구성되지 않음
             !/^[a-zA-Z]+$/.test(word); // 영어만으로 구성되지 않음 (한국어 키워드 우선)
    });

  // 4. 중복 제거
  const uniqueWords = [...new Set(words)];

  // 5. 브랜드명과 카테고리별 우선순위 키워드 확장
  const brandKeywords = new Set([
    // 스포츠 브랜드
    '나이키', '아디다스', '뉴발란스', '컨버스', '반스', '푸마', '아식스', '리복',
    // 축구팀 (브랜드급 인지도)
    '토트넘', '맨유', '맨시티', '아스널', '첼시', '리버풀', '바르샤', '레알', '바이에른', 'psg',
    '맨체스터', '레알마드리드', '바르셀로나', '파리생제르맹', '유벤투스', '밀란', '인터밀란',
    // 테크 브랜드
    '삼성', '애플', 'lg', '아이폰', '갤럭시', '맥북', '아이패드',
    // 패션 브랜드
    '구찌', '샤넬', '루이비통', '프라다', '에르메스', '디올', '발렌시아가'
  ]);
  
  const categoryKeywords = new Set([
    // 의류 카테고리
    '유니폼', '저지', '셔츠', '티셔츠', '후드', '맨투맨', '니트', '가디건', '조끼',
    '바지', '치마', '원피스', '자켓', '코트', '패딩', '점퍼',
    // 신발 카테고리
    '신발', '운동화', '구두', '샌들', '부츠', '슬리퍼', '하이힐', '로퍼',
    // 액세서리 카테고리
    '가방', '백팩', '토트백', '크로스백', '클러치', '지갑', '벨트',
    '시계', '목걸이', '반지', '귀걸이', '팔찌', '선글라스', '모자',
    // 스포츠 관련
    '축구', '농구', '야구', '테니스', '골프', '러닝', '헬스', '요가',
    // 디지털 카테고리
    '노트북', '컴퓨터', '마우스', '키보드', '모니터', '스피커', '헤드폰',
    '스마트폰', '휴대폰', '태블릿', '이어폰', '충전기', '케이스'
  ]);

  const colorKeywords = new Set([
    '빨간', '파란', '노란', '초록', '보라', '분홍', '주황', '갈색',
    '검은', '흰', '회색', '베이지', '네이비', '카키', '민트', '라벤더',
    '빨강', '파랑', '노랑', '초록색', '보라색', '분홍색', '주황색', '갈색',
    '검정', '하양', '회색', '베이지색', '네이비색', '카키색', '원정', '홈'
  ]);

  // 6. 스마트 키워드 조합 생성
  const smartCombinations = [];
  
  // 브랜드 + 카테고리 조합 찾기
  const brands = uniqueWords.filter(word => brandKeywords.has(word));
  const categories = uniqueWords.filter(word => categoryKeywords.has(word));
  const colors = uniqueWords.filter(word => colorKeywords.has(word));
  
  // 우선순위 1: 브랜드 + 대표 카테고리
  if (brands.length > 0 && categories.length > 0) {
    const mainBrand = brands[0];
    const mainCategory = categories[0];
    smartCombinations.push(`${mainBrand} ${mainCategory}`);
    
    // 색상이 있으면 추가
    if (colors.length > 0) {
      smartCombinations.push(colors[0]);
    }
  }
  // 우선순위 2: 카테고리만 있는 경우
  else if (categories.length > 0) {
    smartCombinations.push(categories[0]);
    
    // 일반적인 수식어가 있으면 추가
    const modifiers = uniqueWords.filter(word => 
      !categoryKeywords.has(word) && 
      !brandKeywords.has(word) && 
      !colorKeywords.has(word) &&
      word.length > 1
    );
    
    if (modifiers.length > 0) {
      smartCombinations.push(modifiers[0]);
    }
    
    if (colors.length > 0) {
      smartCombinations.push(colors[0]);
    }
  }
  // 우선순위 3: 일반적인 키워드 추출
  else {
    // 길이 순으로 정렬해서 의미있는 단어들 선택
    const sortedWords = uniqueWords
      .filter(word => word.length >= 2)
      .sort((a, b) => b.length - a.length);
    
    smartCombinations.push(...sortedWords.slice(0, 3));
  }

  // 7. 최종 키워드 선택 (2-3개로 제한하여 더 정확한 검색)
  const finalKeywords = smartCombinations
    .filter(keyword => keyword && keyword.trim().length > 0)
    .slice(0, 3); // 최대 3개로 제한

  // 8. 최소 1개는 보장
  if (finalKeywords.length === 0 && uniqueWords.length > 0) {
    finalKeywords.push(uniqueWords[0]);
  }

  console.log(`💡 개선된 키워드 추출 과정:`);
  console.log(`   원본: "${caption}"`);
  console.log(`   중복 제거 후: "${processed}"`);
  console.log(`   브랜드: [${brands.join(', ')}]`);
  console.log(`   카테고리: [${categories.join(', ')}]`);
  console.log(`   색상: [${colors.join(', ')}]`);
  console.log(`   스마트 조합: [${smartCombinations.join(', ')}]`);
  console.log(`   최종 키워드: [${finalKeywords.join(', ')}]`);

  return finalKeywords;
};

const analyzeImage = catchAsync(async (req, res) => {
  const { imageUrl, isPublic = false } = req.body;
  const userId = req.user.id;

  try {
    // 1. 필수 파라미터 검증
    if (!imageUrl) {
      return res.status(400).json({ 
        error: "imageUrl is required" 
      });
    }

    // 2. URL 형식 검증
    try {
      new URL(imageUrl);
    } catch (urlError) {
      return res.status(400).json({ 
        error: "Invalid imageUrl format" 
      });
    }

    console.log(`🔍 이미지 분석 시작: ${imageUrl} (사용자 ID: ${userId})`);

    // 3. BLIP2 AI 서버에 이미지 분석 요청
    const BLIP2_SERVER_URL = process.env.BLIP2_SERVER_URL || 'http://localhost:5000';
    
    let aiResponse;
    try {
      const axios = await import('axios').then(module => module.default);
      aiResponse = await axios.post(`${BLIP2_SERVER_URL}/caption`, {
        image_url: imageUrl,
      }, {
        timeout: 30000, // 30초 타임아웃
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (aiError) {
      console.error('AI 분석 서버 연결 실패:', aiError.message);
      return res.status(500).json({ 
        error: "AI 분석 서버에 연결할 수 없습니다" 
      });
    }

    const { caption_en, caption_ko } = aiResponse.data;
    
    if (!caption_ko) {
      console.error('AI 분석 결과에서 한국어 캡션을 찾을 수 없음');
      return res.status(500).json({ 
        error: "이미지 분석 결과를 처리할 수 없습니다" 
      });
    }

    console.log(`🤖 AI 분석 완료 - EN: "${caption_en}", KO: "${caption_ko}"`);

    // 4. 한국어 캡션에서 핵심 키워드 추출
    const extractedKeywords = extractKeywords(caption_ko);
    const searchKeyword = extractedKeywords.join(' ').trim();
    
    console.log(`🔍 추출된 키워드: [${extractedKeywords.join(', ')}]`);
    console.log(`🔎 검색어: "${searchKeyword}"`);

    // 5. 네이버 쇼핑 API로 상품 검색
    const query = encodeURIComponent(searchKeyword);
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.error('네이버 API 키가 설정되지 않음');
      return res.status(500).json({ 
        error: "상품 검색 서비스가 설정되지 않았습니다" 
      });
    }

    let naverResponse;
    try {
      const axios = await import('axios').then(module => module.default);
      naverResponse = await axios.get(
        `https://openapi.naver.com/v1/search/shop.json?query=${query}&display=10&sort=sim`,
        {
          headers: {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
          },
          timeout: 10000, // 10초 타임아웃
        }
      );
    } catch (naverError) {
      console.error('네이버 쇼핑 API 호출 실패:', naverError.message);
      return res.status(500).json({ 
        error: "상품 검색 중 오류가 발생했습니다" 
      });
    }

    const items = naverResponse.data.items || [];
    
    // 6. 검색 결과가 없으면 위시리스트에 저장하지 않고 분석 결과만 반환
    if (items.length === 0) {
      console.log(`🚫 검색 결과 없음: "${searchKeyword}" - 위시리스트에 저장하지 않음`);
      return res.status(200).json({
        success: false,
        message: "검색 결과가 없으므로, 위시리스트에 저장되지 않았습니다",
        analysisData: {
          caption_en,
          caption_ko,
          extractedKeywords,
          searchKeyword,
          analyzedAt: new Date().toISOString()
        }
      });
    }

    // 7. 가장 관련성 높은 상품 선택 (첫 번째 결과)
    const bestItem = items[0];
    
    // HTML 태그 제거 함수
    const stripHtml = (html) => {
      return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    };

    const productName = stripHtml(bestItem.title || "");
    const price = parseInt(bestItem.lprice || bestItem.hprice || "0");
    const productImageUrl = bestItem.image || "";

    console.log(`✅ 상품 검색 완료: "${productName}" - ${price}원`);

    // 8. 위시리스트에 자동 등록
    try {
      console.log(`💾 위시리스트 자동 등록 시작...`);
      
      const wishlistData = {
        insertType: "IMAGE",
        productName,
        price,
        imageUrl: productImageUrl,
        isPublic
      };

      const savedWishlist = await wishlistService.createWishlist(userId, wishlistData);
      
      console.log(`✅ 위시리스트 등록 완료: ID ${savedWishlist.id}`);

      // 9. 분석 정보와 함께 위시리스트 정보 반환
      return res.status(201).json({
        success: true,
        message: "이미지 분석 완료 및 위시리스트에 성공적으로 등록되었습니다",
        wishlist: {
          id: savedWishlist.id,
          userId: savedWishlist.userId,
          productName: savedWishlist.productName,
          price: savedWishlist.price,
          productImageUrl: savedWishlist.productImageUrl,
          fundingActive: savedWishlist.fundingActive,
          isPublic: savedWishlist.isPublic,
          createdAt: savedWishlist.createdAt,
          updatedAt: savedWishlist.updatedAt
        },
        analysisData: {
          caption_en,
          caption_ko,
          extractedKeywords,
          searchKeyword,
          analyzedAt: new Date().toISOString()
        }
      });

    } catch (wishlistError) {
      console.error('위시리스트 저장 실패:', wishlistError);
      
      // 위시리스트 저장 실패해도 분석 결과는 반환
      return res.status(500).json({
        success: false,
        error: "상품 검색은 성공했지만 위시리스트 저장에 실패했습니다",
        analysisData: {
          caption_en,
          caption_ko,
          extractedKeywords,
          searchKeyword,
          analyzedAt: new Date().toISOString()
        },
        productData: {
          title: productName,
          price: price,
          image: productImageUrl,
          link: bestItem.link || "",
          mallName: bestItem.mallName || "네이버쇼핑"
        }
      });
    }

  } catch (error) {
    console.error('이미지 분석 API 오류:', error);
    return res.status(500).json({ 
      error: "서버 에러" 
    });
  }
});

export const wishlistController = {
  createWishlist,
  getMyWishlists,
  updateWishlist,
  deleteWishlist,
  getPopularProducts,
  analyzeImage
};
