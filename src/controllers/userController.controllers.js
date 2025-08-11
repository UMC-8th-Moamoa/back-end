import userService from '../services/userService.services.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
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
   * 회원가입
   * POST /api/auth/register
   */
  register = catchAsync(async (req, res) => {
    const createUserDto = new CreateUserDto(req.body);
    const result = await userService.register(createUserDto);
    
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
   * GET /api/users/nickname/:nickname/check
   */
  checkNickname = catchAsync(async (req, res) => {
    const { nickname } = req.params;
    const result = await userService.checkNickname(nickname);
    
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
}

export default new UserController();