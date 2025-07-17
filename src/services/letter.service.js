import { letterRepository } from '../repositories/letter.repository.js';
import { letterDto } from '../dtos/letter.dto.js';

// 편지 생성
const createLetter = async (userId, letterData) => {
  const { 
    birthdayEventId, 
    senderId, 
    receiverId, 
    content, 
    letterPaperId, 
    envelopeId, 
    envelopeImageUrl 
  } = letterData;

  // 1. 발신자 검증 (요청한 사용자와 senderId가 일치해야 함)
  if (userId !== senderId) {
    const error = new Error('본인만 편지를 보낼 수 있습니다');
    error.status = 403;
    throw error;
  }

  // 2. 생일 이벤트 존재 여부 확인
  const birthdayEvent = await letterRepository.findBirthdayEventById(birthdayEventId);
  if (!birthdayEvent) {
    const error = new Error('생일 이벤트를 찾을 수 없습니다');
    error.status = 404;
    throw error;
  }

  // 3. 수신자 존재 여부 확인
  const receiver = await letterRepository.findUserById(receiverId);
  if (!receiver) {
    const error = new Error('수신자를 찾을 수 없습니다');
    error.status = 404;
    throw error;
  }

  // 4. 편지지 소유권 확인
  const letterPaper = await letterRepository.findUserItemById(letterPaperId, userId);
  if (!letterPaper || letterPaper.item.category !== 'LETTER_PAPER') {
    const error = new Error('보유하지 않은 편지지이거나 올바르지 않은 편지지입니다');
    error.status = 400;
    throw error;
  }

  // 5. 편지봉투 소유권 확인
  const envelope = await letterRepository.findUserItemById(envelopeId, userId);
  if (!envelope || envelope.item.category !== 'STICKER') {
    const error = new Error('보유하지 않은 편지봉투이거나 올바르지 않은 편지봉투입니다');
    error.status = 400;
    throw error;
  }

  // 6. 편지 생성
  const createData = {
    birthdayEventId,
    senderId,
    receiverId,
    title: `${receiver.name}님에게 보내는 편지`, // 기본 제목 생성
    content,
    letterPaperId,
    envelopeId,
    envelopeImageUrl,
    sentAt: new Date()
  };

  const letter = await letterRepository.createLetter(createData);
  
  // 7. 응답 데이터 반환 (실제 저장된 데이터 사용)
  return letterDto.toResponse(letter);
};

// 편지 수정
const updateLetter = async (letterId, userId, updateData) => {
  // 1. 편지 존재 및 권한 확인
  const existingLetter = await letterRepository.findLetterById(letterId);
  
  if (!existingLetter) {
    const error = new Error('편지를 찾을 수 없습니다');
    error.status = 404;
    throw error;
  }

  if (existingLetter.senderId !== userId) {
    const error = new Error('본인이 작성한 편지만 수정할 수 있습니다');
    error.status = 403;
    throw error;
  }

  // 2. 생일 전까지만 수정 가능한지 확인
  if (existingLetter.birthdayEvent) {
    const birthdayEventDetail = await letterRepository.findBirthdayEventById(existingLetter.birthdayEvent.id);
    
    if (birthdayEventDetail && birthdayEventDetail.birthdayPerson && birthdayEventDetail.birthdayPerson.birthday) {
      const now = new Date();
      const birthdayThisYear = new Date(now.getFullYear(), 
        birthdayEventDetail.birthdayPerson.birthday.getMonth(), 
        birthdayEventDetail.birthdayPerson.birthday.getDate());
      
      if (now >= birthdayThisYear) {
        const error = new Error('생일이 지나서 편지를 수정할 수 없습니다');
        error.status = 403;
        throw error;
      }
    }
  }

  // 3. 아이템 소유권 확인 (변경하려는 아이템이 있을 경우)
  const { letterPaperId, envelopeId, envelopeImageUrl, ...directUpdateData } = updateData;

  if (letterPaperId) {
    const letterPaper = await letterRepository.findUserItemById(letterPaperId, userId);
    if (!letterPaper || letterPaper.item.category !== 'LETTER_PAPER') {
      const error = new Error('보유하지 않은 편지지이거나 올바르지 않은 편지지입니다');
      error.status = 400;
      throw error;
    }
  }

  if (envelopeId) {
    const envelope = await letterRepository.findUserItemById(envelopeId, userId);
    if (!envelope || envelope.item.category !== 'STICKER') {
      const error = new Error('보유하지 않은 편지봉투이거나 올바르지 않은 편지봉투입니다');
      error.status = 400;
      throw error;
    }
  }

  // 4. 편지 업데이트 (아이템 정보도 함께 업데이트)
  const updatePayload = {
    ...directUpdateData,
    ...(letterPaperId !== undefined && { letterPaperId }),
    ...(envelopeId !== undefined && { envelopeId }),
    ...(envelopeImageUrl !== undefined && { envelopeImageUrl })
  };
  
  const updatedLetter = await letterRepository.updateLetter(letterId, updatePayload);
  
  // 5. 응답 데이터 반환 (실제 저장된 데이터 사용)
  return letterDto.toResponse(updatedLetter);
};

