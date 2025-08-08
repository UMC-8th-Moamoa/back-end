import prisma from './src/config/prismaClient.js';

async function checkParticipants() {
  try {
    console.log('=== 이벤트 참여자 테이블 확인 ===');
    
    // 이벤트 ID 1의 참여자 확인
    const participants1 = await prisma.birthdayEventParticipant.findMany({
      where: {
        eventId: 1
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      }
    });
    
    console.log('이벤트 ID 1의 참여자:', participants1.length, '명');
    participants1.forEach((p, index) => {
      console.log(`${index + 1}. 사용자: ${p.user?.name || 'Unknown'} (ID: ${p.userId}), 금액: ${p.amount}, 참여일: ${p.createdAt}`);
    });

    console.log('\n=== 이벤트 ID 2의 참여자도 확인 ===');
    
    // 이벤트 ID 2의 참여자 확인
    const participants2 = await prisma.birthdayEventParticipant.findMany({
      where: {
        eventId: 2
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      }
    });
    
    console.log('이벤트 ID 2의 참여자:', participants2.length, '명');
    participants2.forEach((p, index) => {
      console.log(`${index + 1}. 사용자: ${p.user?.name || 'Unknown'} (ID: ${p.userId}), 금액: ${p.amount}, 참여일: ${p.createdAt}`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
    console.error('스택 추적:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkParticipants();
