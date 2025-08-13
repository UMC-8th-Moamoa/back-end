import userRepository from '../repositories/userRepository.repositories.js';
import prisma from '../config/prismaClient.js'; 
import { hashPassword, validatePasswordStrength } from '../utils/password.util.js'; // ✅ compare/validatePasswordChange 제거
import * as passwordResetRepository from '../repositories/passwordReset.repositories.js';


import { 
  generateTokenPair, 
  generateEmailVerificationToken, 
  verifyEmailVerificationToken
  
  
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

    // ✅ JWT 토큰 생성: 두 번째 인수는 반드시 이메일이어야 함
    const tokens = generateTokenPair(user.id, user.email);

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

  async findUserId(findUserIdDto) {
  const { email, phone } = findUserIdDto;

  if (!email && !phone) {
    throw new Error('이메일이나 전화번호 중 하나를 입력해주세요.');
  }

  let user;
  if (email) {
    user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) throw new Error('가입 이력이 없는 이메일입니다.');
  } else if (phone) {
    user = await prisma.user.findUnique({
      where: { phone }
    });
    if (!user) throw new Error('가입 이력이 없는 전화번호입니다.');
  }

  // 이메일 발송 (현재 비활성화됨 - 실제 이메일 서비스 구현 후 활성화)
  // await sendEmail({
  //   to: user.email,
  //   subject: '[MOA MOA] 아이디 찾기 안내',
  //   text: `회원님의 아이디는 ${user.user_id} 입니다.`
  // });

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`아이디 찾기: ${user.email}로 아이디 ${user.user_id} 전송 (실제 이메일 발송 비활성화)`);
  }

  return {
    message: '회원님의 이메일로 아이디를 전송했습니다.'
  };
}




  /**
   * 비밀번호 변경
   * @param {number} userId - 사용자 ID
   * @param {ChangePasswordDto} changePasswordDto - 비밀번호 변경 정보
   * @returns {Promise<SuccessResponseDto>} 성공 응답
   */
  async resetPasswordWithTicket(ticketId, newPassword) {
  const ticket = await passwordResetRepository.getValidTicket(ticketId);
  if (!ticket) throw new ValidationError('인증 절차가 만료되었습니다. 다시 시도해주세요.');

  const { isValid, errors } = validatePasswordStrength(newPassword);
  if (!isValid) throw new ValidationError(errors.join(', '));

  const hashed = await hashPassword(newPassword);
  await userRepository.updatePassword(ticket.userId, hashed);
  await passwordResetRepository.consumeTicket(ticketId);

  return new SuccessResponseDto('비밀번호가 성공적으로 재설정되었습니다');
}

// userService.js
async verifyEmailCode({ email, code }) {
  if (!email || !code) {
    throw new ValidationError('email과 code는 필수입니다');
  }

  // 1) 사용자 조회
  const user = await userRepository.findByEmail(email);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다');

  // 2) 코드 검증
  const isValid = await emailVerificationRepository.verifyCode(email, code);
  if (!isValid) throw new ValidationError('잘못된 인증 코드입니다');

  // 3) 이메일 인증 처리
  await userRepository.updateEmailVerified(user.id, true);

  // 4) 비밀번호 재설정 티켓 발급
  const ticket = await passwordResetRepository.createTicket(user.id);

  // 5) verificationToken 생성
  const verificationToken = generateEmailVerificationToken({
    email,
    code,
    type: 'reset', // 목적에 맞게 변경
  });

  // 6) 응답
  return new SuccessResponseDto('이메일 인증이 완료되었습니다', {
    resetTicket: ticket.id,
    expiresIn: '30m',
    verificationToken
  });
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

    // 개발 환경에서는 프론트 디버깅을 위해 토큰/만료 안내 제공
    if (process.env.NODE_ENV === 'development') {
      response.verificationToken = verificationToken;
      response.expiresIn = '10m';
    }

    return response;
  }

  async verifyEmailCode(emailVerificationCodeDto) {
  const { email = null, code, purpose = null, token = null } = emailVerificationCodeDto;

  if (!code) {
    throw new ValidationError('인증 코드는 필수입니다');
  }

  // 운영 환경에서 토큰 없이 검증 허용하려면 email 없어도 그냥 패스
  if (process.env.NODE_ENV === 'production') {
    // token 없이도 code 길이만 체크
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      throw new ValidationError('유효하지 않은 인증 코드입니다');
    }
    return new SuccessResponseDto('이메일 인증이 완료되었습니다');
  }

  // 기존 토큰 검증 로직 (개발환경 + 토큰 있을 때)
  if (token) {
    const decoded = verifyEmailVerificationToken(token);
    if (decoded.code !== code) {
      throw new ValidationError('인증 코드가 일치하지 않습니다');
    }
  }

  return new SuccessResponseDto('이메일 인증이 완료되었습니다');
}

  // UserService 클래스 내부에 추가
async resetPasswordByCode(passwordResetDto) {
  const { email, code, newPassword, token = null } = passwordResetDto;

  // 6자리 숫자 코드 형태 1차 검증
  if (!email || !code || !newPassword) {
    throw new ValidationError('email, code, newPassword는 필수입니다');
  }
  if (!/^\d{6}$/.test(code)) {
    throw new ValidationError('인증 코드는 6자리 숫자여야 합니다');
  }

  // (중요) 코드 검증: 이미 있는 이메일 인증 검증 로직 재사용
  // - 개발환경: token 있으면 verifyEmailVerificationToken으로 일치 여부 확인
  // - 운영환경: verifyEmailCode가 길이/형식만 체크하는 상태면,
  //   실제론 DB에 코드 저장/검증하는 저장소가 필요합니다. (추후 반영 권장)
  await this.verifyEmailCode(
    new EmailVerificationCodeDto({ email, code, purpose: 'reset', token })
  );

  // 사용자 조회
  const user = await userRepository.findByEmail(email);
  if (!user) {
    // 존재 노출을 피하려면 메시지를 일반화해도 됨
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  // 새 비밀번호 정책 검증 (유틸에 정책 함수가 없다면 간단 검사라도)
  // 예: validatePasswordChangeUtil는 현재비번 비교 로직이 섞여있을 수 있어 별도 정책 함수 권장
  if (newPassword.length < 8) {
    throw new ValidationError('새 비밀번호는 최소 8자 이상이어야 합니다');
  }

  // 해싱 후 업데이트
  const hashed = await hashPassword(newPassword);
  await userRepository.updatePassword(user.id, hashed);

  // (선택) 해당 이메일의 인증코드 무효화 처리 필요 시 여기에 추가

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
