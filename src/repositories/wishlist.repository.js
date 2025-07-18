import prisma from '../config/prismaClient.js';

class WishlistRepository {
  async createWishlist(wishlistData) {
    return await prisma.wishlist.create({
      data: wishlistData
    });
  }

  async createAnalysisRequest(requestData) {
    return await prisma.wishlistAnalysisRequest.create({
      data: requestData
    });
  }

  async findById(id) {
    return await prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findWishlistById(id) {
    return await prisma.wishlist.findUnique({
      where: { id }
    });
  }

  async updateWishlist(id, updateData) {
    return await prisma.wishlist.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  async findByUserId(userId, options = {}) {
    const { skip = 0, take = 10, where = {} } = options;
    
    return await prisma.wishlist.findMany({
      where: {
        userId,
        ...where
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findMyWishlists(userId, options = {}) {
    const { 
      skip = 0, 
      take = 10, 
      sort = 'created_at', 
      visibility 
    } = options;

    // where 조건 구성
    const whereCondition = { userId };
    if (visibility === 'public') {
      whereCondition.isPublic = true;
    } else if (visibility === 'private') {
      whereCondition.isPublic = false;
    }

    // orderBy 조건 구성
    let orderBy;
    switch (sort) {
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'created_at':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    return await prisma.wishlist.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true
      }
    });
  }

  async countMyWishlists(userId, visibility) {
    const whereCondition = { userId };
    if (visibility === 'public') {
      whereCondition.isPublic = true;
    } else if (visibility === 'private') {
      whereCondition.isPublic = false;
    }

    return await prisma.wishlist.count({
      where: whereCondition
    });
  }

  async deleteWishlist(id) {
    return await prisma.wishlist.delete({
      where: { id }
    });
  }
}

export const wishlistRepository = new WishlistRepository();
