import prisma from '../config/prismaClient.js';

class UpcomingBirthdayRepository {
  /**
   * 팔로우한 친구들의 다가오는 생일 조회 (스와이프)
   */
  async getUpcomingBirthdays(userId, days, limit, cursor = null, direction = 'next') {
    try {
      let whereClause = '';
      let orderClause = 'ORDER BY d_day ASC, u.id ASC';
      let params = [userId, days];

      // 커서 기반 페이지네이션
      if (cursor) {
        if (direction === 'next') {
          // 다음 페이지: 현재 커서보다 뒤의 데이터
          whereClause = `AND (
            CASE 
              WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
              WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
              ELSE
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
            END > ? OR (
              CASE 
                WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
                WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                  DATEDIFF(
                    DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                    CURDATE()
                  )
                ELSE
                  DATEDIFF(
                    DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                    CURDATE()
                  )
              END = ? AND u.id > ?
            )
          )`;
          params.push(cursor.dDay, cursor.dDay, cursor.id);
        } else if (direction === 'prev') {
          // 이전 페이지: 현재 커서보다 앞의 데이터
          whereClause = `AND (
            CASE 
              WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
              WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
              ELSE
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
            END < ? OR (
              CASE 
                WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
                WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                  DATEDIFF(
                    DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                    CURDATE()
                  )
                ELSE
                  DATEDIFF(
                    DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                    CURDATE()
                  )
              END = ? AND u.id < ?
            )
          )`;
          params.push(cursor.dDay, cursor.dDay, cursor.id);
          orderClause = 'ORDER BY d_day DESC, u.id DESC'; // 역순 정렬
        }
      }

      params.push(limit);

      const query = `
        SELECT 
          u.id as friend_id,
          u.name as friend_name,
          u.photo as friend_photo,
          u.birthday as birthday_date,
          CASE 
            WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
            WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
              DATEDIFF(
                DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                CURDATE()
              )
            ELSE
              DATEDIFF(
                DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                CURDATE()
              )
          END as d_day
        FROM users u
        INNER JOIN follows f ON u.id = f.followingId
        WHERE f.followerId = ?
          AND u.birthday IS NOT NULL
          AND (
            CASE 
              WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
              WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
              ELSE
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
            END
          ) <= ?
          ${whereClause}
        ${orderClause}
        LIMIT ?
      `;

      const upcomingBirthdays = await prisma.$queryRawUnsafe(query, ...params);
      
      return upcomingBirthdays.map(row => ({
        friend: {
          id: Number(row.friend_id),
          name: row.friend_name,
          photo: row.friend_photo
        },
        birthday: {
          date: row.birthday_date,
          dDay: Number(row.d_day)
        }
      }));
    } catch (error) {
      console.error('다가오는 생일 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 다가오는 생일 조회
   */
  async getAllUpcomingBirthdays(userId, days) {
    try {
      const upcomingBirthdays = await prisma.$queryRaw`
        SELECT 
          u.id as friend_id,
          u.name as friend_name,
          u.photo as friend_photo,
          u.birthday as birthday_date,
          CASE 
            WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
            WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
              DATEDIFF(
                DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                CURDATE()
              )
            ELSE
              DATEDIFF(
                DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                CURDATE()
              )
          END as d_day
        FROM users u
        INNER JOIN follows f ON u.id = f.followingId
        WHERE f.followerId = ${userId}
          AND u.birthday IS NOT NULL
          AND (
            CASE 
              WHEN DATE_FORMAT(u.birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d') THEN 0
              WHEN DATE_FORMAT(u.birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
              ELSE
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(u.birthday), '-', DAY(u.birthday))), 
                  CURDATE()
                )
            END
          ) <= ${days}
        ORDER BY d_day ASC, u.id ASC
      `;
      
      return upcomingBirthdays.map(row => ({
        friend: {
          id: Number(row.friend_id),
          name: row.friend_name,
          photo: row.friend_photo
        },
        birthday: {
          date: row.birthday_date,
          dDay: Number(row.d_day)
        }
      }));
    } catch (error) {
      console.error('다가오는 생일 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 일수 후 생일인 사용자들 조회
   */
  async getBirthdaysAfterDays(days) {
    try {
      const users = await prisma.$queryRaw`
        SELECT 
          id as user_id,
          name as user_name,
          birthday as birthday_date
        FROM users
        WHERE birthday IS NOT NULL
          AND (
            CASE 
              WHEN DATE_FORMAT(birthday, '%m-%d') > DATE_FORMAT(CURDATE(), '%m-%d') THEN
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(birthday), '-', DAY(birthday))), 
                  CURDATE()
                )
              ELSE
                DATEDIFF(
                  DATE(CONCAT(YEAR(CURDATE()) + 1, '-', MONTH(birthday), '-', DAY(birthday))), 
                  CURDATE()
                )
            END
          ) = ${days}
      `;

      return users.map(row => ({
        userId: Number(row.user_id),
        userName: row.user_name,
        birthdayDate: row.birthday_date
      }));
    } catch (error) {
      console.error('특정 일수 후 생일 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 팔로우 관계 확인
   */
  async isFollowing(followerUserId, followingUserId) {
    try {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followerUserId,
            followingId: followingUserId
          }
        }
      });

      return !!followRelation;
    } catch (error) {
      console.error('팔로우 관계 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 팔로우한 친구들 목록 조회 (간단한 버전)
   */
  async getFollowingUsers(userId) {
    try {
      return await prisma.follow.findMany({
        where: {
          followerId: userId
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
    } catch (error) {
      console.error('팔로우 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 기본 정보 조회
   */
  async findUserById(userId) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          photo: true,
          birthday: true
        }
      });
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      throw error;
    }
  }
}

export const upcomingBirthdayRepository = new UpcomingBirthdayRepository();