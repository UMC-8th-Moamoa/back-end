import express from 'express';

const router = express.Router();

// 홈 페이지
router.get('/', function(req, res) {
  const user = req.user || null;
  
  res.json({
    message: 'UMC 8기 Moamoa - 생일선물 공동구매 플랫폼',
    user: user,
    isAuthenticated: !!user,
    timestamp: new Date().toISOString()
  });
});

// 헬스체크
router.get('/health', function(req, res) {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

<<<<<<< HEAD
export default router;
=======
module.exports = router;
>>>>>>> 51590831f742a60f150ab22b646a25af7e082109
