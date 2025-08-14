import bcrypt from 'bcrypt';

// 비밀번호 해싱
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// 비밀번호 검증
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// 비밀번호 강도 검증
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    errors: [
      ...(password.length < minLength ? [`비밀번호는 최소 ${minLength}자 이상이어야 합니다`] : []),
      ...((!hasUpperCase || !hasLowerCase) ? ['비밀번호는 대소문자를 포함해야 합니다'] : []),
      ...(!hasNumbers ? ['비밀번호는 숫자를 포함해야 합니다'] : []),
    ]
  };
};

// 비밀번호 변경 검증
export const validatePasswordChange = async (currentPassword, newPassword, hashedCurrentPassword) => {
  // 현재 비밀번호 확인
  const isCurrentPasswordValid = await comparePassword(currentPassword, hashedCurrentPassword);
  if (!isCurrentPasswordValid) {
    throw new Error('현재 비밀번호가 올바르지 않습니다');
  }

  // 새 비밀번호 강도 검증
  const strengthValidation = validatePasswordStrength(newPassword);
  if (!strengthValidation.isValid) {
    throw new Error(strengthValidation.errors.join(', '));
  }

  // 현재 비밀번호와 새 비밀번호가 같은지 확인
  const isSamePassword = await comparePassword(newPassword, hashedCurrentPassword);
  if (isSamePassword) {
    throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다');
  }
};
