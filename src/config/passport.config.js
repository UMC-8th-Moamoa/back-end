import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as KakaoStrategy } from 'passport-kakao';

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import { UnauthorizedError, UserNotFoundError } from '../middlewares/errorHandler.js';
import { comparePassword } from '../utils/password.util.js';
import { getCurrentKSTTime } from '../utils/datetime.util.js';

const prisma = new PrismaClient();

// 고유한 카카오 user_id 생성 함수 (kakao_ + 6자리 랜덤 숫자)
const generateUniqueKakaoUserId = async () => {
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
  
  return uniqueUserId;
};

// 사용자 직렬화 (세션 저장용)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 사용자 역직렬화 (세션에서 복원)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        photo: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return done(new UserNotFoundError(), null);
    }
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT Strategy (토큰 검증)
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'fallback-jwt-secret',
    // issuer/audience도 함께 검증 (jwt.util.js와 일치)
    issuer: 'moamoa-platform',
    audience: 'moamoa-users'
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          user_id: true,
          email: true,
          name: true,
          photo: true,
          createdAt: true
        }
      });

      if (!user) {
        return done(new UserNotFoundError(), false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// 카카오 Strategy (수정된 버전)
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET && process.env.KAKAO_REDIRECT_URI) {
  passport.use(new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_REDIRECT_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('카카오 프로필 정보:', profile);
        
        const kakaoId = profile.id.toString();
        const kakaoEmail = profile._json.kakao_account?.email;
        // name은 받지 않음 - 나중에 사용자가 직접 입력
        const kakaoProfileImage = profile._json.properties?.profile_image;
        
        // 기존 소셜 로그인 확인
        const existingSocialLogin = await prisma.socialLogin.findFirst({
          where: {
            provider: 'kakao',
            token: kakaoId
          },
          include: { 
            user: {
              select: {
                id: true,
                user_id: true,
                email: true,
                name: true,
                photo: true,
                createdAt: true,
                lastLoginAt: true
              }
            }
          }
        });

        if (existingSocialLogin) {
          // 기존 사용자 로그인 - 마지막 로그인 시간 업데이트
          await prisma.user.update({
            where: { id: existingSocialLogin.user.id },
            data: { lastLoginAt: getCurrentKSTTime() }
          });
          
          return done(null, existingSocialLogin.user);
        }

        // 이메일로 기존 사용자 확인 (소셜 로그인 연동)
        let existingUser = null;
        if (kakaoEmail) {
          existingUser = await prisma.user.findUnique({
            where: { email: kakaoEmail },
            select: {
              id: true,
              user_id: true,
              email: true,
              name: true,
              photo: true,
              createdAt: true,
              password: true
            }
          });
        }

        if (existingUser) {
          // 기존 사용자에 카카오 소셜 로그인 연결
          await prisma.socialLogin.create({
            data: {
              user_id: existingUser.user_id,
              provider: 'kakao',
              token: kakaoId
            }
          });
          
          // 마지막 로그인 시간 업데이트
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: getCurrentKSTTime() }
          });
          
          // password 필드 제거
          const { password, ...userWithoutPassword } = existingUser;
          return done(null, userWithoutPassword);
        }
        
        // 새 사용자 생성 (카카오 전용)
        const uniqueUserId = await generateUniqueKakaoUserId();

        const newUser = await prisma.user.create({
          data: {
            email: kakaoEmail || `kakao_${kakaoId}@kakao.temp`,
            name: '', // 이름은 비워둠 (다음 페이지에서 입력받음)
            user_id: uniqueUserId, // kakao_123456 형태
            photo: kakaoProfileImage || null,
            emailVerified: !!kakaoEmail,
            password: '', // 소셜 로그인은 비밀번호 없음
            lastLoginAt: getCurrentKSTTime(),
            createdAt: getCurrentKSTTime(),
            updatedAt: getCurrentKSTTime()
          }
        });
        
        // 별도로 SocialLogin 생성
        await prisma.socialLogin.create({
          data: {
            provider: 'kakao',
            user_id: newUser.user_id,
            token: kakaoId
          }
        });
        
        // 생성된 사용자 정보 반환
        const userResult = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name, // 빈 문자열
          user_id: newUser.user_id, // kakao_123456
          photo: newUser.photo,
          createdAt: newUser.createdAt,
          lastLoginAt: newUser.lastLoginAt
        };

        console.log('새 카카오 사용자 생성:', {
          userId: newUser.id,
          userIdString: newUser.user_id,
          email: newUser.email,
          name: newUser.name, // 빈 문자열
          isEmpty: newUser.name === ''
        });
        
        return done(null, userResult);
        
      } catch (error) {
        console.error('카카오 로그인 중 오류:', error);
        return done(error, false);
      }
    }
  ));
  
  console.log('✅ 카카오 OAuth 전략이 등록되었습니다.');
} else {
  console.warn('⚠️  카카오 OAuth 설정이 없습니다. KAKAO_CLIENT_ID와 KAKAO_CLIENT_SECRET 환경 변수를 확인하세요.');
}

export default passport;