// src/services/birthdayNotification.service.js
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service.js';

const prisma = new PrismaClient();

class BirthdayNotificationService {
  /**
   * 생일 알림 스케줄러 시작
   */
  startBirthdayReminders() {
    // 매일 오전 9시에 생일 알림 체크
    cron.schedule('0 9 * * *', async () => {
      console.log('🎂 생일 알림 체크 시작...');
      await this.checkAndSendBirthdayReminders();
    });
  }

  /**
   * 생일 알림 체크 및 전송
   */
  async checkAndSendBirthdayReminders() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      // 오늘, 내일, 3일 후 생일인 사용자 조회
      const upcomingBirthdays = await prisma.user.findMany({
        where: {
          OR: [
            {
              birthday: {
                gte: today,
                lt: tomorrow
              }
            },
            {
              birthday: {
                gte: tomorrow,
                lt: threeDaysLater
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          birthday: true,
          followers: {
            select: {
              followerId: true
            }
          }
        }
      });

      // 각 생일자의 팔로워들에게 알림 전송
      for (const birthdayPerson of upcomingBirthdays) {
        const daysLeft = this.calculateDaysLeft(birthdayPerson.birthday);
        
        for (const follower of birthdayPerson.followers) {
          await notificationService.createBirthdayReminderNotification(
            follower.followerId,
            birthdayPerson.name,
            daysLeft
          );
        }
      }

      console.log(`✅ ${upcomingBirthdays.length}명의 생일 알림 처리 완료`);
    } catch (error) {
      console.error('생일 알림 처리 중 오류:', error);
    }
  }

  /**
   * 남은 일수 계산
   */
  calculateDaysLeft(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const diffTime = birthDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// 서비스 인스턴스 생성 및 시작
const birthdayNotificationService = new BirthdayNotificationService();
birthdayNotificationService.startBirthdayReminders();

export { birthdayNotificationService };