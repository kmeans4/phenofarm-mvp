import { db } from '@/lib';

export async function seedDatabase() {
  try {
    // Create sample grower
    const grower = await db.grower.upsert({
      where: { userId: 'grower-001' },
      update: {},
      create: {
        id: 'grower-001',
        userId: 'grower-001',
        businessName: 'Vermont Nurseries',
        licenseNumber: 'VT-GWL-2024-001',
        phone: '(802) 555-0123',
        address: '123 Green Valley Rd',
        city: 'Bristol',
        state: 'VT',
        zip: '05443',
        website: 'https://vermontnurseries.com',
        description: 'Premium cannabis products grown with care in Vermont',
      },
    });

    // Create grower user
    await db.user.upsert({
      where: { email: 'grower@vtnurseries.com' },
      update: {
        growerId: grower.id,
      },
      create: {
        id: grower.id,
        email: 'grower@vtnurseries.com',
        name: 'John Green',
        role: 'GROWER',
        growerId: grower.id,
      },
    });

    // Create sample dispensary
    const dispensary = await db.dispensary.upsert({
      where: { userId: 'dispensary-001' },
      update: {},
      create: {
        id: 'dispensary-001',
        userId: 'dispensary-001',
        businessName: 'Green Vermont Dispensary',
        licenseNumber: 'VT-RTL-2024-001',
        phone: '(802) 555-0145',
        address: '456 Market Street',
        city: 'Burlington',
        state: 'VT',
        zip: '05401',
        website: 'https://greenvermontdispensary.com',
        description: ' Vermont\'s premier cannabis retail destination',
      },
    });

    // Create dispensary user
    await db.user.upsert({
      where: { email: 'dispensary@greenvermont.com' },
      update: {
        dispensaryId: dispensary.id,
      },
      create: {
        id: dispensary.id,
        email: 'dispensary@greenvermont.com',
        name: 'Sarah Cannabis',
        role: 'DISPENSARY',
        dispensaryId: dispensary.id,
      },
    });

    // Create sample products
    const product1 = await db.product.upsert({
      where: { id: 'product-001' },
      update: {},
      create: {
        id: 'product-001',
        growerId: grower.id,
        name: 'Purple Haze Flowers',
        strainLegacy: 'Purple Haze',
        categoryLegacy: 'Flowers',
        thcLegacy: 22,
        cbdLegacy: 0.5,
        price: 25,
        inventoryQty: 100,
        unit: 'gram',
        description: 'Indica-dominant hybrid with notes of grape and spice',
        images: ['/products/purple-haze.jpg'],
        isAvailable: true,
      },
    });

    const product2 = await db.product.upsert({
      where: { id: 'product-002' },
      update: {},
      create: {
        id: 'product-002',
        growerId: grower.id,
        name: 'Silver Haze Concentrates',
        strainLegacy: 'Silver Haze',
        categoryLegacy: 'Concentrates',
        thcLegacy: 85,
        cbdLegacy: 0.2,
        price: 60,
        inventoryQty: 50,
        unit: 'gram',
        description: 'High-potency live resin concentrate',
        images: ['/products/silver-haze.jpg'],
        isAvailable: true,
      },
    });

    const product3 = await db.product.upsert({
      where: { id: 'product-003' },
      update: {},
      create: {
        id: 'product-003',
        growerId: grower.id,
        name: 'Artisan Edibles Assortment',
        strainLegacy: 'Assorted',
        categoryLegacy: 'Edibles',
        thcLegacy: 100,
        cbdLegacy: 0,
        price: 45,
        inventoryQty: 30,
        unit: 'piece',
        description: 'Premium THC gummies and chocolates',
        images: ['/products/edibles.jpg'],
        isAvailable: true,
      },
    });

    // Create sample orders
    const now = new Date();
    const twoDaysAgo = new Date(now.setDate(now.getDate() - 2));
    const fiveDaysAgo = new Date(now.setDate(now.getDate() - 3));
    const tenDaysAgo = new Date(now.setDate(now.getDate() - 5));

    const order1 = await db.order.upsert({
      where: { id: 'order-001' },
      update: {},
      create: {
        id: 'order-001',
        orderId: 'PO-2024-001',
        growerId: grower.id,
        dispensaryId: dispensary.id,
        status: 'DELIVERED' as const,
        totalAmount: 275,
        subtotal: 250,
        tax: 25,
        shippingFee: 0,
        createdAt: tenDaysAgo,
      },
    });

    await db.orderItem.upsert({
      where: { id: 'order-item-001' },
      update: {},
      create: {
        id: 'order-item-001',
        orderId: order1.id,
        productId: product1.id,
        growerId: grower.id,
        quantity: 10,
        unitPrice: 25,
        totalPrice: 250,
      },
    });

    const order2 = await db.order.upsert({
      where: { id: 'order-002' },
      update: {},
      create: {
        id: 'order-002',
        orderId: 'PO-2024-002',
        growerId: grower.id,
        dispensaryId: dispensary.id,
        status: 'PENDING' as const,
        totalAmount: 180,
        subtotal: 165,
        tax: 15,
        shippingFee: 0,
        createdAt: fiveDaysAgo,
      },
    });

    await db.orderItem.upsert({
      where: { id: 'order-item-002' },
      update: {},
      create: {
        id: 'order-item-002',
        orderId: order2.id,
        productId: product2.id,
        growerId: grower.id,
        quantity: 3,
        unitPrice: 60,
        totalPrice: 180,
      },
    });

    const order3 = await db.order.upsert({
      where: { id: 'order-003' },
      update: {},
      create: {
        id: 'order-003',
        orderId: 'PO-2024-003',
        growerId: grower.id,
        dispensaryId: dispensary.id,
        status: 'PROCESSING' as const,
        totalAmount: 450,
        subtotal: 410,
        tax: 40,
        shippingFee: 0,
        createdAt: twoDaysAgo,
      },
    });

    await db.orderItem.upsert({
      where: { id: 'order-item-003' },
      update: {},
      create: {
        id: 'order-item-003',
        orderId: order3.id,
        productId: product3.id,
        growerId: grower.id,
        quantity: 10,
        unitPrice: 45,
        totalPrice: 450,
      },
    });

    // Create sample Metrc sync logs
    await db.metrcSyncLog.create({
      data: {
        id: 'metrc-log-001',
        growerId: grower.id,
        recordsSynced: 25,
        success: true,
        createdAt: new Date(),
      },
    });

    console.log('✅ Database seeded successfully');
    console.log('Grower: grower@vtnurseries.com / password123');
    console.log('Dispensary: dispensary@greenvermont.com / password123');
    console.log('Products: 3 products created');
    console.log('Orders: 3 orders created');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
