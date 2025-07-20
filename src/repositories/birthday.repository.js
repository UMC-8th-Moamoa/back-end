import prisma from '../config/prismaClient.js';

class BirthdayRepository {
// 사용자 생일 정보 조회
  async getUserBirthdayInfo(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        birthday: true
      }
    });
  }

// 사용자 생일 정보 업데이트
  async updateUserBirthday(userId, birthday) {
    return await prisma.user.update({
      where: { id: userId },
      data: { birthday },
      select: {
        id: true,
        name: true,
        birthday: true
      }
    });
  }

// 생일이 등록된 사용자인지 확인
  async hasBirthdayRegistered(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthday: true }
    });
    
    return user && user.birthday !== null;
  }
}

export const birthdayRepository = new BirthdayRepository();