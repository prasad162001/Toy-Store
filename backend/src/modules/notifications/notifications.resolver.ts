import { Resolver, Query, Mutation, Subscription, Args, Int } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { NotificationsService, NOTIFICATION_CREATED_EVENT } from './notifications.service';
import { NotificationType } from './dto/notifications.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '../../pubsub/pubsub.module';

@Resolver(() => NotificationType)
export class NotificationsResolver {
  constructor(
    private notificationsService: NotificationsService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  @Query(() => [NotificationType])
  @UseGuards(GqlAuthGuard)
  async myNotifications(@CurrentUser() user: any): Promise<NotificationType[]> {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Query(() => Int)
  @UseGuards(GqlAuthGuard)
  async unreadNotificationCount(@CurrentUser() user: any): Promise<number> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markNotificationAsRead(
    @CurrentUser() user: any,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<boolean> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Subscription(() => NotificationType, {
    filter: (payload, variables, context) => {
      // Filter subscription so users only receive their own notifications
      return payload.notificationCreated?.userId === context.req?.user?.id;
    },
  })
  notificationCreated() {
    return this.pubSub.asyncIterableIterator(NOTIFICATION_CREATED_EVENT);
  }
}
