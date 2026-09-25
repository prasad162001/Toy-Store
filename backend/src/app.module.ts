import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BannersModule } from './modules/banners/banners.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PromotionsModule } from './modules/promotions/promotions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context: any) => {
            const authHeader =
              context.connectionParams?.Authorization ||
              context.connectionParams?.authorization;
            return { req: { headers: { authorization: authHeader } } };
          },
        },
      },
      context: ({ req, res, extra, connectionParams }) => {
        if (req) {
          return { req, res };
        }
        const authHeader =
          connectionParams?.Authorization || connectionParams?.authorization;
        return {
          req: extra?.request
            ? { ...extra.request, headers: { ...(extra.request.headers || {}), authorization: authHeader } }
            : { headers: { authorization: authHeader } },
        };
      },
    }),
    PrismaModule,
    PubSubModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    WishlistModule,
    ReviewsModule,
    BannersModule,
    AdminModule,
    NotificationsModule,
    CouponsModule,
    PromotionsModule,
  ],
})
export class AppModule {}
