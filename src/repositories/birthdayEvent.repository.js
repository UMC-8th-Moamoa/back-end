import prisma from '../config/prismaClient.js';

class BirthdayEventRepository {
  /**
   * 생일 이벤트 상세 정보 조회
   */
  async findEventById(eventId) {
    const event = await prisma.birthdayEvent.findUnique({
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
          select: {
            id: true,
            eventId: true,
            userId: true,
            amount: true,
            message: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                photo: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!event) {
      return null;
    }

    // 생일자의 위시리스트 조회
    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId: event.birthdayPersonId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true,
        //productUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 남은 기간 계산 (월/일 기준)
    const now = new Date();
    const deadline = new Date(event.deadline);
    
    // 현재 년도 기준으로 데드라인 날짜를 재계산
    const currentYear = now.getFullYear();
    const deadlineThisYear = new Date(currentYear, deadline.getMonth(), deadline.getDate());
    
    // 만약 올해 데드라인이 이미 지났다면 내년 데드라인으로 계산
    let targetDeadline = deadlineThisYear;
    if (deadlineThisYear < now) {
      targetDeadline = new Date(currentYear + 1, deadline.getMonth(), deadline.getDate());
    }
    
    const timeDiff = targetDeadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // 이벤트 정보에 추가 데이터 포함
    return {
      ...event,
      wishlist,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      isExpired: daysLeft <= 0
    };
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
   * 특정 생일자와 날짜로 이벤트 조회 (월/일 기준)
   */
  async getEventByBirthdayPersonAndDate(birthdayPersonId, targetDate) {
    const targetDateObj = new Date(targetDate);
    const targetMonth = targetDateObj.getMonth();
    const targetDay = targetDateObj.getDate();
    
    // 모든 이벤트를 조회한 후 월/일 기준으로 필터링
    const events = await prisma.birthdayEvent.findMany({
      where: {
        birthdayPersonId: birthdayPersonId,
        status: 'ACTIVE'
      },
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
    
    // 월/일이 일치하는 이벤트 찾기
    const matchingEvent = events.find(event => {
      const eventDate = new Date(event.deadline);
      return eventDate.getMonth() === targetMonth && eventDate.getDate() === targetDay;
    });
    
    return matchingEvent || null;
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
    return await prisma.birthdayEventParticipant.count({
      where: { eventId }
    });
  }

  /**
   * 팔로우 관계 확인
   */
  async isFollowing(followerId, followingId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    
    return follow !== null;
  }

  /**
   * 사용자 정보 조회
   */
  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        photo: true,
        birthday: true
      }
    });
  }

  /**
   * 이벤트 참여자 목록 조회
   */
  async getParticipants(eventId) {
    const participants = await prisma.birthdayEventParticipant.findMany({
      where: { eventId },
      select: {
        id: true,
        eventId: true,
        userId: true,
        amount: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return participants.map(participant => ({
      userId: participant.user.id,
      userName: participant.user.name,
      userPhoto: participant.user.photo,
      amount: participant.amount,
      message: participant.message,
      participatedAt: participant.createdAt
    }));
  }

  /**
   * 위시리스트 개수 조회
   */
  async getWishlistCount(userId) {
    return await prisma.wishlist.count({
      where: {
        userId,
        isPublic: true
      }
    });
  }

  /**
   * 모든 위시리스트 아이템 조회
   */
  async getAllWishlistItems(userId) {
    return await prisma.wishlist.findMany({
      where: {
        userId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * 특정 사용자가 특정 이벤트에 참여했는지 확인
   */
  async checkUserParticipation(eventId, userId) {
    const participation = await prisma.birthdayEventParticipant.findUnique({
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
    return await prisma.birthdayEventParticipant.create({
      data: {
        eventId,
        userId
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
        amount: true,
        message: true,
        createdAt: true,
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
    return await prisma.birthdayEventParticipant.delete({
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
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    return await prisma.birthdayEvent.findMany({
      where: {
        status: 'ACTIVE'
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
    }).then(events => {
      // 올해 기준 7일 전부터 당일까지만 표시
      return events.filter(event => {
        const deadline = new Date(event.deadline);
        const deadlineThisYear = new Date(currentYear, deadline.getMonth(), deadline.getDate());
        
        // 7일 전 날짜 계산
        const sevenDaysBefore = new Date(deadlineThisYear);
        sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
        
        // 7일 전부터 당일까지의 범위에 있는지 확인
        return now >= sevenDaysBefore && now <= deadlineThisYear;
      });
    });
  }
}

export const birthdayEventRepository = new BirthdayEventRepository();