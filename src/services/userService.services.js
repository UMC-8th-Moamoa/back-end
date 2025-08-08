import userRepository from '../repositories/userRepository.repositories.js';
import { 
  hashPassword, 
  comparePassword, 
  validatePasswordChange as validatePasswordChangeUtil
} from '../utils/password.util.js';
import { 
  generateTokenPair, 
  generateEmailVerificationToken, 
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
} from '../utils/jwt.util.js';
import {
  DuplicateEmailError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from '../middlewares/errorHandler.js';
import {
  CreateUserDto,
  LoginUserDto,
  UserResponseDto,
  UserBasicInfoDto,
  AuthResponseDto,
  TokenResponseDto,
  ChangePasswordDto,
  EmailVerificationDto,
  EmailVerificationCodeDto,
  FindUserIdDto,
  PasswordResetRequestDto,
  PasswordResetDto,
  UpdateUserDto,
  MaskedEmailResponseDto,
  SuccessResponseDto,
  NicknameCheckResponseDto
} from '../dtos/userDto.dto.js';

/**
 * 사용자 비즈니스 로직 처리 서비스
 */
class UserService {

  /**
   * 회원가입
   * @param {CreateUserDto} createUserDto - 회원가입 정보
   * @returns {Promise<AuthResponseDto>} 인증 응답 (사용자 + 토큰)
   */
  async register(createUserDto) {
    const { email, password, name, user_id, phone, birthday } = createUserDto;  // user_id로 변경

    // 이메일 중복 확인
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailError();
    }

    // user_id 중복 확인 (일반 회원가입과 소셜 로그인 사용자 모두)
    const existingUserId = await userRepository.findByUserId(user_id);
    if (existingUserId) {
      throw new DuplicateEmailError('이미 존재하는 사용자 ID입니다');
    }

    // 소셜 로그인 패턴과의 충돌 방지 (추가 보안)
    if (user_id.startsWith('google_') || user_id.startsWith('kakao_')) {
      throw new ValidationError('사용자 ID는 google_ 또는 kakao_로 시작할 수 없습니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const userData = {
      email,
      password: hashedPassword,
      name,
      user_id: user_id,  // DB 필드명과 일치
      phone: phone || null,
      birthday: birthday ? new Date(birthday) : null
    };

    const user = await userRepository.create(userData);

    // JWT 토큰 생성
    const tokens = generateTokenPair(user.id, user.email);

    return new AuthResponseDto(user, tokens);
  }

  /**
   * 로그인
   * @param {LoginUserDto} loginUserDto - 로그인 정보
   * @returns {Promise<AuthResponseDto>} 인증 응답 (사용자 + 토큰)
   */
  async login(loginUserDto) {
    const { user_id, password } = loginUserDto;

    // 사용자 조회
    const user = await userRepository.findByUserId(user_id);
    if (!user) {
      throw new UnauthorizedError('아이디 또는 비밀번호가 잘못되었습니다');
    }

    // 소셜 로그인 전용 계정인지 확인
    if (!user.password && Array.isArray(user.socialLogins) && user.socialLogins.length > 0) {
    throw new UnauthorizedError('소셜 로그인으로 가입된 계정입니다');
  }
    // 비밀번호 검증
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('아이디 또는 비밀번호가 잘못되었습니다');
    }

    // 마지막 로그인 시간 업데이트
    await userRepository.updateLastLoginAt(user.id);

    // JWT 토큰 생성
    const tokens = generateTokenPair(user.id, user.user_id);

    // 민감한 정보 제거
    const { password: _, socialLogins, ...userWithoutPassword } = user;

    return new AuthResponseDto(userWithoutPassword, tokens);
  }
  /**
   * 사용자 정보 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<UserResponseDto>} 사용자 정보
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    return new UserResponseDto(user);
  }

  /**
   * 닉네임 중복 확인
   * @param {string} nickname - 확인할 닉네임
   * @returns {Promise<NicknameCheckResponseDto>} 중복 확인 결과
   */
  async checkNickname(nickname) {
    const existingUser = await userRepository.findByNickname(nickname);
    const available = !existingUser;

    return new NicknameCheckResponseDto(available);
  }

  /**
   * 비밀번호 변경
   * @param {number} userId - 사용자 ID
   * @param {ChangePasswordDto} changePasswordDto - 비밀번호 변경 정보
   * @returns {Promise<SuccessResponseDto>} 성공 응답
   */
  async changePassword(userId, changePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // 현재 사용자 정보 조회
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // 비밀번호 변경 검증
    await validatePasswordChangeUtil(currentPassword, newPassword, user.password);

    // 새 비밀번호 해싱
    const hashedNewPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await userRepository.updatePassword(userId, hashedNewPassword);

    return new SuccessResponseDto('비밀번호가 성공적으로 변경되었습니다');
  }

  async sendEmailVerification(emailVerificationDto) {
  const { email, purpose } = emailVerificationDto;

  const user = await userRepository.findByEmail(email);

  // 목적에 따라 가입 여부 체크
  if (purpose === 'signup') {
    if (user) {
      throw new DuplicateEmailError('이미 가입된 이메일입니다');
    }
  } else if (purpose === 'reset') {
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }
  } else {
    throw new ValidationError('purpose는 signup 또는 reset이어야 합니다');
  }

  // 6자리 인증 코드 생성
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 인증 토큰 생성 (10분 유효)
  const verificationToken = generateEmailVerificationToken(email, verificationCode);

  // TODO: 실제 이메일 발송 로직 구현
  if (process.env.NODE_ENV === 'development') {
    console.log(`이메일 인증 코드 (${email}): ${verificationCode}`);
  }

  const response = { message: '인증 코드가 발송되었습니다' };

  if (process.env.NODE_ENV === 'development') {
    response.verificationToken = verificationToken;
  }

  return response;
}


  async verifyEmailCode(emailVerificationCodeDto) {
  const { email, code, purpose } = emailVerificationCodeDto;

  const user = await userRepository.findByEmail(email);

  if (purpose === 'reset') {
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }
  }

  // 개발 환경에서는 간단한 코드 검증
  if (process.env.NODE_ENV === 'development') {
    const isValidCode = code.length === 6 && /^\d{6}$/.test(code);
    if (!isValidCode) {
      throw new ValidationError('유효하지 않은 인증 코드입니다');
    }
  }

  // 회원가입의 경우: DB 업데이트 필요 없음
  if (purpose === 'reset' && user) {
    await userRepository.updateEmailVerification(user.id, true);
  }

  return new SuccessResponseDto('이메일 인증이 완료되었습니다');
}


  /**
   * 비밀번호 재설정 요청
   * @param {PasswordResetRequestDto} passwordResetRequestDto - 비밀번호 재설정 요청 정보
   * @returns {Promise<Object>} 재설정 링크 발송 결과
   */
  async requestPasswordReset(passwordResetRequestDto) {
    const { email } = passwordResetRequestDto;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('등록되지 않은 이메일입니다');
    }

    // 비밀번호 재설정 토큰 생성
    const resetToken = generatePasswordResetToken(email, user.id);

    // TODO: 실제 이메일 발송 로직 구현
    // await this.sendPasswordResetEmail(email, resetToken);

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`비밀번호 재설정 토큰 (${email}): ${resetToken}`);
    }

    const response = {
      message: '비밀번호 재설정 링크가 이메일로 발송되었습니다'
    };

    // 개발 환경에서만 토큰 반환
    if (process.env.NODE_ENV === 'development') {
      response.resetToken = resetToken;
    }

    return response;
  }

  /**
   * 비밀번호 재설정
   * @param {PasswordResetDto} passwordResetDto - 비밀번호 재설정 정보
   * @returns {Promise<SuccessResponseDto>} 성공 응답
   */
  async resetPassword(passwordResetDto) {
    const { token, newPassword } = passwordResetDto;

    // 토큰 검증
    const decoded = verifyPasswordResetToken(token);

    // 사용자 존재 확인
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // 새 비밀번호 해싱
    const hashedNewPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await userRepository.updatePassword(user.id, hashedNewPassword);

    return new SuccessResponseDto('비밀번호가 성공적으로 재설정되었습니다');
  }

  /**
   * 사용자 정보 수정
   * @param {number} userId - 사용자 ID
   * @param {UpdateUserDto} updateUserDto - 수정할 사용자 정보
   * @returns {Promise<UserResponseDto>} 수정된 사용자 정보
   */
  async updateUser(userId, updateUserDto) {
    const { name, phone, birthday, photo } = updateUserDto;

    // 사용자 존재 확인
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // 업데이트 데이터 준비
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (birthday) updateData.birthday = new Date(birthday);
    if (photo) updateData.photo = photo;

    // 사용자 정보 업데이트
    const updatedUser = await userRepository.update(userId, updateData);

    return new UserResponseDto(updatedUser);
  }

  /**
   * 사용자 삭제 (탈퇴)
   * @param {number} userId - 사용자 ID
   * @returns {Promise<SuccessResponseDto>} 성공 응답
   */
  async deleteUser(userId) {
    // 사용자 존재 확인
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // 사용자 삭제
    await userRepository.delete(userId);

    return new SuccessResponseDto('회원탈퇴가 완료되었습니다');
  }

  /**
   * 소셜 로그인 사용자 생성 또는 로그인 처리
   * @param {string} provider - 소셜 로그인 제공자
   * @param {Object} profile - 소셜 로그인 프로필
   * @returns {Promise<Object>} 사용자 정보
   */
  async handleSocialLogin(provider, profile) {
    const socialId = profile.id.toString();
    
    // 기존 소셜 로그인 확인
    let user = await userRepository.findBySocialLogin(provider, socialId);
    
    if (user) {
      // 기존 사용자 로그인 - 마지막 로그인 시간 업데이트
      await userRepository.updateLastLoginAt(user.id);
      return user;
    }

    // 이메일로 기존 사용자 확인
    const email = this.extractEmailFromProfile(profile, provider);
    if (email) {
      user = await userRepository.findByEmail(email);
      if (user) {
        // 기존 사용자에 소셜 로그인 연결
        await userRepository.createSocialLogin(user.user_id, provider, socialId);
        return user;
      }
    }

    // 새 사용자 생성을 위한 데이터 준비
    const userData = this.createUserDataFromProfile(profile, provider);
    
    // user_id 중복 확인 (소셜 로그인 사용자도 고유해야 함)
    const existingUserId = await userRepository.findByUserId(userData.user_id);
    if (existingUserId) {
      // 중복 시 타임스탬프 추가하여 고유성 보장
      userData.user_id = `${userData.user_id}_${Date.now()}`;
    }

    user = await userRepository.create(userData);

    // 소셜 로그인 정보 생성 (User 테이블의 user_id 사용)
    await userRepository.createSocialLogin(user.user_id, provider, socialId);

    return user;
  }

  /**
   * 소셜 로그인 프로필에서 이메일 추출
   * @param {Object} profile - 소셜 로그인 프로필
   * @param {string} provider - 소셜 로그인 제공자
   * @returns {string|null} 이메일 또는 null
   */
  extractEmailFromProfile(profile, provider) {
    if (provider === 'google') {
      return profile.emails?.[0]?.value || null;
    } else if (provider === 'kakao') {
      return profile._json?.kakao_account?.email || null;
    }
    return null;
  }

  /**
   * 소셜 로그인 프로필에서 사용자 데이터 생성
   * @param {Object} profile - 소셜 로그인 프로필
   * @param {string} provider - 소셜 로그인 제공자
   * @returns {Object} 사용자 데이터
   */
  createUserDataFromProfile(profile, provider) {
    const email = this.extractEmailFromProfile(profile, provider);
    
    // 소셜 로그인 사용자를 위한 고유한 user_id 생성
    const socialUserId = `${provider}_${profile.id}`;
    
    let userData = {
      user_id: socialUserId, // 소셜 로그인 사용자 고유 ID
      email: email || `${provider}_${profile.id}@${provider}.temp`,
      password: '', // 소셜 로그인은 비밀번호 없음
      emailVerified: !!email,
      lastLoginAt: new Date()
    };

    if (provider === 'google') {
      userData.name = profile.displayName || 'Google 사용자';
      userData.photo = profile.photos?.[0]?.value || null;
    } else if (provider === 'kakao') {
      userData.name = profile.displayName || profile._json?.properties?.nickname || 'Kakao 사용자';
      userData.photo = profile._json?.properties?.profile_image || null;
    }

    return userData;
  }

  /**
   * 사용자 목록 조회 (관리자용)
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 사용자 목록과 페이지 정보
   */
  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      userRepository.findMany(skip, limit),
      userRepository.count()
    ]);

    return {
      users: users.map(user => new UserResponseDto(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 이메일 중복 확인
   * @param {string} email - 확인할 이메일
   * @returns {Promise<Object>} 중복 확인 결과
   */
  async checkEmailDuplicate(email) {
    const exists = await userRepository.emailExists(email);
    
    return {
      available: !exists,
      message: exists ? '이미 사용 중인 이메일입니다' : '사용 가능한 이메일입니다'
    };
  }

  /**
   * 토큰 갱신
   * @param {string} refreshToken - 리프레시 토큰
   * @returns {Promise<TokenResponseDto>} 새로운 토큰 쌍
   */
  async refreshTokens(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // 사용자 존재 확인
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
      }

      // 새 토큰 쌍 생성
      const tokens = generateTokenPair(user.id, user.email);
      
      return new TokenResponseDto(tokens.accessToken, tokens.refreshToken);
    } catch (error) {
      throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다');
    }
  }

  /**
   * 이메일 발송 (실제 구현 시 사용)
   * @param {string} email - 수신자 이메일
   * @param {string} code - 인증 코드
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(email, code) {
    // TODO: 실제 이메일 발송 로직 구현
    // 예: SendGrid, Nodemailer 등 사용
    console.log(`이메일 발송: ${email}, 인증 코드: ${code}`);
  }

  /**
   * 비밀번호 재설정 이메일 발송 (실제 구현 시 사용)
   * @param {string} email - 수신자 이메일
   * @param {string} resetToken - 재설정 토큰
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail(email, resetToken) {
    // TODO: 실제 이메일 발송 로직 구현
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log(`비밀번호 재설정 링크: ${resetUrl}`);
  }
}

export default new UserService();
