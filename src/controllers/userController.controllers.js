import userService from '../services/userService.services.js';
import { autoEventService } from '../services/autoEvent.service.js';
import PaymentService from '../services/payment.service.js';
import prisma from '../config/prismaClient.js';
// import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.util.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import {
  CreateUserDto,
  LoginUserDto,
  ChangePasswordDto,
  EmailVerificationDto,
  EmailVerificationCodeDto,
  FindUserIdDto,
  PasswordResetRequestDto,
  PasswordResetDto,
  UpdateUserDto,
  RefreshTokenDto
} from '../dtos/userDto.dto.js';

/**
 * 사용자 컨트롤러
 * HTTP 요청/응답 처리
 */
class UserController {

  /**
   * 회원가입 (수정된 버전 - 보너스 포함)
   * POST /api/auth/register
   */
  register = catchAsync(async (req, res) => {
    const createUserDto = new CreateUserDto(req.body);
    const result = await userService.register(createUserDto);
    
    // 💰 회원가입 보너스 지급 (수정된 부분)
    try {
      console.log('💰 일반 회원가입 보너스 지급 시작');
      const bonusResult = await PaymentService.giveSignupBonus(result.user.id, result.user.user_id);
      
      console.log('✅ 일반 회원가입 보너스 지급 완료:', {
        userId: bonusResult.user.id,
        newCash: bonusResult.user.cash
      });
  
      // ✅ 응답에 보너스 정보 포함 - cash 업데이트
      result.user.cash = bonusResult.user.cash;
      result.message = '회원가입이 완료되었습니다. 회원가입 축하 보너스 400 포인트가 지급되었습니다!';
  
    } catch (bonusError) {
      console.error('⚠️ 일반 회원가입 보너스 지급 실패 (사용자는 생성됨):', bonusError);
      
      // 수동 보너스 지급 시도
      try {
        console.log('🔄 수동 포인트 지급 시도...');
        const manualResult = await prisma.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: result.user.id },
            data: { cash: { increment: 400 } },
            select: { id: true, user_id: true, cash: true }
          });
  
          await tx.pointHistory.create({
            data: {
              userId: result.user.id,
              pointType: 'CHARGE',  // ← SIGNUP_BONUS 대신 CHARGE 사용
              pointChange: 400,
              description: '회원가입 축하 보너스 (수동 지급)',
              totalPoints: updatedUser.cash,
              createdAt: new Date(),
            }
          });
  
          return updatedUser;
        });
  
        // ✅ 수동 지급 성공 시에도 cash 업데이트
        result.user.cash = manualResult.cash;
        console.log('✅ 수동 포인트 지급 성공:', manualResult.cash);
        result.message = '회원가입이 완료되었습니다. 회원가입 축하 보너스 400 포인트가 지급되었습니다!';
  
      } catch (manualError) {
        console.error('❌ 수동 포인트 지급도 실패:', manualError);
        // ✅ 실패해도 cash는 0으로 명시적 설정
        result.user.cash = result.user.cash || 0;
        result.message = '회원가입이 완료되었습니다. (보너스 지급 중 일시적 오류가 발생했습니다)';
      }
    }
    
    // ✅ 최종 응답 전에 cash 확인 및 로깅
    console.log('🎉 회원가입 최종 응답:', {
      userId: result.user.id,
      user_id: result.user.user_id,
      email: result.user.email,
      cash: result.user.cash,
      message: result.message
    });
    
    res.status(201).success(result);
  });

  /**
   * 로그인
   * POST /api/auth/login
   */
  login = catchAsync(async (req, res) => {
    const loginUserDto = new LoginUserDto(req.body);
    const result = await userService.login(loginUserDto);
    
    res.success(result);
  });

  /**
   * 현재 사용자 정보 조회
   * GET /api/auth/me
   */
  getMe = catchAsync(async (req, res) => {
    const result = await userService.getUserById(req.user.id);
    res.success(result);
  });

  /**
   * 로그아웃
   * POST /api/auth/logout
   */
  logout = catchAsync(async (req, res) => {
    // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됨
    res.success({
      message: '로그아웃되었습니다'
    });
  });

  /**
   * 토큰 갱신
   * POST /api/auth/refresh
   */
  refreshToken = catchAsync(async (req, res) => {
    const refreshTokenDto = new RefreshTokenDto(req.body);
    const result = await userService.refreshTokens(refreshTokenDto.refreshToken);
    
    res.success({ tokens: result });
  });

  /**
   * 닉네임 중복 확인
   * GET /api/auth/nickname/:nickname/check
   */
  checkNickname = catchAsync(async (req, res) => {
    const { nickname } = req.params;
    const result = await userService.checkNickname(nickname);
    
    res.success(result);
  });

  /**
   * 사용자 ID 중복 확인
   * GET /api/auth/user-id/:userId/check
   */
  checkUserId = catchAsync(async (req, res) => {
    const { userId } = req.params;
    
    // 디버그 로그 추가
    console.log('🔍 checkUserId 호출됨:', { userId });
    console.log('🔍 userService 객체:', typeof userService, Object.keys(userService));
    console.log('🔍 checkUserId 메서드 존재 여부:', typeof userService.checkUserId);
    
    if (typeof userService.checkUserId !== 'function') {
      console.error('❌ userService.checkUserId가 함수가 아닙니다');
      return res.status(500).json({
        success: false,
        message: 'checkUserId 메서드를 찾을 수 없습니다'
      });
    }
    
    const result = await userService.checkUserId(userId);
    
    res.success(result);
  });

  /**
   * 이메일 중복 확인
   * POST /api/auth/email/check
   */
  checkEmail = catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await userService.checkEmailDuplicate(email);
    
    res.success(result);
  });

  sendEmailVerification = catchAsync(async (req, res) => {
  const emailVerificationDto = new EmailVerificationDto(req.body); // email + purpose
  const result = await userService.sendEmailVerification(emailVerificationDto);

  // 인증 토큰을 쿠키로 저장 (result 안에 token이 있다고 가정)
  if (result?.token) {
    res.cookie('email_verify_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 크로스도메인 테스트 필요하면 'none'
      maxAge: 10 * 60 * 1000, // 10분
    });
  }

  res.success(result);
});

  verifyEmailCode = catchAsync(async (req, res) => {
    const emailVerificationCodeDto = new EmailVerificationCodeDto(req.body); // email + code + purpose
    const result = await userService.verifyEmailCode(emailVerificationCodeDto);
    res.success(result);
  });

  

  /**
   * 비밀번호 변경
   * PUT /api/users/password
   */
  changePassword = catchAsync(async (req, res) => {
    const changePasswordDto = new ChangePasswordDto(req.body);
    const result = await userService.changePassword(req.user.id, changePasswordDto);
    
    res.success(result);
  });

  /**
   * 아이디 찾기
   * POST /api/users/find-id
   */
  findUserId = catchAsync(async (req, res) => {
    const findUserIdDto = new FindUserIdDto(req.body);
    const result = await userService.findUserId(findUserIdDto);
    
    res.success(result);
  });

  /**
   * 비밀번호 재설정 요청
   * POST /api/users/find-password
   */
  requestPasswordReset = catchAsync(async (req, res) => {
    const passwordResetRequestDto = new PasswordResetRequestDto(req.body);
    const result = await userService.requestPasswordReset(passwordResetRequestDto);
    
    res.success(result);
  });

  /**
   * 비밀번호 재설정 인증 코드 확인
   * POST /api/users/verify-reset-code
   */
  verifyPasswordResetCode = catchAsync(async (req, res) => {
    const { email, code, token } = req.body;
    const result = await userService.verifyPasswordResetCode({ email, code, token });
    
    res.success(result);
  });

  /**
   * 비밀번호 재설정
   * POST /api/users/reset-password
   */
  resetPassword = catchAsync(async (req, res) => {
    const passwordResetDto = new PasswordResetDto(req.body);
    const result = await userService.resetPassword(passwordResetDto);
    
    res.success(result);
  });

  /**
   * 사용자 정보 수정
   * PUT /api/users/profile
   */
  updateProfile = catchAsync(async (req, res) => {
    const updateUserDto = new UpdateUserDto(req.body);
    const result = await userService.updateUser(req.user.id, updateUserDto);
    
    res.success(result);
  });

  /**
   * 회원 탈퇴
   * DELETE /api/users/profile
   */
  deleteAccount = catchAsync(async (req, res) => {
    const result = await userService.deleteUser(req.user.id);
    res.success(result);
  });

  /**
   * Google OAuth 로그인 시작
   * GET /api/auth/google
   */
  googleLogin = catchAsync(async (req, res, next) => {
    const passport = await import('passport');
    passport.default.authenticate('google', { 
      scope: ['profile', 'email'] 
    })(req, res, next);
  });

  /**
   * Google OAuth 콜백
   * GET /api/auth/google/callback
   */
  googleCallback = catchAsync(async (req, res) => {
    const user = req.user;
    const tokens = generateTokenPair(user.id, user.email);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  });

  /**
   * Kakao OAuth 로그인 시작
   * GET /api/auth/kakao
   */
  kakaoLogin = catchAsync(async (req, res, next) => {
    const passport = await import('passport');
    passport.default.authenticate('kakao')(req, res, next);
  });

  /**
   * Kakao OAuth 콜백
   * GET /api/auth/kakao/callback
   */
  kakaoCallback = catchAsync(async (req, res) => {
    const user = req.user;
    const tokens = generateTokenPair(user.id, user.email);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  });

  /**
   * 사용자 목록 조회 (관리자용)
   * GET /api/users
   */
  getUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await userService.getUsers(parseInt(page), parseInt(limit));
    
    res.success(result);
  });

  /**
   * 특정 사용자 조회 (관리자용)
   * GET /api/users/:id
   */
  getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await userService.getUserById(parseInt(id));
    
    res.success(result);
  });

  /**
   * 사용자 정보 수정 (관리자용)
   * PUT /api/users/:id
   */
  updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateUserDto = new UpdateUserDto(req.body);
    const result = await userService.updateUser(parseInt(id), updateUserDto);
    
    res.success(result);
  });

  /**
   * 사용자 삭제 (관리자용)
   * DELETE /api/users/:id
   */
  deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await userService.deleteUser(parseInt(id));
    
    res.success(result);
  });

  /**
   * 소셜 로그인 콜백 처리 (공통)
   * @param {string} provider - 소셜 로그인 제공자
   */
  handleSocialCallback = (provider) => {
    return catchAsync(async (req, res, next) => {
      const passport = await import('passport');
      
      passport.default.authenticate(provider, { session: false }, (error, user, info) => {
        if (error) {
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
          return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
        }
        
        if (!user) {
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
          return res.redirect(`${clientUrl}/auth/error?message=${encodeURIComponent('소셜 로그인에 실패했습니다')}`);
        }
        
        req.user = user;
        next();
      })(req, res, next);
    });
  };

  /**
   * 현재 사용자 확인 (미들웨어에서 사용)
   * @param {Object} req - 요청 객체
   * @param {Object} res - 응답 객체
   * @param {Function} next - 다음 미들웨어 함수
   */
  getCurrentUser = catchAsync(async (req, res, next) => {
    if (req.user) {
      const userInfo = await userService.getUserById(req.user.id);
      req.user = userInfo;
    }
    next();
  });

  /**
   * 사용자 통계 조회 (관리자용)
   * GET /api/users/stats
   */
  getUserStats = catchAsync(async (req, res) => {
    // TODO: 사용자 통계 서비스 구현
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      verifiedUsers: 0
    };
    
    res.success(stats);
  });

  /**
   * 생일 이벤트 수동 생성 트리거 (개발/테스트용)
   * POST /api/auth/trigger-birthday-event
   */
  triggerBirthdayEvent = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const result = await userService.triggerBirthdayEventForUser(userId);
    res.success(result);
  });
}

export default new UserController();