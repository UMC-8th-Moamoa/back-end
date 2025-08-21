import express from 'express';
import { autoEventService } from '../services/autoEvent.service.js';

const router = express.Router();

/**
 * [테스트용] 특정 사용자의 활성 이벤트를 강제로 완료 상태로 변경
 * POST /api/test/force-complete-event/:userId
 */
router.post('/force-complete-event/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'userId는 숫자여야 합니다.' });
  }
  try {
    const result = await autoEventService.triggerForceCompleteEvent(userId);
    if (!result) {
      return res.status(404).json({ success: false, message: '활성 이벤트가 없습니다.' });
    }
    res.json({ success: true, event: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;