// 임시 데이터베이스 테스트 스크립트
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('=== 데이터베이스 테스트 시작 ===');
    
    // 1. 전체 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log('전체 사용자 수:', userCount);
    
    // 2. 전체 생일 이벤트 수 확인
    const eventCount = await prisma.birthdayEvent.count();
    console.log('전체 생일 이벤트 수:', eventCount);
    
    // 3. 전체 이벤트 참여자 수 확인
    const participantCount = await prisma.birthdayEventParticipant.count();
    console.log('전체 이벤트 참여자 수:', participantCount);
    
    // 4. 활성 이벤트 확인
    const activeEvents = await prisma.birthdayEvent.findMany({
      where: {
        status: 'active',
        deadline: {
          gte: new Date()
        }
      },
      include: {
        birthdayPerson: true,
        participants: true
      },
      take: 5
    });
    
    console.log('\n=== 활성 이벤트 목록 ===');
    activeEvents.forEach((event, index) => {
      console.log(`${index + 1}. 이벤트 ID: ${event.id}`);
      console.log(`   제목: ${event.title}`);
      console.log(`   생일 주인공: ${event.birthdayPerson.name}`);
      console.log(`   마감일: ${event.deadline}`);
      console.log(`   참여자 수: ${event.participants.length}`);
      console.log('   ---');
    });
    
    // 5. 최근 사용자 5명의 이벤트 참여 현황
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        eventParticipants: {
          include: {
            event: true
          }
        }
      }
    });
    
    console.log('\n=== 최근 사용자들의 이벤트 참여 현황 ===');
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. 사용자: ${user.name} (ID: ${user.id})`);
      console.log(`   참여 중인 이벤트: ${user.eventParticipants.length}개`);
      user.eventParticipants.forEach((participation, pIndex) => {
        console.log(`   - ${pIndex + 1}) ${participation.event.title}`);
      });
      console.log('   ---');
    });
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('데이터베이스 테스트 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
