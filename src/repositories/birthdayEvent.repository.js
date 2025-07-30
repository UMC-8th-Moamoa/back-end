import prisma from '../config/prismaClient.js';

class BirthdayEventRepository {
  /**
   * 생일 이벤트 상세 정보 조회
   */
  async findEventById(eventId) {
    return await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true,
            birthday: true
          }
        },
        participants: {
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
            participatedAt: 'desc'
          }
        },
        wishlistItems: {
          where: {
            isPublic: true
          },
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            isPublic: true
          }
        }
      }
    });
  }

  /**
   * 생일 이벤트 생성
   */
  async createBirthdayEvent(eventData) {
    return await prisma.birthdayEvent.create({
      data: eventData,
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true,
            birthday: true
          }
        }
      }
    });
  }

  /**
   * 생일 이벤트 업데이트
   */
  async updateBirthdayEvent(eventId, updateData) {
    return await prisma.birthdayEvent.update({
      where: { id: eventId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  /**
   * 생일 이벤트 삭제
   */
  async deleteBirthdayEvent(eventId) {
    return await prisma.birthdayEvent.delete({
      where: { id: eventId }
    });
  }

  /**
   * 특정 사용자의 생일 이벤트 목록 조회
   */
  async findEventsByUserId(userId, options = {}) {
    const { skip = 0, take = 10, status } = options;
    
    const whereCondition = {
      birthdayPersonId: userId
    };
    
    if (status) {
      whereCondition.status = status;
    }

    return await prisma.birthdayEvent.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: {
        deadline: 'desc'
      },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });
  }

  /**
   * 참여자 수 조회
   */
  async countParticipants(eventId) {
    return await prisma.eventParticipant.count({
      where: { eventId }
    });
  }

  /**
   * 특정 사용자가 특정 이벤트에 참여했는지 확인
   */
  async checkUserParticipation(eventId, userId) {
    const participation = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
    
    return participation !== null;
  }

  /**
   * 이벤트 참여자 추가
   */
  async addParticipant(eventId, userId) {
    return await prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
        participatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      }
    });
  }

  /**
   * 이벤트 참여자 제거
   */
  async removeParticipant(eventId, userId) {
    return await prisma.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
  }

  /**
   * 활성 상태인 생일 이벤트 목록 조회 (홈 화면용)
   */
  async findActiveEvents(options = {}) {
    const { skip = 0, take = 10 } = options;
    
    return await prisma.birthdayEvent.findMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          gte: new Date()
        }
      },
      skip,
      take,
      orderBy: {
        deadline: 'asc'
      },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true,
            birthday: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });
  }
}

export const birthdayEventRepository = new BirthdayEventRepository();