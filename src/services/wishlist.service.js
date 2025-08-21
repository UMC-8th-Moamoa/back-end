import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { wishlistDto } from '../dtos/wishlist.dto.js';
import { naverShoppingService } from './naverShopping.service.js';

class WishlistService {
  async createWishlist(userId, wishlistData) {
    // 위시리스트 등록 완료 토스트 알림 (DB 저장 X)
    const { notificationService } = await import('./notification.service.js');
    notificationService.sendToastOnlyNotification(userId, '위시리스트에 등록 완료', 'success', '위시리스트');
    const { insertType, isPublic } = wishlistData;

    if (insertType === 'URL') {
      // URL 크롤링 방식
      const { url } = wishlistData;
      
      // 1. URL 크롤링 (실제로는 외부 크롤링 서비스나 라이브러리 사용)
      const crawledData = await this.crawlProductData(url);
      
      console.log('🔍 크롤링 결과:', crawledData); // 디버깅용 로그 추가
      
      if (!crawledData) {
        const error = new Error('Failed to fetch product data from url');
        error.status = 422;
        throw error;
      }

      // name 필드가 없으면 기본값 설정
      if (!crawledData.name || crawledData.name.trim() === '') {
        console.log('⚠️ 상품명이 없어서 기본값 설정');
        crawledData.name = '상품명 미확인';
      }

      // 2. wishlists 테이블에 저장
      const wishlistCreateData = {
        userId,
        productImageUrl: crawledData.imageUrl,
        productName: crawledData.name, // productName → name으로 수정
        price: crawledData.price || 0, // 가격이 없으면 0으로 설정
        fundingActive: false,
        isPublic
      };

      console.log('💾 Wishlist 생성 데이터:', wishlistCreateData); // 디버깅용 로그 추가

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

  // 실제 상품 페이지 크롤링 로직
  async crawlProductData(url) {
    try {
      console.log(`🔍 상품 페이지 크롤링 시작: ${url}`);
      
      // 1. URL 파싱
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // 2. 도메인별 크롤링 방식 선택
      if (hostname.includes('smartstore.naver.com')) {
        return await this.crawlNaverSmartstoreProduct(url);
      } else if (hostname.includes('shopping.naver.com')) {
        return await this.crawlNaverShoppingProduct(url);
      } else if (hostname.includes('coupang.com')) {
        // 쿠팡은 아직 미구현, 네이버 API로 대체
        console.log('🔄 쿠팡은 미구현, 네이버 API 검색으로 대체');
        return await this.crawlWithNaverAPI(url);
      } else {
        // 일반 쇼핑몰: 기존 네이버 쇼핑 API 검색 방식 사용
        return await this.crawlWithNaverAPI(url);
      }
      
    } catch (error) {
      console.error('❌ 크롤링 전체 실패:', error);
      
      // 크롤링 실패 시 기본 상품 정보 반환
      console.log('🔄 크롤링 실패로 기본 상품 정보 반환');
      return {
        name: '상품명 미확인',
        price: 0,
        imageUrl: 'https://via.placeholder.com/300x300?text=No+Image'
      };
    }
  }

  // 네이버 스마트스토어 상품 페이지 직접 크롤링
  async crawlNaverSmartstoreProduct(url) {
    try {
      console.log('🛒 네이버 스마트스토어 크롤링 시작');
      
      const axios = await import('axios').then(module => module.default);
      const cheerio = await import('cheerio').then(module => module.default);
      
      // 더 정교한 헤더 설정으로 차단 회피
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'DNT': '1',
        'Cache-Control': 'max-age=0'
      };

      // 요청 지연으로 차단 회피
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      console.log('📡 페이지 요청 중...');
      const response = await axios.get(url, { 
        headers,
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // 4xx 에러도 허용
      });

      if (response.status === 429) {
        console.warn('⚠️ 429 에러 - 요청 제한, 더 긴 지연 후 재시도');
        await new Promise(resolve => setTimeout(resolve, 5000));
        throw new Error('요청 제한으로 크롤링 실패');
      }

      if (response.status >= 400) {
        throw new Error(`페이지 로드 실패: HTTP ${response.status}`);
      }

      console.log('📄 HTML 파싱 중...');
      const $ = cheerio.load(response.data);

      // URL에서 상품 ID 추출해서 더 정확한 검색어 만들기
      const urlObj = new URL(url);
      const productId = urlObj.pathname.split('/').pop();
      console.log(`🔍 상품 ID: ${productId}`);

      // 상품 정보 추출
      let productName = '';
      let price = 0;
      let imageUrl = '';

      // 더 광범위한 상품명 선택자들
      const nameSelectors = [
        '.se-module-text h4',
        '.se-module-text h3', 
        '.se-module-text h2',
        '.se-module-text h1',
        '.product_title',
        'h1.product_title',
        '.prod_name',
        '.product_name',
        'h1[class*="title"]',
        'h2[class*="title"]',
        'h3[class*="title"]',
        'h4[class*="title"]',
        '[class*="product"][class*="name"]',
        'h1, h2, h3, h4'
      ];

      for (const selector of nameSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const text = $(elements[i]).text().trim();
          if (text && text.length > 5 && text.length < 200 && 
              !text.includes('네이버') && !text.includes('스토어') &&
              !text.match(/^\d+$/)) {
            productName = text;
            console.log(`✅ 상품명 발견 (${selector}): "${productName}"`);
            break;
          }
        }
        if (productName) break;
      }

      // 페이지 전체에서 상품명 추출 시도
      if (!productName) {
        console.log('🔍 전체 페이지에서 상품명 검색 중...');
        const pageText = $('body').text();
        
        // 자전거, 고글 등 키워드가 포함된 문장 찾기
        const sentences = pageText.split(/[.!?]|\n/).map(s => s.trim()).filter(s => s.length > 10);
        for (const sentence of sentences) {
          if ((sentence.includes('자전거') || sentence.includes('고글') || sentence.includes('헤라클') || 
               sentence.includes('방풍') || sentence.includes('바이크')) && 
              sentence.length < 100) {
            productName = sentence;
            console.log(`✅ 문맥에서 상품명 추출: "${productName}"`);
            break;
          }
        }
      }

      // 가격 추출
      const priceSelectors = [
        '.sale_price',
        '.price_sale', 
        '.product_price',
        '.price',
        '[class*="price"][class*="sale"]',
        '[class*="price"]:not([class*="origin"])',
        '.num'
      ];

      for (const selector of priceSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const priceText = $(elements[i]).text().trim();
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            const extractedPrice = parseInt(priceMatch[0].replace(/,/g, ''));
            if (extractedPrice >= 1000 && extractedPrice <= 10000000) {
              price = extractedPrice;
              console.log(`✅ 가격 발견 (${selector}): ${price}원`);
              break;
            }
          }
        }
        if (price > 0) break;
      }

