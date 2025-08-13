import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// 이미지 분석 API 테스트
async function testAnalyzeImageAPI() {
  console.log('🔍 이미지 분석 API 테스트 시작...\n');

  // 테스트용 이미지 URL들 (공개적으로 접근 가능한 이미지들)
  const testImages = [
    {
      name: '신발 이미지',
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500'
    },
    {
      name: '시계 이미지', 
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
    },
    {
      name: '노트북 이미지',
      url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'
    }
  ];

  for (const testImage of testImages) {
    console.log(`\n📷 테스트: ${testImage.name}`);
    console.log(`🖼️ 이미지 URL: ${testImage.url}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlists/analyze`, {
        imageUrl: testImage.url
      }, {
        timeout: 60000 // 60초 타임아웃 (AI 분석 시간 고려)
      });

      console.log('✅ 응답 성공!');
      console.log(`🤖 AI 분석 결과 (영어): "${response.data.caption_en}"`);
      console.log(`🇰🇷 AI 분석 결과 (한국어): "${response.data.caption_ko}"`);
      console.log(`🔍 검색 키워드: "${response.data.searchKeyword}"`);
      console.log('🛍️ 추천 상품:');
      console.log(`   - 상품명: ${response.data.result.title}`);
      console.log(`   - 가격: ${response.data.result.price}원`);
      console.log(`   - 쇼핑몰: ${response.data.result.mallName}`);
      console.log(`   - 이미지: ${response.data.result.image}`);
      console.log(`⏰ 분석 시간: ${response.data.analyzedAt}`);
      
    } catch (error) {
      console.error('❌ 요청 실패:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ 타임아웃 발생 - AI 서버 응답이 너무 느립니다');
      } else if (error.response?.status === 500) {
        console.error('🚨 서버 내부 오류 - AI 서버 연결 상태를 확인하세요');
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// 잘못된 요청 테스트
async function testInvalidRequests() {
  console.log('\n\n🚫 잘못된 요청 테스트...\n');

  const invalidTests = [
    {
      name: 'imageUrl 누락',
      data: {}
    },
    {
      name: '잘못된 URL 형식',
      data: { imageUrl: 'invalid-url' }
    },
    {
      name: '존재하지 않는 이미지',
      data: { imageUrl: 'https://nonexistent-domain-12345.com/image.jpg' }
    }
  ];

  for (const test of invalidTests) {
    console.log(`\n🧪 테스트: ${test.name}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlists/analyze`, test.data, {
        timeout: 10000
      });
      
      console.log('⚠️ 예상과 다른 성공 응답:', response.data);
      
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.log(`✅ 예상된 오류 응답 (${status}):`, errorData);
    }
  }
}

// 서버 연결 확인
async function checkServerConnection() {
  console.log('🔌 서버 연결 상태 확인...\n');
  
  try {
    // Node.js 서버 확인
    const nodeResponse = await axios.get(`${API_BASE_URL}/api/wishlists/popular?limit=1`, {
      timeout: 5000
    });
    console.log('✅ Node.js 서버 연결 정상');
    
    // BLIP2 AI 서버 확인
    const aiResponse = await axios.get('http://localhost:5000', {
      timeout: 5000
    });
    console.log('✅ BLIP2 AI 서버 연결 정상');
    
    return true;
    
  } catch (error) {
    if (error.message.includes('localhost:3000')) {
      console.error('❌ Node.js 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
    } else if (error.message.includes('localhost:5000')) {
      console.error('❌ BLIP2 AI 서버에 연결할 수 없습니다. Python Flask 서버가 실행 중인지 확인하세요.');
    } else {
      console.error('❌ 서버 연결 확인 실패:', error.message);
    }
    
    return false;
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🚀 이미지 분석 API 전체 테스트 시작\n');
  console.log('=' * 60);
  
  // 1. 서버 연결 확인
  const isConnected = await checkServerConnection();
  if (!isConnected) {
    console.log('\n❌ 서버 연결 실패로 테스트를 중단합니다.');
    return;
  }
  
  console.log('\n' + '=' * 60);
  
  // 2. 정상적인 이미지 분석 테스트
  await testAnalyzeImageAPI();
  
  // 3. 잘못된 요청 테스트
  await testInvalidRequests();
  
  console.log('\n\n🎉 모든 테스트 완료!');
  console.log('\n📝 테스트 결과 요약:');
  console.log('- ✅ 정상적인 이미지 분석 요청 테스트');
  console.log('- ✅ 에러 처리 및 유효성 검사 테스트');
  console.log('\n💡 추가 테스트를 위해서는:');
  console.log('1. 다양한 이미지 유형으로 테스트');
  console.log('2. 큰 용량의 이미지로 성능 테스트');
  console.log('3. 동시 요청 부하 테스트');
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testAnalyzeImageAPI, testInvalidRequests, checkServerConnection };
