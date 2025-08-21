import prisma from '../config/prismaClient.js';

class EventShareRepository {
  /**
   * 이벤트 기본 정보 조회
   */
  async getEventById(eventId) {
    try {
      return await prisma.birthdayEvent.findUnique({
        where: { id: eventId },
        include: {
          birthdayPerson: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 팔로우 관계 확인
   */
  async isFollowing(followerUserId, followingUserId) {
    try {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followerUserId,
            followingId: followingUserId
          }
        }
      });

      return !!followRelation;
    } catch (error) {
      console.error('팔로우 관계 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 공유 토큰 생성 및 저장
   */
  async createShareToken(eventId, expiresAt) {
    try {
      // 기존 토큰이 있다면 삭제
      await prisma.EventShareToken.deleteMany({
        where: {
          eventId: eventId,
          expiresAt: {
            lt: new Date() // 만료된 토큰들도 함께 정리
          }
        }
      });

      // 새 토큰 생성
      const token = this.generateShareToken();
      
      const shareToken = await prisma.EventShareToken.create({
        data: {
          eventId: eventId,
          token: token,
          expiresAt: new Date(expiresAt),
          isActive: true
        }
      });

      return shareToken.token;
    } catch (error) {
      console.error('공유 토큰 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 공유 토큰 생성 (랜덤 문자열)
   */
  generateShareToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * 공유 토큰으로 이벤트 조회
   */
  async getEventByShareToken(token) {
    try {
      const shareToken = await prisma.eventShareToken.findFirst({
        where: {
          token: token,
          isActive: true,
          expiresAt: {
            gt: new Date() // 만료되지 않은 토큰만
          }
        },
        include: {
          event: {
            include: {
              birthdayPerson: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      return shareToken?.event || null;
    } catch (error) {
      console.error('공유 토큰 이벤트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 만료된 토큰 정리 (배치 작업용)
   */
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await prisma.eventShareToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false }
          ]
        }
      });

      console.log(`만료된 공유 토큰 ${deletedCount.count}개 정리 완료`);
      return deletedCount.count;
    } catch (error) {
      console.error('만료된 토큰 정리 실패:', error);
      throw error;
    }
  }
}

export const eventShareRepository = new EventShareRepository();
