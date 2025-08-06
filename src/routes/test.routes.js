import express from 'express';
import { autoEventService } from '../services/autoEvent.service.js';
import prisma from '../config/prismaClient.js';

const router = express.Router();

// 테스트용: 자동 이벤트 생성 강제 실행 (autoEvent.service.js 메서드 호출)
router.post('/auto-events/force', async (req, res) => {
  try {
    console.log('강제 자동 이벤트 생성 시작...');
    
    // autoEvent.service.js의 메서드를 직접 호출
    await autoEventService.createAutoEventsForUpcomingBirthdays();

    res.json({
      success: true,
      message: '자동 이벤트 생성 완료 (autoEvent.service.js 사용)'
    });

  } catch (error) {
    console.error('자동 이벤트 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 테스트용: 현재 활성 이벤트 목록 조회
router.get('/events/active', async (req, res) => {
  try {
    const activeEvents = await prisma.birthdayEvent.findMany({
      where: {
        status: 'active'
      },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            birthday: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            wishlistVotes: true
          }
        }
      }
    });

    res.json({
      success: true,
      events: activeEvents
    });

  } catch (error) {
    console.error('활성 이벤트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
