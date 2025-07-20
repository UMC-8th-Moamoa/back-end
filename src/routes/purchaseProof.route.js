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

export default router;