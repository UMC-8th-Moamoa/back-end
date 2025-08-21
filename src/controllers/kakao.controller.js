// src/controllers/kakao.controller.js
// 카카오 관련 요청/응답 처리
import KakaoService from '../services/kakao.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

class KakaoController {
  /**
   * 카카오 로그인 시작
   * GET /api/auth/kakao-direct
   */
  static startKakaoLogin = (req, res) => {
    console.log('🔄 카카오 로그인 시작');
    
    try {
      const kakaoAuthURL = KakaoService.generateKakaoAuthURL();
      
      console.log('📤 카카오 인증 페이지로 리다이렉트');
      res.redirect(kakaoAuthURL);
      
    } catch (error) {
      console.error('❌ 카카오 로그인 시작 실패:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent('카카오 로그인 초기화에 실패했습니다')}`);
    }
  };

  /**
   * 카카오 로그인 콜백 처리
   * GET /api/auth/kakao/callback-direct
   */
  static handleKakaoCallback = catchAsync(async (req, res) => {
    const { code, error, error_description, state } = req.query;

    console.log('📥 카카오 콜백 수신:', {
      hasCode: !!code,
      hasError: !!error,
      state,
      error: error || null
    });

    // 에러 처리
    if (error) {
      console.error('❌ 카카오 인증 에러:', { error, error_description });
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(
        `${clientUrl}/auth/error?message=${encodeURIComponent(error_description || error)}`
      );
    }

    // 인가 코드 확인
    if (!code) {
      console.error('❌ 인가 코드가 없습니다');
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(
        `${clientUrl}/auth/error?message=${encodeURIComponent('인가 코드를 받지 못했습니다')}`
      );
    }

    try {
      // KakaoService에서 전체 로그인 플로우 처리
      const result = await KakaoService.handleKakaoLogin(code);
      
      console.log('✅ 카카오 로그인 완료 - 클라이언트로 리다이렉트', {
        userId: result.user.id,
        email: result.user.email,
        user_id: result.user.user_id
      });
      
      // 클라이언트로 리다이렉트 (JWT 토큰과 함께)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = `${clientUrl}/auth/callback?accessToken=${encodeURIComponent(result.tokens.accessToken)}&refreshToken=${encodeURIComponent(result.tokens.refreshToken)}`;
      
      console.log('리다이렉트 URL 길이:', redirectUrl.length);
      console.log('클라이언트 URL:', clientUrl);
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ 카카오 로그인 처리 중 오류:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(
        `${clientUrl}/auth/error?message=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다: ' + error.message)}`
      );
    }
  });

  /**
   * 카카오 토큰 갱신
   * POST /api/auth/kakao/refresh
   */
  static refreshKakaoToken = catchAsync(async (req, res) => {
    const userId = req.user.id;

    try {
      const newTokenInfo = await KakaoService.refreshKakaoToken(userId);
      
      res.success({
        message: '카카오 토큰이 갱신되었습니다',
        tokenInfo: {
          expiresIn: newTokenInfo.expiresIn,
          tokenType: newTokenInfo.tokenType
        }
      });

    } catch (error) {
      console.error('❌ 카카오 토큰 갱신 실패:', error);
      res.error({
        errorCode: 'KAKAO_TOKEN_REFRESH_FAILED',
        reason: error.message
      });
    }
  });

  /**
   * 카카오 연동 해제
   * POST /api/auth/kakao/unlink
   */
  static unlinkKakao = catchAsync(async (req, res) => {
    const userId = req.user.id;

    try {
      const result = await KakaoService.unlinkKakao(userId);
      
      res.success(result);

    } catch (error) {
      console.error('❌ 카카오 연동 해제 실패:', error);
      res.error({
        errorCode: 'KAKAO_UNLINK_FAILED',
        reason: error.message
      });
    }
  });

  /**
   * 카카오 사용자 정보 동기화
   * POST /api/auth/kakao/sync
   */
  static syncKakaoUserInfo = catchAsync(async (req, res) => {
    const userId = req.user.id;

    try {
      const updatedUser = await KakaoService.syncKakaoUserInfo(userId);
      
      res.success({
        message: '카카오 사용자 정보가 동기화되었습니다',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          photo: updatedUser.photo,
          emailVerified: updatedUser.emailVerified
        }
      });

    } catch (error) {
      console.error('❌ 카카오 사용자 정보 동기화 실패:', error);
      res.error({
        errorCode: 'KAKAO_SYNC_FAILED',
        reason: error.message
      });
    }
  });

  /**
   * 카카오 연동 상태 확인
   * GET /api/auth/kakao/status
   */
  static getKakaoConnectionStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;

    try {
      const status = await KakaoService.getKakaoConnectionStatus(userId);
      
      res.success({
        kakaoConnection: status
      });

    } catch (error) {
      console.error('❌ 카카오 연동 상태 확인 실패:', error);
      res.error({
        errorCode: 'KAKAO_STATUS_CHECK_FAILED',
        reason: error.message
      });
    }
  });

  /**
   * 카카오 로그인 URL 생성 (API로 제공)
   * GET /api/auth/kakao/auth-url
   */
  static getKakaoAuthURL = catchAsync(async (req, res) => {
    const { redirect_uri, state } = req.query;

    try {
      const authURL = KakaoService.generateKakaoAuthURL(redirect_uri, state);
      
      res.success({
        authURL,
        message: '카카오 인증 URL이 생성되었습니다'
      });

    } catch (error) {
      console.error('❌ 카카오 인증 URL 생성 실패:', error);
      res.error({
        errorCode: 'KAKAO_AUTH_URL_GENERATION_FAILED',
        reason: error.message
      });
    }
  });

  /**
   * 카카오 로그인 테스트 (개발용)
   * GET /api/auth/kakao/test
   */
  static testKakaoLogin = catchAsync(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.error({
        errorCode: 'NOT_AVAILABLE_IN_PRODUCTION',
        reason: '프로덕션 환경에서는 사용할 수 없습니다'
      });
    }

    try {
      // 환경변수 확인
      const config = {
        hasClientId: !!process.env.KAKAO_CLIENT_ID,
        hasClientSecret: !!process.env.KAKAO_CLIENT_SECRET,
        hasRedirectUri: !!process.env.KAKAO_REDIRECT_URI,
        baseUrl: process.env.BASE_URL,
        clientUrl: process.env.CLIENT_URL
      };

      const authURL = KakaoService.generateKakaoAuthURL();

      res.success({
        message: '카카오 로그인 테스트 정보',
        config,
        authURL,
        testSteps: [
          '1. 위의 authURL로 접근하여 카카오 로그인',
          '2. 로그인 완료 후 콜백 URL 확인',
          '3. JWT 토큰 발급 확인',
          '4. 사용자 정보 저장 확인'
        ]
      });

    } catch (error) {
      console.error('❌ 카카오 로그인 테스트 실패:', error);
      res.error({
        errorCode: 'KAKAO_TEST_FAILED',
        reason: error.message
      });
    }
  });
}

export default KakaoController;