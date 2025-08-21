export class ItemListEntryDTO {
  constructor(itemData) {
    this.item_no = itemData.id;
    this.name = itemData.name;
    this.price = itemData.price;
    this.image = itemData.imageUrl;
  }
}

export class ItemListResponseDTO {
  constructor(items) {
    this.success = true;
    this.num = items.length;
    this.itemListEntry = items.map(item => new ItemListEntryDTO(item));
  }

  toResponse() {
    return {
      success: this.success,
      num: this.num,
      itemListEntry: this.itemListEntry,
    };
  }
}

export class ShoppingRequestDTO {
  constructor(query) {
    this.category = query.category;
    this.num = query.num ? parseInt(query.num, 10) : undefined;
  }

  validate() {
    const validCategories = ['font', 'paper', 'seal'];

    if (!this.category || !validCategories.includes(this.category)) {
      throw new Error('Category is required and must be one of: font, paper, seal.');
    }

    if (this.num !== undefined && (isNaN(this.num) || this.num <= 0)) {
      throw new Error('Number of items (num) must be a positive integer.');
    }
  }

  getValidatedData() {
    this.validate();
    return {
      category: this.category,
      num: this.num,
    };
  }
}

export class ItemDetailEntryDTO {
  constructor(itemData) {
    this.item_no = itemData.id;
    this.name = itemData.name;
    this.detail = itemData.description;
    this.price = itemData.price;
    this.image = itemData.imageUrl;
  }
}

export class ItemDetailRequestDTO {
  constructor(query) {
    this.id = query.id ? parseInt(query.id, 10) : undefined;
  }

  validate() {
    if (this.id === undefined || isNaN(this.id) || this.id <= 0) {
      throw new Error('Item ID (id) is required and must be a positive integer.');
    }
  }

  getValidatedData() {
    this.validate();
    return {
      id: this.id,
    };
  }
}

export class ItemDetailResponseDTO {
  constructor(item) {
    this.success = true;
    this.itemDetailEntry = item ? new ItemDetailEntryDTO(item) : null;
  }

  toResponse() {
    return {
      success: this.success,
      itemDetailEntry: this.itemDetailEntry,
    };
  }
}

/**
 * @desc 아이템 구매 요청 데이터 전송 객체 (DTO)
 * POST /api/shopping/item_buy 요청의 본문 데이터를 처리합니다.
 */
export class ItemBuyRequestDTO {
  constructor(body) {
    this.category = body.category;
    this.user_id = body.user_id;
    this.item_no = body.item_no;
    this.price = body.price;
    this.event = body.event;
  }

  /**
   * @desc 요청 데이터의 유효성을 검사합니다.
   * @throws {Error} - 유효성 검사 실패 시
   */
  validate() {
    const validCategories = ['font', 'paper', 'seal'];
    if (!this.category || !validCategories.includes(this.category)) {
      throw new Error('Category is required and must be one of: font, paper, seal.');
    }
    if (!this.user_id) {
      throw new Error('User ID is required.');
    }
    if (this.item_no === undefined || isNaN(this.item_no) || this.item_no <= 0) {
      throw new Error('Item number is required and must be a positive integer.');
    }
    if (this.price === undefined || isNaN(this.price) || this.price < 0) {
      throw new Error('Price is required and must be a non-negative integer.');
    }
    if (typeof this.event !== 'boolean') {
      throw new Error('Event status must be a boolean.');
    }
  }

  /**
   * @desc 검증된 요청 데이터를 반환합니다.
   * @returns {object} - 검증된 구매 요청 데이터를 포함하는 객체
   */
  getValidatedData() {
    this.validate();
    return {
      category: this.category,
      user_id: this.user_id,
      item_no: this.item_no,
      price: this.price,
      event: this.event,
    };
  }
}

/**
 * @desc 아이템 구매 응답 데이터 전송 객체 (DTO)
 * POST /api/shopping/item_buy 요청에 대한 최종 응답 본문의 success 필드 구조를 정의합니다.
 */
export class ItemBuyResponseDTO {
  /**
   * @param {object} data - 서비스 계층에서 반환된 구매 결과 데이터
   * @param {string} data.message - 구매 성공 메시지
   */
  constructor(data) {
    this.message = data.message || "아이템 구매 성공";
  }

  /**
   * @desc 클라이언트에게 보낼 최종 응답 데이터를 반환합니다.
   * @returns {object} - 명세서에 정의된 JSON 응답 형식
   */
  toResponse() {
    return {
      message: this.message,
    };
  }
}

/**
 * @desc 사용자 보유 아이템의 데이터 전송 객체 (DTO)
 * API 응답에서 하나의 구매한 아이템 정보를 나타냅니다.
 */

export class HoldItemEntryDTO {
  /**
   * @param {object} itemData - 데이터베이스에서 조회된 원본 구매 아이템 데이터
   */
  constructor(itemData) {
    this.holditem_no = itemData.holditem_no;
    this.category = itemData.category;
    this.item_no = itemData.item_no;
    this.user_id = itemData.user_id;
    this.image = itemData.image;
    this.name = itemData.name;
    this.detail = itemData.detail;
    this.price = itemData.price;
    this.event = itemData.event;
    this.purchasedAt = itemData.purchasedAt;
  }
}


/**
 * @desc 사용자 구매 아이템 목록 조회 요청 데이터 전송 객체 (DTO)
 * GET /api/shopping/user_item?num=10 요청의 쿼리 파라미터를 처리합니다.
 */
export class UserItemRequestDTO {
  /**
   * @param {object} query - Express 요청 객체에서 추출된 쿼리 파라미터 (req.query)
   * @param {string} [query.num] - 조회할 아이템의 개수 (페이징을 위한 문자열 형태)
   */
  constructor(query) {
    this.num = query.num ? parseInt(query.num, 10) : undefined;
  }

  /**
   * @desc 요청 데이터의 유효성을 검사합니다.
   * num은 선택 사항이지만, 제공되면 유효한 숫자인지 확인합니다.
   * @throws {Error} - 유효성 검사 실패 시
   */
  validate() {
    if (this.num !== undefined && (isNaN(this.num) || this.num <= 0)) {
      throw new Error('Number of items (num) for user items must be a positive integer.');
    }
  }

  /**
   * @desc 검증된 요청 데이터를 반환합니다.
   * @returns {object} - 검증된 num 값을 포함하는 객체
   */
  getValidatedData() {
    this.validate();
    return {
      num: this.num,
    };
  }
}

/**
 * @desc 사용자 구매 아이템 목록 조회 응답 데이터 전송 객체 (DTO)
 * GET /api/shopping/user_item 요청에 대한 최종 응답 본문의 구조를 정의합니다.
 */
export class UserItemResponseDTO {
  /**
   * @param {Array<object>} userItems - HoldItemEntryDTO로 변환될 사용자 아이템 배열
   */
  constructor(userItems) {
    this.success = true;
    this.userItems = userItems.map(item => new HoldItemEntryDTO(item));
  }

  /**
   * @desc 클라이언트에게 보낼 최종 응답 데이터를 반환합니다.
   * @returns {object} - 명세서에 정의된 JSON 응답 형식
   */
  toResponse() {
    return {
      success: this.success,
      userItems: this.userItems,
    };
  }
}