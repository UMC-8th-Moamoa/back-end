import dotenv from 'dotenv';
import { naverShoppingService } from '../src/services/naverShopping.service.js';

// 환경변수 로드
dotenv.config();

async function testNaverShoppingAPI() {
  console.log('🔍 네이버 쇼핑 API 테스트 시작...\n');

  try {
    // 1. 기본 상품 검색 테스트
    console.log('1. "나이키" 검색 테스트:');
    const nikeProducts = await naverShoppingService.searchProducts('나이키', 3);
    console.log(`✅ ${nikeProducts.length}개 상품 검색 완료`);
    nikeProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.productName} - ${product.price.toLocaleString()}원`);
    });
    console.log('');

    // 2. 첫 번째 상품을 위시리스트 형식으로 변환 테스트
    console.log('2. 위시리스트 형식 변환 테스트:');
    const wishlistData = await naverShoppingService.getFirstProductForWishlist('애플 에어팟');
    console.log('✅ 위시리스트 데이터 생성 완료:');
    console.log('   Request format:', {
      insertType: wishlistData.insertType,
      url: wishlistData.url.substring(0, 50) + '...',
      isPublic: wishlistData.isPublic
    });
    console.log('   Crawled data:', wishlistData._crawledData);
    console.log('');

    // 3. 여러 상품을 위시리스트 형식으로 변환 테스트
    console.log('3. 다중 상품 위시리스트 변환 테스트:');
    const multipleWishlistData = await naverShoppingService.getProductsForWishlist('갤럭시', 2);
    console.log(`✅ ${multipleWishlistData.length}개 위시리스트 데이터 생성 완료`);
    multipleWishlistData.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item._crawledData.productName} - ${item._crawledData.price.toLocaleString()}원`);
    });
    console.log('');

    console.log('🎉 모든 테스트가 성공적으로 완료되었습니다!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('   API 응답 상태:', error.response.status);
      console.error('   API 응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testNaverShoppingAPI();
