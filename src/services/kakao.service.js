// src/services/kakao.service.js (수정된 버전)
// 카카오 관련 비즈니스 로직
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
    // 기존 사용자 확인 (이메일 또는 카카오 ID로)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: kakaoUserInfo.email },
          { 
            socialLogins: { 
              some: { 
                provider: 'kakao', 
                token: kakaoUserInfo.id  // ⚠️ 스키마에서는 token 필드 사용
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
   * 새 사용자 생성 (스키마에 맞게 수정)
   */
  static async createNewUser(kakaoUserInfo, tokenInfo) {
    console.log('🆕 새 사용자 생성');

    // 1. 고유한 user_id 생성 (String 타입)
    const uniqueUserId = await this.generateUniqueUserId(kakaoUserInfo.id);

    // 2. 사용자 생성 (스키마 구조에 맞게)
    const user = await prisma.user.create({
      data: {
        email: kakaoUserInfo.email || `kakao_${kakaoUserInfo.id}@temp.com`,
        name: kakaoUserInfo.nickname || '카카오 사용자',
        user_id: uniqueUserId,  // ✅ 필수 필드 추가
        password: '',  // 소셜 로그인은 빈 패스워드
        photo: kakaoUserInfo.thumbnailImage,
        emailVerified: kakaoUserInfo.isEmailVerified || false,
        lastLoginAt: new Date(),
        socialLogins: {
          create: {
            provider: 'kakao',
            user_id: uniqueUserId,  // ✅ SocialLogin의 user_id에 String 값 설정
            token: kakaoUserInfo.id  // 카카오 사용자 ID를 token으로 저장
          }
        }
      },
      include: { socialLogins: true }
    });

    console.log('✅ 새 사용자 생성 완료:', { 
      userId: user.id, 
      userIdString: user.user_id,
      email: user.email 
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
      // 기존 카카오 로그인 정보 업데이트 (필요시)
      await prisma.socialLogin.update({
        where: { id: existingKakaoLogin.id },
        data: {
          // token은 변경하지 않음 (카카오 사용자 ID는 고정)
          updatedAt: new Date()
        }
      });
    } else {
      // 새 카카오 연동 추가
      await prisma.socialLogin.create({
        data: {
          provider: 'kakao',
          user_id: user.user_id,  // ✅ 기존 사용자의 user_id (String) 사용
          token: kakaoUserInfo.id  // 카카오 사용자 ID
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
   * 고유한 user_id 생성 (String 타입)
   */
  static async generateUniqueUserId(kakaoId) {
    const baseUserId = `kakao_${kakaoId}`;
    let uniqueUserId = baseUserId;
    let counter = 1;

    // user_id 중복 확인 및 고유값 생성
    while (await prisma.user.findUnique({ where: { user_id: uniqueUserId } })) {
      uniqueUserId = `${baseUserId}_${counter}`;
      counter++;
    }

    return uniqueUserId;
  }

  /**
   * 카카오 토큰 갱신 (스키마에 맞게 수정)
   */
  static async refreshKakaoToken(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          socialLogins: {
            where: { provider: 'kakao' }
          }
        }
      });

      if (!user || !user.socialLogins.length) {
        throw new Error('카카오 연동 정보를 찾을 수 없습니다');
      }

      // 현재 스키마에서는 리프레시 토큰을 별도로 저장하지 않으므로
      // 새로운 토큰 정보 조회가 필요한 경우 구현
      console.log('✅ 카카오 토큰 정보 확인 완료');
      
      return {
        message: '카카오 연동 상태 확인됨',
        provider: 'kakao',
        connected: true
      };

    } catch (error) {
      console.error('❌ 카카오 토큰 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 연동 해제
   */
  static async unlinkKakao(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          socialLogins: {
            where: { provider: 'kakao' }
          }
        }
      });

      if (!user || !user.socialLogins.length) {
        throw new Error('연결된 카카오 계정이 없습니다');
      }

      // 카카오 소셜 로그인 정보 삭제
      await prisma.socialLogin.deleteMany({
        where: {
          user_id: user.user_id,
          provider: 'kakao'
        }
      });

      return { success: true, message: '카카오 연동이 해제되었습니다' };

    } catch (error) {
      console.error('❌ 카카오 연동 해제 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 인증 URL 생성
   */
  static generateKakaoAuthURL(redirectURI = null, state = null) {
    const finalRedirectURI = redirectURI || `${process.env.BASE_URL}/api/auth/kakao/callback`;
    const finalState = state || Math.random().toString(36).substring(7);
    
    return KakaoUtil.generateAuthURL(finalRedirectURI, finalState);
  }

  /**
   * 사용자의 카카오 연동 상태 확인
   */
  static async getKakaoConnectionStatus(userId) {
    try { 
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          socialLogins: {
            where: { provider: 'kakao' }
          }
        }
      });

      if (!user || !user.socialLogins.length) {
        return { connected: false };
      }

      const kakaoLogin = user.socialLogins[0];

      return {
        connected: true,
        providerId: kakaoLogin.token,  // 카카오 사용자 ID
        connectedAt: kakaoLogin.createdAt,
        lastUpdated: kakaoLogin.updatedAt
      };

    } catch (error) {
      console.error('❌ 카카오 연동 상태 확인 실패:', error);
      throw error;
    }
  }
}

export default KakaoService;