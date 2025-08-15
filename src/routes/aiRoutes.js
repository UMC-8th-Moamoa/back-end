// aiRoutes.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

// 예: AI 서버에 POST 요청 보내기
router.post('/analyze', async (req, res) => {
  try {
    const aiResponse = await axios.post('http://127.0.0.1:5000/analyze', req.body);
    res.json(aiResponse.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'AI 서버 호출 실패' });
  }
});

export default router;
