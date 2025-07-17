//테스트 데이터 생성

import prisma from '../src/config/prismaClient.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('시드 데이터 입력 시작...');

  // 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: '테스트 사용자',
      phone: '010-1234-5678',
      birthday: new Date('1990-01-01'),
      cash: 10000,
    },
  });

  console.log('테스트 사용자 생성:', testUser);

  // 테스트 위시리스트 생성
  const testWishlist = await prisma.wishlist.create({
    data: {
      userId: testUser.id,
      productName: 'iPhone 15 Pro',
      price: 1500000,
      productImageUrl: 'https://example.com/iphone15.jpg',
      isPublic: true,
    },
  });

  console.log('테스트 위시리스트 생성:', testWishlist);

  console.log('시드 데이터 입력 완료!');
}

main()
  .catch((e) => {
    console.error('시드 데이터 입력 중 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });