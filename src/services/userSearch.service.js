import { userSearchRepository } from '../repositories/userSearch.repository.js';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.js';
import { toKSTISOString } from '../utils/datetime.util.js';

class UserSearchService {
  /**
   * 사용자 검색
   * @param {number} currentUserId - 현재 로그인한 사용자 ID
   * @param {string} searchTerm - 검색어
   * @param {number} limit - 검색 결과 개수
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 검색 결과
   */
  async searchUsers(currentUserId, searchTerm, limit, page) {
    // 검색어 저장
    await userSearchRepository.saveSearchHistory(currentUserId, searchTerm);

    // 사용자 검색
    const result = await userSearchRepository.searchUsers(currentUserId, searchTerm, limit, page);
    
    return {
      users: result.users.map((user) => ({
        id: user.id,
        userId: user.user_id,
        name: user.name,
        photo: user.photo,
        birthday: user.birthday,
        isFollowing: user.isFollowing,
        isFollower: user.isFollower,
        followersCount: user._count?.followers || 0,
        followingCount: user._count?.following || 0
      })),
      pagination: {
        currentPage: result.debug?.safePage || page,
        totalPages: Math.ceil(result.totalCount / (result.debug?.safeLimit || limit)),
        totalCount: result.totalCount,
        hasNext: (result.debug?.safePage || page) < Math.ceil(result.totalCount / (result.debug?.safeLimit || limit)),
        hasPrev: (result.debug?.safePage || page) > 1
      },
      // 임시 디버깅 정보
      debug: result.debug
    };
  }

  /**
   * 검색 기록 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 검색 기록 수
   * @returns {Promise<Object>} 검색 기록 목록
   */
  async getSearchHistory(userId, limit) {
    const searchHistory = await userSearchRepository.getSearchHistory(userId, limit);
    
    return {
      searchHistory: searchHistory.map(history => ({
        id: history.id,
        searchTerm: history.searchTerm,
        searchedAt: toKSTISOString(history.searchedAt)
      }))
    };
  }

  /**
   * 검색 기록 삭제
   * @param {number} userId - 사용자 ID
   * @param {number} historyId - 삭제할 검색 기록 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteSearchHistory(userId, historyId) {
    // 검색 기록이 존재하는지 확인
    const history = await userSearchRepository.getSearchHistoryById(historyId);
    
    if (!history) {
      throw new NotFoundError('검색 기록을 찾을 수 없습니다');
    }

    // 본인의 검색 기록인지 확인
    if (history.userId !== userId) {
      throw new ValidationError('본인의 검색 기록만 삭제할 수 있습니다');
    }

    await userSearchRepository.deleteSearchHistory(historyId);
    
    return {
      message: '검색 기록이 삭제되었습니다'
    };
  }
}

export const userSearchService = new UserSearchService();
