import { demoRepository } from '../repositories/demo.repository.js';
import { demoDto } from '../dtos/demo.dto.js';
import { nanoid } from 'nanoid';

class DemoService {
  /**
   * 데모 이벤트 생성
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 데모 이벤트
   */
  async createDemoEvent(userId) {
    // 이미 데모 이벤트가 있는지 확인
    const existingEvent = await demoRepository.findDemoEventByUserId(userId);
    if (existingEvent) {
      const error = new Error('이미 데모 이벤트가 존재합니다');
      error.status = 400;
      throw error;
    }

    // 고유한 공유 링크 생성
    const shareLink = nanoid(10); // 10자리 고유 ID 생성

    const demoEventData = {
      userId,
      shareLink,
      title: '나에게 편지를 써주세요!',
      isActive: true
    };

    const demoEvent = await demoRepository.createDemoEvent(demoEventData);
    return demoDto.toDemoEventResponse(demoEvent);
  }

  /**
   * 사용자 ID로 데모 이벤트 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 데모 이벤트 정보
   */
  async getDemoEventByUserId(userId) {
    const demoEvent = await demoRepository.findDemoEventByUserId(userId);
    if (!demoEvent) {
      const error = new Error('데모 이벤트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    return demoDto.toDemoEventResponse(demoEvent);
  }

  /**
   * 공유 링크로 데모 이벤트 조회 (비회원 접근 가능)
   * @param {string} shareLink - 공유 링크
   * @returns {Promise<Object>} 데모 이벤트 정보
   */
  async getDemoEventByShareLink(shareLink) {
    const demoEvent = await demoRepository.findDemoEventByShareLink(shareLink);
    if (!demoEvent || !demoEvent.isActive) {
      const error = new Error('데모 이벤트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    return demoDto.toDemoEventPublicResponse(demoEvent);
  }

  /**
   * 데모 편지 작성 (비회원 접근 가능)
   * @param {string} shareLink - 공유 링크
   * @param {string} writerName - 작성자 이름
   * @param {string} content - 편지 내용
   * @returns {Promise<Object>} 생성된 편지 정보
   */
  async createDemoLetter(shareLink, writerName, content) {
    // 데모 이벤트 존재 및 활성화 확인
    const demoEvent = await demoRepository.findDemoEventByShareLink(shareLink);
    if (!demoEvent || !demoEvent.isActive) {
      const error = new Error('유효하지 않은 공유 링크입니다');
      error.status = 404;
      throw error;
    }

    // 입력 데이터 검증
    if (!writerName || writerName.trim().length === 0) {
      const error = new Error('작성자 이름을 입력해주세요');
      error.status = 400;
      throw error;
    }

    if (!content || content.trim().length === 0) {
      const error = new Error('편지 내용을 입력해주세요');
      error.status = 400;
      throw error;
    }

    if (writerName.length > 50) {
      const error = new Error('작성자 이름은 50자를 초과할 수 없습니다');
      error.status = 400;
      throw error;
    }

    if (content.length > 5000) {
      const error = new Error('편지 내용은 5000자를 초과할 수 없습니다');
      error.status = 400;
      throw error;
    }

    const letterData = {
      demoEventId: demoEvent.id,
      writerName: writerName.trim(),
      content: content.trim(),
      isRead: false
    };

    const demoLetter = await demoRepository.createDemoLetter(letterData);
    return demoDto.toDemoLetterResponse(demoLetter);
  }

  /**
   * 사용자의 데모 편지들 조회
   * @param {number} userId - 사용자 ID
   * @param {Object} options - 페이지네이션 옵션
   * @returns {Promise<Object>} 편지 목록과 페이지 정보
   */
  async getDemoLettersByUserId(userId, options) {
    const { page, size } = options;

    // 사용자의 데모 이벤트 확인
    const demoEvent = await demoRepository.findDemoEventByUserId(userId);
    if (!demoEvent) {
      const error = new Error('데모 이벤트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    const skip = (page - 1) * size;
    
    const [letters, total] = await Promise.all([
      demoRepository.findDemoLettersByEventId(demoEvent.id, skip, size),
      demoRepository.countDemoLettersByEventId(demoEvent.id)
    ]);

    const totalPages = Math.ceil(total / size);

    return {
      content: letters.map(letter => demoDto.toDemoLetterResponse(letter)),
      page,
      size,
      totalPages,
      totalElements: total
    };
  }

  /**
   * 데모 편지 읽음 처리
   * @param {number} letterId - 편지 ID
   * @param {number} userId - 사용자 ID
   */
  async markDemoLetterAsRead(letterId, userId) {
    // 편지 존재 확인
    const letter = await demoRepository.findDemoLetterById(letterId);
    if (!letter) {
      const error = new Error('편지를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    // 권한 확인 (편지의 주인인지 확인)
    if (letter.demoEvent.userId !== userId) {
      const error = new Error('편지를 읽을 권한이 없습니다');
      error.status = 403;
      throw error;
    }

    // 읽음 처리
    await demoRepository.markDemoLetterAsRead(letterId);
  }

  /**
   * ID로 데모 편지 조회 (공개용 - 권한 검사 없음)
   * @param {number} letterId - 편지 ID
   * @returns {Promise<Object>} 편지 정보
   */
  async getDemoLetterByIdPublic(letterId) {
    const letter = await demoRepository.findDemoLetterById(letterId);
    if (!letter) {
      const error = new Error('편지를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    return demoDto.toDemoLetterResponse(letter);
  }

  /**
   * ID로 데모 편지 조회 (권한 검사 포함)
   * @param {number} letterId - 편지 ID
   * @param {number} userId - 요청 사용자 ID
   * @returns {Promise<Object>} 편지 정보
   */
  async getDemoLetterById(letterId, userId) {
    const letter = await demoRepository.findDemoLetterById(letterId);
    if (!letter) {
      const error = new Error('편지를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    // 권한 확인 (내 데모 이벤트에 작성된 편지인지 확인)
    // 편지를 받은 사람(데모 이벤트 소유자)만 편지를 볼 수 있음
    if (letter.demoEvent.userId !== userId) {
      const error = new Error('편지를 읽을 권한이 없습니다');
      error.status = 403;
      throw error;
    }

    return demoDto.toDemoLetterResponse(letter);
  }

  /**
   * 데모 이벤트 비활성화
   * @param {number} userId - 사용자 ID
   */
  async deactivateDemoEvent(userId) {
    const demoEvent = await demoRepository.findDemoEventByUserId(userId);
    if (!demoEvent) {
      const error = new Error('데모 이벤트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    await demoRepository.updateDemoEvent(demoEvent.id, { isActive: false });
  }

  /**
   * 데모 이벤트 삭제 (관리자용)
   * @param {number} userId - 사용자 ID
   */
  async deleteDemoEvent(userId) {
    const demoEvent = await demoRepository.findDemoEventByUserId(userId);
    if (!demoEvent) {
      const error = new Error('데모 이벤트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    await demoRepository.deleteDemoEvent(demoEvent.id);
  }
}

export const demoService = new DemoService();
