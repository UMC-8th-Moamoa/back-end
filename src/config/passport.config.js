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

// 중복되지 않는 user_id 생성 함수
const generateUniqueUserId = async () => {
  let userId;
  let existingUser;
  
  do {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6자리 랜덤 숫자
    userId = randomNumber.toString(); // String으로 변환
    existingUser = await prisma.user.findUnique({
      where: { user_id: userId }
    });
  } while (existingUser); // 중복되면 다시 생성
  
  return userId;
};

// 랜덤 닉네임 생성 함수
const generateRandomNickname = async () => {
  let nickname;
  let existingUser;
  
  do {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6자리 랜덤 숫자
    nickname = `User${randomNumber}`;
    existingUser = await prisma.user.findFirst({
      where: { name: nickname }
    });
  } while (existingUser); // 중복되면 다시 생성
  
  return nickname;
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

// // 1. Local Strategy (이메일/비밀번호 로그인)
// passport.use(new LocalStrategy(
//   {
//     usernameField: 'email',
//     passwordField: 'password'
//   },
//   async (email, password, done) => {
//     try {
//       // 사용자 조회
//       const user = await prisma.user.findUnique({
//         where: { email },
//         include: {
//           socialLogins: true
//         }
//       });

//       if (!user) {
//         return done(new UnauthorizedError('이메일 또는 비밀번호가 잘못되었습니다'), false);
//       }

//       // 소셜 로그인 전용 계정인지 확인
//       if (!user.password && user.socialLogins.length > 0) {
//         return done(new UnauthorizedError('소셜 로그인으로 가입된 계정입니다'), false);
//       }

      // 비밀번호 검증
      // const isValidPassword = await comparePassword(password, user.password);
      // if (!isValidPassword) {
      //   return done(new UnauthorizedError('이메일 또는 비밀번호가 잘못되었습니다'), false);
      // }

//       // 마지막 로그인 시간 업데이트
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { lastLoginAt: new Date() }
//       });

//       // 비밀번호 제거 후 반환
//       const { password: _, ...userWithoutPassword } = user;
//       return done(null, userWithoutPassword);

//     } catch (error) {
//       return done(error, false);
//     }
//   }
// ));

// 2. JWT Strategy (토큰 검증)
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'fallback-jwt-secret',
    // ✅ issuer/audience도 함께 검증 (jwt.util.js와 일치)
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
        const kakaoNickname = profile.displayName || profile._json.properties?.nickname;
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
              user_Id: existingUser.user_id,
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
        

        // 새 사용자 생성
        const newUserData = {
          email: kakaoEmail || `kakao_${kakaoId}@kakao.temp`,
          name: kakaoNickname || '카카오 사용자',
          photo: kakaoProfileImage || null,
          emailVerified: !!kakaoEmail, // 카카오에서 이메일을 제공하면 인증된 것으로 간주
          password: '', // 소셜 로그인 사용자는 비밀번호 없음
          lastLoginAt: getCurrentKSTTime(),
          createdAt: getCurrentKSTTime(), // 한국 시간으로 설정
          updatedAt: getCurrentKSTTime(),
          socialLogins: {
            create: {
              provider: 'kakao',
              token: kakaoId
            }
          }
        };

        const uniqueUserId = await generateUniqueUserId();

        const newUser = await prisma.user.create({
          data: {
            email: kakaoEmail || `kakao_${kakaoId}@kakao.temp`,
            name: kakaoNickname || '카카오 사용자',
            user_id: uniqueUserId,
            photo: kakaoProfileImage || null,
            emailVerified: !!kakaoEmail,
            password: '',
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
          name: newUser.name,
          user_id: newUser.user_id,
          photo: newUser.photo,
          createdAt: newUser.createdAt,
          lastLoginAt: newUser.lastLoginAt
        };

        console.log('새 카카오 사용자 생성:', newUser);
        return done(null, newUser);
        
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
