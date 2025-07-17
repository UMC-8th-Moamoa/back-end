import express from 'express';
import { PrismaClient } from '@prisma/client';

import { catchAsync, DuplicateEmailError } from '../middlewares/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// 기본 테스트 라우트
router.get('/test', (req, res) => {
  res.json({ message: 'User routes working!' });
});

// 회원가입
router.post('/auth/register', catchAsync(async (req, res) => {
  const { email, password, name, phone, birthday } = req.body;

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new DuplicateEmailError();
  }

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      birthday: birthday ? new Date(birthday) : null
    },
    select: {
      id: true,
      email: true,
      name: true,
      photo: true,
      createdAt: true
    }
  });

  // JWT 토큰 생성
  const tokens = generateTokenPair(user.id, user.email);

  res.status(201).success({
    user,
    tokens
  });
}));

// 로그인
router.post('/auth/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).error({
      errorCode: 'UNAUTHORIZED',
      reason: '이메일 또는 비밀번호가 잘못되었습니다'
    });
  }

  const tokens = generateTokenPair(user.id, user.email);

  res.success({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo,
      createdAt: user.createdAt
    },
    tokens
  });
}));

export default router;