import cron from 'node-cron';
import prisma from '../config/prismaClient.js';
import { notificationService } from './notification.service.js';

class AutoEventService {
  constructor() {
    this.startScheduler();
  }

  /**
   * 스케줄러 시작 - 매일 자정에 실행
   */
  startScheduler() {
    // 매일 자정에 실행 (0 0 * * *)
    cron.schedule('0 0 * * *', async () => {
      console.log('자동 생일 이벤트 생성 체크 시작...');
      try {
        await this.createAutoEventsForUpcomingBirthdays();
      } catch (error) {
        console.error('자동 이벤트 생성 중 오류 발생:', error);
      }
    });
    
    console.log('자동 이벤트 생성 스케줄러가 시작되었습니다. (매일 자정 실행)');
  }

  /**
   * 오늘부터 7일 이내 생일인 사용자들의 자동 이벤트 생성
   */
  async createAutoEventsForUpcomingBirthdays() {
    try {
      // 오늘부터 7일 이내 생일인 사용자들 찾기
      const upcomingBirthdayUsers = await this.findUsersWithUpcomingBirthdays();

      console.log(`오늘부터 7일 이내 생일인 사용자 ${upcomingBirthdayUsers.length}명 발견`);

      for (const user of upcomingBirthdayUsers) {
        await this.createAutoEventForUser(user);
      }

      console.log('자동 이벤트 생성 완료');
    } catch (error) {
      console.error('자동 이벤트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 오늘부터 7일 이내 생일인 사용자 찾기
   */
  async findUsersWithUpcomingBirthdays() {
    const users = await prisma.user.findMany({
      where: {
        birthday: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        birthday: true,
        birthdayEvents: {
          where: {
            status: 'active',
            deadline: {
              gte: new Date() // 현재 활성 상태인 이벤트
            }
          }
        }
      }
    });

    // 오늘부터 7일 이내 생일인 사용자들 필터링
    const usersWithUpcomingBirthdays = users.filter(user => {
      if (!user.birthday) return false;

      // 이미 활성 이벤트가 있으면 제외
      if (user.birthdayEvents.length > 0) return false;

      const birthday = new Date(user.birthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentYear = today.getFullYear();
      
      // 올해 생일
      const thisYearBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );

      // 내년 생일
      const nextYearBirthday = new Date(
        currentYear + 1,
        birthday.getMonth(),
        birthday.getDate()
      );

      // 올해 생일이 오늘 이전이면 내년 생일을 사용
      const targetBirthday = thisYearBirthday < today ? nextYearBirthday : thisYearBirthday;

      // 생일까지의 날짜 차이 계산
      const daysUntilBirthday = Math.ceil((targetBirthday - today) / (1000 * 60 * 60 * 24));

      // 오늘부터 7일 이내인지 확인 (0일 = 오늘, 7일 = 7일 후)
      return daysUntilBirthday >= 0 && daysUntilBirthday <= 7;
    });

    console.log(`필터링 결과: ${usersWithUpcomingBirthdays.length}명`);
    usersWithUpcomingBirthdays.forEach(user => {
      const birthday = new Date(user.birthday);
      const today = new Date();
      const currentYear = today.getFullYear();
      const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
      const targetBirthday = thisYearBirthday < today ? 
        new Date(currentYear + 1, birthday.getMonth(), birthday.getDate()) : thisYearBirthday;
      const daysUntil = Math.ceil((targetBirthday - today) / (1000 * 60 * 60 * 24));
      console.log(`- ${user.name}: ${daysUntil}일 후 생일 (${targetBirthday.toLocaleDateString()})`);
    });

    return usersWithUpcomingBirthdays;
  }

  /**
   * 특정 사용자에 대한 자동 이벤트 생성
   */
  async createAutoEventForUser(user) {
    try {
      const birthday = new Date(user.birthday);
      const currentYear = new Date().getFullYear();
      
      // 올해 생일 계산
      let thisYearBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );

      // 올해 생일이 지났으면 내년 생일로 설정
      const today = new Date();
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(currentYear + 1);
      }

      // 이벤트 시작일: 생일 일주일 전 00시 (현재 시점)
      const eventStartDate = new Date();
      eventStartDate.setHours(0, 0, 0, 0);

      // 이벤트 마감일: 생일 당일 21시
      const deadline = new Date(thisYearBirthday);
      deadline.setHours(21, 0, 0, 0); // 21시 정각에 마감

      // 자동 이벤트 생성
      const event = await prisma.birthdayEvent.create({
        data: {
          birthdayPersonId: user.id,
          title: `${user.name}님의 생일 모아`,
          currentAmount: 0,
          deadline: deadline,
          status: 'active',
          createdAt: eventStartDate, // 일주일 전부터 시작
          updatedAt: new Date()
        }
      });

      console.log(`${user.name}님의 자동 생일 이벤트 생성 완료 (ID: ${event.id})`);
      console.log(`이벤트 시작: ${eventStartDate.toLocaleString('ko-KR')} (일주일 전 00:00)`);
      console.log(`생일 날짜: ${thisYearBirthday.toLocaleString('ko-KR', { month: 'long', day: 'numeric' })}`);
      console.log(`이벤트 마감: ${deadline.toLocaleString('ko-KR')} (생일 당일 21:00)`);
      
      // 알림 생성 (팔로워들에게)
      await this.createBirthdayNotifications(user.id, event.id);

      return event;
    } catch (error) {
      console.error(`${user.name}님의 자동 이벤트 생성 실패:`, error);
      throw error;
    }
  }

  /**
   * 생일 알림 생성 (팔로워들에게)
   */
  async createBirthdayNotifications(birthdayPersonId, eventId) {
    try {
      // 해당 사용자의 팔로워 목록 조회
      const followers = await prisma.follow.findMany({
        where: {
          followingId: birthdayPersonId
        },
        include: {
          follower: {
            select: {
              id: true,
              name: true
            }
          },
          following: {
            select: {
              name: true
            }
          }
        }
      });
      // 알림 전송 (BIRTHDAY_REMINDER)
      const followerUsers = followers.map(f => f.follower);
      if (followerUsers.length > 0) {
        await notificationService.createBirthdayReminderToFollowers(followerUsers, followers[0].following.name, 7);
        // 이벤트 생성 알림도 함께 전송
        await notificationService.createFriendEventCreatedToFollowers(followerUsers, followers[0].following.name);
      }
    } catch (error) {
      console.error('생일 알림 생성 실패:', error);
    }
  }

  /**
   * 두 날짜가 같은 날인지 확인 (연도 제외)
   */
  isSameDate(date1, date2) {
    return date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  }

  /**
   * 수동으로 자동 이벤트 생성 트리거 (테스트용)
   */
  async triggerAutoEventCreation() {
    console.log('수동 자동 이벤트 생성 트리거...');
    await this.createAutoEventsForUpcomingBirthdays();
  }

  /**
   * 특정 사용자의 활성 이벤트를 강제로 완료 상태로 변경 (테스트용)
   * @param {number} userId - 사용자 ID
   */
  async triggerForceCompleteEvent(userId) {
    try {
      console.log(`수동 이벤트 강제 완료 트리거... (사용자 ID: ${userId})`);

      // 현재 활성 이벤트 조회
      const activeEvent = await prisma.birthdayEvent.findFirst({
        where: {
          birthdayPersonId: userId,
          status: 'active'
        },
        include: {
          birthdayPerson: {
            select: {
              name: true
            }
          }
        }
      });

      if (!activeEvent) {
        console.log('현재 활성 상태인 생일 이벤트가 없습니다.');
        return null;
      }

      console.log(`활성 이벤트 발견: ${activeEvent.birthdayPerson.name}님의 이벤트 (ID: ${activeEvent.id})`);


      // 이벤트 상태를 completed로 변경
      const completedEvent = await prisma.birthdayEvent.update({
        where: {
          id: activeEvent.id
        },
        data: {
          status: 'completed',
          updatedAt: new Date()
        }
      });


      // 알림 생성 (생일자에게 얼마가 모금되었는지)
      await notificationService.createMoaCompletedNotification(
        activeEvent.birthdayPersonId,
        activeEvent.currentAmount
      );

      // 참여자 전체 알림 (EVENT_COMPLETED)
      const participants = await prisma.birthdayEventParticipant.findMany({
        where: { eventId: activeEvent.id },
        include: { user: { select: { id: true, name: true } } }
      });
      if (participants.length > 0) {
        await notificationService.createEventCompletedToParticipants(
          participants.map(p => ({ userId: p.user.id })),
          activeEvent.birthdayPerson.name
        );
      }

      console.log(`이벤트가 성공적으로 완료되었습니다! (완료 시간: ${completedEvent.updatedAt})`);
      return completedEvent;

    } catch (error) {
      console.error('이벤트 강제 완료 중 오류 발생:', error);
      throw error;
    }
  }
}

export const autoEventService = new AutoEventService();
