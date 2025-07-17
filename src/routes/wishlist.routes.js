import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateWishlistCreation, validateWishlistUpdate, validateWishlistQuery, validateId } from '../middlewares/validation.middleware.js';
import { wishlistController } from '../controllers/wishlist.controller.js';

const router = express.Router();

// 위시리스트 등록
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