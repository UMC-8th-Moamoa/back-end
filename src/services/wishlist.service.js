import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { wishlistDto } from '../dtos/wishlist.dto.js';

class WishlistService {
  async createWishlist(userId, wishlistData) {
    const { insertType, isPublic } = wishlistData;

    if (insertType === 'URL') {
      // URL 크롤링 방식
      const { url } = wishlistData;
      
      // 1. URL 크롤링 (실제로는 외부 크롤링 서비스나 라이브러리 사용)
      const crawledData = await this.crawlProductData(url);
      
      if (!crawledData) {
        const error = new Error('Failed to fetch product data from url');
        error.status = 422;
        throw error;
      }

      // 2. wishlists 테이블에 저장
      const wishlistCreateData = {
        userId,
        productImageUrl: crawledData.imageUrl,
        productName: crawledData.productName,
        price: crawledData.price,
        fundingActive: false,
        isPublic
      };

      const wishlist = await wishlistRepository.createWishlist(wishlistCreateData);

      // 3. wishlist_analysis_requests에 기록 저장 (추적용)
      await wishlistRepository.createAnalysisRequest({
        wishlistId: wishlist.id,
        insertType: 'URL',
        inputData: url,
        completedAt: new Date()
      });

      return wishlistDto.toResponse(wishlist);

    } else if (insertType === 'IMAGE') {
      // 수동 입력 방식
      const { productName, price, imageUrl } = wishlistData;

      const wishlistCreateData = {
        userId,
        productImageUrl: imageUrl,
        productName,
        price,
        fundingActive: false,
        isPublic
      };

      const wishlist = await wishlistRepository.createWishlist(wishlistCreateData);
      
      return wishlistDto.toResponse(wishlist);
    }

    const error = new Error('Invalid insertType');
    error.status = 400;
    throw error;
  }

  async updateWishlist(wishlistId, userId, updateData) {
    // 1. 위시리스트 존재 및 권한 확인
    const existingWishlist = await wishlistRepository.findWishlistById(wishlistId);
    
    if (!existingWishlist) {
      const error = new Error('위시리스트를 찾을 수 없습니다');
      error.status = 404;
      throw error;
    }

    if (existingWishlist.userId !== userId) {
      const error = new Error('본인의 위시리스트만 수정할 수 있습니다');
      error.status = 403;
      throw error;
    }

    // 2. 위시리스트 업데이트
    const updatedWishlist = await wishlistRepository.updateWishlist(wishlistId, updateData);
    
    return wishlistDto.toResponse(updatedWishlist);
  }

  async deleteWishlist(wishlistId, userId) {
    // 1. 위시리스트 존재 여부 및 소유권 확인
    const existingWishlist = await wishlistRepository.findWishlistById(wishlistId);
    
    if (!existingWishlist) {
      const error = new Error('위시리스트를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    if (existingWishlist.userId !== userId) {
      const error = new Error('본인의 위시리스트만 삭제할 수 있습니다.');
      error.status = 403;
      throw error;
    }

    // 2. 위시리스트 삭제
    await wishlistRepository.deleteWishlist(wishlistId);
  }

  async getMyWishlists(userId, queryParams) {
    const { 
      sort = 'created_at', 
      visibility, 
      page = 1, 
      size = 10 
    } = queryParams;

    // 페이지네이션 계산
    const skip = (page - 1) * size;
    const take = parseInt(size);

    // 위시리스트 조회
    const wishlists = await wishlistRepository.findMyWishlists(userId, {
      skip,
      take,
      sort,
      visibility
    });

    // 전체 개수 조회
    const totalElements = await wishlistRepository.countMyWishlists(userId, visibility);
    const totalPages = Math.ceil(totalElements / size);

    const responseData = {
      content: wishlists,
      page: parseInt(page),
      size: parseInt(size),
      totalPages,
      totalElements
    };

    return wishlistDto.toMyWishlistsResponse(responseData);
  }

  // 실제 구현에서는 외부 크롤링 서비스나 라이브러리 사용
  async crawlProductData(url) {
    // TODO: 실제 크롤링 로직 구현
    // 임시로 더미 데이터 반환
    try {
      // 예시: puppeteer, cheerio 등을 사용한 크롤링
      return {
        productName: "크롤링된 상품명",
        price: 50000,
        imageUrl: "https://example.com/crawled-image.jpg"
      };
    } catch (error) {
      console.error('크롤링 실패:', error);
      return null;
    }
  }
}

export const wishlistService = new WishlistService();