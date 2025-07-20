import { birthdayRepository } from '../repositories/birthday.repository.js';
import { BirthdayCountdownResponseDTO, CountdownInfoDTO } from '../dtos/birthday.dto.js';
import { ValidationError, NotFoundError } from '../middlewares/errorHandler.js';

class BirthdayService {
// 사용자 생일 카운트다운 정보 조회
  async getBirthdayCountdown(userId) {
    // 사용자 정보 조회
    const user = await birthdayRepository.getUserBirthdayInfo(userId);
    
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    if (!user.birthday) {
      throw new ValidationError('사용자의 생일 정보가 등록되지 않았습니다');
    }

    // D-day 계산
    const countdownData = this.calculateBirthdayCountdown(user.birthday, user.name);
    const countdown = new CountdownInfoDTO(countdownData);

    // 응답 DTO 생성
    const responseDTO = new BirthdayCountdownResponseDTO(user, countdown);
    
    return responseDTO.toResponse();
  }

// 생일까지 남은 일수 계산
  calculateBirthdayCountdown(birthday, userName) {
    const today = new Date();
    const birthDate = new Date(birthday);
    
    // 시간을 00:00:00으로 설정하여 정확한 날짜 비교
    today.setHours(0, 0, 0, 0);
    
    // 올해 생일 계산
    let birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    birthdayThisYear.setHours(0, 0, 0, 0);
    
    let isBirthdayPassed = false;
    
    // 올해 생일이 지났으면 내년 생일로 설정
    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
      isBirthdayPassed = true;
    }

    // 남은 일수 계산
    const timeDiff = birthdayThisYear.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 생일 당일 확인
    const isBirthdayToday = daysRemaining === 0;
    
    // 포맷팅
    const formattedDaysRemaining = this.formatDaysRemaining(daysRemaining, isBirthdayToday);
    const message = this.createBirthdayMessage(userName, isBirthdayToday);

    return {
      daysRemaining,
      formattedDaysRemaining,
      birthdayThisYear: birthdayThisYear.toISOString(),
      isBirthdayToday,
      isBirthdayPassed,
      message
    };
  }

// 남은 일수 포맷팅
  formatDaysRemaining(daysRemaining, isBirthdayToday) {
    if (isBirthdayToday) {
      return 'D-DAY';
    }
    return `D-${daysRemaining}`;
  }

// 생일 메시지 생성
  createBirthdayMessage(userName, isBirthdayToday) {
    if (isBirthdayToday) {
      return `${userName}님의 생일 🎉`;
    }
    return `${userName}님의 생일`;
  }

// 윤년 처리 (2월 29일 생일자)
  handleLeapYearBirthday(birthday, year) {
    const birthDate = new Date(birthday);
    
    // 2월 29일 생일자인 경우
    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29) {
      // 평년인 경우 2월 28일로 설정
      if (!this.isLeapYear(year)) {
        return new Date(year, 1, 28); // 2월 28일
      }
    }
    
    return new Date(year, birthDate.getMonth(), birthDate.getDate());
  }

// 윤년 확인
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }
}

export const birthdayService = new BirthdayService();