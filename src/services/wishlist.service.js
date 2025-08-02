import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { wishlistDto } from '../dtos/wishlist.dto.js';
import { naverShoppingService } from './naverShopping.service.js';

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

  // 네이버 쇼핑 API를 활용한 실제 크롤링 로직
  async crawlProductData(url) {
    try {
      let searchQuery = '';
      
      // 1. URL 파라미터에서 검색어 추출 시도
      try {
        const urlObj = new URL(url);
        searchQuery = urlObj.searchParams.get('query') || 
                     urlObj.searchParams.get('q') || 
                     urlObj.searchParams.get('keyword') ||
                     urlObj.searchParams.get('search') ||
                     urlObj.searchParams.get('prdNm') ||
                     urlObj.searchParams.get('product');
        
        // 2. 경로에서 상품 정보 추출 시도
        if (!searchQuery) {
          const pathname = urlObj.pathname;
          const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
          
          // 일반적인 상품 URL 패턴에서 상품명 추출 시도
          for (const segment of pathSegments) {
            if (segment.length > 2 && !segment.match(/^\d+$/)) {
              // 숫자만 있는 세그먼트는 제외하고, 의미있는 텍스트 찾기
              searchQuery = decodeURIComponent(segment.replace(/[-_]/g, ' '));
              break;
            }
          }
        }
        
        // 3. 도메인명에서 브랜드명 추출
        if (!searchQuery) {
          const hostname = urlObj.hostname.replace('www.', '').replace('m.', '');
          const domainParts = hostname.split('.');
          
          // 잘 알려진 쇼핑몰 도메인 체크
          const knownMalls = {
            'coupang.com': '쿠팡',
            'gmarket.co.kr': '지마켓',
            'auction.co.kr': '옥션',
            '11st.co.kr': '11번가',
            'yes24.com': 'YES24',
            'interpark.com': '인터파크',
            'lotte.com': '롯데',
            'shinsegae.com': '신세계',
            'ssg.com': 'SSG',
            'homeplus.co.kr': '홈플러스'
          };
          
          const mallName = knownMalls[hostname] || domainParts[0];
          searchQuery = mallName + ' 상품';
        }
        
      } catch (urlError) {
        console.warn('URL 파싱 실패:', urlError.message);
        searchQuery = '인기상품';
      }

      // 4. 검색어가 너무 짧으면 보완
      if (searchQuery.length < 2) {
        searchQuery = '인기상품';
      }

      console.log(`🔍 URL "${url}"에서 추출한 검색어: "${searchQuery}"`);

      // 5. 네이버 쇼핑 API로 상품 검색
      const products = await naverShoppingService.searchProducts(searchQuery, 5);
      
      if (!products || products.length === 0) {
        console.warn(`검색어 "${searchQuery}"로 상품을 찾을 수 없습니다`);
        
        // 검색어를 더 간단하게 만들어서 재시도
        const simplifiedQuery = searchQuery.split(' ')[0];
        if (simplifiedQuery !== searchQuery && simplifiedQuery.length > 1) {
          console.log(`🔍 간단한 검색어로 재시도: "${simplifiedQuery}"`);
          const retryProducts = await naverShoppingService.searchProducts(simplifiedQuery, 1);
          if (retryProducts && retryProducts.length > 0) {
            const product = retryProducts[0];
            return {
              productName: product.productName,
              price: product.price,
              imageUrl: product.productImageUrl
            };
          }
        }
        
        return null;
      }

      // 6. 가장 적합한 상품 선택 (첫 번째 상품)
      const product = products[0];
      
      console.log(`✅ 크롤링 성공: ${product.productName} - ${product.price.toLocaleString()}원`);
      
      return {
        productName: product.productName,
        price: product.price,
        imageUrl: product.productImageUrl
      };
      
    } catch (error) {
      console.error('상품 데이터 크롤링 실패:', error);
      return null;
    }
  }
}

export const wishlistService = new WishlistService();
