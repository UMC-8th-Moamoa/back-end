export class EventCompletionDto {
  /**
   * 이벤트 완료 후 처리 상태 조회 응답
   */
  static getEventStatusResponse(data) {
    return {
      totalReceivedAmount: data.totalReceivedAmount,
      selectedItemsAmount: data.selectedItemsAmount,
      remainingAmount: data.remainingAmount,
      status: data.status, // "EXACT_MATCH" | "HAS_REMAINING"
      message: data.message,
      canViewLetters: data.canViewLetters
    };
  }

  /**
   * 남은 금액 처리 선택지 조회 응답
   */
  static getRemainingOptionsResponse(data) {
    return {
      totalReceivedAmount: data.totalReceivedAmount,
      selectedItemsAmount: data.selectedItemsAmount,
      remainingAmount: data.remainingAmount,
      message: data.message,
      description: data.description,
      options: data.options.map(option => ({
        type: option.type,
        label: option.label
      }))
    };
  }

  /**
   * 몽코인 전환 미리보기 응답
   */
  static getConversionPreviewResponse(data) {
    return {
      conversionRate: data.conversionRate,
      message: data.message,
      description: data.description,
      minimumUnit: data.minimumUnit
    };
  }

  /**
   * 기부 처리 응답
   */
  static processDonationResponse(data) {
    return {
      organizationName: data.organizationName,
      donatedAmount: data.donatedAmount,
      message: data.message,
      description: data.description,
      donatedAt: data.donatedAt
    };
  }

  /**
   * 몽코인 전환 처리 응답
   */
  static convertToCoinsResponse(data) {
    return {
      convertedAmount: data.convertedAmount,
      convertedCoins: data.convertedCoins,
      message: data.message,
      description: data.description,
      convertedAt: data.convertedAt
    };
  }
}
