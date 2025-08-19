// 디버깅: 사용자의 이벤트 참여 상태 확인
export const checkUserEventParticipation = async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: '인증 필요' });
  }

  try {
    const query = `
      SELECT 
        be.id as eventId,
        be.title,
        be.deadline,
        be.status,
        bp.name as birthdayPersonName,
        ep.userId as participantId,
        ep.createdAt as participationDate
      FROM birthday_events be
      INNER JOIN users bp ON be.birthdayPersonId = bp.id
      INNER JOIN birthday_event_participants ep ON be.id = ep.eventId
      WHERE ep.userId = ?
      ORDER BY be.createdAt DESC
      LIMIT 10
    `;

    const events = await prisma.$queryRawUnsafe(query, userId);
    
    res.json({
      userId,
      totalEvents: events.length,
      events: events.map(event => ({
        eventId: Number(event.eventId),
        title: event.title,
        birthdayPersonName: event.birthdayPersonName,
        deadline: event.deadline,
        status: event.status,
        participationDate: event.participationDate
      }))
    });
    
  } catch (error) {
    console.error('이벤트 참여 확인 오류:', error);
    res.status(500).json({ error: error.message });
  }
};
