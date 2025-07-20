/**
 * 쇼핑아이템 조회 요청 DTO
 * GET /api/shopping/item_list?category=font&num=10
 */
// 쇼핑 아이템 단일 객체 DTO
export class ItemDTO {
    constructor(item) {
      this.item_no = item.item_no;
      this.name = item.name;
      this.price = item.price;
      this.image = item.image;
    }
  }
  
  // 쇼핑 아이템 목록 응답 DTO
  export class ItemListResponseDTO {
    constructor(items) {
      this.success = true;
      this.num = items.length;
      this.item = items.map(item => new ItemDTO(item));
    }
  
    // 정리된 응답 데이터 반환
    toResponse() {
      return {
        success: this.success,
        num: this.num,
        item: this.item
      };
    }
  }
  
  // 쇼핑 아이템 목록 요청 DTO
  export class ShoppingRequestDTO {
    constructor(query) {
      this.category = query.category;
      this.num = query.num ? parseInt(query.num, 10) : undefined;
    }
  
    // 요청 유효성 검사
    validate() {
      const validCategories = ['font', 'paper', 'envelope'];
  
      if (!this.category || !validCategories.includes(this.category)) {
        throw new Error('Category is required and must be one of: font, paper, envelope.');
      }
  
      if (this.num !== undefined && (isNaN(this.num) || this.num <= 0)) {
        throw new Error('Number of items (num) must be a positive integer.');
      }
    }
  
    // 유효성 검사 후 데이터 반환
    getValidatedData() {
      this.validate();
      return {
        category: this.category,
        num: this.num
      };
    }
  }
  