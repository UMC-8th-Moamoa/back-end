import prisma from '../config/prismaClient.js';

/**
 * 위시리스트 투표 레포지토리
 */
class WishlistVoteRepository {
  /**
   * 이벤트의 위시리스트 목록 조회 (투표용)
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID (투표 상태 확인용)
   * @returns {Array} 위시리스트 목록
   */
  async getEventWishlistsForVote(eventId, userId) {
    // 이벤트 정보와 생일자의 위시리스트 조회
    const event = await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      include: {
        birthdayPerson: {
          include: {
            wishlists: {
              include: {
                votes: {
                  where: { eventId: eventId }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!event) return null;

    // 각 위시리스트별 투표 수와 현재 사용자의 투표 상태 계산
    const wishlistsWithVotes = event.birthdayPerson.wishlists.map(wishlist => {
      const totalVotes = wishlist.votes.length;
      const userVoted = wishlist.votes.some(vote => vote.userId === userId);
      
      return {
        itemId: wishlist.id,
        productName: wishlist.productName,
        price: wishlist.price,
        productImageUrl: wishlist.productImageUrl,
        totalVotes,
        userVoted,
        createdAt: wishlist.createdAt
      };
    });

    return {
      event: {
        id: event.id,
        birthdayPersonName: event.birthdayPerson.name
      },
      wishlists: wishlistsWithVotes
    };
  }

  /**
   * 위시리스트에 투표하기 (중복 투표 가능 - upsert 사용)
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 투표한 사용자 ID
   * @param {Array} wishlistIds - 선택된 위시리스트 ID 배열
   */
  async voteForWishlists(eventId, userId, wishlistIds) {
    return await prisma.$transaction(async (tx) => {
      // 1. 해당 이벤트에서 사용자의 기존 투표 모두 삭제
      await tx.wishlistVote.deleteMany({
        where: {
          eventId: eventId,
          userId: userId
        }
      });

      // 2. 새로운 투표들 생성
      const votePromises = wishlistIds.map(wishlistId =>
        tx.wishlistVote.create({
          data: {
            eventId: eventId,
            wishlistId: wishlistId,
            userId: userId
          }
        })
      );

      const votes = await Promise.all(votePromises);
      return votes;
    });
  }

  /**
   * 투표 결과 조회 (간단한 버전 - 투표수만)
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 현재 사용자 ID
   * @returns {Object} 투표 결과
   */
  async getVoteResults(eventId, userId) {
    const event = await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      include: {
        birthdayPerson: {
          include: {
            wishlists: {
              include: {
                votes: {
                  where: { eventId: eventId }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!event) return null;

    // 각 위시리스트별 투표 결과 계산 (간단한 버전)
    const wishlistResults = event.birthdayPerson.wishlists.map(wishlist => {
      const votes = wishlist.votes;
      const voteCount = votes.length;
      const userVoted = votes.some(vote => vote.userId === userId);

      return {
        itemId: wishlist.id, 
        productName: wishlist.productName,
        price: wishlist.price,
        productImageUrl: wishlist.productImageUrl,
        voteCount,
        userVoted
      };
    });

    // 투표 수 기준으로 내림차순 정렬
    wishlistResults.sort((a, b) => b.voteCount - a.voteCount);

    return {
      event: {
        id: event.id,
        birthdayPersonName: event.birthdayPerson.name
      },
      userHasVoted: wishlistResults.some(w => w.userVoted),
      results: wishlistResults
    };
  }

  /**
   * 사용자가 해당 이벤트에 투표했는지 확인
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @returns {boolean} 투표 여부
   */
  async hasUserVoted(eventId, userId) {
    const vote = await prisma.wishlistVote.findFirst({
      where: {
        eventId: eventId,
        userId: userId
      }
    });

    return !!vote;
  }

  /**
   * 사용자의 현재 투표 상태 조회
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @returns {Array} 투표한 위시리스트 ID 배열
   */
  async getUserVotes(eventId, userId) {
    const votes = await prisma.wishlistVote.findMany({
      where: {
        eventId: eventId,
        userId: userId
      },
      select: {
        wishlistId: true
      }
    });

    return votes.map(vote => vote.wishlistId);
  }
}

export const wishlistVoteRepository = new WishlistVoteRepository();