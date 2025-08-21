// src/utils/kakao.util.js
// 순수한 카카오 API 호출 유틸리티
import fetch from 'node-fetch';

export class KakaoUtil {
  /**
   * 인가 코드를 액세스 토큰으로 교환
   */
  static async exchangeCodeForToken(authorizationCode) {
    const tokenURL = 'https://kauth.kakao.com/oauth/token';
    
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code: authorizationCode
    });

    if (process.env.KAKAO_CLIENT_SECRET) {
      requestBody.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }

    const response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`토큰 요청 실패: ${responseData.error_description || responseData.error}`);
    }

    return {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
      tokenType: responseData.token_type,
      expiresIn: responseData.expires_in,
      scope: responseData.scope,
      idToken: responseData.id_token // OpenID Connect
    };
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  static async getUserInfo(accessToken) {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const userData = await response.json();

    if (!response.ok) {
      throw new Error(`사용자 정보 조회 실패: ${userData.msg}`);
    }

    return {
      id: userData.id.toString(),
      email: userData.kakao_account?.email,
      nickname: userData.kakao_account?.profile?.nickname,
      profileImage: userData.kakao_account?.profile?.profile_image_url,
      thumbnailImage: userData.kakao_account?.profile?.thumbnail_image_url,
      isEmailVerified: userData.kakao_account?.is_email_verified
    };
  }

  /**
   * 리프레시 토큰으로 새 액세스 토큰 발급
   */
  static async refreshToken(refreshToken) {
    const tokenURL = 'https://kauth.kakao.com/oauth/token';

    const requestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KAKAO_CLIENT_ID,
      refresh_token: refreshToken
    });

    if (process.env.KAKAO_CLIENT_SECRET) {
      requestBody.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }

    const response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`토큰 갱신 실패: ${responseData.error_description || responseData.error}`);
    }

    return {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token || refreshToken,
      tokenType: responseData.token_type,
      expiresIn: responseData.expires_in
    };
  }

  /**
   * 카카오 인증 URL 생성
   */
  static generateAuthURL(redirectURI, state = null) {
    const baseURL = 'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: redirectURI,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email'
    });

    if (state) {
      params.append('state', state);
    }

    return `${baseURL}?${params.toString()}`;
  }
}