import prisma from '../config/prismaClient.js';

class CalendarRepository {
  // 특정 월에 생일이 있는 팔로우한 사용자들 조회
  async getFriendsBirthdaysInMonth(userId, startDate, endDate) {
    // 해당 월의 월과 일 범위 계산
    const month = startDate.getMonth() + 1; // 1-12
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    const followedUsers = await prisma.user.findMany({
      where: {
        AND: [
          // 내가 팔로우한 사용자들 (일방향 관계)
          {
            followers: {
              some: {
                followerId: userId // 내가 이 사용자를 팔로우
              }
            }
          },
          // 생일이 null이 아닌 사용자들
          {
            birthday: {
              not: null
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        photo: true,
        birthday: true,
        // 활성 생일 이벤트가 있는지 확인
        birthdayEvents: {
          where: {
            status: 'active',
            deadline: {
              gte: new Date() // 마감일이 현재보다 미래인 이벤트
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    // 생일이 해당 월에 있는 팔로우한 사용자들만 필터링
    const filteredFollowedUsers = followedUsers.filter(user => {
      if (!user.birthday) return false;
      
      const userBirthdayMonth = user.birthday.getMonth() + 1;
      const userBirthdayDay = user.birthday.getDate();
      
      // 월이 일치하는지 확인
      if (userBirthdayMonth !== month) return false;
      
      // 일이 범위 내에 있는지 확인
      return userBirthdayDay >= startDay && userBirthdayDay <= endDay;
    });

    // 결과 데이터 가공
    return filteredFollowedUsers.map(user => ({
      id: user.id,
      name: user.name,
      photo: user.photo,
      birthday: user.birthday,
      hasActiveEvent: user.birthdayEvents.length > 0
    }));
  }

  // 특정 날짜(월/일)에 생일인 팔로우한 사용자들 조회
  async getFriendsBirthdaysBySpecificDate(userId, month, day) {
    const followedUsers = await prisma.user.findMany({
      where: {
        AND: [
          // 내가 팔로우한 사용자들 (일방향 관계)
          {
            followers: {
              some: {
                followerId: userId // 내가 이 사용자를 팔로우
              }
            }
          },
          // 생일이 null이 아닌 사용자들
          {
            birthday: {
              not: null
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        birthday: true
      }
    });

    // 해당 월/일에 생일인 사용자들만 필터링
    const birthdayUsers = followedUsers.filter(user => {
      if (!user.birthday) return false;
      
      const userBirthdayMonth = user.birthday.getMonth() + 1;
      const userBirthdayDay = user.birthday.getDate();
      
      // 월과 일이 모두 일치하는지 확인
      return userBirthdayMonth === month && userBirthdayDay === day;
    });

    // 결과 데이터 가공
    return birthdayUsers.map(user => ({
      id: user.id,
      name: user.name,
      birthday: user.birthday
    }));
  }

  // 특정 사용자가 팔로우하는 사용자 목록 조회 (생일 정보 포함)
  async getUserFollowings(userId) {
    const followings = await prisma.follow.findMany({
      where: {
        followerId: userId // 내가 팔로우하는 사람들
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            photo: true,
            birthday: true
          }
        }
      }
    });

    // 팔로우하는 사용자 정보 추출
    return followings.map(follow => ({
      id: follow.following.id,
      name: follow.following.name,
      photo: follow.following.photo,
      birthday: follow.following.birthday
    }));
  }
}

export const calendarRepository = new CalendarRepository();