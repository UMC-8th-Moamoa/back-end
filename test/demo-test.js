// 데모 데이 기능 테스트 스크립트
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const DEMO_URL = `${BASE_URL}/demo`;

// 테스트용 사용자 정보 (실제 DB에 있는 사용자 ID 사용)
const TEST_USER_ID = 1; // 실제 사용자 ID로 변경 필요
let TEST_JWT_TOKEN = ''; // 실제 JWT 토큰으로 변경 필요
let SHARE_LINK = '';

console.log('🚀 데모 데이 기능 테스트 시작\n');

// 1. 데모 이벤트 생성 테스트
async function testCreateDemoEvent() {
  console.log('📝 1. 데모 이벤트 생성 테스트');
  
  try {
    const response = await axios.post(`${DEMO_URL}/events`, {}, {
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 데모 이벤트 생성 성공:', response.data);
    SHARE_LINK = response.data.result.shareLink;
    console.log('🔗 공유 링크:', response.data.result.shareUrl);
    console.log('');
  } catch (error) {
    console.log('❌ 데모 이벤트 생성 실패:', error.response?.data || error.message);
    console.log('');
  }
}

// 2. 공유 링크로 데모 이벤트 조회 테스트 (비회원 접근)
async function testGetDemoEventByShareLink() {
  console.log('📖 2. 공유 링크로 데모 이벤트 조회 테스트 (비회원)');
  
  if (!SHARE_LINK) {
    console.log('❌ 공유 링크가 없습니다. 먼저 데모 이벤트를 생성하세요.');
    return;
  }
  
  try {
    const response = await axios.get(`${DEMO_URL}/events/${SHARE_LINK}/public`);
    
    console.log('✅ 공유 링크 조회 성공:', response.data);
    console.log('');
  } catch (error) {
    console.log('❌ 공유 링크 조회 실패:', error.response?.data || error.message);
    console.log('');
  }
}

// 3. 데모 편지 작성 테스트 (비회원)
async function testCreateDemoLetter() {
  console.log('✍️  3. 데모 편지 작성 테스트 (비회원)');
  
  if (!SHARE_LINK) {
    console.log('❌ 공유 링크가 없습니다. 먼저 데모 이벤트를 생성하세요.');
    return;
  }
  
  try {
    const letterData = {
      writerName: '테스트 작성자',
      content: '안녕하세요! 이것은 데모 데이를 위한 테스트 편지입니다. 🎉'
    };
    
    const response = await axios.post(`${DEMO_URL}/events/${SHARE_LINK}/letters`, letterData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 데모 편지 작성 성공:', response.data);
    console.log('');
  } catch (error) {
    console.log('❌ 데모 편지 작성 실패:', error.response?.data || error.message);
    console.log('');
  }
}

// 4. 내 데모 편지들 조회 테스트
async function testGetMyDemoLetters() {
  console.log('📬 4. 내 데모 편지들 조회 테스트');
  
  try {
    const response = await axios.get(`${DEMO_URL}/letters?page=1&size=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 내 데모 편지들 조회 성공:', response.data);
    console.log('');
  } catch (error) {
    console.log('❌ 내 데모 편지들 조회 실패:', error.response?.data || error.message);
    console.log('');
  }
}

// 5. 내 데모 이벤트 조회 테스트
async function testGetMyDemoEvent() {
  console.log('👤 5. 내 데모 이벤트 조회 테스트');
  
  try {
    const response = await axios.get(`${DEMO_URL}/events/my`, {
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 내 데모 이벤트 조회 성공:', response.data);
    console.log('');
  } catch (error) {
    console.log('❌ 내 데모 이벤트 조회 실패:', error.response?.data || error.message);
    console.log('');
  }
}

// 모든 테스트 실행
async function runAllTests() {
  console.log('⚠️  주의: 이 테스트를 실행하기 전에:');
  console.log('1. TEST_USER_ID를 실제 데이터베이스에 있는 사용자 ID로 변경하세요');
  console.log('2. TEST_JWT_TOKEN을 실제 JWT 토큰으로 변경하세요');
  console.log('3. 서버가 http://localhost:3000에서 실행 중인지 확인하세요\n');
  
  if (!TEST_JWT_TOKEN) {
    console.log('❌ JWT 토큰이 설정되지 않았습니다. TEST_JWT_TOKEN 변수를 수정하세요.');
    return;
  }
  
  await testCreateDemoEvent();
  await testGetDemoEventByShareLink();
  await testCreateDemoLetter();
  await testGetMyDemoLetters();
  await testGetMyDemoEvent();
  
  console.log('🎉 모든 테스트 완료!');
  
  if (SHARE_LINK) {
    console.log(`\n🔗 생성된 공유 링크: http://localhost:3000/demo/${SHARE_LINK}`);
    console.log('이 링크를 브라우저에서 열어서 프론트엔드 연동을 테스트할 수 있습니다.');
  }
}

// 개별 테스트 함수들을 export
module.exports = {
  testCreateDemoEvent,
  testGetDemoEventByShareLink,
  testCreateDemoLetter,
  testGetMyDemoLetters,
  testGetMyDemoEvent,
  runAllTests
};

// 스크립트가 직접 실행될 때만 모든 테스트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}
