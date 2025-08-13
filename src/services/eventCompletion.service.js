import { eventCompletionRepository } from '../repositories/eventCompletion.repository.js';
import { donationService } from '../services/donation.service.js';
import { EventCompletionDto } from '../dtos/eventCompletion.dto.js';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.js';
import { getCurrentKSTISOString, toKSTISOString } from '../utils/datetime.util.js';

class EventCompletionService {
  /**
   * 이벤트 완료 후 처리 상태 조회
   */
  async getEventStatus(userId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    const totalReceivedAmount = completedEvent.currentAmount;
    const selectedItemsAmount = await eventCompletionRepository.getSelectedItemsAmount(completedEvent.id);
    const remainingAmount = Math.max(0, totalReceivedAmount - selectedItemsAmount);

    return EventCompletionDto.getEventStatusResponse({
      totalReceivedAmount,
      selectedItemsAmount,
      remainingAmount,
      status: remainingAmount === 0 ? 'EXACT_MATCH' : 'HAS_REMAINING',
      message: remainingAmount === 0 ? '친구들의 마음을 받았어요!' : `${remainingAmount.toLocaleString()}원이 남았어요`,
      canViewLetters: true
    });
  }

  /**
   * 남은 금액 처리 선택지 조회
   */
  async getRemainingOptions(userId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    const totalReceivedAmount = completedEvent.currentAmount;
    const selectedItemsAmount = await eventCompletionRepository.getSelectedItemsAmount(completedEvent.id);
    const remainingAmount = Math.max(0, totalReceivedAmount - selectedItemsAmount);

    if (remainingAmount === 0) {
      throw new ValidationError('처리할 남은 금액이 없습니다');
    }

    // 이미 처리되었는지 확인
    const isProcessed = await eventCompletionRepository.isRemainingAmountProcessed(completedEvent.id);
    if (isProcessed) {
      throw new ValidationError('이미 처리된 이벤트입니다');
    }

    return EventCompletionDto.getRemainingOptionsResponse({
      totalReceivedAmount,
      selectedItemsAmount,
      remainingAmount,
      message: `${remainingAmount.toLocaleString()}원이 남았어요`,
      description: '어떤 용도로 사용할지 선택해주세요',
      options: [
        {
          type: 'DONATE',
          label: '기부하기'
        },
        {
          type: 'CONVERT_TO_COIN',
          label: '몽코인으로 전환하기'
        }
      ]
    });
  }

  /**
   * 몽코인 전환 미리보기
   */
  async getConversionPreview(userId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    // 실제 남은 금액 계산
    const totalReceivedAmount = completedEvent.currentAmount;
    const selectedItemsAmount = await eventCompletionRepository.getSelectedItemsAmount(completedEvent.id);
    const remainingAmount = Math.max(0, totalReceivedAmount - selectedItemsAmount);

    if (remainingAmount === 0) {
      throw new ValidationError('전환할 남은 금액이 없습니다');
    }

    // 전환될 몽코인 계산 (100원 단위로 올림, 1.2 배율)
    const adjustedAmount = Math.ceil(remainingAmount / 100) * 100; // 100원 단위로 올림
    const convertedCoins = Math.floor(adjustedAmount * 1.2 / 100); // MC 단위로 변환

    return EventCompletionDto.getConversionPreviewResponse({
      conversionRate: 1.2,
      message: "전환되는 몽코인은 100원 단위까지 전환되며 나머지 금액은 올림 되어 적용됩니다",
      description: `${remainingAmount.toLocaleString()}원 = ${convertedCoins}MC`,
      minimumUnit: 100,
      remainingAmount,
      convertedCoins
    });
  }

  /**
   * 기부 처리
   */
  async processDonation(userId, organizationId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    const totalReceivedAmount = completedEvent.currentAmount;
    const selectedItemsAmount = await eventCompletionRepository.getSelectedItemsAmount(completedEvent.id);
    const remainingAmount = Math.max(0, totalReceivedAmount - selectedItemsAmount);

    if (remainingAmount === 0) {
      throw new ValidationError('처리할 남은 금액이 없습니다');
    }

    // 이미 처리되었는지 확인
    const isProcessed = await eventCompletionRepository.isRemainingAmountProcessed(completedEvent.id);
    if (isProcessed) {
      throw new ValidationError('이미 처리된 이벤트입니다');
    }

    // 기부 단체 확인
    const organization = await donationService.getOrganizationById(organizationId);
    if (!organization) {
      throw new NotFoundError('선택한 기부 단체가 존재하지 않습니다');
    }

    // 기부 처리
    await donationService.processDonation({
      eventId: completedEvent.id,
      userId,
      organizationId,
      amount: remainingAmount
    });

    // 처리 완료 표시
    await eventCompletionRepository.markRemainingAmountProcessed(
      completedEvent.id, 
      userId,
      'DONATE',
      remainingAmount
    );

    return EventCompletionDto.processDonationResponse({
      organizationName: organization.name,
      donatedAmount: remainingAmount,
      message: `${organization.name}에 기부했어요`,
      description: '기부금을 전달하고 있어요',
      donatedAt: getCurrentKSTISOString()
    });
  }

  /**
   * 몽코인 전환 처리
   */
  async convertToCoins(userId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    const totalReceivedAmount = completedEvent.currentAmount;
    const selectedItemsAmount = await eventCompletionRepository.getSelectedItemsAmount(completedEvent.id);
    const remainingAmount = Math.max(0, totalReceivedAmount - selectedItemsAmount);

    if (remainingAmount === 0) {
      throw new ValidationError('처리할 남은 금액이 없습니다');
    }

    if (remainingAmount < 100) {
      throw new ValidationError('최소 전환 단위는 100원입니다');
    }

    // 이미 처리되었는지 확인
    const isProcessed = await eventCompletionRepository.isRemainingAmountProcessed(completedEvent.id);
    if (isProcessed) {
      throw new ValidationError('이미 처리된 이벤트입니다');
    }

    // 몽코인 전환 계산 (1:1.2 비율, 100원 단위, 올림 처리)
    const convertibleAmount = Math.floor(remainingAmount / 100) * 100; // 100원 단위로 맞춤
    const convertedCoins = Math.ceil(convertibleAmount / 1000 * 1.2); // 1000원당 1.2MC, 올림

    // 몽코인 전환 처리
    await eventCompletionRepository.convertToCoins({
      eventId: completedEvent.id,
      userId,
      amount: convertibleAmount,
      coins: convertedCoins
    });

    // 처리 완료 표시
    await eventCompletionRepository.markRemainingAmountProcessed(
      completedEvent.id, 
      userId,
      'CONVERT_TO_COIN',
      convertibleAmount
    );

    return EventCompletionDto.convertToCoinsResponse({
      convertedAmount: convertibleAmount,
      convertedCoins,
      message: `${convertedCoins}MC로 전환되었습니다`,
      description: '상점에서 원하는 아이템으로 교환해 보세요',
      convertedAt: getCurrentKSTISOString()
    });
  }

  /**
   * 편지함 조회
   */
  async getEventLetters(userId) {
    const completedEvent = await eventCompletionRepository.getCompletedEvent(userId);
    
    if (!completedEvent) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    const letters = await eventCompletionRepository.getEventLetters(completedEvent.id);

    return {
      eventId: completedEvent.id,
      totalLetters: letters.length,
      letters: letters.map(letter => ({
        id: letter.id,
        senderName: letter.sender.name,
        content: letter.content,
        createdAt: toKSTISOString(letter.createdAt)
      }))
    };
  }
}

export const eventCompletionService = new EventCompletionService();
