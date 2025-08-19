import prisma from '../config/prismaClient.js';

class LetterHomeRepository {
  /**
   * 사용자가 참여 중인 생일 이벤트와 편지 정보 조회 (스와이프)
   */
  async getBirthdayEventsWithLetters(userId, limit, cursor = null, direction = 'next') {
    let params; // catch 블록에서도 접근 가능하도록 상위 스코프에 선언
    
    try {
      let whereClause = '';
      let orderClause = 'ORDER BY be.createdAt DESC, be.id DESC';
      params = [userId, userId]; // senderId와 userId 모두 필요

      // 커서 기반 페이지네이션
      if (cursor && cursor.id && cursor.createdAt) {
        const cursorDate = new Date(cursor.createdAt);
        
        if (direction === 'next') {
          // 다음 페이지: 현재 커서보다 이전 데이터
          whereClause = `AND (
            be.createdAt < ? OR (be.createdAt = ? AND be.id < ?)
          )`;
          params.push(cursorDate, cursorDate, cursor.id);
        } else if (direction === 'prev') {
          // 이전 페이지: 현재 커서보다 이후 데이터
          whereClause = `AND (
            be.createdAt > ? OR (be.createdAt = ? AND be.id > ?)
          )`;
          params.push(cursorDate, cursorDate, cursor.id);
          orderClause = 'ORDER BY be.createdAt ASC, be.id ASC'; // 역순 정렬
        }
      }

      params.push(limit);

      const query = `
        SELECT 
          be.id,
          be.createdAt,
          bp.name as birthdayPersonName,
          bp.photo as birthdayPersonPhoto,
          bp.birthday as birthdayPersonBirthday,
          CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as hasLetter,
          l.id as letterId,
          l.updatedAt as lastModified
        FROM birthday_events be
        INNER JOIN users bp ON be.birthdayPersonId = bp.id
        INNER JOIN birthday_event_participants ep ON be.id = ep.eventId
        LEFT JOIN letters l ON be.id = l.birthdayEventId AND l.senderId = ?
        WHERE ep.userId = ?
          AND be.status = 'active'
          AND be.deadline >= CURDATE()
          ${whereClause}
        ${orderClause}
        LIMIT ?
      `;

      console.log('🔍 [Repository] 실행할 SQL:', query);
      console.log('🔍 [Repository] SQL 파라미터:', params);

      const events = await prisma.$queryRawUnsafe(query, ...params);
      
      return events.map(row => ({
        id: Number(row.id),
        createdAt: row.createdAt,
        birthdayPersonName: row.birthdayPersonName,
        birthdayPersonPhoto: row.birthdayPersonPhoto,
        birthdayPersonBirthday: row.birthdayPersonBirthday,
        hasLetter: Boolean(row.hasLetter),
        letterId: row.letterId ? Number(row.letterId) : null,
        lastModified: row.lastModified
      }));
    } catch (error) {
      console.error('❌ [Repository] 생일 이벤트 조회 실패:', error);
      console.error('❌ [Repository] Error name:', error.name);
      console.error('❌ [Repository] Error message:', error.message);
      console.error('❌ [Repository] Error code:', error.code);
      console.error('❌ [Repository] SQL 파라미터:', params);
      throw new Error('생일 이벤트 조회 중 오류가 발생했습니다.');
    }
  }
}

export const letterHomeRepository = new LetterHomeRepository();