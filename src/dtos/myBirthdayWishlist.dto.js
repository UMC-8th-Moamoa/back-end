/**
 * 위시리스트 조회 요청 DTO
 */
export class MyBirthdayWishlistRequestDTO {
  constructor(query) {
    this.sortBy = query.sortBy || 'CREATED_AT';
    this.cursor = query.cursor || null;
    this.limit = query.limit ? parseInt(query.limit) : 10;
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    const validSortOptions = ['CREATED_AT', 'VOTE_COUNT', 'PRICE_DESC', 'PRICE_ASC'];
    
    if (!validSortOptions.includes(this.sortBy)) {
      throw new Error(`sortBy는 다음 값 중 하나여야 합니다: ${validSortOptions.join(', ')}`);
    }

    if (isNaN(this.limit) || this.limit < 1 || this.limit > 50) {
      throw new Error('limit은 1-50 사이의 숫자여야 합니다');
    }

    // 커서 검증 (있는 경우에만)
    if (this.cursor) {
      try {
        const decodedCursor = JSON.parse(Buffer.from(this.cursor, 'base64').toString());
        if (!decodedCursor.id || !decodedCursor.createdAt) {
          throw new Error('Invalid cursor format');
        }
      } catch (error) {
        throw new Error('유효하지 않은 커서입니다');
      }
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      sortBy: this.sortBy,
      cursor: this.cursor,
      limit: this.limit
    };
  }
}

/**
 * 위시리스트 아이템 DTO (상품 → 아이템으로 변경)
 */
export class WishlistItemDTO {
  constructor(item) {
    this.itemId = item.itemId; 
    this.name = item.name;
    this.price = item.price;
    this.image = item.image;
    this.isSelected = item.isSelected;
    this.addedAt = item.addedAt;
    this.voteCount = item.voteCount;
  }
}

/**
 * 페이지네이션 DTO
 */
export class PaginationDTO {
  constructor(paginationData) {
    this.hasNext = paginationData.hasNext;
    this.nextCursor = paginationData.nextCursor;
    this.totalCount = paginationData.totalCount;
  }
}

/**
 * 내 생일 위시리스트 응답 DTO
 */
export class MyBirthdayWishlistResponseDTO {
  constructor(wishlistData) {
    this.currentAmount = wishlistData.currentAmount;
    this.products = wishlistData.products.map(item => new WishlistItemDTO(item));
    this.pagination = new PaginationDTO(wishlistData.pagination);
    this.selectedItems = wishlistData.selectedItems;
    this.totalSelectedAmount = wishlistData.totalSelectedAmount;
    this.remainingAmount = wishlistData.remainingAmount;
  }

  /**
   * API 응답용 데이터 변환
   * @returns {Object} 정리된 응답 데이터
   */
  toResponse() {
    return {
      currentAmount: this.currentAmount,
      products: this.products,
      pagination: this.pagination,
      selectedItems: this.selectedItems,
      totalSelectedAmount: this.totalSelectedAmount,
      remainingAmount: this.remainingAmount
    };
  }

  /**
   * 데이터 유효성 검사
   * @returns {boolean} 유효성 여부
   */
  validate() {
    // 필수 필드 검증
    const requiredFields = ['currentAmount', 'products', 'pagination', 'selectedItems', 'totalSelectedAmount', 'remainingAmount']; // selectedProducts → selectedItems
    
    for (const field of requiredFields) {
      if (this[field] === undefined || this[field] === null) {
        throw new Error(`필수 필드가 누락되었습니다: ${field}`);
      }
    }

    // 타입 검증
    if (typeof this.currentAmount !== 'number' || this.currentAmount < 0) {
      throw new Error('currentAmount는 0 이상의 숫자여야 합니다');
    }

    if (!Array.isArray(this.products)) {
      throw new Error('products는 배열이어야 합니다');
    }

    if (!Array.isArray(this.selectedItems)) {
      throw new Error('selectedItems는 배열이어야 합니다');
    }

    if (typeof this.totalSelectedAmount !== 'number' || this.totalSelectedAmount < 0) {
      throw new Error('totalSelectedAmount는 0 이상의 숫자여야 합니다');
    }

    if (typeof this.remainingAmount !== 'number' || this.remainingAmount < 0) {
      throw new Error('remainingAmount는 0 이상의 숫자여야 합니다');
    }

    return true;
  }
}