import express from 'express';
import prisma from './src/config/prismaClient.js';

const router = express.Router();

// 데이터베이스 연결 및 테이블 존재 확인
router.get('/db-status', async (req, res) => {
  try {
    console.log('🔍 [Debug] 데이터베이스 상태 확인 시작');
    
    // 1. Prisma 연결 테스트
    await prisma.$connect();
    console.log('✅ [Debug] Prisma 연결 성공');
    
    // 2. 간단한 쿼리 테스트
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [Debug] 기본 쿼리 테스트 성공:', result);
    
    // 3. 테이블 존재 확인
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('users', 'birthday_events', 'birthday_event_participants', 'letters')
    `;
    console.log('✅ [Debug] 테이블 존재 확인:', tables);
    
    // 4. 각 테이블 레코드 수 확인
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const eventCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM birthday_events`;
    const participantCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM birthday_event_participants`;
    const letterCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM letters`;
    
    const counts = {
      users: userCount[0]?.count || 0,
      birthday_events: eventCount[0]?.count || 0,
      birthday_event_participants: participantCount[0]?.count || 0,
      letters: letterCount[0]?.count || 0
    };
    
    console.log('✅ [Debug] 테이블별 레코드 수:', counts);
    
    // 5. 실제 letterHome 쿼리 테스트 (userId=1로)
    const testQuery = `
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
      ORDER BY be.createdAt DESC, be.id DESC
      LIMIT ?
    `;
    
    console.log('🔍 [Debug] letterHome 쿼리 테스트 시작');
    const testResult = await prisma.$queryRawUnsafe(testQuery, 1, 1, 4);
    console.log('✅ [Debug] letterHome 쿼리 성공:', testResult);
    
    res.json({
      success: true,
      message: '데이터베이스 연결 및 쿼리 테스트 성공',
      data: {
        tables,
        counts,
        testQuery: testResult
      }
    });
    
  } catch (error) {
    console.error('❌ [Debug] 데이터베이스 상태 확인 실패:', error);
    console.error('❌ [Debug] Error name:', error.name);
    console.error('❌ [Debug] Error message:', error.message);
    console.error('❌ [Debug] Error code:', error.code);
    console.error('❌ [Debug] Error stack:', error.stack);
    
    if (error.meta) {
      console.error('❌ [Debug] Prisma meta:', error.meta);
    }
    
    res.status(500).json({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      }
    });
  }
});

export default router;
