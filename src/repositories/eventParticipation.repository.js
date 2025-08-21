import prisma from '../config/prismaClient.js';

class EventParticipationRepository {
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
   * 이벤트 참여자 수 조회
   */
  async getParticipantCount(eventId) {
    try {
      return await prisma.birthdayEventParticipant.count({
        where: {
          eventId: eventId
        }
      });
    } catch (error) {
      console.error('참여자 수 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 참여 여부 확인
   */
  async isUserParticipating(eventId, userId) {
    try {
      const participation = await prisma.birthdayEventParticipant.findUnique({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userId
          }
        }
      });

      return participation !== null;
    } catch (error) {
      console.error('사용자 참여 확인 실패:', error);
      return false;
    }
  }

  /**
   * 이벤트 참여 추가
   */
  async addParticipation(eventId, userId, amount, participationType) {
    try {
      return await prisma.birthdayEventParticipant.create({
        data: {
          eventId: eventId,
          userId: userId,
          amount: amount,
          participationType: participationType
        }
      });
    } catch (error) {
      console.error('이벤트 참여 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 이벤트 현재 금액 업데이트
   */
  async updateEventCurrentAmount(eventId, additionalAmount) {
    try {
      return await prisma.birthdayEvent.update({
        where: { id: eventId },
        data: {
          currentAmount: {
            increment: additionalAmount
          }
        }
      });
    } catch (error) {
      console.error('이벤트 금액 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 이벤트 현재 상태 조회
   */
  async getEventStatus(eventId) {
    try {
      const event = await prisma.birthdayEvent.findUnique({
        where: { id: eventId },
        select: {
          currentAmount: true
        }
      });

      const participantCount = await this.getParticipantCount(eventId);

      return {
        currentAmount: event?.currentAmount || 0,
        participantCount
      };
    } catch (error) {
      console.error('이벤트 상태 조회 실패:', error);
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
   * 이벤트 상태 확인 (활성/마감)
   */
  async isEventActive(eventId) {
    try {
      const event = await prisma.birthdayEvent.findUnique({
        where: { id: eventId },
        select: {
          status: true,
          deadline: true
        }
      });

      if (!event) return false;

      const now = new Date();
      const deadline = new Date(event.deadline);

      return event.status === 'active' && deadline > now;
    } catch (error) {
      console.error('이벤트 활성 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 사용자가 해당 이벤트에 편지를 작성했는지 확인
   */
  async hasUserWrittenLetter(eventId, userId) {
    try {
      const letter = await prisma.letter.findFirst({
        where: {
          birthdayEventId: eventId,
          senderId: userId
        }
      });

      return letter !== null;
    } catch (error) {
      console.error('편지 작성 여부 확인 실패:', error);
      return false;
    }
  }
  /**
   * 사용자 정보 조회 (알림용)
   */
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true
        }
      });

      return user;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  }
}

export const eventParticipationRepository = new EventParticipationRepository();
