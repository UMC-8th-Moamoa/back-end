class LetterDto {
  toResponse(letter) {
    return {
      id: letter.id,
      birthdayEventId: letter.birthdayEventId,
      senderId: letter.senderId,
      receiverId: letter.receiverId,
      content: letter.content,
      letterPaperId: letter.letterPaperId || null,
      envelopeId: letter.envelopeId || null,
      fontId: letter.fontId || null,
      envelopeImageUrl: letter.envelopeImageUrl || null,
      sentAt: letter.sentAt
    };
  }

  toDetailResponse(letter) {
    return {
      id: letter.id,
      birthdayEventId: letter.birthdayEventId,
      senderId: letter.senderId,
      receiverId: letter.receiverId,
      title: letter.title,
      content: letter.content,
      letterPaperId: letter.letterPaperId,
      envelopeId: letter.envelopeId,
      fontId: letter.fontId,
      envelopeImageUrl: letter.envelopeImageUrl,
      sentAt: letter.sentAt,
      readAt: letter.readAt,
      sender: letter.sender ? {
        id: letter.sender.id,
        name: letter.sender.name,
        email: letter.sender.email
      } : null,
      receiver: letter.receiver ? {
        id: letter.receiver.id,
        name: letter.receiver.name,
        email: letter.receiver.email
      } : null,
      birthdayEvent: letter.birthdayEvent ? {
        id: letter.birthdayEvent.id,
        title: letter.birthdayEvent.title
      } : null
    };
  }

  toListResponse(letters, pagination) {
    return {
      letters: letters.map(letter => this.toResponse(letter)),
      pagination
    };
  }
}

export const letterDto = new LetterDto();
