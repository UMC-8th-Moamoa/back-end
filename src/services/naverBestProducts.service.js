import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

class NaverBestProductsService {
  constructor() {
    this.baseUrl = 'https://shopping.naver.com/ns/product/best/click';
    this.fallbackUrls = [
      'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY&ageType=MEN_20',
      'https://shopping.naver.com/home/best/click',
      'https://shopping.naver.com/api/modules/gnb/best-product'
    ];
  }

  /**
   * 네이버 쇼핑 베스트 상품 크롤링 (Puppeteer 사용)
   * @param {number} limit - 가져올 상품 개수 (기본 10개)
   * @returns {Promise<Object[]>} 베스트 상품 목록
   */
  async getBestProductsWithPuppeteer(limit = 10) {
    let browser;
    
    try {
      console.log('🚀 Puppeteer로 네이버 쇼핑 베스트 상품 크롤링 시작...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // User-Agent 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 뷰포트 설정
      await page.setViewport({ width: 1920, height: 1080 });

      const targetUrl = 'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY&ageType=MEN_20';
      console.log(`📡 페이지 로딩: ${targetUrl}`);

      // 페이지 로드
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // 베스트 상품 페이지 전용 셀렉터들로 대기
      try {
        await page.waitForSelector('.snx_bestseller_list, .bestseller_list, .product_list, .basicList_list_basis__uNBZC, [data-testid="basicProductList"]', { 
          timeout: 15000 
        });
        console.log('✅ 베스트 상품 목록 로딩 확인됨');
      } catch (e) {
        console.log('⚠️ 기본 셀렉터로 상품을 찾을 수 없습니다. 페이지 구조를 분석합니다.');
      }

      // 페이지가 완전히 로드될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 스크롤을 통해 더 많은 상품 로드 시도
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 페이지 콘텐츠 가져오기
      const content = await page.content();
      const $ = cheerio.load(content);

      console.log('🔍 상품 정보 추출 중...');

      const products = [];
      
      // 베스트 상품 페이지(snxbest.naver.com)에 특화된 셀렉터들
      const selectors = [
        // snxbest 페이지 전용 셀렉터들
        '.snx_bestseller_list .snx_bestseller_item',
        '.bestseller_list .bestseller_item',
        '.snx_bestseller_item',
        '.bestseller_item',
        '[class*="bestseller_item"]',
        '[class*="snx_bestseller"]',
        // 일반적인 베스트 상품 구조
        '[class*="bestseller"] [class*="item"]',
        '[class*="best"] [class*="item"]',
        // 기본적인 상품 구조들
        '.basicList_list_basis__uNBZC .basicList_item__2XT81',
        '.basicList_item__2XT81',
        '.product_list .product_item',
        '.product_item',
        '.list_list__2OBzT .item_item__2kCtJ',
        '.item_item__2kCtJ',
        // 더 넓은 범위 검색
        '[data-testid="basicProductList"] > div',
        '.basicList_list_basis__uNBZC > div',
        '.list_list__2OBzT > div',
        '.list_item',
        // 링크 기반 검색 (가장 확실한 방법)
        'a[href*="/product/"]',
        'a[href*="shopping.naver.com/products"]',
        // 이미지 기반 검색
        'img[src*="shopping-phinf.pstatic.net"]',
        // 가격이 있는 요소들
        '[class*="price"]',
        // 마지막 수단
        '[class*="product"]',
        '[class*="item"]'
      ];

      for (const selector of selectors) {
        console.log(`🔍 셀렉터 시도: ${selector}`);
        
        $(selector).each((index, element) => {
          if (products.length >= limit) return false;

          const $element = $(element);
          
          // 상품명 추출 - 네이버 쇼핑 실제 구조에 맞춘 셀렉터
          const productName = this.extractText($element, [
            '.basicList_title__3P9Q7',
            '.item_title__1E9L7', 
            '.basicList_link__1MaTN',
            '.item_link__2kDer',
            '.product_title',
            '.name',
            '[class*="title"]',
            '[class*="name"]',
            'a[href*="/product/"]',
            'strong',
            'h3',
            'h4',
            'span'
          ]);

          // 가격 추출 - 네이버 쇼핑 실제 구조에 맞춘 셀렉터
          const priceText = this.extractText($element, [
            '.price_num__2WUXn',
            '.price_price__1AsEs .price_num__2WUXn',
            '.item_price__3iTTr .price_num__2WUXn',
            '.basicList_price__2DL1L .price_num__2WUXn',
            '.price_num',
            '.price',
            '[class*="price"]',
            '.num',
            '[class*="amount"]',
            'span[class*="price"]',
            'em'
          ]);

          // 이미지 URL 추출 - 네이버 쇼핑 실제 구조에 맞춘 셀렉터
          const imageUrl = this.extractAttribute($element, [
            '.basicList_thumb__2ss3z img',
            '.item_thumb__2kVkH img',
            '.product_img img',
            '[class*="thumb"] img',
            '[class*="img"] img',
            'img'
          ], 'src');

          // 상품 URL 추출 - 네이버 쇼핑 실제 구조에 맞춘 셀렉터
          const productUrl = this.extractAttribute($element, [
            '.basicList_link__1MaTN',
            '.item_link__2kDer',
            'a[href*="/product/"]',
            'a[href*="shopping.naver.com"]',
            'a'
          ], 'href');

          if (productName && priceText) {
            const price = this.parsePrice(priceText);
            
            if (price > 0) {
              products.push({
                productName: productName.trim(),
                price: price,
                productImageUrl: imageUrl ? this.normalizeImageUrl(imageUrl) : '',
                url: productUrl ? this.normalizeProductUrl(productUrl) : '',
                mallName: '네이버쇼핑',
                rank: products.length + 1
              });

              console.log(`✅ 상품 ${products.length}: ${productName} - ${price.toLocaleString()}원`);
            }
          }
        });

        if (products.length > 0) {
          console.log(`✅ 셀렉터 "${selector}"로 ${products.length}개 상품 추출 성공`);
          break;
        }
      }

      if (products.length === 0) {
        console.log('📄 페이지 HTML 구조 분석...');
        console.log('Title:', await page.title());
        
        // 페이지의 모든 클래스명 분석
        const classes = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const classSet = new Set();
          elements.forEach(el => {
            if (el.className && typeof el.className === 'string') {
              el.className.split(' ').forEach(cls => {
                if (cls.includes('item') || cls.includes('product') || cls.includes('list') || cls.includes('basic')) {
                  classSet.add(cls);
                }
              });
            }
          });
          return Array.from(classSet).slice(0, 20);
        });
        console.log('관련 클래스명들:', classes);
        
        // 페이지의 모든 링크와 이미지 확인
        const links = await page.$$eval('a', links => 
          links.slice(0, 10).map(link => ({
            text: link.textContent?.trim().slice(0, 50),
            href: link.href,
            classes: link.className
          }))
        );
        console.log('페이지 링크 샘플:', links);
        
        // 가격 정보가 있는 요소들 찾기
        const priceElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const priceEls = [];
          elements.forEach(el => {
            const text = el.textContent || '';
            if (text.includes('원') && text.match(/\d+/)) {
              priceEls.push({
                text: text.trim().slice(0, 50),
                className: el.className,
                tagName: el.tagName
              });
            }
          });
          return priceEls.slice(0, 10);
        });
        console.log('가격 요소들:', priceElements);
      }

      return products.slice(0, limit);

    } catch (error) {
      console.error('Puppeteer 크롤링 오류:', error);
      throw new Error(`네이버 쇼핑 베스트 상품 크롤링 실패: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 네이버 쇼핑 베스트 상품 크롤링 (Axios + Cheerio 사용)
   * @param {number} limit - 가져올 상품 개수 (기본 10개)
   * @returns {Promise<Object[]>} 베스트 상품 목록
   */
  async getBestProductsWithAxios(limit = 10) {
    try {
      console.log('🚀 Axios로 네이버 쇼핑 베스트 상품 크롤링 시작...');

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };

      const targetUrl = 'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY&ageType=MEN_20';
      console.log(`📡 페이지 요청: ${targetUrl}`);

      const response = await axios.get(targetUrl, {
        headers,
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      console.log('🔍 HTML 파싱 완료, 상품 정보 추출 중...');

      const products = [];
      const selectors = [
        // snxbest 페이지 전용 셀렉터들
        '.snx_bestseller_list .snx_bestseller_item',
        '.bestseller_list .bestseller_item',
        '.snx_bestseller_item',
        '.bestseller_item',
        '[class*="bestseller_item"]',
        '[class*="snx_bestseller"]',
        // 일반적인 베스트 상품 구조
        '[class*="bestseller"] [class*="item"]',
        '[class*="best"] [class*="item"]',
        // 기본적인 상품 구조들
        '.basicList_list_basis__uNBZC .basicList_item__2XT81',
        '.basicList_item__2XT81',
        '.product_list .product_item',
        '.product_item',
        '.list_list__2OBzT .item_item__2kCtJ',
        '.item_item__2kCtJ',
        '.basicList_list_basis__uNBZC > div',
        '.list_list__2OBzT > div',
        // 일반적인 구조
        '.list_item',
        '[class*="product"]',
        '[class*="item"]',
        // 가장 기본적인 구조
        'a[href*="/product/"]',
        'a[href*="shopping.naver.com/products"]'
      ];

      for (const selector of selectors) {
        console.log(`🔍 셀렉터 시도: ${selector}`);
        
        $(selector).each((index, element) => {
          if (products.length >= limit) return false;

          const $element = $(element);
          
          const productName = this.extractText($element, [
            '.basicList_title__3P9Q7',
            '.item_title__1E9L7', 
            '.basicList_link__1MaTN',
            '.item_link__2kDer',
            '.product_title',
            '.name',
            '[class*="title"]',
            '[class*="name"]',
            'a',
            'strong'
          ]);

          const priceText = this.extractText($element, [
            '.price_num__2WUXn',
            '.price_price__1AsEs .price_num__2WUXn',
            '.item_price__3iTTr .price_num__2WUXn',
            '.basicList_price__2DL1L .price_num__2WUXn',
            '.price_num',
            '.price',
            '[class*="price"]',
            '.num'
          ]);

          const imageUrl = this.extractAttribute($element, [
            '.basicList_thumb__2ss3z img',
            '.item_thumb__2kVkH img',
            'img',
            '.product_img img'
          ], 'src');

          const productUrl = this.extractAttribute($element, [
            '.basicList_link__1MaTN',
            '.item_link__2kDer',
            'a[href*="/product/"]',
            'a'
          ], 'href');

          if (productName && priceText) {
            const price = this.parsePrice(priceText);
            
            if (price > 0) {
              products.push({
                productName: productName.trim(),
                price: price,
                productImageUrl: imageUrl ? this.normalizeImageUrl(imageUrl) : '',
                url: productUrl ? this.normalizeProductUrl(productUrl) : '',
                mallName: '네이버쇼핑',
                rank: products.length + 1
              });
            }
          }
        });

        if (products.length > 0) {
          console.log(`✅ 셀렉터 "${selector}"로 ${products.length}개 상품 추출 성공`);
          break;
        }
      }

      return products.slice(0, limit);

    } catch (error) {
      console.error('Axios 크롤링 오류:', error);
      throw new Error(`네이버 쇼핑 베스트 상품 크롤링 실패: ${error.message}`);
    }
  }

  /**
   * 베스트 상품 가져오기 (API만 사용)
   * @param {number} limit - 가져올 상품 개수
   * @returns {Promise<Object[]>} 베스트 상품 목록
   */
  async getBestProducts(limit = 10) {
    console.log(`🛍️ 네이버 쇼핑 베스트 상품 ${limit}개 크롤링 시작`);
    
    // 크롤링은 문제가 많으므로 바로 API 사용
    try {
      console.log('🔄 네이버 쇼핑 API로 베스트 상품 조회...');
      const searchResults = await this.getPopularProductsFromAPI(limit);
      if (searchResults.length > 0) {
        console.log(`✅ API로 ${searchResults.length}개 상품 조회 성공!`);
        return searchResults;
      }
    } catch (error) {
      console.log(`❌ API 방식 실패: ${error.message}`);
    }

    throw new Error('베스트 상품 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
  }

  /**
   * 네이버 쇼핑 API를 이용한 인기 상품 조회
   * @param {number} limit - 가져올 상품 개수
   * @returns {Promise<Object[]>} 상품 목록
   */
  async getPopularProductsFromAPI(limit = 10) {
    // 지정된 카테고리별 키워드 (각각 1개씩, 총 10개)
    const categoryKeywords = [
      '핸드폰', '신발', '옷', '바지', '유니폼', 
      '노트북', '향수', '디퓨저', '무드등', '스마트워치'
    ];
    
    const allProducts = [];
    
    // 각 카테고리에서 1개씩 상품 추출
    for (const keyword of categoryKeywords) {
      try {
        console.log(`🔍 "${keyword}" 카테고리에서 1개 상품 검색 중...`);
        
        const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
          params: {
            query: keyword,
            display: 10, // 10개 검색해서 가장 적절한 것 선택
            sort: 'sim' // 정확도순
          },
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
          timeout: 5000
        });

        if (response.data?.items?.length > 0) {
          // 여러 상품 중에서 가장 적절한 상품 선택
          let selectedItem = null;
          
          for (const item of response.data.items) {
            const productName = item.title.replace(/<[^>]*>/g, '').trim();
            const price = parseInt(item.lprice) || 0;
            
            // 유효한 상품명과 가격인지 검사
            if (productName && 
                productName.length >= 3 && 
                price >= 1000 &&
                !['정가', '할인율', '원', '할인', '무료배송', '리뷰', '상품평'].includes(productName) &&
                !/^[\d,\.원\s]+$/.test(productName) &&
                productName !== keyword &&
                !productName.includes('...')) {
              
              selectedItem = { ...item, productName, price };
              break; // 첫 번째 유효한 상품 선택
            }
          }
          
          if (selectedItem) {
            const product = {
              productName: selectedItem.productName,
              price: selectedItem.price,
              productImageUrl: selectedItem.image || '',
              url: selectedItem.link || '',
              mallName: selectedItem.mallName || '네이버쇼핑',
              rank: allProducts.length + 1,
              category: keyword
            };

            allProducts.push(product);
            console.log(`✅ "${keyword}" 상품 발견: ${product.productName} - ${product.price.toLocaleString()}원`);
          } else {
            console.log(`⚠️ "${keyword}" 카테고리에서 유효한 상품을 찾을 수 없음`);
          }
        } else {
          console.log(`❌ "${keyword}" 카테고리에서 상품을 찾을 수 없음`);
        }

        // 각 요청 사이에 짧은 지연 (API 요청 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`❌ "${keyword}" 카테고리 검색 실패: ${error.message}`);
        continue;
      }
    }

    console.log(`🎯 총 ${allProducts.length}개 카테고리별 상품 수집 완료`);
    
    // 순서대로 랭킹 재설정하여 반환
    return allProducts.slice(0, limit).map((product, index) => ({
      ...product,
      rank: index + 1
    }));
  }

  /**
   * 대체 URL들로 크롤링 시도
   * @param {number} limit - 가져올 상품 개수
   * @returns {Promise<Object[]>} 베스트 상품 목록
   */
  async tryAlternativeUrls(limit = 10) {
    const alternativeUrls = [
      // snxbest 베스트 상품 페이지들 (가장 확실함)
      'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY&ageType=MEN_20',
      'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY&ageType=WOMEN_20',
      'https://snxbest.naver.com/product/best/click?categoryId=A&sortType=PRODUCT_CLICK&periodType=DAILY',
      'https://snxbest.naver.com/product/best/click?categoryId=B&sortType=PRODUCT_CLICK&periodType=DAILY',
      'https://snxbest.naver.com/product/best/click?categoryId=C&sortType=PRODUCT_CLICK&periodType=DAILY',
      // 다른 베스트 상품 URL들
      'https://search.shopping.naver.com/search/all?query=%EC%9D%B8%EA%B8%B0%EC%83%81%ED%92%88',
      'https://search.shopping.naver.com/search/all?query=%EB%B2%A0%EC%8A%A4%ED%8A%B8',
      'https://search.shopping.naver.com/search/all?query=%ED%9C%B4%EB%8C%80%ED%8F%B0',
      'https://search.shopping.naver.com/search/all?query=%EC%A0%84%EC%9E%90%EC%A0%9C%ED%92%88',
      'https://search.shopping.naver.com/category/50000000'
    ];

    for (const url of alternativeUrls) {
      try {
        console.log(`🔍 대체 URL 시도: ${url}`);
        
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': 'https://shopping.naver.com/'
        };

        const response = await axios.get(url, {
          headers,
          timeout: 10000,
          maxRedirects: 5
        });

        if (response.status === 200 && response.data) {
          const $ = cheerio.load(response.data);
          console.log(`✅ ${url} 응답 성공, HTML 파싱 중...`);
          
          // 간단한 상품 추출 시도
          const products = this.extractProductsFromHtml($, limit);
          
          if (products.length > 0) {
            console.log(`✅ ${url}에서 ${products.length}개 상품 발견!`);
            return products;
          }
        }
      } catch (error) {
        console.log(`❌ ${url} 실패: ${error.message}`);
        continue;
      }
    }

    return [];
  }

  /**
   * HTML에서 상품 정보 추출 (범용)
   * @param {CheerioAPI} $ - Cheerio 인스턴스
   * @param {number} limit - 추출할 상품 개수
   * @returns {Object[]} 상품 목록
   */
  extractProductsFromHtml($, limit = 10) {
    const products = [];
    
    // 가능한 모든 상품 링크 수집
    $('a[href*="/product/"]').each((index, element) => {
      if (products.length >= limit) return false;
      
      const $element = $(element);
      const $parent = $element.closest('div, li, article');
      
      const productName = this.extractText($parent, [
        '.basicList_title__3P9Q7',
        '.item_title__1E9L7',
        '[class*="title"]',
        '[class*="name"]',
        'span',
        'strong'
      ]) || this.extractText($element, ['span', 'strong']) || $element.text().trim();

      const priceText = this.extractText($parent, [
        '.price_num__2WUXn',
        '[class*="price"]',
        'em',
        'span'
      ]);

      const imageUrl = this.extractAttribute($parent, ['img'], 'src');
      const productUrl = $element.attr('href');

      if (productName && productName.length > 2 && priceText) {
        const price = this.parsePrice(priceText);
        
        if (price > 1000) { // 최소 1,000원 이상인 상품만
          products.push({
            productName: productName.trim(),
            price: price,
            productImageUrl: imageUrl ? this.normalizeImageUrl(imageUrl) : '',
            url: productUrl ? this.normalizeProductUrl(productUrl) : '',
            mallName: '네이버쇼핑',
            rank: products.length + 1
          });
          
          console.log(`📦 상품 ${products.length}: ${productName} - ${price.toLocaleString()}원`);
        }
      }
    });

    return products;
  }

  // 유틸리티 메서드들
  extractText($element, selectors) {
    for (const selector of selectors) {
      const text = $element.find(selector).first().text().trim();
      if (text) return text;
    }
    return $element.text().trim();
  }

  extractAttribute($element, selectors, attribute) {
    for (const selector of selectors) {
      const attr = $element.find(selector).first().attr(attribute);
      if (attr) return attr;
    }
    return '';
  }

  parsePrice(priceText) {
    if (!priceText) return 0;
    const cleanPrice = priceText.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }

  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('//')) return 'https:' + imageUrl;
    if (imageUrl.startsWith('/')) return 'https://shopping.naver.com' + imageUrl;
    return imageUrl;
  }

  normalizeProductUrl(productUrl) {
    if (!productUrl) return '';
    if (productUrl.startsWith('//')) return 'https:' + productUrl;
    if (productUrl.startsWith('/')) return 'https://shopping.naver.com' + productUrl;
    return productUrl;
  }
}

export const naverBestProductsService = new NaverBestProductsService();
