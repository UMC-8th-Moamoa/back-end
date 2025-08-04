/**
 * 네이버 쇼핑 API 크롤링 기능 테스트
 * 
 * 사용법:
 * 1. 서버를 실행합니다: npm run dev
 * 2. 이 스크립트를 실행합니다: node test/wishlist-crawling-test.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// 테스트용 사용자 토큰 (실제 환경에서는 로그인 후 받은 토큰 사용)
const TEST_TOKEN = 'your-jwt-token-here';

async function testWishlistCrawling() {
  console.log('🧪 위시리스트 크롤링 기능 테스트 시작\n');

  const testCases = [
    {
      name: '쿠팡 상품 URL',
      data: {
        insertType: 'URL',
        url: 'https://www.coupang.com/vp/products/1234567890',
        isPublic: true
      }
    },
    {
      name: '지마켓 상품 URL',
      data: {
        insertType: 'URL',
        url: 'https://item.gmarket.co.kr/Item?goodscode=1234567890',
        isPublic: true
      }
    },
    {
      name: '네이버 쇼핑 URL',
      data: {
        insertType: 'URL',
        url: 'https://shopping.naver.com/home/p/12345678?query=아이폰',
        isPublic: true
      }
    },
    {
      name: '검색어가 포함된 URL',
      data: {
        insertType: 'URL',
        url: 'https://example.com/search?q=애플워치&category=electronics',
        isPublic: true
      }
    },
    {
      name: '일반적인 상품 URL',
      data: {
        insertType: 'URL',
        url: 'https://store.example.com/products/nike-air-max',
        isPublic: false
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 테스트: ${testCase.name}`);
    console.log(`   URL: ${testCase.data.url}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/wishlists`, testCase.data, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ 성공: ${response.data.productName} - ${response.data.price?.toLocaleString()}원`);
      console.log(`   📷 이미지: ${response.data.productImageUrl?.substring(0, 50)}...`);
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ 실패 (${error.response.status}): ${error.response.data?.message || error.message}`);
      } else {
        console.log(`   ❌ 네트워크 오류: ${error.message}`);
      }
    }
    
    console.log('');
  }

  console.log('🎯 수동 입력 방식 테스트');
  try {
    const manualData = {
      insertType: 'IMAGE',
      productName: '수동 입력 테스트 상품',
      price: 99000,
      imageUrl: 'https://example.com/test-image.jpg',
      isPublic: true
    };

    const response = await axios.post(`${BASE_URL}/wishlists`, manualData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   ✅ 수동 입력 성공: ${response.data.productName}`);
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ 수동 입력 실패 (${error.response.status}): ${error.response.data?.message || error.message}`);
    } else {
      console.log(`   ❌ 네트워크 오류: ${error.message}`);
    }
  }

  console.log('\n🎉 테스트 완료!');
  console.log('\n💡 참고사항:');
  console.log('   - 실제 테스트를 위해서는 유효한 JWT 토큰이 필요합니다');
  console.log('   - 서버가 실행 중이어야 합니다 (npm run dev)');
  console.log('   - 네이버 API 키가 .env 파일에 올바르게 설정되어야 합니다');
}

// 테스트 실행
testWishlistCrawling().catch(console.error);
