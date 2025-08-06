import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateWishlistCreation, validateWishlistUpdate, validateWishlistQuery, validateId } from '../middlewares/validation.middleware.js';
import { wishlistController } from '../controllers/wishlist.controller.js';

const router = express.Router();

// 인기 상품 상위 10개 조회 (인증 불필요)
router.get('/popular', wishlistController.getPopularProducts);

// 이미지 분석을 통한 상품 추천 및 위시리스트 자동 등록 (인증 필요)
router.post('/analyze', 
  authenticateJWT,
  wishlistController.analyzeImage
);

// 위시리스트 등록 (URL 크롤링 및 수동 입력 모두 지원)
router.post('/', 
  authenticateJWT,
  validateWishlistCreation,
  wishlistController.createWishlist
);

// 나의 위시리스트 목록 조회
router.get('/',
  authenticateJWT,
  validateWishlistQuery,
  wishlistController.getMyWishlists
);

// 위시리스트 수정
router.patch('/:id',
  authenticateJWT,
  validateWishlistUpdate,
  wishlistController.updateWishlist
);

// 위시리스트 삭제
router.delete('/:id',
  authenticateJWT,
  validateId,
  wishlistController.deleteWishlist
);

export default router;