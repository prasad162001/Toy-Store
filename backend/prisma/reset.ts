import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function resetDatabase() {
  const dbUrl = process.env.DATABASE_URL || '';

  // CRITICAL SAFETY GUARD: Refuse to execute if not clearly identified as development DB
  if (!dbUrl.includes('toy_store_dev') && process.env.NODE_ENV === 'production') {
    console.error('================================================================');
    console.error('SAFETY BLOCKED: CRITICAL PREVENTIVE GUARD TRIGGERED!');
    console.error('Database reset was BLOCKED because DATABASE_URL does not match');
    console.error('the local development database "toy_store_dev" or NODE_ENV is production.');
    console.error('================================================================');
    process.exit(1);
  }

  console.log('--- Development Database Reset Started (toy_store_dev) ---');

  // Truncate/delete all tables in cascade order
  await prisma.adminAuditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.return.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.banner.deleteMany();

  console.log('--- Database Cleaned Successfully ---');
}

resetDatabase()
  .catch((e) => {
    console.error('Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
