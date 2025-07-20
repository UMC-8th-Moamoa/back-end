// 생일 카운트다운 응답 DTO
export class BirthdayCountdownResponseDTO {
  constructor(user, countdown) {
    this.user = {
      id: user.id,
      name: user.name,
      birthday: user.birthday
    };
    this.countdown = countdown;
  }

  toResponse() {
    return {
      user: this.user,
      countdown: this.countdown
    };
  }
}

// 사용자 정보 DTO
export class UserBirthdayDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.birthday = user.birthday;
  }
}


// 카운트다운 정보 DTO
export class CountdownInfoDTO {
  constructor(countdownData) {
    this.daysRemaining = countdownData.daysRemaining;
    this.formattedDaysRemaining = countdownData.formattedDaysRemaining;
    this.birthdayThisYear = countdownData.birthdayThisYear;
    this.isBirthdayToday = countdownData.isBirthdayToday;
    this.isBirthdayPassed = countdownData.isBirthdayPassed;
    this.message = countdownData.message;
  }
}