/**
 * 투표 요청 DTO
 */
export class WishlistVoteRequestDTO {
  constructor(body) {
    this.wishlistIds = body.wishlistIds || [];
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    if (!Array.isArray(this.wishlistIds)) {
      throw new Error('wishlistIds는 배열이어야 합니다');
    }

    if (this.wishlistIds.length === 0) {
      throw new Error('최소 하나의 위시리스트를 선택해야 합니다');
    }

    if (this.wishlistIds.length > 10) {
      throw new Error('최대 10개까지만 선택할 수 있습니다');
    }

    // ID가 모두 숫자인지 확인
    for (const id of this.wishlistIds) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('유효하지 않은 위시리스트 ID입니다');
      }
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      wishlistIds: this.wishlistIds
    };
  }
}

/**
 * 투표용 위시리스트 DTO
 */
export class VotingWishlistDTO {
  constructor(wishlist) {
    this.itemId = wishlist.itemId;
    this.name = wishlist.productName;
    this.price = wishlist.price;
    this.image = wishlist.productImageUrl;
    this.totalVotes = wishlist.totalVotes;
    this.userVoted = wishlist.userVoted;
    this.addedAt = wishlist.createdAt;
  }
}

/**
 * 투표 결과 위시리스트 DTO
 */
export class VoteResultWishlistDTO {
  constructor(wishlist) {
    this.itemId = wishlist.itemId;
    this.name = wishlist.productName;
    this.price = wishlist.price;
    this.image = wishlist.productImageUrl;
    this.voteCount = wishlist.voteCount;
    this.userVoted = wishlist.userVoted;
  }
}

/**
 * 투표 위시리스트 목록 응답 DTO
 */
export class VotingWishlistsResponseDTO {
  constructor(data) {
    this.event = {
      id: data.event.id,
      birthdayPersonName: data.event.birthdayPersonName
    };
    this.wishlists = data.wishlists.map(wishlist => new VotingWishlistDTO(wishlist));
  }

  toResponse() {
    return {
      event: this.event,
      wishlists: this.wishlists
    };
  }
}

/**
 * 투표 완료 응답 DTO
 */
export class VoteCompletionResponseDTO {
  constructor(data) {
    this.message = data.message;
    this.votedItems = data.votedItems;
    this.votedWishlistIds = data.votedWishlistIds;
  }

  toResponse() {
    return {
      message: this.message,
      votedItems: this.votedItems,
      votedWishlistIds: this.votedWishlistIds
    };
  }
}

/**
 * 투표 결과 응답 DTO
 */
export class VoteResultsResponseDTO {
  constructor(data) {
    this.event = {
      id: data.event.id,
      birthdayPersonName: data.event.birthdayPersonName
    };
    this.userHasVoted = data.userHasVoted;
    this.results = data.results.map(wishlist => new VoteResultWishlistDTO(wishlist));
  }

  toResponse() {
    return {
      event: this.event,
      userHasVoted: this.userHasVoted,
      results: this.results
    };
  }
}