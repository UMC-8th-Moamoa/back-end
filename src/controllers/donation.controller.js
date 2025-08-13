import { donationService } from '../services/donation.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

class DonationController {
  /**
   * 기부 가능한 단체 목록 조회
   * GET /api/donations/organizations
   */
  getOrganizations = catchAsync(async (req, res) => {
    const result = await donationService.getOrganizations();
    res.success(result);
  });
}

export const donationController = new DonationController();
