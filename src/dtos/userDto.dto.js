/**
 * 사용자 관련 DTO (Data Transfer Object)
 * 클라이언트와 서버 간 데이터 전송 형식을 정의
 */

import { toKSTISOString } from '../utils/datetime.util.js';

// 회원가입 요청 DTO
export class CreateUserDto {
  constructor({ user_id, email, password, name, phone, birthday }) {
    this.user_id = user_id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.phone = phone;
    this.birthday = birthday;
  }
}

// 로그인 요청 DTO
export class LoginUserDto {
  constructor({ user_id, password }) {
    this.user_id = user_id;
    this.password = password;
  }
}

// 사용자 응답 DTO (민감한 정보 제외)
export class UserResponseDto {
  constructor(user) {
    this.id = user.id;
    this.user_id = user.user_id;
    this.email = user.email;
    this.name = user.name;
    this.phone = user.phone;
    this.birthday = user.birthday ? toKSTISOString(user.birthday) : null;
    this.photo = user.photo;
    this.cash = user.cash;
    this.emailVerified = user.emailVerified;
    this.createdAt = user.createdAt ? toKSTISOString(user.createdAt) : null;
    this.lastLoginAt = user.lastLoginAt ? toKSTISOString(user.lastLoginAt) : null;
    
    // 팔로워/팔로잉 수 추가
    this.followersCount = user._count?.followers || 0;
    this.followingCount = user._count?.following || 0;
    this.wishlistsCount = user._count?.wishlists || 0;
  }
}

// 사용자 기본 정보 DTO
export class UserBasicInfoDto {
  constructor(user) {
    this.id = user.id;
    this.user_id = user.user_id;
    this.email = user.email;
    this.name = user.name;
    this.photo = user.photo;
    this.createdAt = user.createdAt;
  }
}

// 토큰 응답 DTO
export class TokenResponseDto {
  constructor(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

// 인증 응답 DTO (사용자 + 토큰)
export class AuthResponseDto {
  constructor(user, tokens) {
    this.user = new UserBasicInfoDto(user);
    this.tokens = tokens;
  }
}

// 비밀번호 변경 요청 DTO
export class ChangePasswordDto {
  constructor({ currentPassword, newPassword, confirmPassword }) {
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
    this.confirmPassword = confirmPassword;
  }
}

// 이메일 인증 요청 DTO
export class EmailVerificationDto {
  constructor({ email, purpose}) {
    this.email = email;

    this.purpose = purpose;
  }
}

export class EmailVerificationCodeDto {
  constructor({ email = null, code, purpose = null }) {
    this.email = email;
    this.code = code;
    this.purpose = purpose;
  }
}


// 아이디 찾기 DTO
export class FindUserIdDto {
  constructor({ email, phone }) {
    this.email = email || null;
    this.phone = phone || null;
  }
}



// 비밀번호 재설정 요청 DTO
export class PasswordResetRequestDto {
  constructor({ email }) {
    this.email = email;
  }
}

// 비밀번호 재설정 DTO
export class PasswordResetDto {
  constructor({ token, newPassword, confirmPassword }) {
    this.token = token;
    this.newPassword = newPassword;
    this.confirmPassword = confirmPassword;
  }
}

// 사용자 정보 수정 DTO
export class UpdateUserDto {
  constructor({ name, phone, birthday, photo }) {
    this.name = name;
    this.phone = phone;
    this.birthday = birthday;
    this.photo = photo;
  }
}

// 리프레시 토큰 요청 DTO
export class RefreshTokenDto {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}

// 마스킹된 이메일 응답 DTO
export class MaskedEmailResponseDto {
  constructor(email) {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    
    this.email = `${maskedLocal}@${domain}`;
    this.message = '등록된 이메일 주소입니다';
  }
}

// 성공 응답 DTO
export class SuccessResponseDto {
  constructor(message) {
    this.message = message;
  }
}

// 닉네임 중복 확인 응답 DTO
export class NicknameCheckResponseDto {
  constructor(available) {
    this.available = available;
    this.message = available ? '사용 가능한 닉네임입니다' : '이미 사용 중인 닉네임입니다';
  }
}

export default {
  CreateUserDto,
  LoginUserDto,
  UserResponseDto,
  UserBasicInfoDto,
  TokenResponseDto,
  AuthResponseDto,
  ChangePasswordDto,
  EmailVerificationDto,
  EmailVerificationCodeDto,
  FindUserIdDto,
  PasswordResetRequestDto,
  PasswordResetDto,
  UpdateUserDto,
  RefreshTokenDto,
  MaskedEmailResponseDto,
  SuccessResponseDto,
  NicknameCheckResponseDto
};
