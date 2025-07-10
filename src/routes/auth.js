var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client');
var bcrypt = require('bcryptjs');

var prisma = new PrismaClient();

// 로그인 페이지
router.get('/login', function(req, res) {
  res.json({
    message: '로그인 페이지',
    error: req.query.error || null,
    user: req.user || null
  });
});

// 회원가입 페이지
router.get('/register', function(req, res) {
  res.json({
    message: '회원가입 페이지',
    user: req.user || null
  });
});

// 회원가입 처리
router.post('/register', async function(req, res) {
  try {
    var { email, pwd, name, phone, birthday } = req.body;

    // 필수 입력값 확인
    if (!email || !pwd || !name) {
      return res.status(400).json({
        error: '이메일, 비밀번호, 이름은 필수 입력값입니다'
      });
    }

    // 이메일 중복 확인
    var existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: '이미 사용 중인 이메일입니다'
      });
    }

    // 비밀번호 해싱
    var hashedPassword = await bcrypt.hash(pwd, 12);

    // 사용자 생성
    var user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        phone: phone || null,
        birthday: birthday ? new Date(birthday) : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        createdAt: true
      }
    });

    // 자동 로그인
    req.login(user, function(err) {
      if (err) {
        console.error('자동 로그인 실패:', err);
        return res.status(201).json({
          message: '회원가입 성공',
          user: user,
          autoLogin: false
        });
      }
      
      res.status(201).json({
        message: '회원가입 및 로그인 성공',
        user: user,
        autoLogin: true
      });
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      error: '서버 내부 오류가 발생했습니다'
    });
  }
});

// 로그아웃 처리
router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
    }
    res.json({
      message: '로그아웃되었습니다'
    });
  });
});

// 현재 사용자 정보
router.get('/me', function(req, res) {
  if (req.user) {
    res.json({
      user: req.user,
      isAuthenticated: true
    });
  } else {
    res.status(401).json({
      error: '인증이 필요합니다',
      isAuthenticated: false
    });
  }
});

// 로그인 상태 확인
router.get('/status', function(req, res) {
  res.json({
    isAuthenticated: !!req.user,
    user: req.user || null,
    sessionID: req.sessionID
  });
});

module.exports = router;