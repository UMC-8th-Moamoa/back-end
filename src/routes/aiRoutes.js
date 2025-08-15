// aiRoutes.js
import express from 'express';
import axios from 'axios';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// /ai/wishlists/analyze
router.post('/wishlists/analyze', authenticateJWT, async (req, res) => {
  try {
    const aiResponse = await axios.post('http://127.0.0.1:5000/analyze', req.body);
    res.json(aiResponse.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'AI 서버 호출 실패' });
  }
});

export default router;
