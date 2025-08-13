export class DonationDto {
  /**
   * 기부 단체 목록 조회 응답
   */
  static getOrganizationsResponse(organizations) {
    return {
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name
      }))
    };
  }

  /**
   * 기부 단체 정보
   */
  static organizationInfo(organization) {
    return {
      id: organization.id,
      name: organization.name
    };
  }
}
