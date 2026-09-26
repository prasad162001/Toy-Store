import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Development Database Seed ---');

  // 1. Seed Roles
  const roles: Record<RoleName, string> = {
    SUPER_ADMIN: (await prisma.role.upsert({
      where: { name: RoleName.SUPER_ADMIN },
      update: {},
      create: { name: RoleName.SUPER_ADMIN, description: 'Super Administrator with full access' },
    })).id,
    ADMIN: (await prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: 'Administrator for store management' },
    })).id,
    STAFF: (await prisma.role.upsert({
      where: { name: RoleName.STAFF },
      update: {},
      create: { name: RoleName.STAFF, description: 'Operational staff for order processing' },
    })).id,
    CUSTOMER: (await prisma.role.upsert({
      where: { name: RoleName.CUSTOMER },
      update: {},
      create: { name: RoleName.CUSTOMER, description: 'End-user customer' },
    })).id,
  };

  // 2. Seed 12 Development Accounts
  const devUsersConfig = [
    { accountName: 'superadmin1', mobile: '9900000001', pin: '111111', role: RoleName.SUPER_ADMIN, email: 'superadmin1@toystore.dev' },
    { accountName: 'superadmin2', mobile: '9900000002', pin: '111111', role: RoleName.SUPER_ADMIN, email: 'superadmin2@toystore.dev' },
    { accountName: 'superadmin3', mobile: '9900000003', pin: '111111', role: RoleName.SUPER_ADMIN, email: 'superadmin3@toystore.dev' },

    { accountName: 'admin1', mobile: '9900000004', pin: '222222', role: RoleName.ADMIN, email: 'admin1@toystore.dev' },
    { accountName: 'admin2', mobile: '9900000005', pin: '222222', role: RoleName.ADMIN, email: 'admin2@toystore.dev' },
    { accountName: 'admin3', mobile: '9900000006', pin: '222222', role: RoleName.ADMIN, email: 'admin3@toystore.dev' },

    { accountName: 'staff1', mobile: '9900000007', pin: '333333', role: RoleName.STAFF, email: 'staff1@toystore.dev' },
    { accountName: 'staff2', mobile: '9900000008', pin: '333333', role: RoleName.STAFF, email: 'staff2@toystore.dev' },
    { accountName: 'staff3', mobile: '9900000009', pin: '333333', role: RoleName.STAFF, email: 'staff3@toystore.dev' },

    { accountName: 'customer1', mobile: '9900000010', pin: '444444', role: RoleName.CUSTOMER, email: 'customer1@toystore.dev' },
    { accountName: 'customer2', mobile: '9900000011', pin: '444444', role: RoleName.CUSTOMER, email: 'customer2@toystore.dev' },
    { accountName: 'customer3', mobile: '9900000012', pin: '444444', role: RoleName.CUSTOMER, email: 'customer3@toystore.dev' },
  ];

  const seededUsers: Record<string, string> = {};

  for (const u of devUsersConfig) {
    const pinHash = await bcrypt.hash(u.pin, 10);
    const user = await prisma.user.upsert({
      where: { mobile: u.mobile },
      update: { accountName: u.accountName, pinHash, email: u.email, isVerified: true, isActive: true },
      create: {
        accountName: u.accountName,
        mobile: u.mobile,
        pinHash,
        email: u.email,
        isVerified: true,
      },
    });

    seededUsers[u.accountName] = user.id;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[u.role] } },
      update: {},
      create: { userId: user.id, roleId: roles[u.role] },
    });
  }

  // 3. Seed 3 Categories (Boys, Girls, Unisex)
  const catBoys = await prisma.category.upsert({
    where: { slug: 'boys' },
    update: {},
    create: {
      name: 'Boys',
      slug: 'boys',
      description: 'Action figures, remote control cars, building blocks & tech toys for boys.',
      imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catGirls = await prisma.category.upsert({
    where: { slug: 'girls' },
    update: {},
    create: {
      name: 'Girls',
      slug: 'girls',
      description: 'Dollhouses, creative arts & crafts, pretend play sets & plush toys for girls.',
      imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=800&q=80',
    },
  });

  const catUnisex = await prisma.category.upsert({
    where: { slug: 'unisex' },
    update: {},
    create: {
      name: 'Unisex',
      slug: 'unisex',
      description: 'Educational STEM kits, wooden puzzles, board games & musical instruments for all kids.',
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 4. Seed 18 Toy Products
  const productsData = [
    // BOYS (6 Products)
    {
      name: 'Turbo Racer 4WD RC Buggy',
      slug: 'turbo-racer-4wd-rc-buggy',
      description: 'High-speed remote control off-road buggy with shock absorbers and rechargeable battery pack.',
      specifications: 'Scale: 1:16, Max Speed: 25 km/h, Range: 50m, Charge Time: 2 hrs',
      price: 2499,
      discountPercent: 15,
      recommendedAge: '6-10 years',
      categoryId: catBoys.id,
      isFeatured: true,
      isBestSeller: true,
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Mech Warrior Transforming Robot',
      slug: 'mech-warrior-transforming-robot',
      description: 'Futuristic action figure that easily converts from a high-tech battle mech into a armored supercar.',
      specifications: 'Material: ABS non-toxic plastic, Die-cast alloy parts, Height: 28cm',
      price: 1899,
      discountPercent: 10,
      recommendedAge: '5-8 years',
      categoryId: catBoys.id,
      isNewArrival: true,
      stock: 15,
      images: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Galactic Police Space Blaster Set',
      slug: 'galactic-police-space-blaster-set',
      description: 'Safe soft foam dart blaster with LED lights, realistic target scope and sound effects.',
      specifications: 'Includes: Blaster, 20 suction darts, Target stand, Requires 3 AAA batteries',
      price: 1299,
      discountPercent: 0,
      recommendedAge: '6+ years',
      categoryId: catBoys.id,
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1589254065909-b7086229d08c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Super Construction Crane & Truck Set',
      slug: 'super-construction-crane-truck-set',
      description: 'Heavy duty construction play set featuring a 360-degree rotating crane and dump truck.',
      specifications: 'Includes: 1 Crane, 1 Dump Truck, 4 Mini workers, 6 Traffic cones',
      price: 3499,
      discountPercent: 20,
      recommendedAge: '3-6 years',
      categoryId: catBoys.id,
      isBestSeller: true,
      stock: 3, // LOW STOCK
      images: [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Dino Explorer T-Rex Robotic Figure',
      slug: 'dino-explorer-trex-robotic-figure',
      description: 'Interactive walking T-Rex with roaring sounds, glowing eyes, and smoke mist breathing effect.',
      specifications: 'Height: 35cm, Material: Safe PVC, Includes water dropper for mist effect',
      price: 2799,
      discountPercent: 5,
      recommendedAge: '4-8 years',
      categoryId: catBoys.id,
      isFeatured: true,
      stock: 12,
      images: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Speedway Stunt Slot Car Track',
      slug: 'speedway-stunt-slot-car-track',
      description: 'Dual lane slot car racing track with 360-degree loops, speed controllers and lap counters.',
      specifications: 'Track Length: 4.8 meters, 2 Licensed race cars included, AC adapter powered',
      price: 4999,
      discountPercent: 12,
      recommendedAge: '8+ years',
      categoryId: catBoys.id,
      stock: 0, // OUT OF STOCK
      images: [
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // GIRLS (6 Products)
    {
      name: 'Royal Princess Victorian Dollhouse',
      slug: 'royal-princess-victorian-dollhouse',
      description: '3-story wooden dollhouse with 5 rooms, balcony, working elevator and 15 miniature furniture pieces.',
      specifications: 'Dimensions: 80cm x 35cm x 115cm, FSC certified sustainable wood',
      price: 7999,
      discountPercent: 15,
      recommendedAge: '4-9 years',
      categoryId: catGirls.id,
      isFeatured: true,
      isBestSeller: true,
      stock: 10,
      images: [
        'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Little Chef Gourmet Wooden Kitchen Set',
      slug: 'little-chef-gourmet-wooden-kitchen',
      description: 'Interactive play kitchen with realistic stove burner lights, clicking knobs, microwave and cookware.',
      specifications: 'Includes 12 kitchen accessories, cookware, aprons, Dimensions: 65cm x 30cm x 88cm',
      price: 5499,
      discountPercent: 10,
      recommendedAge: '3-7 years',
      categoryId: catGirls.id,
      isNewArrival: true,
      stock: 18,
      images: [
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Sparkle & Shine Deluxe Jewelry Craft Kit',
      slug: 'sparkle-shine-deluxe-jewelry-kit',
      description: 'Over 1,200 colorful beads, charms, metallic threads, and storage case to design custom bracelets.',
      specifications: 'Non-toxic materials, 4 storage compartments, Step-by-step design book included',
      price: 1499,
      discountPercent: 0,
      recommendedAge: '6-12 years',
      categoryId: catGirls.id,
      stock: 40,
      images: [
        'https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Enchanted Unicorn Magic Plush Companion',
      slug: 'enchanted-unicorn-magic-plush',
      description: 'Super soft plush unicorn with light-up rainbow horn and relaxing lullaby melodies.',
      specifications: 'Height: 40cm, Hypoallergenic ultra-soft fabric, Washable cover',
      price: 1799,
      discountPercent: 15,
      recommendedAge: '2-6 years',
      categoryId: catGirls.id,
      isBestSeller: true,
      stock: 4, // LOW STOCK
      images: [
        'https://images.unsplash.com/photo-1558060370-d644479be6f7?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Ballerina Dreams Musical Jewelry Box',
      slug: 'ballerina-dreams-musical-jewelry-box',
      description: 'Classic wooden jewelry box with spinning ballerina figure and Swan Lake musical chime.',
      specifications: 'Velvet lining, Ring slots, Mirror lid, Dimensions: 18cm x 12cm x 10cm',
      price: 1299,
      discountPercent: 5,
      recommendedAge: '4+ years',
      categoryId: catGirls.id,
      stock: 22,
      images: [
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Fairy Tale Tea Party Ceramic Set',
      slug: 'fairy-tale-tea-party-ceramic-set',
      description: '13-piece miniature hand-painted floral ceramic tea set in a vintage carrying basket.',
      specifications: 'Food-safe ceramic, Includes teapot, 4 cups, 4 saucers, milk pitcher, sugar bowl',
      price: 2199,
      discountPercent: 0,
      recommendedAge: '5-10 years',
      categoryId: catGirls.id,
      stock: 14,
      images: [
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX (6 Products)
    {
      name: 'Smart Explorer Solar System Planetarium',
      slug: 'smart-explorer-solar-system-planetarium',
      description: 'Motorized revolving solar system model with built-in star projector and audio guide.',
      specifications: 'Includes 8 planets, sun globe, audio guide in 3 languages, STEM certified',
      price: 3299,
      discountPercent: 10,
      recommendedAge: '8-14 years',
      categoryId: catUnisex.id,
      isFeatured: true,
      isNewArrival: true,
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Master Builder 500-Piece Creative Block Set',
      slug: 'master-builder-500pc-block-set',
      description: 'Universal interlocking building bricks compatible with major brands, includes wheels & windows.',
      specifications: '500 vibrant bricks, BPA-free plastic, heavy-duty storage tub with lid',
      price: 2299,
      discountPercent: 20,
      recommendedAge: '4+ years',
      categoryId: catUnisex.id,
      isBestSeller: true,
      stock: 35,
      images: [
        'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Young Inventor Electronic Circuit Lab',
      slug: 'young-inventor-electronic-circuit-lab',
      description: 'Snap-together electronic modules to build over 100 working projects including radios and alarms.',
      specifications: 'Includes 30 modular components, color manual, 100% safe low-voltage design',
      price: 2899,
      discountPercent: 8,
      recommendedAge: '7-12 years',
      categoryId: catUnisex.id,
      isFeatured: true,
      stock: 16,
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Woodland Animals 3D Wooden Puzzle Set',
      slug: 'woodland-animals-3d-wooden-puzzle',
      description: 'Eco-friendly laser-cut wooden puzzles of 4 animals that require no glue or tools.',
      specifications: 'Made from natural plywood, non-toxic dyes, 4 puzzles per box',
      price: 1199,
      discountPercent: 0,
      recommendedAge: '5-9 years',
      categoryId: catUnisex.id,
      stock: 2, // LOW STOCK
      images: [
        'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Junior Orchestra 5-in-1 Wooden Musical Bench',
      slug: 'junior-orchestra-5in1-musical-bench',
      description: 'All-in-one musical toy featuring xylophone, cymbal, drum, scraper and triangle.',
      specifications: 'Child-safe water-based paints, FSC wooden frame, 2 wooden mallets included',
      price: 2499,
      discountPercent: 15,
      recommendedAge: '2-5 years',
      categoryId: catUnisex.id,
      stock: 19,
      images: [
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Safari World Deluxe Board Game',
      slug: 'safari-world-deluxe-board-game',
      description: 'Cooperative strategy board game where players team up to rescue endangered safari animals.',
      specifications: '2-6 players, 30-min play time, includes 3D board, wooden animal pawns',
      price: 1699,
      discountPercent: 0,
      recommendedAge: '6+ years',
      categoryId: catUnisex.id,
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        price: p.price,
        discountPercent: p.discountPercent,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        specifications: p.specifications,
        price: p.price,
        discountPercent: p.discountPercent,
        recommendedAge: p.recommendedAge,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured || false,
        isNewArrival: p.isNewArrival || false,
        isBestSeller: p.isBestSeller || false,
        images: {
          create: p.images.map((img, idx) => ({
            url: img,
            isPrimary: idx === 0,
            displayOrder: idx,
          })),
        },
        inventory: {
          create: {
            stockQuantity: p.stock,
            lowStockThreshold: 5,
          },
        },
      },
    });

    console.log(`Seeded Product: ${product.name}`);
  }

  // 5. Seed Banners
  await prisma.banner.upsert({
    where: { id: 'banner-hero-1' },
    update: {},
    create: {
      id: 'banner-hero-1',
      title: 'Magic & Wonder for Every Childhood',
      subtitle: 'Explore our curated collection of premium, safe, and educational toys.',
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80',
      ctaText: 'Explore Collection',
      ctaLink: '/products',
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.banner.upsert({
    where: { id: 'banner-hero-2' },
    update: {},
    create: {
      id: 'banner-hero-2',
      title: 'Unleash Creative Power with STEM Toys',
      subtitle: 'Get up to 20% off on all robotic & electronic builder kits this week!',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
      ctaText: 'Shop STEM Toys',
      ctaLink: '/products/unisex',
      displayOrder: 2,
      isActive: true,
    },
  });

  // 6. Seed Coupons & Promotions
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountVal: 10,
      minOrderVal: 999,
      maxDiscount: 500,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'TOYFEST200' },
    update: {},
    create: {
      code: 'TOYFEST200',
      discountType: 'FIXED',
      discountVal: 200,
      minOrderVal: 1499,
      isActive: true,
    },
  });

  // 7. Seed Sample Address for Customer 1
  const cust1Id = seededUsers['customer1'];
  if (cust1Id) {
    let addr = await prisma.address.findFirst({
      where: { userId: cust1Id, pincode: '560001' },
    });
    if (!addr) {
      addr = await prisma.address.create({
        data: {
          userId: cust1Id,
          fullName: 'Rahul Sharma',
          mobile: '9900000010',
          street: '42 Lotus Garden Apartments, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          isDefault: true,
        },
      });
    }

    // 8. Seed Sample Order for Customer 1
    const p1 = await prisma.product.findFirst({ where: { slug: 'turbo-racer-4wd-rc-buggy' } });
    if (p1) {
      await prisma.order.upsert({
        where: { orderNumber: 'ORD-2026-1001' },
        update: {},
        create: {
          orderNumber: 'ORD-2026-1001',
          userId: cust1Id,
          addressId: addr.id,
          subtotal: 2499,
          discount: 249.9,
          deliveryFee: 0,
          grandTotal: 2249.1,
          couponCode: 'WELCOME10',
          status: 'DELIVERED',
          items: {
            create: [
              {
                productId: p1.id,
                productName: p1.name,
                unitPrice: p1.price,
                quantity: 1,
                totalPrice: p1.price,
              },
            ],
          },
          statusHistory: {
            create: [
              { status: 'ORDER_PLACED', notes: 'Order placed by customer' },
              { status: 'CONFIRMED', notes: 'Payment verified' },
              { status: 'SHIPPED', notes: 'Shipped via Express Courier' },
              { status: 'DELIVERED', notes: 'Delivered successfully' },
            ],
          },
          payments: {
            create: {
              transactionId: 'TXN-99887766',
              method: 'UPI',
              status: 'COMPLETED',
              amount: 2249.1,
            },
          },
        },
      });

      const existingReview = await prisma.review.findFirst({
        where: { userId: cust1Id, productId: p1.id },
      });
      if (!existingReview) {
        await prisma.review.create({
          data: {
            userId: cust1Id,
            productId: p1.id,
            rating: 5,
            title: 'Amazing quality and speed!',
            comment: 'My son absolutely loves this RC buggy! Very sturdy build quality and super fast on lawn and gravel.',
            isApproved: true,
          },
        });
      }
    }
  }

  console.log('--- Development Database Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
