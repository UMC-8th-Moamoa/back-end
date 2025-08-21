// src/services/kakao.service.js
// 카카오 관련 비즈니스 로직 (수정된 버전)
import { KakaoUtil } from '../utils/kakao.util.js';
import { generateTokenPair } from '../utils/jwt.util.js';
import prisma from '../config/prismaClient.js';

class KakaoService {
  /**
   * 카카오 로그인 처리 (전체 플로우)
   */
  static async handleKakaoLogin(authorizationCode) {
    try {
      console.log('🔄 카카오 로그인 처리 시작');

      // 1. 인가 코드를 토큰으로 교환
      const tokenInfo = await KakaoUtil.exchangeCodeForToken(authorizationCode);
      console.log('✅ 토큰 교환 완료');

      // 2. 사용자 정보 조회
      const kakaoUserInfo = await KakaoUtil.getUserInfo(tokenInfo.accessToken);
      console.log('✅ 사용자 정보 조회 완료');

      // 3. 사용자 생성 또는 업데이트
      const user = await this.findOrCreateUser(kakaoUserInfo, tokenInfo);
      console.log('✅ 사용자 처리 완료');

      // 4. JWT 토큰 생성
      const jwtTokens = generateTokenPair(user.id, user.email, user.user_id);
      console.log('✅ JWT 토큰 생성 완료');

      return {
        user,
        tokens: jwtTokens,
        kakaoTokens: tokenInfo
      };

    } catch (error) {
      console.error('❌ 카카오 로그인 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 찾기 또는 생성
   */
  static async findOrCreateUser(kakaoUserInfo, tokenInfo) {
    // 기존 사용자 확인 (이메일 또는 카카오 ID로 검색)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: kakaoUserInfo.email },
          { 
            socialLogins: { 
              some: { 
                provider: 'kakao', 
                providerId: kakaoUserInfo.id 
              } 
            } 
          }
        ]
      },
      include: { socialLogins: true }
    });

