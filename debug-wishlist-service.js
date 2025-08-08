import { myBirthdayWishlistRepository } from './src/repositories/myBirthdayWishlist.repository.js';

async function debugWishlistService() {
  try {
    console.log('=== 위시리스트 서비스 디버그 ===');
    
    const userId = 1; // test1 사용자 ID
    
    console.log('1. getCurrentEventByUserId 호출...');
    const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
    console.log('currentEvent:', currentEvent);
    
    if (!currentEvent) {
      console.log('완료된 생일 이벤트가 없습니다');
      return;
    }
    
    console.log('\n2. getCurrentAmount 호출...');
    const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);
    console.log('currentAmount:', currentAmount);
    
    console.log('\n3. getBirthdayPersonSelectedProducts 호출...');
    const selectedProductIds = await myBirthdayWishlistRepository.getBirthdayPersonSelectedProducts(currentEvent.id);
    console.log('selectedProductIds (생일자가 선택한 상품들):', selectedProductIds);
    
    console.log('\n4. getTotalSelectedAmount 호출...');
    const totalSelectedAmount = await myBirthdayWishlistRepository.getTotalSelectedAmount(selectedProductIds);
    console.log('totalSelectedAmount:', totalSelectedAmount);
    
    console.log('\n5. getWishlistProducts 호출...');
    const products = await myBirthdayWishlistRepository.getWishlistProducts(
      userId, 
      { 
        sortBy: 'CREATED_AT', 
        cursor: null, 
        limit: 10, 
        selectedProductIds: selectedProductIds, 
        eventId: currentEvent.id 
      }
    );
    console.log('products:', products);

  } catch (error) {
    console.error('디버그 중 오류 발생:');
    console.error('오류 메시지:', error.message);
    console.error('스택 추적:', error.stack);
  }
}

debugWishlistService();
