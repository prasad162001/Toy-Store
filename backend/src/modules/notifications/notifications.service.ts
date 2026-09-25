import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '../../pubsub/pubsub.module';

export const NOTIFICATION_CREATED_EVENT = 'notificationCreated';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  async createNotification(userId: string, title: string, message: string, type: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    // Publish to GraphQL Subscriptions stream
    this.pubSub.publish(NOTIFICATION_CREATED_EVENT, { notificationCreated: notification });

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return true;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return true;
  }
}
