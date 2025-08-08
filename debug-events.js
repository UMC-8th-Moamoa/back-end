import prisma from './src/config/prismaClient.js';

async function checkEvents() {
  try {
    console.log('=== 모든 이벤트 조회 ===');
    const events = await prisma.birthdayEvent.findMany({
      include: {
        birthdayPerson: { 
          select: { 
            id: true,
            name: true 
          } 
        }
      }
    });
    
    console.log('총', events.length, '개의 이벤트 발견');
    events.forEach((event, index) => {
      console.log(`${index + 1}. 이벤트 ID: ${event.id}, 상태: ${event.status}, 생일자: ${event.birthdayPerson?.name || 'Unknown'} (ID: ${event.birthdayPersonId})`);
    });

    console.log('\n=== 완료된 이벤트만 조회 ===');
    const completedEvents = await prisma.birthdayEvent.findMany({
      where: {
        status: 'completed'
      },
      include: {
        birthdayPerson: { 
          select: { 
            id: true,
            name: true 
          } 
        }
      }
    });
    
    console.log('완료된 이벤트:', completedEvents.length, '개');
    completedEvents.forEach((event, index) => {
      console.log(`${index + 1}. 이벤트 ID: ${event.id}, 생일자: ${event.birthdayPerson?.name || 'Unknown'} (ID: ${event.birthdayPersonId}), 완료일: ${event.updatedAt}`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();
