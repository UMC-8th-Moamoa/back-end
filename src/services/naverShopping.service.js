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

      // API 키 검증
      if (!this.clientId || !this.clientSecret) {
        console.error('❌ 네이버 API 키 누락:', {
          clientId: this.clientId ? '설정됨' : '누락',
          clientSecret: this.clientSecret ? '설정됨' : '누락'
        });
        throw new Error('네이버 API 키가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 확인해주세요.');
      }

      const cleanQuery = query.trim();
      const encodedQuery = encodeURIComponent(cleanQuery);
      const url = `${this.baseUrl}?query=${encodedQuery}&display=${display}&start=${start}&sort=sim`;

      console.log(`📡 네이버 쇼핑 API 요청:`);
      console.log(`   - 검색어: "${cleanQuery}"`);
      console.log(`   - URL: ${url}`);
      console.log(`   - 헤더: Client-Id=${this.clientId.substring(0, 8)}...`);

      const response = await axios.get(url, {
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
        timeout: 10000 // 10초 타임아웃
      });

      console.log(`📡 네이버 쇼핑 API 응답:`);
      console.log(`   - 상태: ${response.status}`);
      console.log(`   - 헤더: ${JSON.stringify(response.headers, null, 2)}`);

      if (!response.data) {
        console.error('❌ 응답 데이터가 비어있음');
        throw new Error('네이버 쇼핑 API 응답이 비어있습니다');
      }

      console.log(`   - 응답 데이터:`, JSON.stringify(response.data, null, 2));

      if (!response.data.items) {
        console.warn('⚠️ items 필드가 없음:', response.data);
        return [];
      }

      const items = response.data.items;
      console.log(`📦 검색 결과: ${items.length}개 상품 발견`);

      if (items.length === 0) {
        console.warn(`⚠️ 검색어 "${cleanQuery}"에 대한 결과가 없습니다`);
        return [];
      }

      const formattedProducts = this.formatProductData(items);
      console.log(`✅ 포맷팅 완료: ${formattedProducts.length}개 상품`);
      
      return formattedProducts;
    } catch (error) {
      console.error('❌ 네이버 쇼핑 API 오류:', error.message);
      
      if (error.response) {
        // API 응답 오류
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('❌ API 응답 오류 상세:', {
          status,
          statusText: error.response.statusText,
          data: JSON.stringify(data, null, 2),
          headers: error.response.headers
        });
        
        if (status === 401) {
          throw new Error('네이버 API 인증 실패: API 키를 확인해주세요');
        } else if (status === 403) {
          throw new Error('네이버 API 접근 권한이 없습니다');
        } else if (status === 429) {
          throw new Error('네이버 API 요청 한도를 초과했습니다');
        } else if (status === 400) {
          const message = data?.errorMessage || data?.message || '잘못된 요청입니다';
          throw new Error(`네이버 API 요청 오류: ${message}`);
        } else {
          const message = data?.errorMessage || data?.message || '네이버 쇼핑 API 오류';
          throw new Error(`네이버 쇼핑 API 오류 (${status}): ${message}`);
        }
      } else if (error.request) {
        // 네트워크 오류
        console.error('❌ 네트워크 오류:', {
          message: error.message,
          code: error.code,
          timeout: error.timeout
        });
        throw new Error('네이버 쇼핑 API 연결 실패: 네트워크를 확인해주세요');
      } else if (error.code === 'ECONNABORTED') {
        // 타임아웃 오류
        console.error('❌ 타임아웃 오류');
        throw new Error('네이버 쇼핑 API 요청 시간 초과');
      } else {
        // 기타 오류
        console.error('❌ 기타 오류:', {
          message: error.message,
          stack: error.stack
        });
        throw new Error(`네이버 쇼핑 API 오류: ${error.message}`);
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
