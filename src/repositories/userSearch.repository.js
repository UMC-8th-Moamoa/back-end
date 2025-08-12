import prisma from '../config/prismaClient.js';

class UserSearchRepository {
  /**
   * 사용자 검색
   * @param {number} currentUserId - 현재 사용자 ID
   * @param {string} searchTerm - 검색어
   * @param {number} limit - 검색 결과 개수
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 검색 결과와 총 개수
   */
  async searchUsers(currentUserId, searchTerm, limit, page) {
    const offset = (page - 1) * limit;
    
    const whereCondition = {
      AND: [
        // 현재 사용자 제외
        {
          id: {
            not: currentUserId
          }
        },
        // 검색어 조건 (이름 또는 사용자 ID)
        {
          OR: [
            {
              name: {
                contains: searchTerm
              }
            },
            {
              user_id: {
                contains: searchTerm
              }
            }
          ]
        }
      ]
    };

    // 검색된 사용자들과 팔로우 관계 조회
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        user_id: true,
        name: true,
        photo: true,
        birthday: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        },
        // 현재 사용자가 이 사용자를 팔로우하는지
        followers: {
          where: {
            followerId: currentUserId
          },
          select: {
            id: true
          }
        },
        // 이 사용자가 현재 사용자를 팔로우하는지
        following: {
          where: {
            followingId: currentUserId
          },
          select: {
            id: true
          }
        }
      },
      orderBy: [
        {
          name: 'asc'
        }
      ],
      skip: offset,
      take: limit
    });

    // 총 검색 결과 수 조회
    const totalCount = await prisma.user.count({
      where: whereCondition
    });

    // 팔로우 관계 정보 추가
    const usersWithFollowInfo = users.map(user => ({
      ...user,
      isFollowing: user.followers.length > 0,
      isFollower: user.following.length > 0,
      // 불필요한 중간 데이터 제거
      followers: undefined,
      following: undefined
    }));

    return {
      users: usersWithFollowInfo,
      totalCount
    };
  }

  /**
   * 검색 기록 저장
   * @param {number} userId - 사용자 ID
   * @param {string} searchTerm - 검색어
   * @returns {Promise<void>}
   */
  async saveSearchHistory(userId, searchTerm) {
    // 한국 시간으로 설정 (UTC+9)
    const koreaTime = new Date();
    koreaTime.setHours(koreaTime.getHours() + 9);
    
    // 동일한 검색어가 이미 있는지 확인
    const existingHistory = await prisma.searchHistory.findFirst({
      where: {
        userId,
        searchTerm
      }
    });

    if (existingHistory) {
      // 기존 검색 기록의 시간을 업데이트
      await prisma.searchHistory.update({
        where: {
          id: existingHistory.id
        },
        data: {
          searchedAt: koreaTime
        }
      });
    } else {
      // 새로운 검색 기록 저장
      await prisma.searchHistory.create({
        data: {
          userId,
          searchTerm,
          searchedAt: koreaTime
        }
      });

      // 최대 50개 검색 기록 유지 (초과시 오래된 것부터 삭제)
      await this.cleanupOldSearchHistory(userId);
    }
  }

  /**
   * 검색 기록 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 검색 기록 수
   * @returns {Promise<Array>} 검색 기록 목록
   */
  async getSearchHistory(userId, limit) {
    return await prisma.searchHistory.findMany({
      where: {
        userId
      },
      orderBy: {
        searchedAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * 검색 기록 ID로 조회
   * @param {number} historyId - 검색 기록 ID
   * @returns {Promise<Object|null>} 검색 기록
   */
  async getSearchHistoryById(historyId) {
    return await prisma.searchHistory.findUnique({
      where: {
        id: historyId
      }
    });
  }

  /**
   * 검색 기록 삭제
   * @param {number} historyId - 검색 기록 ID
   * @returns {Promise<void>}
   */
  async deleteSearchHistory(historyId) {
    await prisma.searchHistory.delete({
      where: {
        id: historyId
      }
    });
  }

  /**
   * 오래된 검색 기록 정리 (50개 초과시)
   * @param {number} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async cleanupOldSearchHistory(userId) {
    const historyCount = await prisma.searchHistory.count({
      where: {
        userId
      }
    });

    if (historyCount > 50) {
      // 가장 오래된 검색 기록들 조회
      const oldHistories = await prisma.searchHistory.findMany({
        where: {
          userId
        },
        orderBy: {
          searchedAt: 'asc'
        },
        take: historyCount - 50,
        select: {
          id: true
        }
      });

      // 오래된 검색 기록들 삭제
      const oldHistoryIds = oldHistories.map(h => h.id);
      await prisma.searchHistory.deleteMany({
        where: {
          id: {
            in: oldHistoryIds
          }
        }
      });
    }
  }
}

export const userSearchRepository = new UserSearchRepository();
