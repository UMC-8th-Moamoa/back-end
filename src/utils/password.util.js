const bcrypt = require('bcryptjs');

class PasswordUtil {
  // 비밀번호 해싱
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // 비밀번호 검증
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 비밀번호 강도 검증
  static validatePasswordStrength(password) {
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
  }
}

module.exports = PasswordUtil;