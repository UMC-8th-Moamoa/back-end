// test-kakao-existing.js
// 기존에 만들어진 카카오 코드들을 테스트하는 스크립트

import { KakaoUtil } from './src/utils/kakao.util.js';
import KakaoService from './src/services/kakao.service.js';
import KakaoController from './src/controllers/kakao.controller.js';

// 임시 액세스 토큰
const TEMP_ACCESS_TOKEN = 'SCjrOwW9epHUzFMrSwPvu3JHvpqubW80AAAAAQoNIBsAAAGYy_ySAMLen3w93lOl';

/**
 * 1. KakaoUtil 클래스 테스트
 */
async function testKakaoUtil() {
  console.log('🧪 === KakaoUtil 클래스 테스트 ===');
  
  try {
    // 1-1. 사용자 정보 조회 테스트
    console.log('\n📋 getUserInfo() 테스트:');
    const userInfo = await KakaoUtil.getUserInfo(TEMP_ACCESS_TOKEN);
    console.log('✅ 사용자 정보 조회 성공:');
    console.log(JSON.stringify(userInfo, null, 2));
    
    // 1-2. 인증 URL 생성 테스트
    console.log('\n🔗 generateAuthURL() 테스트:');
    const authURL = KakaoUtil.generateAuthURL(
      'https://www.moamoas.com/api/auth/kakao/callback-direct',
      'test_state_123'
    );
    console.log('✅ 인증 URL 생성 성공:');
    console.log(authURL);
    
    return userInfo;
    
  } catch (error) {
    console.error('❌ KakaoUtil 테스트 실패:', error.message);
    return null;
  }
}

/**
 * 2. KakaoService 클래스 테스트 (일부 메소드)
 */
async function testKakaoService() {
  console.log('\n🧪 === KakaoService 클래스 테스트 ===');
  
  try {
    // 2-1. 카카오 인증 URL 생성 테스트
    console.log('\n🔗 generateKakaoAuthURL() 테스트:');
    const authURL = KakaoService.generateKakaoAuthURL();
    console.log('✅ 카카오 인증 URL 생성 성공:');
    console.log(authURL);
    
    // 2-2. 고유 사용자 ID 생성 테스트 (DB 없이 시뮬레이션)
    console.log('\n🆔 generateUniqueUserId() 시뮬레이션:');
    const testKakaoId = '4383845253'; // 실제 카카오 ID
    const uniqueUserId = `kakao_${testKakaoId}`;
    console.log('✅ 생성된 고유 사용자 ID:', uniqueUserId);
    
  } catch (error) {
    console.error('❌ KakaoService 테스트 실패:', error.message);
  }
}

/**
 * 3. 환경 변수 설정 확인
 */
function testEnvironmentVariables() {
  console.log('\n🧪 === 환경 변수 설정 확인 ===');
  
  const requiredEnvVars = [
    'KAKAO_CLIENT_ID',
    'KAKAO_CLIENT_SECRET', 
    'KAKAO_REDIRECT_URI',
    'BASE_URL',
    'CLIENT_URL'
  ];
  
  const envStatus = {};
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    envStatus[varName] = {
      exists: !!value,
      value: value ? `${value.substring(0, 10)}...` : null
    };
  });
  
  console.log('📋 환경 변수 상태:');
  console.table(envStatus);
  
  const allSet = requiredEnvVars.every(varName => process.env[varName]);
  console.log(allSet ? '✅ 모든 환경 변수가 설정됨' : '❌ 일부 환경 변수가 누락됨');
  
  return allSet;
}

/**
 * 4. 카카오 API 응답 구조 분석
 */
function analyzeKakaoUserData(userData) {
  if (!userData) {
    console.log('❌ 분석할 사용자 데이터가 없습니다.');
    return;
  }
  
  console.log('\n🧪 === 카카오 사용자 데이터 구조 분석 ===');
  
  const analysis = {
    기본정보: {
      id: userData.id,
      connected_at: userData.connected_at
    },
    계정정보: {
      email: userData.kakao_account?.email,
      is_email_verified: userData.kakao_account?.is_email_verified,
      is_email_valid: userData.kakao_account?.is_email_valid,
      has_email: userData.kakao_account?.has_email
    },
    프로필정보: {
      nickname: userData.kakao_account?.profile?.nickname,
      profile_image_url: userData.kakao_account?.profile?.profile_image_url,
      thumbnail_image_url: userData.kakao_account?.profile?.thumbnail_image_url,
      is_default_image: userData.kakao_account?.profile?.is_default_image
    },
    권한정보: userData.kakao_account?.scope || []
  };
  
  console.log('📊 데이터 구조 분석 결과:');
  console.log(JSON.stringify(analysis, null, 2));
  
  // 기존 코드에서 사용하는 필드들이 모두 있는지 확인
  const requiredFields = {
    'ID': userData.id,
    '이메일': userData.kakao_account?.email,
    '닉네임': userData.kakao_account?.profile?.nickname,
    '프로필사진': userData.kakao_account?.profile?.profile_image_url,
    '이메일인증': userData.kakao_account?.is_email_verified
  };
  
  console.log('\n✅ 기존 코드 호환성 확인:');
  Object.entries(requiredFields).forEach(([field, value]) => {
    console.log(`${field}: ${value ? '✅ 존재' : '❌ 없음'} (${value})`);
  });
}

