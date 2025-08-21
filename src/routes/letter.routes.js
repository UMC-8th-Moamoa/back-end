import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateLetterCreation, validateLetterUpdate, validateId } from '../middlewares/validation.middleware.js';
import { letterController } from '../controllers/letter.controller.js';

const router = express.Router();

// 편지 목록 조회
router.get('/', 
  authenticateJWT,
  letterController.getLetters
);

// 편지 상세 조회
router.get('/:id',
  authenticateJWT,
  validateId,
  letterController.getLetterById
);

// 편지 등록
router.post('/', 
  authenticateJWT,
  validateLetterCreation,
  letterController.createLetter
);

// 편지 수정
router.patch('/:id',
  authenticateJWT,
  validateLetterUpdate,
  letterController.updateLetter
);

// 편지 삭제
router.delete('/:id',
  authenticateJWT,
  validateId,
  letterController.deleteLetter
);

// 사용자 보관함 아이템 조회 (편지 작성용) - 쇼핑 API와 동일한 보관함
router.get('/user/items',
  authenticateJWT,
  letterController.getUserItems
);

export default router;
