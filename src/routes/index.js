var express = require('express');
var router = express.Router();
const { getCurrentKSTISOString } = require('../utils/datetime.util.js');

// 홈 페이지
router.get('/', function(req, res) {
  var user = req.user || null;
  
  res.json({
    message: 'UMC 8기 Moamoa - 생일선물 공동구매 플랫폼',
    user: user,
    isAuthenticated: !!user,
    timestamp: getCurrentKSTISOString()
  });
});

// 헬스체크
router.get('/health', function(req, res) {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: getCurrentKSTISOString()
  });
});

module.exports = router;
