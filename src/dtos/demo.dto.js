class DemoDto {
  /**
   * 데모 이벤트 응답 DTO
   * @param {Object} demoEvent - 데모 이벤트 데이터
   * @returns {Object} 응답 데이터
   */
  toDemoEventResponse(demoEvent) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      id: demoEvent.id,
      userId: demoEvent.userId,
      shareLink: demoEvent.shareLink,
      shareUrl: `${baseUrl}/demo/${demoEvent.shareLink}`, // 완전한 공유 URL
      title: demoEvent.title,
      isActive: demoEvent.isActive,
      createdAt: demoEvent.createdAt,
      updatedAt: demoEvent.updatedAt,
      user: demoEvent.user ? {
        id: demoEvent.user.id,
        name: demoEvent.user.name,
        user_id: demoEvent.user.user_id
      } : null
    };
  }

  /**
   * 공개용 데모 이벤트 응답 DTO (비회원도 볼 수 있는 정보)
   * @param {Object} demoEvent - 데모 이벤트 데이터
   * @returns {Object} 공개 응답 데이터
   */
  toDemoEventPublicResponse(demoEvent) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      id: demoEvent.id,
      title: demoEvent.title,
      userName: demoEvent.user ? demoEvent.user.name : '알 수 없음',
      shareLink: demoEvent.shareLink,
      shareUrl: `${baseUrl}/demo/${demoEvent.shareLink}`, // 완전한 공유 URL
      isActive: demoEvent.isActive
    };
  }

  /**
   * 데모 편지 응답 DTO
   * @param {Object} demoLetter - 데모 편지 데이터
   * @returns {Object} 응답 데이터
   */
  toDemoLetterResponse(demoLetter) {
    return {
      id: demoLetter.id,
      demoEventId: demoLetter.demoEventId,
      writerName: demoLetter.writerName,
      content: demoLetter.content,
      isRead: demoLetter.isRead,
      createdAt: demoLetter.createdAt,
      updatedAt: demoLetter.updatedAt
    };
  }

  /**
   * 데모 편지 목록 응답 DTO
   * @param {Array} letters - 편지 목록
   * @param {Object} pagination - 페이지네이션 정보
   * @returns {Object} 목록 응답 데이터
   */
  toDemoLetterListResponse(letters, pagination) {
    return {
      content: letters.map(letter => this.toDemoLetterResponse(letter)),
      ...pagination
    };
  }

  /**
   * 데모 편지 공개 응답 DTO (편지 작성 후 반환용)
   * @param {Object} demoLetter - 데모 편지 데이터
   * @returns {Object} 공개 응답 데이터
   */
  toDemoLetterPublicResponse(demoLetter) {
    return {
      id: demoLetter.id,
      writerName: demoLetter.writerName,
      message: '편지가 성공적으로 전달되었습니다!',
      createdAt: demoLetter.createdAt
    };
  }

  /**
   * 데모 이벤트 통계 DTO
   * @param {Object} demoEvent - 데모 이벤트
   * @param {number} totalLetters - 총 편지 수
   * @param {number} unreadLetters - 읽지 않은 편지 수
   * @returns {Object} 통계 데이터
   */
  toDemoEventStatsResponse(demoEvent, totalLetters, unreadLetters) {
    return {
      ...this.toDemoEventResponse(demoEvent),
      stats: {
        totalLetters,
        unreadLetters,
        readLetters: totalLetters - unreadLetters
      }
    };
  }
}

export const demoDto = new DemoDto();
