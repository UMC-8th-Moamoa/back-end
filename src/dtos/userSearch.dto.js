/**
 * 사용자 검색 관련 DTO (Data Transfer Object)
 * 클라이언트와 서버 간 데이터 전송 형식을 정의
 */

// 사용자 검색 요청 DTO
export class SearchUsersRequestDto {
  constructor(query = {}) {
    this.q = query && query.q ? query.q : '';
    // parseInt 안전성 검사 추가
    const parsedLimit = parseInt(query && query.limit ? query.limit : 10);
    const parsedPage = parseInt(query && query.page ? query.page : 1);
    
    this.limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 20);
    this.page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  }

  validate() {
    const errors = [];

    if (!this.q) {
      errors.push('검색어는 필수입니다.');
    } else if (typeof this.q !== 'string') {
      errors.push('검색어는 문자열이어야 합니다.');
    } else if (this.q.trim().length < 1 || this.q.trim().length > 50) {
      errors.push('검색어는 1자 이상 50자 이하여야 합니다.');
    }

    if (this.limit < 1 || this.limit > 20) {
      errors.push('검색 결과 개수는 1개 이상 20개 이하여야 합니다.');
    }

    if (this.page < 1) {
      errors.push('페이지 번호는 1 이상이어야 합니다.');
    }

    return errors;
  }
}

// 검색된 사용자 응답 DTO
export class SearchedUserResponseDto {
  constructor(user, isFollowing = false, isFollower = false, followersCount = 0, followingCount = 0) {
    this.id = user && user.id ? user.id : null;
    this.userId = user && user.user_id ? user.user_id : '';
    this.name = user && user.name ? user.name : '알 수 없음';
    this.photo = user && user.photo ? user.photo : null;
    this.birthday = user && user.birthday ? user.birthday : null;
    this.isFollowing = !!isFollowing;
    this.isFollower = !!isFollower;
    this.followersCount = typeof followersCount === 'number' ? followersCount : 0;
    this.followingCount = typeof followingCount === 'number' ? followingCount : 0;
  }
}

// 사용자 검색 결과 DTO
export class SearchUsersResponseDto {
  constructor(users = [], pagination = {}) {
    this.users = Array.isArray(users) ? users : []; // service에서 이미 변환된 형태로 받음
    this.pagination = new PaginationDto(pagination);
  }
}

// 페이지네이션 DTO
export class PaginationDto {
  constructor(pagination = {}) {
    this.currentPage = pagination && typeof pagination.currentPage === 'number' ? pagination.currentPage : 1;
    this.totalPages = pagination && typeof pagination.totalPages === 'number' ? pagination.totalPages : 1;
    this.totalCount = pagination && typeof pagination.totalCount === 'number' ? pagination.totalCount : 0;
    this.hasNext = pagination ? !!pagination.hasNext : false;
    this.hasPrev = pagination ? !!pagination.hasPrev : false;
  }
}

// 검색 기록 조회 요청 DTO
export class GetSearchHistoryRequestDto {
  constructor(query = {}) {
    // parseInt 안전성 검사 추가
    const parsedLimit = parseInt(query && query.limit ? query.limit : 10);
    this.limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 50);
  }

  validate() {
    const errors = [];

    if (this.limit < 1 || this.limit > 50) {
      errors.push('조회할 검색 기록 수는 1개 이상 50개 이하여야 합니다.');
    }

    return errors;
  }
}

// 검색 기록 항목 DTO
export class SearchHistoryItemDto {
  constructor(searchHistory = {}) {
    this.id = searchHistory && searchHistory.id ? searchHistory.id : null;
    this.searchTerm = searchHistory && searchHistory.searchTerm ? searchHistory.searchTerm : '';
    this.searchedAt = searchHistory && searchHistory.searchedAt ? searchHistory.searchedAt : null;
  }
}

// 검색 기록 조회 응답 DTO
export class GetSearchHistoryResponseDto {
  constructor(searchHistories = []) {
    this.searchHistory = Array.isArray(searchHistories) 
      ? searchHistories.map(history => new SearchHistoryItemDto(history))
      : [];
  }
}

// 검색 기록 삭제 요청 DTO
export class DeleteSearchHistoryRequestDto {
  constructor(params = {}) {
    // parseInt 안전성 검사 추가
    const parsedHistoryId = parseInt(params && params.historyId ? params.historyId : 0);
    this.historyId = isNaN(parsedHistoryId) ? null : parsedHistoryId;
  }

  validate() {
    const errors = [];

    if (!this.historyId || isNaN(this.historyId)) {
      errors.push('검색 기록 ID는 필수이며 숫자여야 합니다.');
    } else if (this.historyId < 1) {
      errors.push('검색 기록 ID는 1 이상이어야 합니다.');
    }

    return errors;
  }
}

// 검색 기록 삭제 응답 DTO
export class DeleteSearchHistoryResponseDto {
  constructor() {
    this.message = '검색 기록이 삭제되었습니다';
  }
}

// 성공 응답 DTO
export class UserSearchSuccessResponseDto {
  constructor(message) {
    this.message = message;
  }
}

export default {
  SearchUsersRequestDto,
  SearchedUserResponseDto,
  SearchUsersResponseDto,
  PaginationDto,
  GetSearchHistoryRequestDto,
  SearchHistoryItemDto,
  GetSearchHistoryResponseDto,
  DeleteSearchHistoryRequestDto,
  DeleteSearchHistoryResponseDto,
  UserSearchSuccessResponseDto
};
