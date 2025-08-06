import cron from 'node-cron';
import prisma from '../config/prismaClient.js';

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
   * 일주일 후 생일인 사용자들의 자동 이벤트 생성
   */
  async createAutoEventsForUpcomingBirthdays() {
    try {
      // 7일 후의 날짜 계산
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(0, 0, 0, 0);

      // 7일 후에 생일인 사용자들 찾기
      const upcomingBirthdayUsers = await this.findUsersWithUpcomingBirthdays(sevenDaysLater);

      console.log(`7일 후 생일인 사용자 ${upcomingBirthdayUsers.length}명 발견`);

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
   * 7일 후 생일인 사용자 찾기
   */
  async findUsersWithUpcomingBirthdays(targetDate) {
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

    // 올해와 내년 생일을 고려하여 필터링
    const usersWithUpcomingBirthdays = users.filter(user => {
      if (!user.birthday) return false;

      // 이미 활성 이벤트가 있으면 제외
      if (user.birthdayEvents.length > 0) return false;

      const birthday = new Date(user.birthday);
      const currentYear = targetDate.getFullYear();
      
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

      // 목표 날짜와 일치하는지 확인
      return (
        this.isSameDate(thisYearBirthday, targetDate) ||
        this.isSameDate(nextYearBirthday, targetDate)
      );
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

      // 각 팔로워에게 알림 생성
      const notifications = followers.map(follow => ({
        userId: follow.followerId,
        message: `${follow.following.name}님의 생일이 일주일 후입니다! 생일 모아에 참여해보세요.`,
        isRead: false,
        createdAt: new Date()
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
        
        console.log(`${notifications.length}명의 팔로워에게 생일 알림 전송 완료`);
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
}

export const autoEventService = new AutoEventService();