    if (user) {
      // 기존 사용자 업데이트
      return await this.updateExistingUser(user, kakaoUserInfo, tokenInfo);
    } else {
      // 새 사용자 생성
      return await this.createNewUser(kakaoUserInfo, tokenInfo);
    }
  }

  /**
   * 새 사용자 생성
   */
  static async createNewUser(kakaoUserInfo, tokenInfo) {
    console.log('🆕 새 사용자 생성');

    // 고유한 user_id 생성 (kakao_ + 6자리 랜덤 숫자)
    const uniqueUserId = await this.generateUniqueKakaoUserId();

    const user = await prisma.user.create({
      data: {
        email: kakaoUserInfo.email,
        name: '', // 이름은 비워둠 (다음 페이지에서 입력받음)
        user_id: uniqueUserId,
        photo: kakaoUserInfo.thumbnailImage,
        emailVerified: kakaoUserInfo.isEmailVerified || false,
        password: '', // 소셜 로그인은 비밀번호 없음
        socialLogins: {
          create: {
            provider: 'kakao',
            providerId: kakaoUserInfo.id,
            accessToken: tokenInfo.accessToken,
            refreshToken: tokenInfo.refreshToken,
            tokenExpiry: new Date(Date.now() + tokenInfo.expiresIn * 1000)
          }
        }
      },
      include: { socialLogins: true }
    });

    console.log('✅ 새 사용자 생성 완료:', { 
      userId: user.id, 
      userIdString: user.user_id,
      email: user.email,
      name: user.name // 빈 문자열
    });

    return user;
  }

  /**
   * 기존 사용자 업데이트
   */
  static async updateExistingUser(user, kakaoUserInfo, tokenInfo) {
    console.log('🔄 기존 사용자 업데이트');

    const existingKakaoLogin = user.socialLogins.find(sl => sl.provider === 'kakao');

    if (existingKakaoLogin) {
      // 기존 카카오 로그인 정보 업데이트
      await prisma.socialLogin.update({
        where: { id: existingKakaoLogin.id },
        data: {
          accessToken: tokenInfo.accessToken,
          refreshToken: tokenInfo.refreshToken,
          tokenExpiry: new Date(Date.now() + tokenInfo.expiresIn * 1000),
          lastLoginAt: new Date()
        }
      });
    } else {
      // 새 카카오 연동 추가
      await prisma.socialLogin.create({
        data: {
          userId: user.id,
          provider: 'kakao',
          providerId: kakaoUserInfo.id,
          accessToken: tokenInfo.accessToken,
          refreshToken: tokenInfo.refreshToken,
          tokenExpiry: new Date(Date.now() + tokenInfo.expiresIn * 1000)
        }
      });
    }

    // 사용자 기본 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // 기존 사진이 없을 때만 업데이트
        photo: user.photo || kakaoUserInfo.thumbnailImage,
        // 이메일 인증 상태 업데이트
        emailVerified: user.emailVerified || kakaoUserInfo.isEmailVerified
      },
      include: { socialLogins: true }
    });

    console.log('✅ 기존 사용자 업데이트 완료');
    return updatedUser;
  }

  /**
   * 고유한 카카오 user_id 생성 (kakao_ + 6자리 랜덤 숫자)
   */
  static async generateUniqueKakaoUserId() {
    let uniqueUserId;
    let attempts = 0;
    const maxAttempts = 1000; // 무한 루프 방지

    do {
      // 6자리 랜덤 숫자 생성 (100000 ~ 999999)
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      uniqueUserId = `kakao_${randomNumber}`;
      
      // 기존 user_id와 중복 확인
      const existingUser = await prisma.user.findUnique({ 
        where: { user_id: uniqueUserId } 
      });
      
      if (!existingUser) {
        break; // 중복되지 않으면 루프 종료
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('고유한 사용자 ID 생성에 실패했습니다');
      }
      
    } while (true);

    console.log(`✅ 고유한 카카오 user_id 생성: ${uniqueUserId}`);
    return uniqueUserId;
  }

  /**
   * 카카오 토큰 갱신
   */
  static async refreshKakaoToken(userId) {
    try {
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        }
      });

      if (!socialLogin || !socialLogin.refreshToken) {
        throw new Error('카카오 리프레시 토큰을 찾을 수 없습니다');
      }

      const newTokenInfo = await KakaoUtil.refreshToken(socialLogin.refreshToken);

      // 새 토큰 정보로 업데이트
      await prisma.socialLogin.update({
        where: { id: socialLogin.id },
        data: {
          accessToken: newTokenInfo.accessToken,
          refreshToken: newTokenInfo.refreshToken,
          tokenExpiry: new Date(Date.now() + newTokenInfo.expiresIn * 1000)
        }
      });

      return newTokenInfo;

    } catch (error) {
      console.error('❌ 카카오 토큰 갱신 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 연동 해제
   */
  static async unlinkKakao(userId) {
    try {
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        }
      });

      if (!socialLogin) {
        throw new Error('연결된 카카오 계정이 없습니다');
      }

      // 카카오 API로 연동 해제 요청 (선택사항)
      // await KakaoUtil.unlinkAccount(socialLogin.accessToken);

      // 데이터베이스에서 소셜 로그인 정보 삭제
      await prisma.socialLogin.delete({
        where: { id: socialLogin.id }
      });

      return { success: true, message: '카카오 연동이 해제되었습니다' };

    } catch (error) {
      console.error('❌ 카카오 연동 해제 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 사용자 정보 동기화
   */
  static async syncKakaoUserInfo(userId) {
    try {
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        }
      });

      if (!socialLogin) {
        throw new Error('연결된 카카오 계정이 없습니다');
      }

      // 카카오에서 최신 사용자 정보 조회
      const kakaoUserInfo = await KakaoUtil.getUserInfo(socialLogin.accessToken);

      // 데이터베이스 사용자 정보 업데이트 (name은 업데이트하지 않음)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          photo: kakaoUserInfo.thumbnailImage || undefined,
          emailVerified: kakaoUserInfo.isEmailVerified || undefined
          // name은 제외 - 사용자가 직접 입력한 값 유지
        }
      });

      console.log('✅ 카카오 사용자 정보 동기화 완료');
      return updatedUser;

    } catch (error) {
      console.error('❌ 카카오 사용자 정보 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 인증 URL 생성
   */
  static generateKakaoAuthURL(redirectURI = null, state = null) {
    const finalRedirectURI = redirectURI || `${process.env.BASE_URL}/api/auth/kakao/callback-direct`;
    const finalState = state || Math.random().toString(36).substring(7);
    
    return KakaoUtil.generateAuthURL(finalRedirectURI, finalState);
  }

  /**
   * 사용자의 카카오 연동 상태 확인
   */
  static async getKakaoConnectionStatus(userId) {
    try {
      const socialLogin = await prisma.socialLogin.findFirst({
        where: {
          userId: userId,
          provider: 'kakao'
        },
        select: {
          id: true,
          providerId: true,
          tokenExpiry: true,
          lastLoginAt: true,
          createdAt: true
        }
      });

      if (!socialLogin) {
        return { connected: false };
      }

      const isTokenExpired = socialLogin.tokenExpiry < new Date();

      return {
        connected: true,
        providerId: socialLogin.providerId,
        tokenExpired: isTokenExpired,
        lastLoginAt: socialLogin.lastLoginAt,
        connectedAt: socialLogin.createdAt
      };

    } catch (error) {
      console.error('❌ 카카오 연동 상태 확인 실패:', error);
      throw error;
    }
  }
}

export default KakaoService;