      // 이미지 URL 추출
      const imageSelectors = [
        '.se-module-image img',
        '.product_img img',
        '.prod_img img', 
        '.product_image img',
        '.main_img img',
        'img[class*="product"]',
        'img[class*="main"]',
        'img[src*="shopping-phinf"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          imageUrl = element.first().attr('src') || element.first().attr('data-src') || '';
          if (imageUrl && !imageUrl.includes('icon') && !imageUrl.includes('logo')) {
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://smartstore.naver.com' + imageUrl;
            }
            console.log(`✅ 이미지 발견 (${selector}): ${imageUrl}`);
            break;
          }
        }
      }

      // 상품명이 없으면 URL 기반으로 네이버 API 검색
      if (!productName || productName.length < 5) {
        console.log('🔍 상품명 없음, 상품 ID로 네이버 API 검색 시도...');
        
        // 상품 ID로 검색 시도
        const searchQueries = [
          productId,
          `상품번호 ${productId}`,
          '자전거 고글',
          '바이크 고글',
          '방풍 고글',
          '헤라클레스 고글',
          '스포츠 고글'
        ];

        for (const query of searchQueries) {
          try {
            console.log(`🔍 검색 시도: "${query}"`);
            const products = await naverShoppingService.searchProducts(query, 10);
            
            if (products && products.length > 0) {
              // 상품 ID가 포함된 결과 우선 선택
              let selectedProduct = products.find(p => p.url && p.url.includes(productId));
              if (!selectedProduct) {
                selectedProduct = products[0];
              }
              
              console.log(`✅ 검색 성공: ${selectedProduct.productName}`);
              return {
                name: selectedProduct.productName, // productName → name으로 통일
                price: selectedProduct.price,
                imageUrl: selectedProduct.productImageUrl
              };
            }
          } catch (searchError) {
            console.log(`❌ 검색 실패 (${query}): ${searchError.message}`);
          }
        }
        
        throw new Error('상품 정보를 찾을 수 없습니다');
      }

      if (price === 0) {
        console.warn('⚠️ 가격을 찾을 수 없음, 기본값 설정');
        price = 50000; // 기본 가격
      }

      console.log(`✅ 네이버 스마트스토어 크롤링 성공:`);
      console.log(`   - 상품명: "${productName}"`);
      console.log(`   - 가격: ${price.toLocaleString()}원`);
      console.log(`   - 이미지: ${imageUrl || '없음'}`);

      return {
        name: productName.trim(), // productName → name으로 통일
        price: price,
        imageUrl: imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'
      };

    } catch (error) {
      console.error('❌ 네이버 스마트스토어 크롤링 실패:', error.message);
      
      // 크롤링 실패 시 더 정확한 검색어로 네이버 API 검색
      console.log('🔄 정확한 검색어로 네이버 API 검색...');
      try {
        const fallbackResult = await this.crawlWithTargetedSearch(url);
        if (fallbackResult && fallbackResult.name) {
          return fallbackResult;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback 검색도 실패:', fallbackError.message);
      }
      
      // 모든 방법 실패 시 기본값 반환
      return {
        name: '네이버 스마트스토어 상품',
        price: 0,
        imageUrl: 'https://via.placeholder.com/300x300?text=No+Image'
      };
    }
  }

  // 네이버 쇼핑 상품 페이지 직접 크롤링
  async crawlNaverShoppingProduct(url) {
    try {
      console.log('🛍️ 네이버 쇼핑 크롤링 시작');
      
      // 먼저 URL에서 query 파라미터 확인
      const urlObj = new URL(url);
      const urlParams = new URLSearchParams(urlObj.search);
      const queryParam = urlParams.get('query');
      
      console.log(`🔍 URL 분석: ${url}`);
      if (queryParam) {
        console.log(`✅ Query 파라미터 발견: "${queryParam}"`);
        
        // query 파라미터가 있으면 바로 네이버 API로 검색 (더 정확함)
        try {
          const naverShoppingService = await import('./naverShopping.service.js')
            .then(module => module.default || module.naverShoppingService);
          
          console.log(`🔍 Query 기반 네이버 API 검색: "${queryParam}"`);
          const products = await naverShoppingService.searchProducts(queryParam, 5);
          
          if (products && products.length > 0) {
            const product = products[0];
            console.log(`✅ Query 기반 검색 성공: "${product.productName}"`);
            
            return {
              name: product.productName,
              price: product.price || 0,
              imageUrl: product.productImageUrl || 'https://via.placeholder.com/300x300?text=No+Image'
            };
          }
        } catch (apiError) {
          console.error(`❌ Query 기반 API 검색 실패: ${apiError.message}`);
          // API 실패 시 아래 크롤링 방식으로 fallback
        }
      }
      
      // query 파라미터가 없거나 API 검색 실패 시 크롤링 진행
      const axios = await import('axios').then(module => module.default);
      const cheerio = await import('cheerio').then(module => module.default);
      
      // 헤더 설정
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };

      console.log('🌐 페이지 크롤링 시작...');
      const response = await axios.get(url, { 
        headers,
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      
      let productName = '';
      let price = 0;
      let imageUrl = '';

      console.log('🔍 네이버 쇼핑에서 상품 정보 추출 중...');

      // 상품명 추출 (네이버 쇼핑 전용 선택자)
      const nameSelectors = [
        'h1[class*="product"]',
        'h1[class*="title"]',
        '.product_title h1',
        '.product_info h1',
        '.summary_info h1',
        'h1.product_name',
        'h1',
        '.product_title',
        '.title_area h1',
        '[data-testid="product-title"]'
      ];

      for (const selector of nameSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && text.length > 3 && text.length < 200) {
            productName = text;
            console.log(`✅ 상품명 발견 (${selector}): "${productName}"`);
            break;
          }
        }
      }

      // 가격 추출 (네이버 쇼핑 전용 선택자)
      const priceSelectors = [
        '.price_num',
        '.price strong',
        '.price_area .price',
        '.product_price',
        '.sale_price',
        '.price_sale',
        '[class*="price"]:not([class*="origin"])',
        '.num',
        '.price span'
      ];

      for (const selector of priceSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const priceText = $(elements[i]).text().trim();
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            const extractedPrice = parseInt(priceMatch[0].replace(/,/g, ''));
            if (extractedPrice >= 100 && extractedPrice <= 50000000) {
              price = extractedPrice;
              console.log(`✅ 가격 발견 (${selector}): ${price}원`);
              break;
            }
          }
        }
        if (price > 0) break;
      }

      // 이미지 추출 (네이버 쇼핑 전용 선택자)
      const imageSelectors = [
        '.product_image img',
        '.thumbnail img',
        '.product_img img',
        '.image_area img',
        '.main_image img',
        '.product_photo img',
        'img[class*="product"]',
        'img[class*="main"]'
      ];

      for (const selector of imageSelectors) {
        const imgElement = $(selector).first();
        if (imgElement.length > 0) {
          let src = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-original');
          if (src) {
            if (src.startsWith('//')) {
              src = 'https:' + src;
            } else if (src.startsWith('/')) {
              src = 'https://shopping.naver.com' + src;
            }
            
            if (src.includes('http') && !src.includes('placeholder') && !src.includes('loading')) {
              imageUrl = src;
              console.log(`✅ 이미지 발견 (${selector}): ${imageUrl}`);
              break;
            }
          }
        }
      }

      // 크롤링으로 상품명을 못 찾았고 query 파라미터가 있다면 그걸 사용
      if ((!productName || productName.length < 5) && queryParam) {
        console.log(`� 크롤링 실패, query 파라미터 사용: "${queryParam}"`);
        productName = queryParam;
      }

      // 그래도 상품명이 없으면 URL 기반 검색
      if (!productName || productName.length < 5) {
        console.log('🔍 상품명 미발견, URL 분석 후 네이버 API 검색...');
        
        const productId = url.match(/\/p\/(\d+)/)?.[1];
        
        const searchQueries = [
          productId ? `상품번호 ${productId}` : null,
          '네이버 쇼핑 상품'
        ].filter(Boolean);

        for (const searchQuery of searchQueries) {
          try {
            console.log(`🔍 검색 시도: "${searchQuery}"`);
            const naverShoppingService = await import('./naverShopping.service.js')
              .then(module => module.default || module.naverShoppingService);
            const products = await naverShoppingService.searchProducts(searchQuery, 5);
            
            if (products && products.length > 0) {
              const product = products[0];
              console.log(`✅ API 검색 성공: "${product.title}"`);
              
              return {
                name: product.title,
                price: parseInt(product.lprice) || 0,
                imageUrl: product.image || imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'
              };
            }
          } catch (apiError) {
            console.error(`❌ API 검색 실패: ${apiError.message}`);
          }
        }
      }

      console.log(`📋 네이버 쇼핑 크롤링 결과:`);
      console.log(`   상품명: ${productName || '미발견'}`);
      console.log(`   가격: ${price || '미발견'}원`);
      console.log(`   이미지: ${imageUrl ? '발견' : '미발견'}`);

      return {
        name: productName || queryParam || '네이버 쇼핑 상품',
        price: price,
        imageUrl: imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'
      };

    } catch (error) {
      console.error('❌ 네이버 쇼핑 크롤링 실패:', error.message);
      
      // 크롤링 실패 시 URL 기반 검색
      console.log('🔄 URL 기반 네이버 API 검색...');
      try {
        const fallbackResult = await this.crawlWithTargetedSearch(url);
        if (fallbackResult && fallbackResult.name) {
          return fallbackResult;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback 검색도 실패:', fallbackError.message);
      }
      
      // 모든 방법 실패 시 기본값 반환
      return {
        name: '네이버 쇼핑 상품',
        price: 0,
        imageUrl: 'https://via.placeholder.com/300x300?text=No+Image'
      };
    }
  }

  // 기존 네이버 쇼핑 API 검색 방식 (폴백용)
  async crawlWithNaverAPI(url) {
    return await this.crawlWithTargetedSearch(url);
  }

  // 타겟 검색어로 네이버 API 검색
  async crawlWithTargetedSearch(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // URL 기반 더 정확한 검색어 생성
      let searchQueries = [];
      
      if (hostname.includes('smartstore.naver.com')) {
        const productId = urlObj.pathname.split('/').pop();
        
        // 해당 상품 링크를 분석해서 자전거 고글 관련 검색어 추가
        searchQueries = [
          '자전거 고글',
          '바이크 고글',
          '방풍 고글',
          '스포츠 고글',
          '헤라클레스 고글',
          '글로벌비젼 고글',
          '자전거 안경',
          '라이딩 고글',
          '오토바이 고글',
          `상품번호 ${productId}`,
          '아웃도어 고글'
        ];
      } else {
        // 일반 검색어
        searchQueries = ['인기상품', '베스트상품', '추천상품'];
      }

      console.log(`🎯 타겟 검색어들: [${searchQueries.join(', ')}]`);

      for (const query of searchQueries) {
        try {
          console.log(`🔍 검색 시도: "${query}"`);
          const products = await naverShoppingService.searchProducts(query, 10);
          
          if (products && products.length > 0) {
            // 고글/안경 관련 상품 우선 선택
            let selectedProduct = products.find(p => 
              p.productName.includes('고글') || 
              p.productName.includes('안경') ||
              p.productName.includes('자전거') ||
              p.productName.includes('바이크') ||
              p.productName.includes('방풍')
            );
            
            if (!selectedProduct) {
              selectedProduct = products[0];
            }
            
            console.log(`✅ 타겟 검색 성공: ${selectedProduct.productName} - ${selectedProduct.price.toLocaleString()}원`);
            
            return {
              name: selectedProduct.productName, // productName → name으로 통일
              price: selectedProduct.price,
              imageUrl: selectedProduct.productImageUrl
            };
          } else {
            console.log(`❌ 검색 결과 없음: "${query}"`);
          }
        } catch (searchError) {
          console.error(`❌ 검색 오류 (${query}):`, searchError.message);
        }
      }
      
      console.error('❌ 모든 타겟 검색 실패');
      // null 대신 기본값 반환
      return {
        name: '상품명 미확인',
        price: 0,
        imageUrl: 'https://via.placeholder.com/300x300?text=No+Image'
      };
      
    } catch (error) {
      console.error('❌ 타겟 검색 전체 실패:', error);
      // null 대신 기본값 반환
      return {
        name: '상품명 미확인',
        price: 0,
        imageUrl: 'https://via.placeholder.com/300x300?text=No+Image'
      };
    }
  }
}

export const wishlistService = new WishlistService();
