import prisma from '../config/prismaClient.js';

// 편지 생성
const createLetter = async (letterData) => {
  try {
    return await prisma.letter.create({
      data: letterData
    });
  } catch (error) {
    console.error('편지 생성 레포지토리 오류:', error);
    throw error;
  }
};

// 생일 이벤트 조회
const findBirthdayEventById = async (id) => {
  try {
    return await prisma.birthdayEvent.findUnique({
      where: { id },
      include: {
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            birthday: true
          }
        }
      }
    });
  } catch (error) {
    console.error('생일 이벤트 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 사용자 조회
const findUserById = async (id) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        birthday: true
      }
    });
  } catch (error) {
    console.error('사용자 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 사용자 아이템 조회
const findUserItemById = async (id, userId) => {
  try {
    return await prisma.userItem.findFirst({
      where: {
        id,
        userId
      },
      include: {
        item: {
          select: {
            id: true,
            category: true,
            name: true
          }
        }
      }
    });
  } catch (error) {
    console.error('사용자 아이템 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 편지 조회
const findLetterById = async (id) => {
  try {
    return await prisma.letter.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            birthday: true
          }
        },
        birthdayEvent: {
          select: {
            id: true,
            title: true,
            birthdayPersonId: true
          }
        }
      }
    });
  } catch (error) {
    console.error('편지 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 편지 수정
const updateLetter = async (id, updateData) => {
  try {
    return await prisma.letter.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('편지 수정 레포지토리 오류:', error);
    throw error;
  }
};

// 편지 삭제
const deleteLetter = async (letterId) => {
  try {
    const deletedLetter = await prisma.letter.delete({
      where: {
        id: letterId
      }
    });
    
    return deletedLetter;
  } catch (error) {
    console.error('편지 삭제 레포지토리 오류:', error);
    throw error;
  }
};

// 특정 생일 이벤트의 편지 목록 조회 (페이징)
const findLettersByBirthdayEventId = async (birthdayEventId, skip, take) => {
  try {
    return await prisma.letter.findMany({
      where: {
        birthdayEventId: birthdayEventId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: take
    });
  } catch (error) {
    console.error('편지 목록 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 특정 생일 이벤트의 편지 개수 조회
const countLettersByBirthdayEventId = async (birthdayEventId) => {
  try {
    return await prisma.letter.count({
      where: {
        birthdayEventId: birthdayEventId
      }
    });
  } catch (error) {
    console.error('편지 개수 조회 레포지토리 오류:', error);
    throw error;
  }
};

// 편지 읽음 처리
const markAsRead = async (letterId) => {
  try {
    return await prisma.letter.update({
      where: {
        id: letterId
      },
      data: {
        readAt: new Date()
      }
    });
  } catch (error) {
    console.error('편지 읽음 처리 레포지토리 오류:', error);
    throw error;
  }
};

export const letterRepository = {
  createLetter,
  findBirthdayEventById,
  findUserById,
  findUserItemById,
  findLetterById,
  updateLetter,
  deleteLetter,
  findLettersByBirthdayEventId,
  countLettersByBirthdayEventId,
  markAsRead
};
