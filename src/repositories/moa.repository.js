import prisma from '../config/prismaClient.js';

class MoaRepository {
// 사용자가 관련된 모든 모아모아 조회 (참여/미참여 포함)

  async getMoas(userId, { limit, cursor, direction }) {
    // where 조건 구성
    const where = this.buildWhereCondition(cursor, direction);
    
    // 정렬 조건 설정
    const orderBy = { createdAt: direction === 'next' ? 'desc' : 'asc' };

    // 데이터베이스 쿼리 실행
    const events = await prisma.birthdayEvent.findMany({
      where,
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        },
        participants: {
          where: { userId }, // 현재 사용자의 참여 여부만 확인
          select: { userId: true }
        }
      },
      orderBy,
      take: limit + 1 // 다음 페이지 존재 여부 확인용
    });

    // 사용자가 볼 수 있는 이벤트만 필터링
    const visibleEvents = await this.filterVisibleEvents(events, userId);

    // 참여 상태 정보 추가하여 반환
    return visibleEvents.map(event => ({
      ...event,
      isParticipating: event.participants.length > 0
    }));
  }


// Where 조건 빌드
  buildWhereCondition(cursor, direction) {
    let where = {
      status: {
        in: ['active', 'completed']
      }
    };

    if (cursor) {
      if (direction === 'next') {
        where.createdAt = { lt: new Date(cursor.createdAt) };
      } else {
        where.createdAt = { gt: new Date(cursor.createdAt) };
      }
    }

    return where;
  }

  /**
   * 사용자가 볼 수 있는 이벤트 필터링
   */
  async filterVisibleEvents(events, userId) {
    const visibleEvents = [];

    for (const event of events) {
      // 자신이 생일 주인공인 경우
      if (event.birthdayPersonId === userId) {
        visibleEvents.push(event);
        continue;
      }

      // 팔로우한 사람의 이벤트인지 확인
      const isFollowing = await prisma.follow.findFirst({
        where: {
          followerId: userId,
          followingId: event.birthdayPersonId
        }
      });

      if (isFollowing) {
        visibleEvents.push(event);
      }
    }

    return visibleEvents;
  }
}

export const moaRepository = new MoaRepository();
