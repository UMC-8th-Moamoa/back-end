var express = require('express');
var router = express.Router();

// 인증 미들웨어
function requireAuth(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({
      error: '로그인이 필요합니다'
    });
  }
}

// 토픽 목록 조회 (인증 필요)
router.get('/', requireAuth, function(req, res) {
  res.json({
    message: '토픽 목록',
    user: req.user,
    topics: [
      { id: 1, title: '첫 번째 토픽', author: req.user.name },
      { id: 2, title: '두 번째 토픽', author: req.user.name }
    ]
  });
});

// 토픽 상세 조회 (인증 필요)
router.get('/:id', requireAuth, function(req, res) {
  var topicId = req.params.id;
  
  res.json({
    message: '토픽 상세',
    user: req.user,
    topic: {
      id: topicId,
      title: `토픽 ${topicId}`,
      content: `이것은 토픽 ${topicId}의 내용입니다.`,
      author: req.user.name,
      createdAt: new Date().toISOString()
    }
  });
});

// 토픽 생성 (인증 필요)
router.post('/', requireAuth, function(req, res) {
  var { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({
      error: '제목과 내용은 필수입니다'
    });
  }
  
  res.status(201).json({
    message: '토픽 생성 성공',
    user: req.user,
    topic: {
      id: Date.now(), // 임시 ID
      title: title,
      content: content,
      author: req.user.name,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
