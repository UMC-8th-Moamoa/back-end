-- CreateTable
CREATE TABLE `birthday_event_selected_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `wishlistId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `birthday_event_selected_items_eventId_wishlistId_key`(`eventId`, `wishlistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `birthday_event_selected_items` ADD CONSTRAINT `birthday_event_selected_items_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `birthday_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `birthday_event_selected_items` ADD CONSTRAINT `birthday_event_selected_items_wishlistId_fkey` FOREIGN KEY (`wishlistId`) REFERENCES `wishlists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
