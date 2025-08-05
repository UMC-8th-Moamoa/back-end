import axios from 'axios';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

class NaverShoppingService {
  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID;
    this.clientSecret = process.env.NAVER_CLIENT_SECRET;
    this.baseUrl = 'https://openapi.naver.com/v1/search/shop.json';
  }

  /**
   * 네이버 쇼핑 API를 통해 상품 검색
   * @param {string} query - 검색할 상품명
   * @param {number} display - 검색 결과 개수 (기본 10개)
   * @param {number} start - 검색 시작 위치 (기본 1)
   * @returns {Promise<Object[]>} 검색된 상품 목록
   */
  async searchProducts(query, display = 10, start = 1) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('검색어를 입력해주세요');
      }

      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${this.baseUrl}?query=${encodedQuery}&display=${display}&start=${start}&sort=sim`;

      const response = await axios.get(url, {
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      });

      if (!response.data || !response.data.items) {
        throw new Error('네이버 쇼핑 API 응답이 올바르지 않습니다');
      }

      return this.formatProductData(response.data.items);
    } catch (error) {
      console.error('네이버 쇼핑 API 오류:', error);
      
      if (error.response) {
        // API 응답 오류
        const status = error.response.status;
        const message = error.response.data?.errorMessage || '네이버 쇼핑 API 오류';
        throw new Error(`네이버 쇼핑 API 오류 (${status}): ${message}`);
      } else if (error.request) {
        // 네트워크 오류
        throw new Error('네이버 쇼핑 API 연결 실패');
      } else {
        // 기타 오류
        throw error;
      }
    }
  }

  /**
   * 네이버 쇼핑 API 응답을 위시리스트 형식으로 변환
   * @param {Object[]} items - 네이버 쇼핑 API 응답 아이템들
   * @returns {Object[]} 포맷된 상품 데이터
   */
  formatProductData(items) {
    return items.map(item => {
      // HTML 태그 제거 및 특수문자 디코딩
      const productName = this.cleanHtmlText(item.title);
      
      // 가격 문자열을 숫자로 변환 (콤마 제거)
      const price = parseInt(item.lprice.replace(/,/g, '')) || 0;
      
      return {
        productName,
        price,
        productImageUrl: item.image || '', // 이미지 URL
        url: item.link, // 원본 상품 URL
        mallName: item.mallName || '', // 쇼핑몰명 (추가 정보)
        brand: item.brand || '', // 브랜드명 (추가 정보)
        category1: item.category1 || '', // 카테고리 (추가 정보)
        category2: item.category2 || '',
        category3: item.category3 || '',
        category4: item.category4 || ''
      };
    });
  }

  /**
   * HTML 태그 제거 및 특수문자 디코딩
   * @param {string} text - 정리할 텍스트
   * @returns {string} 정리된 텍스트
   */
  cleanHtmlText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  /**
   * 첫 번째 검색 결과를 위시리스트 생성용 데이터로 변환
   * @param {string} query - 검색어
   * @returns {Promise<Object>} 위시리스트 생성용 데이터
   */
  async getFirstProductForWishlist(query) {
    const products = await this.searchProducts(query, 1); // 첫 번째 결과만 가져오기
    
    if (!products || products.length === 0) {
      throw new Error(`"${query}"에 대한 검색 결과를 찾을 수 없습니다`);
    }

    const product = products[0];
    
    // 위시리스트 생성 요청 형식으로 변환
    return {
      insertType: 'URL',
      url: product.url,
      isPublic: true,
      // 크롤링된 데이터 (내부적으로 사용)
      _crawledData: {
        productName: product.productName,
        price: product.price,
        imageUrl: product.productImageUrl
      }
    };
  }

  /**
   * 여러 상품을 위시리스트 형식으로 변환
   * @param {string} query - 검색어
   * @param {number} count - 가져올 상품 개수
   * @returns {Promise<Object[]>} 위시리스트 생성용 데이터 배열
   */
  async getProductsForWishlist(query, count = 5) {
    const products = await this.searchProducts(query, count);
    
    if (!products || products.length === 0) {
      throw new Error(`"${query}"에 대한 검색 결과를 찾을 수 없습니다`);
    }

    return products.map(product => ({
      insertType: 'URL',
      url: product.url,
      isPublic: true,
      _crawledData: {
        productName: product.productName,
        price: product.price,
        imageUrl: product.productImageUrl
      }
    }));
  }
}

export const naverShoppingService = new NaverShoppingService();
