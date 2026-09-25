import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class NotificationType {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  type: string;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;
}