// 편지 삭제
const deleteLetter = async (letterId, userId) => {
  try {
    // 편지 조회 및 존재 여부 확인
    const letter = await letterRepository.findLetterById(letterId);
    
    if (!letter) {
      throw new Error('편지를 찾을 수 없습니다.');
    }

    // 작성자 권한 확인 (senderId 사용)
    if (letter.senderId !== userId) {
      throw new Error('본인의 편지만 삭제할 수 있습니다.');
    }

    // 수신자의 생일 전날까지만 삭제 가능한지 확인 (receiver 사용)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recipientBirthday = new Date(letter.receiver.birthday);
    recipientBirthday.setFullYear(today.getFullYear());
    
    // 만약 올해 생일이 이미 지났다면, 내년 생일로 계산
    if (recipientBirthday < today) {
      recipientBirthday.setFullYear(today.getFullYear() + 1);
    }

    // 생일 전날까지만 삭제 가능 (생일 당일부터는 삭제 불가)
    if (today >= recipientBirthday) {
      throw new Error('생일 당일 이후로는 편지를 삭제할 수 없습니다.');
    }

    // 편지 삭제
    await letterRepository.deleteLetter(letterId);
    
    return true;
  } catch (error) {
    console.error('편지 삭제 서비스 오류:', error);
    throw error;
  }
};

// 편지 목록 조회
const getLetters = async (birthdayEventId, page, size) => {
  try {
    // 1. 생일 이벤트 존재 여부 확인
    const birthdayEvent = await letterRepository.findBirthdayEventById(birthdayEventId);
    if (!birthdayEvent) {
      throw new Error('생일 이벤트를 찾을 수 없습니다.');
    }

    // 2. 페이징 계산
    const skip = (page - 1) * size;

    // 3. 편지 목록 조회
    const letters = await letterRepository.findLettersByBirthdayEventId(birthdayEventId, skip, size);
    
    // 4. 전체 개수 조회
    const totalElements = await letterRepository.countLettersByBirthdayEventId(birthdayEventId);
    
    // 5. 페이징 정보 계산
    const totalPages = Math.ceil(totalElements / size);

    // 6. 응답 데이터 변환
    const content = letters.map(letter => ({
      id: letter.id,
      senderId: letter.senderId,
      title: letter.title,
      letterPaperId: letter.letterPaperId,
      envelopeId: letter.envelopeId,
      envelopeImageUrl: letter.envelopeImageUrl
    }));

    return {
      content,
      page,
      size,
      totalPages,
      totalElements
    };
  } catch (error) {
    console.error('편지 목록 조회 서비스 오류:', error);
    throw error;
  }
};

// 편지 상세 조회
const getLetterById = async (letterId, userId) => {
  try {
    // 1. 편지 조회
    const letter = await letterRepository.findLetterById(letterId);
    
    if (!letter) {
      throw new Error('편지를 찾을 수 없습니다.');
    }

    // 2. 편지 열람 권한 확인 (수신자 또는 발신자만 조회 가능)
    if (letter.senderId !== userId && letter.receiverId !== userId) {
      throw new Error('편지를 열람할 권한이 없습니다.');
    }

    // 3. 편지 읽음 처리 (수신자가 조회하는 경우에만)
    if (letter.receiverId === userId && !letter.readAt) {
      await letterRepository.markAsRead(letterId);
      letter.readAt = new Date();
    }

    // 4. 응답 데이터 반환
    return {
      id: letter.id,
      birthdayEventId: letter.birthdayEventId,
      senderId: letter.senderId,
      receiverId: letter.receiverId,
      content: letter.content,
      letterPaperId: letter.letterPaperId,
      envelopeId: letter.envelopeId,
      envelopeImageUrl: letter.envelopeImageUrl,
      sentAt: letter.sentAt,
      readAt: letter.readAt
    };
  } catch (error) {
    console.error('편지 상세 조회 서비스 오류:', error);
    throw error;
  }
};

export const letterService = {
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter
};