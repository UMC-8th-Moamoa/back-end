import prisma from '../config/prismaClient.js';

class DonationRepository {
  /**
   * 기부 단체 목록 조회
   */
  async getOrganizations() {
    return [
      { id: 1, name: '굿네이버스' },
      { id: 2, name: '세이브 더 칠드런' },
      { id: 3, name: '유니세프' }
    ];
  }

  /**
   * 기부 단체 ID로 조회
   */
  async getOrganizationById(organizationId) {
    const organizations = await this.getOrganizations();
    return organizations.find(org => org.id === organizationId);
  }

  /**
   * 기부 처리
   */
  async processDonation({ eventId, userId, organizationId, amount }) {
    const organization = await this.getOrganizationById(organizationId);
    
    return await prisma.donation.create({
      data: {
        eventId,
        userId,
        organizationId,
        organizationName: organization.name,
        amount,
        donatedAt: new Date()
      }
    });
  }
}

export const donationRepository = new DonationRepository();
