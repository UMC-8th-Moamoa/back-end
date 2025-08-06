import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. 사용자 생성 (or upsert)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      user_id: 'user123',
      name: '홍길동',
      email: 'user@example.com',
      password: 'Pass1234', // 실제로는 해시값 사용
      birthday: new Date('1990-01-01')
    }
  });

  // 2. 위시리스트 생성
  const wishlist = await prisma.wishlist.create({
    data: {
      userId: user.id,
      productImageUrl: 'https://example.com/image.jpg',
      productName: '샘플 선물',
      price: 50000,
      isPublic: true,
    }
  });

  // 3. 생일 이벤트 생성
  const event = await prisma.birthdayEvent.create({
    data: {
      wishlistId: wishlist.id,
      birthdayPersonId: user.id,
      creatorId: user.id,
      title: '홍길동의 생일 이벤트',
      deadline: new Date('2025-08-23T23:59:59Z'),
      status: 'ACTIVE'
    }
  });

  // 4. 이벤트 참여자 추가
  await prisma.birthdayEventParticipant.create({
    data: {
      eventId: event.id,
      userId: user.id,
      amount: 10000,
      message: '축하해요!'
    }
  });

  console.log('✅ 테스트 데이터 생성 완료');
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