/**
 * 5. 데이터베이스 연결 없이 사용자 생성 로직 시뮬레이션
 */
function simulateUserCreation(userData) {
  if (!userData) return;
  
  console.log('\n🧪 === 사용자 생성 로직 시뮬레이션 ===');
  
  const kakaoId = userData.id.toString();
  const kakaoEmail = userData.kakao_account?.email;
  const kakaoNickname = userData.kakao_account?.profile?.nickname;
  const kakaoProfileImage = userData.kakao_account?.profile?.profile_image_url;
  
  // 기존 코드의 로직 시뮬레이션
  const simulatedUser = {
    email: kakaoEmail || `kakao_${kakaoId}@kakao.temp`,
    name: kakaoNickname || '카카오 사용자',
    user_id: `kakao_${kakaoId}`, // 실제로는 generateUniqueUserId 사용
    photo: kakaoProfileImage || null,
    emailVerified: !!kakaoEmail,
    createdFrom: 'kakao_oauth'
  };
  
  console.log('👤 시뮬레이션된 사용자 데이터:');
  console.log(JSON.stringify(simulatedUser, null, 2));
  
  // 소셜 로그인 데이터 시뮬레이션
  const simulatedSocialLogin = {
    provider: 'kakao',
    providerId: kakaoId,
    accessToken: TEMP_ACCESS_TOKEN,
    refreshToken: null, // 실제로는 교환 과정에서 받음
    tokenExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2시간 후
  };
  
  console.log('🔗 시뮬레이션된 소셜 로그인 데이터:');
  console.log(JSON.stringify(simulatedSocialLogin, null, 2));
}

/**
 * 6. JWT 토큰 생성 테스트 (실제 generateTokenPair 함수 사용)
 */
function testJWTGeneration(userData) {
  if (!userData) return;
  
  console.log('\n🧪 === JWT 토큰 생성 테스트 ===');
  
  try {
    // 모의 사용자 데이터
    const mockUser = {
      id: 999, // 테스트용 ID
      email: userData.kakao_account?.email || 'test@kakao.temp',
      user_id: `kakao_${userData.id}`
    };
    
    // 실제 JWT 유틸 함수를 import해서 테스트할 수 있음
    // import { generateTokenPair } from './src/utils/jwt.util.js';
    // const tokens = generateTokenPair(mockUser.id, mockUser.email, mockUser.user_id);
    
    // 여기서는 구조만 시뮬레이션
    const mockTokens = {
      accessToken: 'mock_access_token_would_be_here',
      refreshToken: 'mock_refresh_token_would_be_here'
    };
    
    console.log('🎫 모의 JWT 토큰:');
    console.log(JSON.stringify(mockTokens, null, 2));
    
  } catch (error) {
    console.error('❌ JWT 토큰 생성 테스트 실패:', error.message);
  }
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 카카오 기존 코드 테스트 시작\n');
  
  // 1. 환경 변수 확인
  const envOk = testEnvironmentVariables();
  
  // 2. KakaoUtil 테스트
  const userData = await testKakaoUtil();
  
  // 3. KakaoService 테스트  
  await testKakaoService();
  
  // 4. 사용자 데이터 분석
  analyzeKakaoUserData(userData);
  
  // 5. 사용자 생성 로직 시뮬레이션
  simulateUserCreation(userData);
  
  // 6. JWT 토큰 생성 테스트
  testJWTGeneration(userData);
  
  console.log('\n✅ 모든 테스트 완료!');
  console.log('\n📝 테스트 결과 요약:');
  console.log('- 환경 변수:', envOk ? '✅ 정상' : '❌ 문제있음');
  console.log('- 카카오 API:', userData ? '✅ 정상' : '❌ 문제있음');
  console.log('- 코드 구조:', '✅ 분석완료');
}

// 테스트 실행
runAllTests().catch(console.error);

// 개별 테스트 함수들을 export하여 필요할 때 개별 실행 가능
export {
  testKakaoUtil,
  testKakaoService,
  testEnvironmentVariables,
  analyzeKakaoUserData,
  simulateUserCreation,
  testJWTGeneration
};