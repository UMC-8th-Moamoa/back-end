import prisma from '../config/prismaClient.js';

class EventCompletionRepository {
  /**
   * 완료된 생일 이벤트 조회 (가장 최근)
   */
  async getCompletedEvent(userId) {
    return await prisma.birthdayEvent.findFirst({
      where: {
        birthdayPersonId: userId,
        status: 'completed'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * 선택된 위시리스트 아이템들의 총 금액 조회
   */
  async getSelectedItemsAmount(eventId) {
    const selectedItems = await prisma.birthdayEventSelectedItem.findMany({
      where: {
        eventId: eventId
      },
      include: {
        wishlist: {
          select: {
            price: true
          }
        }
      }
    });

    // 선택된 아이템들의 가격 합계
    const totalAmount = selectedItems.reduce((sum, item) => {
      return sum + (item.wishlist?.price || 0);
    }, 0);

    return totalAmount;
  }

  /**
   * 남은 금액이 이미 처리되었는지 확인
   */
  async isRemainingAmountProcessed(eventId) {
    const processedRecord = await prisma.remainingAmountProcess.findFirst({
      where: {
        eventId
      }
    });

    return !!processedRecord;
  }

  /**
   * 남은 금액 처리 완료 표시
   */
  async markRemainingAmountProcessed(eventId, userId, processType, amount) {
    return await prisma.remainingAmountProcess.create({
      data: {
        eventId,
        userId,
        processType,
        amount,
        processedAt: new Date()
      }
    });
  }

  /**
   * 몽코인 전환 처리
   */
  async convertToCoins({ eventId, userId, amount, coins }) {
    return await prisma.$transaction(async (tx) => {
      // 현재 사용자의 cash 잔액 조회
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { cash: true }
      });

      const newCash = user.cash + coins;

      // 사용자 cash 잔액 업데이트
      await tx.user.update({
        where: { id: userId },
        data: { cash: newCash }
      });

      // 포인트 히스토리 생성
      await tx.pointHistory.create({
        data: {
          userId,
          pointType: 'CHARGE',
          pointChange: coins,
          totalPoints: newCash,
          description: `생일 이벤트 차액 전환 (${amount.toLocaleString()}원 → ${coins}MC)`,
          createdAt: new Date()
        }
      });

      // 전환 기록 저장
      return await tx.coinConversion.create({
        data: {
          eventId,
          userId,
          originalAmount: amount,
          convertedCoins: coins,
          conversionRate: 1.2,
          convertedAt: new Date()
        }
      });
    });
  }

  /**
   * 이벤트 편지 목록 조회
   */
  async getEventLetters(eventId) {
    return await prisma.letter.findMany({
      where: {
        birthdayEventId: eventId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

export const eventCompletionRepository = new EventCompletionRepository();
