class WishlistDto {
  toResponse(wishlist) {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      productName: wishlist.productName,
      price: wishlist.price,
      productImageUrl: wishlist.productImageUrl,
      fundingActive: wishlist.fundingActive,
      isPublic: wishlist.isPublic,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    };
  }

  toListResponse(wishlists, pagination) {
    return {
      wishlists: wishlists.map(wishlist => this.toResponse(wishlist)),
      pagination
    };
  }

  toMyWishlistsResponse(data) {
    return {
      content: data.content.map(wishlist => ({
        id: wishlist.id,
        productName: wishlist.productName,
        price: wishlist.price,
        productImageUrl: wishlist.productImageUrl
      })),
      page: data.page,
      size: data.size,
      totalPages: data.totalPages,
      totalElements: data.totalElements
    };
  }
}

export const wishlistDto = new WishlistDto();
