import express from 'express';
import { autoEventService } from '../services/autoEvent.service.js';
import prisma from '../config/prismaClient.js';

const router = express.Router();

// 테스트용: 자동 이벤트 생성 강제 실행 (autoEvent.service.js 메서드 호출)
router.post('/auto-events/force', async (req, res) => {
  try {
    console.log('강제 자동 이벤트 생성 시작...');
    
    // autoEvent.service.js의 수정된 메서드를 직접 호출
    await autoEventService.createAutoEventsForUpcomingBirthdays();

    res.json({
      success: true,
      message: '자동 이벤트 생성 완료 (오늘부터 7일 이내 생일인 사용자 대상)'
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

// 테스트용: 특정 사용자의 이벤트 강제 완료
router.post('/events/force-complete', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId가 필요합니다.'
      });
    }

    console.log(`사용자 ID ${userId}의 이벤트 강제 완료 시작...`);
    
    // autoEvent.service.js의 강제 완료 메서드 호출
    const result = await autoEventService.triggerForceCompleteEvent(parseInt(userId));

    if (!result) {
      return res.json({
        success: false,
        message: '활성 상태인 생일 이벤트가 없습니다.'
      });
    }

    res.json({
      success: true,
      message: `사용자 ID ${userId}의 이벤트가 성공적으로 완료되었습니다.`,
      eventId: result.id,
      completedAt: result.updatedAt
    });

  } catch (error) {
    console.error('이벤트 강제 완료 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
