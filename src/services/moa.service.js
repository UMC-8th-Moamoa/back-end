import { moaRepository } from '../repositories/moa.repository.js';
import { MoaResponseDTO } from '../dtos/moa.dto.js';

class MoaService {

// 사용자가 참여한 모아모아 목록 조회
  async getMoas(userId, { limit = 1, cursor = null, direction = 'next' }) {
    // 데이터 조회
    const moas = await moaRepository.getMoas(userId, {
      limit,
      cursor,
      direction
    });

    // 페이지네이션 정보 계산
    const paginationInfo = this.calculatePagination(moas, limit, direction);

    // DTO로 응답 데이터 구성
    const responseDTO = new MoaResponseDTO(
      paginationInfo.processedMoas,
      paginationInfo.pagination
    );

    return responseDTO.toResponse();
  }

// 페이지네이션 정보 계산
  calculatePagination(moas, limit, direction) {
    // 다음 페이지 존재 여부 확인
    const hasMore = moas.length > limit;
    if (hasMore) {
      moas.pop(); // 마지막 아이템 제거 (페이지네이션 확인용)
    }

    // direction이 prev인 경우 순서 뒤집기
    if (direction === 'prev') {
      moas.reverse();
    }

    // 커서 생성
    const nextCursor = moas.length > 0 ? 
      this.createCursor(moas[moas.length - 1]) : null;

    const prevCursor = moas.length > 0 ? 
      this.createCursor(moas[0]) : null;

    return {
      processedMoas: moas,
      pagination: {
        hasNext: direction === 'next' ? hasMore : true,
        hasPrev: direction === 'prev' ? hasMore : !!prevCursor,
        nextCursor: direction === 'next' && hasMore ? nextCursor : null,
        prevCursor: direction === 'prev' && hasMore ? prevCursor : null
      }
    };
  }

// 커서 생성
  createCursor(moa) {
    return Buffer.from(JSON.stringify({
      id: moa.id,
      createdAt: moa.createdAt
    })).toString('base64');
  }
}

export const moaService = new MoaService();