import { wishlistVoteRepository } from '../repositories/wishlistVote.repository.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middlewares/errorHandler.js';
import prisma from '../config/prismaClient.js';

/**
 * 위시리스트 투표 서비스
 */
class WishlistVoteService {
  /**
   * 투표할 위시리스트 목록 조회
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @returns {Object} 투표 정보
   */
  async getVotingWishlists(eventId, userId) {
    try {
      // 이벤트 접근 권한 확인 (참여자인지 확인)
      await this.validateEventAccess(eventId, userId);

      const data = await wishlistVoteRepository.getEventWishlistsForVote(eventId, userId);
      
      if (!data) {
        throw new NotFoundError('이벤트를 찾을 수 없습니다');
      }

      return data;
    } catch (error) {
      console.error('투표 위시리스트 조회 오류:', error);
      
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      
      throw new Error('투표 정보를 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 위시리스트 투표하기
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @param {Array} wishlistIds - 선택된 위시리스트 ID 배열
   * @returns {Object} 투표 결과
   */
  async voteForWishlists(eventId, userId, wishlistIds) {
    try {
      // 입력값 검증
      if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
        throw new ValidationError('최소 하나의 위시리스트를 선택해야 합니다');
      }

      if (wishlistIds.length > 10) {
        throw new ValidationError('최대 10개까지만 선택할 수 있습니다');
      }

      // 이벤트 접근 권한 확인
      await this.validateEventAccess(eventId, userId);

      // 투표 실행
      const votes = await wishlistVoteRepository.voteForWishlists(eventId, userId, wishlistIds);

      return {
        message: '투표가 완료되었습니다',
        votedItems: votes.length,
        votedWishlistIds: wishlistIds
      };
    } catch (error) {
      console.error('투표 처리 오류:', error);
      
      if (error instanceof ValidationError || error instanceof ForbiddenError) {
        throw error;
      }
      
      throw new Error('투표 처리 중 오류가 발생했습니다');
    }
  }

  /**
   * 투표 결과 조회
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @returns {Object} 투표 결과
   */
  async getVoteResults(eventId, userId) {
    try {
      // 이벤트 접근 권한 확인
      await this.validateEventAccess(eventId, userId);

      const results = await wishlistVoteRepository.getVoteResults(eventId, userId);
      
      if (!results) {
        throw new NotFoundError('이벤트를 찾을 수 없습니다');
      }

      return results;
    } catch (error) {
      console.error('투표 결과 조회 오류:', error);
      
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      
      throw new Error('투표 결과를 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 사용자의 현재 투표 상태 조회
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   * @returns {Array} 투표한 위시리스트 ID 배열
   */
  async getUserVotes(eventId, userId) {
    try {
      await this.validateEventAccess(eventId, userId);
      return await wishlistVoteRepository.getUserVotes(eventId, userId);
    } catch (error) {
      console.error('사용자 투표 상태 조회 오류:', error);
      
      if (error instanceof ForbiddenError) {
        throw error;
      }
      
      throw new Error('투표 상태를 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 이벤트 접근 권한 확인
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 사용자 ID
   */
  async validateEventAccess(eventId, userId) {
    // 이벤트 참여자인지 확인
    const participant = await prisma.birthdayEventParticipant.findFirst({
      where: {
        eventId: eventId,
        userId: userId
      }
    });

    if (!participant) {
      throw new ForbiddenError('이벤트에 참여한 사용자만 투표할 수 있습니다');
    }
  }
}

export const wishlistVoteService = new WishlistVoteService();