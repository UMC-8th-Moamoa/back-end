import prisma from '../config/prismaClient.js';

// 편지 홈 화면 관련 데이터베이스 접근 계층

class LetterHomeRepository {

// 사용자가 참여 중인 생일 이벤트와 편지 정보 조회
  async getBirthdayEventsWithLetters(userId, { limit, cursor, direction }) {
    // 커서 기반 where 조건 생성
    let cursorCondition = {};
    if (cursor) {
      if (direction === 'next') {
        cursorCondition = {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              AND: [
                { createdAt: new Date(cursor.createdAt) },
                { id: { lt: cursor.id } }
              ]
            }
          ]
        };
      } else {
        cursorCondition = {
          OR: [
            { createdAt: { gt: new Date(cursor.createdAt) } },
            {
              AND: [
                { createdAt: new Date(cursor.createdAt) },
                { id: { gt: cursor.id } }
              ]
            }
          ]
        };
      }
    }

    // 사용자가 참여 중인 생일 이벤트 조회
    const events = await prisma.birthdayEvent.findMany({
      where: {
        AND: [
          // 활성 상태인 이벤트
          { status: 'active' },
          // 마감일이 아직 지나지 않은 이벤트
          { deadline: { gte: new Date() } },
          // 사용자가 참여 중인 이벤트
          {
            participants: {
              some: {
                userId: userId
              }
            }
          },
          // 커서 조건
          cursorCondition
        ]
      },
      include: {
        // 생일 주인공 정보
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true,
            birthday: true
          }
        },
        // 현재 사용자가 작성한 편지 정보
        letters: {
          where: {
            senderId: userId
          },
          select: {
            id: true,
            updatedAt: true,
            sentAt: true
          },
          take: 1
        }
      },
      orderBy: [
        { createdAt: direction === 'prev' ? 'asc' : 'desc' },
        { id: direction === 'prev' ? 'asc' : 'desc' }
      ],
      take: limit
    });

    // 편지 정보를 단일 객체로 변환
    return events.map(event => ({
      ...event,
      userLetter: event.letters.length > 0 ? event.letters[0] : null,
      letters: undefined // letters 배열 제거
    }));
  }
}

export const letterHomeRepository = new LetterHomeRepository();