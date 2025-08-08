import prisma from '../config/prismaClient.js';

/**
 * 내 생일 이벤트 레포지토리
 */
class MyBirthdayRepository {
  /**
   * 사용자의 완료된 생일 이벤트 조회 (가장 최근 완료된 이벤트)
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object|null} 이벤트 정보
   */
  async getCurrentEventByUserId(userId) {
    const event = await prisma.birthdayEvent.findFirst({
      where: {
        birthdayPersonId: userId,
        status: 'completed'
      },
      orderBy: {
        updatedAt: 'desc' // 가장 최근 완료된 이벤트
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
    const participants = await prisma.birthdayEventParticipant.findMany({
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
    const result = await prisma.birthdayEventParticipant.aggregate({
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
    const count = await prisma.birthdayEventParticipant.count({
      where: {
        eventId: eventId
      }
    });

    return count;
  }

  /**
   * 생일자의 위시리스트 상품 전체 조회 (투표용)
   * @param {number} userId - 생일자 사용자 ID
   * @param {number} eventId - 이벤트 ID (투표 수 조회용)
   * @returns {Array} 위시리스트 상품 목록
   */
  async getBirthdayWishlistForVoting(userId, eventId) {
    const products = await prisma.wishlist.findMany({
      where: {
        userId: userId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true,
        productUrl: true,
        votes: {
          where: { eventId: eventId },
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return products.map(product => ({
      itemId: product.id,
      productName: product.productName,
      price: product.price,
      productImageUrl: product.productImageUrl,
      productUrl: product.productUrl,
      currentVoteCount: product.votes.length
    }));
  }

  /**
   * 위시리스트 상품에 투표하기
   * @param {number} userId - 투표자 ID
   * @param {number} wishlistId - 위시리스트 상품 ID
   * @param {number} eventId - 이벤트 ID
   * @returns {Object} 생성된 투표 정보
   */
  async addVote(userId, wishlistId, eventId) {
    return await prisma.wishlistVote.create({
      data: {
        userId,
        wishlistId,
        eventId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        },
        wishlist: {
          select: {
            id: true,
            productName: true
          }
        }
      }
    });
  }

  /**
   * 투표 결과 조회 - 모든 위시리스트 상품의 투표 수와 함께 조회
   * @param {number} userId - 생일자 사용자 ID
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 투표 결과 목록 (투표 수 순으로 정렬)
   */
  async getVoteResults(userId, eventId) {
    const products = await prisma.wishlist.findMany({
      where: {
        userId: userId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true,
        productUrl: true,
        votes: {
          where: { eventId: eventId },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                photo: true
              }
            }
          }
        }
      },
      orderBy: {
        votes: {
          _count: 'desc'
        }
      }
    });

    return products.map(product => ({
      itemId: product.id,
      productName: product.productName,
      price: product.price,
      productImageUrl: product.productImageUrl,
      productUrl: product.productUrl,
      voteCount: product.votes.length,
      voters: product.votes.map(vote => ({
        id: vote.user.id,
        name: vote.user.name,
        photo: vote.user.photo
      }))
    }));
  }

  /**
   * 투표받은 상품 ID 목록 조회 (참여자들이 추천한 상품들)
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 생일자 사용자 ID  
   * @returns {Array} 투표받은 상품 ID 배열
   */
  async getVotedProducts(eventId, userId) {
    // 투표를 받은 상품들의 ID만 반환 (투표 많은 순)
    const votedProducts = await prisma.wishlistVote.groupBy({
      by: ['wishlistId'],
      where: {
        eventId: eventId
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    return votedProducts.map(item => item.wishlistId);
  }
}

export const myBirthdayRepository = new MyBirthdayRepository();