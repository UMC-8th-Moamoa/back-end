/**
 * 사용자 검색 관련 DTO (Data Transfer Object)
 * 클라이언트와 서버 간 데이터 전송 형식을 정의
 */

// 사용자 검색 요청 DTO
export class SearchUsersRequestDto {
  constructor({ q, limit = 10, page = 1 }) {
    this.q = q;
    this.limit = parseInt(limit);
    this.page = parseInt(page);
  }

  validate() {
    const errors = [];

    if (!this.q) {
      errors.push('검색어는 필수입니다.');
    } else if (typeof this.q !== 'string') {
      errors.push('검색어는 문자열이어야 합니다.');
    } else if (this.q.length < 1 || this.q.length > 50) {
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
    this.id = user.id;
    this.userId = user.user_id;
    this.name = user.name;
    this.photo = user.photo;
    this.birthday = user.birthday;
    this.isFollowing = isFollowing;
    this.isFollower = isFollower;
    this.followersCount = followersCount;
    this.followingCount = followingCount;
  }
}

// 사용자 검색 결과 DTO
export class SearchUsersResponseDto {
  constructor(users, pagination) {
    this.users = users; // service에서 이미 변환된 형태로 받음
    this.pagination = new PaginationDto(pagination);
  }
}

// 페이지네이션 DTO
export class PaginationDto {
  constructor({ currentPage, totalPages, totalCount, hasNext, hasPrev }) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.totalCount = totalCount;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
  }
}

// 검색 기록 조회 요청 DTO
export class GetSearchHistoryRequestDto {
  constructor({ limit = 10 }) {
    this.limit = parseInt(limit);
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
  constructor(searchHistory) {
    this.id = searchHistory.id;
    this.searchTerm = searchHistory.searchTerm;
    this.searchedAt = searchHistory.searchedAt;
  }
}

// 검색 기록 조회 응답 DTO
export class GetSearchHistoryResponseDto {
  constructor(searchHistories) {
    this.searchHistory = searchHistories.map(history => 
      new SearchHistoryItemDto(history)
    );
  }
}

// 검색 기록 삭제 요청 DTO
export class DeleteSearchHistoryRequestDto {
  constructor({ historyId }) {
    this.historyId = parseInt(historyId);
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
