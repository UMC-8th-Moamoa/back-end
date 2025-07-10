
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;

const { PrismaClient } = require('@prisma/client');
const PasswordUtil = require('../utils/password.util');
const { UnauthorizedError, UserNotFoundError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

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

// 1. Local Strategy (이메일/비밀번호 로그인)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          socialLogins: true
        }
      });

      if (!user) {
        return done(new UnauthorizedError('이메일 또는 비밀번호가 잘못되었습니다'), false);
      }

      // 소셜 로그인 전용 계정인지 확인
      if (!user.password && user.socialLogins.length > 0) {
        return done(new UnauthorizedError('소셜 로그인으로 가입된 계정입니다'), false);
      }

      // 비밀번호 검증
      const isValidPassword = await PasswordUtil.comparePassword(password, user.password);
      if (!isValidPassword) {
        return done(new UnauthorizedError('이메일 또는 비밀번호가 잘못되었습니다'), false);
      }

      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // 비밀번호 제거 후 반환
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);

    } catch (error) {
      return done(error, false);
    }
  }
));

// 2. JWT Strategy (토큰 검증)
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
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

// 3. Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 기존 소셜 로그인 확인
        const existingSocialLogin = await prisma.socialLogin.findFirst({
          where: {
            provider: 'google',
            token: profile.id
          },
          include: { user: true }
        });

        if (existingSocialLogin) {
          // 기존 사용자 로그인
          await prisma.user.update({
            where: { id: existingSocialLogin.user.id },
            data: { lastLoginAt: new Date() }
          });
          return done(null, existingSocialLogin.user);
        }

        // 이메일로 기존 사용자 확인
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.emails[0].value }
        });

        if (existingUser) {
          // 기존 사용자에 소셜 로그인 연결
          await prisma.socialLogin.create({
            data: {
              userId: existingUser.id,
              provider: 'google',
              token: profile.id
            }
          });
          return done(null, existingUser);
        }

        // 새 사용자 생성
        const newUser = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
            photo: profile.photos[0]?.value,
            emailVerified: true,
            password: '', // 소셜 로그인은 비밀번호 없음
            lastLoginAt: new Date(),
            socialLogins: {
              create: {
                provider: 'google',
                token: profile.id
              }
            }
          }
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  ));
}

// 4. Kakao OAuth Strategy
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: "/api/auth/kakao/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const kakaoId = profile.id.toString();
        
        // 기존 소셜 로그인 확인
        const existingSocialLogin = await prisma.socialLogin.findFirst({
          where: {
            provider: 'kakao',
            token: kakaoId
          },
          include: { user: true }
        });

        if (existingSocialLogin) {
          await prisma.user.update({
            where: { id: existingSocialLogin.user.id },
            data: { lastLoginAt: new Date() }
          });
          return done(null, existingSocialLogin.user);
        }

        // 이메일로 기존 사용자 확인
        const email = profile._json.kakao_account?.email;
        let existingUser = null;
        
        if (email) {
          existingUser = await prisma.user.findUnique({
            where: { email }
          });
        }

        if (existingUser) {
          // 기존 사용자에 소셜 로그인 연결
          await prisma.socialLogin.create({
            data: {
              userId: existingUser.id,
              provider: 'kakao',
              token: kakaoId
            }
          });
          return done(null, existingUser);
        }

        // 새 사용자 생성
        const userData = {
          email: email || `kakao_${kakaoId}@kakao.temp`,
          name: profile.displayName || profile._json.properties?.nickname || '카카오 사용자',
          photo: profile._json.properties?.profile_image,
          emailVerified: !!email,
          password: '',
          lastLoginAt: new Date(),
          socialLogins: {
            create: {
              provider: 'kakao',
              token: kakaoId
            }
          }
        };

        const newUser = await prisma.user.create({
          data: userData
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  ));
}

module.exports = passport;
