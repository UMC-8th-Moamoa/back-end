import { moaRepository } from '../repositories/moa.repository.js';
import { MoaResponseDTO } from '../dtos/moa.dto.js';
import { getMainBanner } from './main.banner.service.js';
import { upcomingBirthdayService } from './upcomingBirthday.service.js';
import userRepository from '../repositories/userRepository.repositories.js';

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
    // userId를 DTO에 전달하여 본인/참여자 분기 및 배너 타입 결정
    const responseDTO = new MoaResponseDTO(
      paginationInfo.processedMoas,
      paginationInfo.pagination,
      userId
    );

    // 사용자 정보 조회 (생일 포함)
    const user = await userRepository.findById(userId);

    // upcomingBirthdays 조회
    const upcomingBirthdaysResult = await upcomingBirthdayService.getUpcomingBirthdays(userId, { days: 7, limit: 3 });
    const upcomingBirthdays = upcomingBirthdaysResult?.upcomingBirthdays || [];

    // mainBanner 정보 추가 (user, upcomingBirthdays 전달)
    const mainBanner = getMainBanner(user, responseDTO.moas, upcomingBirthdays);

    // subBanners: 참여 중인 친구 모아, 인증 필요 모아 등 (mainBanner와 중복되지 않게)
    const subBanners = [];
    // 참여 중인 친구 모아 (본인 제외, 진행 중)
    responseDTO.moas.forEach(moa => {
      if (moa.bannerType === 'participating') {
        subBanners.push({
          type: 'participating',
          title: `${moa.birthdayPersonName}님의 모아모아 참여 중`,
          description: '',
          actionText: '진행도 보러 가기',
          moaId: moa.id
        });
      }
      // 선물 인증 필요 (본인 && 종료 && needCertification)
      if (moa.bannerType === 'certification') {
        subBanners.push({
          type: 'certification',
          title: '받은 선물을 인증해보세요',
          description: '',
          actionText: '선물 인증하기',
          moaId: moa.id
        });
      }
    });

    // mainBanner, subBanners 필드 포함하여 반환
    return {
      ...responseDTO.toResponse(),
      mainBanner,
      subBanners
    };
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