import prisma from '../config/prismaClient.js';

/**
 * 내 생일 이벤트 레포지토리
 */
class MyBirthdayRepository {
  /**
   * 사용자의 현재 진행 중인 생일 이벤트 조회
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object|null} 이벤트 정보
   */
  async getCurrentEventByUserId(userId) {
    const event = await prisma.birthdayEvent.findFirst({
      where: {
        birthdayPersonId: userId,
        status: 'active',
        deadline: {
          gte: new Date() // 마감일이 현재 시간 이후인 것만
        }
      },
      orderBy: {
        createdAt: 'desc' // 가장 최근 생성된 이벤트
      }
    });

    return event;
  }

  /**
   * 이벤트 참여자 목록 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 참여자 정보 배열
   */
  async getEventParticipants(eventId) {
    const participants = await prisma.eventParticipation.findMany({
      where: {
        eventId: eventId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // 참여한 순서대로 정렬
      }
    });

    return participants;
  }

  /**
   * 이벤트에 모인 총 금액 계산
   * @param {number} eventId - 이벤트 ID
   * @returns {number} 총 모인 금액
   */
  async getTotalAmount(eventId) {
    const result = await prisma.contribution.aggregate({
      where: {
        eventId: eventId
      },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  }

  /**
   * 이벤트 ID로 이벤트 정보 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Object|null} 이벤트 정보
   */
  async getEventById(eventId) {
    const event = await prisma.birthdayEvent.findUnique({
      where: {
        id: eventId
      },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      }
    });

    return event;
  }

  /**
   * 참여자 수 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {number} 참여자 수
   */
  async getParticipantCount(eventId) {
    const count = await prisma.eventParticipation.count({
      where: {
        eventId: eventId
      }
    });

    return count;
  }
}

export const myBirthdayRepository = new MyBirthdayRepository();