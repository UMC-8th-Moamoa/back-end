import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validatePagination } from '../middlewares/validation.middleware.js';
import { demoController } from '../controllers/demo.controller.js';

const router = express.Router();

// 데모 이벤트 생성 (회원가입 시 자동 호출용)
router.post('/events',
  authenticateJWT,
  demoController.createDemoEvent
);

// 내 데모 이벤트 조회
router.get('/events/my',
  authenticateJWT,
  demoController.getMyDemoEvent
);

// 공유 링크로 데모 이벤트 조회 (비회원 접근 가능)
router.get('/events/:shareLink/public',
  demoController.getDemoEventByShareLink
);

// 데모 편지 작성 (비회원 접근 가능)
router.post('/events/:shareLink/letters',
  demoController.createDemoLetter
);

// 내 데모 편지들 조회
router.get('/letters/my',
  authenticateJWT,
  validatePagination,
  demoController.getMyDemoLetters
);

// 편지 읽음 처리
router.patch('/letters/:id/read',
  authenticateJWT,
  demoController.markDemoLetterAsRead
);

// 편지 상세 조회
router.get('/letters/:id',
  authenticateJWT,
  demoController.getDemoLetterById
);

export default router;
