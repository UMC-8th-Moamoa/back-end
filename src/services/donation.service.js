import { donationRepository } from '../repositories/donation.repository.js';
import { DonationDto } from '../dtos/donation.dto.js';

class DonationService {
  /**
   * 기부 가능한 단체 목록 조회
   */
  async getOrganizations() {
    const organizations = await donationRepository.getOrganizations();
    return DonationDto.getOrganizationsResponse(organizations);
  }

  /**
   * 기부 단체 정보 조회
   */
  async getOrganizationById(organizationId) {
    return await donationRepository.getOrganizationById(organizationId);
  }

  /**
   * 기부 처리
   */
  async processDonation(donationData) {
    return await donationRepository.processDonation(donationData);
  }
}

export const donationService = new DonationService();
