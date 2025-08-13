import prisma from '../config/prismaClient.js';

export const createTicket = (userId, ttlMinutes = 30) =>
  prisma.passwordResetTicket.create({
    data: {
      userId,
      used: false,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    },
  });

export const getValidTicket = (id) =>
  prisma.passwordResetTicket.findFirst({
    where: { id, used: false, expiresAt: { gt: new Date() } },
  });

export const consumeTicket = (id) =>
  prisma.passwordResetTicket.update({
    where: { id },
    data: { used: true },
  });
