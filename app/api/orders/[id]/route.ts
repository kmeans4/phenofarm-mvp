import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import {
  canEditOrderItems,
  canTransitionOrderStatus,
  getOrderStatusLabel,
  getInvalidOrderStatusTransitionMessage,
  isOrderStatus,
} from '@/lib/order-workflow';
import {
  claimOrder,
  syncOrderInventory,
  lockInventoryProducts,
  assertInventoryReviewed,
  OrderInventoryError,
  OrderConflictError,
} from '@/lib/order-mutations';
import { PATCH as changeStatus } from './status/route';
import { createNotification } from '@/lib/notifications';

interface OrderItemUpdateInput {
  id?: string;
  productId?: string;
  quantity: number;
  unitPrice?: number;
}

class OrderEditError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function parseMoney(value: unknown, field: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 999999.99) {
    throw new OrderEditError(`${field} must be a valid non-negative amount`);
  }
  return Math.round(amount * 100) / 100;
}

function parsePositiveQuantity(value: unknown) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    throw new OrderEditError(
      'Each item quantity must be a whole number between 1 and 9999'
    );
  }
  return quantity;
}

function normalizeItems(value: unknown): OrderItemUpdateInput[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    throw new OrderEditError('items must be an array');
  }
  if (value.length === 0) {
    throw new OrderEditError('Order must have at least one item');
  }

  const seenExistingIds = new Set<string>();

  return value.map((raw) => {
    if (!raw || typeof raw !== 'object') {
      throw new OrderEditError('Each item must be an object');
    }

    const record = raw as Record<string, unknown>;
    const id =
      typeof record.id === 'string' && record.id.trim()
        ? record.id.trim()
        : undefined;
    const productId =
      typeof record.productId === 'string' && record.productId.trim()
        ? record.productId.trim()
        : undefined;

    if (!id && !productId) {
      throw new OrderEditError(
        'Each item must include an existing item id or productId'
      );
    }

    if (id) {
      if (seenExistingIds.has(id)) {
        throw new OrderEditError('Duplicate order item ids are not allowed');
      }
      seenExistingIds.add(id);
    }

    return {
      id,
      productId,
      quantity: parsePositiveQuantity(record.quantity),
      ...(record.unitPrice !== undefined
        ? { unitPrice: parseMoney(record.unitPrice, 'Price') }
        : {}),
    };
  });
}

function buildEditResponse(error: OrderEditError) {
  return NextResponse.json(
    { error: error.message, ...(error.details || {}) },
    { status: error.status }
  );
}

// GET a single order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
    }

    const orderId = (await context.params).id;

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
      include: {
        dispensary: {
          select: {
            id: true,
            businessName: true,
            contactName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                productType: true,
                inventoryQty: true,
                isAvailable: true,
                isDeleted: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof OrderConflictError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT update an order
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
    }

    const orderId = (await context.params).id;

    const existingOrder = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
      include: {
        dispensary: { select: { userId: true } },
        items: {
          include: {
            acceptedQuote: { select: { id: true, quantity: true } },
            product: {
              select: {
                id: true,
                name: true,
                inventoryQty: true,
                isAvailable: true,
                isDeleted: true,
              },
            },
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, shippedAt } = body;
    const requestedItems = normalizeItems(body.items);
    const requestedShippingFee =
      body.shippingFee !== undefined
        ? parseMoney(body.shippingFee, 'shippingFee')
        : Number(existingOrder.shippingFee);
    const requestedTax =
      body.tax !== undefined
        ? parseMoney(body.tax, 'tax')
        : Number(existingOrder.tax);

    if (
      notes !== undefined &&
      (typeof notes !== 'string' || notes.length > 1000)
    ) {
      throw new OrderEditError('Notes must be less than 1000 characters');
    }

    if (status !== undefined && !isOrderStatus(status)) {
      throw new OrderEditError('Invalid status');
    }

    if (status && !canTransitionOrderStatus(existingOrder.status, status)) {
      return NextResponse.json(
        {
          error: getInvalidOrderStatusTransitionMessage(
            existingOrder.status,
            status
          ),
        },
        { status: 400 }
      );
    }

    if (status && status !== existingOrder.status)
      throw new OrderEditError(
        'Use the order status action to change status.',
        400
      );
    const existingItemsById = new Map(
      existingOrder.items.map((item) => [item.id, item])
    );
    const existingIds = new Set(existingItemsById.keys());
    const requestedExistingIds = new Set(
      requestedItems
        ?.filter((item) => item.id)
        .map((item) => item.id as string) || []
    );
    const removedItems = requestedItems
      ? existingOrder.items.filter((item) => !requestedExistingIds.has(item.id))
      : [];

    if (requestedItems) {
      const quotedQuantities = new Map<
        string,
        { quantity: number; cap: number | null }
      >();
      for (const item of requestedItems) {
        if (item.id && !existingItemsById.has(item.id)) {
          throw new OrderEditError(
            'One or more edited items do not belong to this order',
            403
          );
        }

        const existingItem = item.id ? existingItemsById.get(item.id) : null;
        if (existingItem?.acceptedQuote) {
          const quote = existingItem.acceptedQuote;
          quotedQuantities.set(quote.id, {
            quantity:
              (quotedQuantities.get(quote.id)?.quantity || 0) + item.quantity,
            cap: quote.quantity,
          });
        }
        if (
          existingItem &&
          item.productId &&
          item.productId !== existingItem.productId
        ) {
          throw new OrderEditError(
            'Changing the product on an existing request line is not supported. Remove the line and add a new one instead.'
          );
        }
      }
      // An accepted offer covers the combined quantity, including split lines for one product.
      for (const { quantity, cap } of quotedQuantities.values()) {
        if (cap !== null && quantity > cap)
          throw new OrderEditError(
            `This accepted quote covers up to ${cap} units. Send a new quote for a larger quantity.`,
            409
          );
      }
    }

    const hasLineChanges = requestedItems
      ? requestedItems.length !== existingOrder.items.length ||
        requestedItems.some((item) => {
          if (!item.id || !existingIds.has(item.id)) return true;
          const existingItem = existingItemsById.get(item.id);
          return (
            !existingItem ||
            existingItem.quantity !== item.quantity ||
            (item.unitPrice !== undefined &&
              item.unitPrice !== Number(existingItem.unitPrice))
          );
        }) ||
        removedItems.length > 0
      : false;

    const hasPricingChanges =
      requestedShippingFee !== Number(existingOrder.shippingFee) ||
      requestedTax !== Number(existingOrder.tax);

    if (
      (hasLineChanges || hasPricingChanges) &&
      !canEditOrderItems(existingOrder.status)
    ) {
      throw new OrderEditError(
        'Items, shipping, and tax can only be edited before a request is ready, delivered, or cancelled.',
        409
      );
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      await claimOrder(tx, existingOrder);
      if (requestedItems) {
        assertInventoryReviewed(existingOrder);
        await lockInventoryProducts(tx, [
          ...existingOrder.items.map((item) => item.productId),
          ...requestedItems.flatMap((item) =>
            item.productId ? [item.productId] : []
          ),
        ]);
      }

      let subtotal = existingOrder.items.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      );

      if (requestedItems) {
        for (const item of removedItems) {
          await tx.orderItem.delete({ where: { id: item.id } });
        }

        for (const item of requestedItems) {
          if (item.id) {
            const existingItem = existingItemsById.get(item.id)!;
            // Existing agreed prices are immutable snapshots; quantity edits cannot reprice a line.
            const unitPrice = item.unitPrice ?? Number(existingItem.unitPrice);
            if (
              existingItem.acceptedQuoteId &&
              unitPrice !== Number(existingItem.unitPrice)
            )
              throw new OrderEditError(
                'An accepted quote price cannot be changed. Send a new quote instead.',
                409
              );
            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                unitPrice,
                ...(unitPrice !== Number(existingItem.unitPrice)
                  ? {
                      catalogUnitPrice:
                        existingItem.catalogUnitPrice ?? existingItem.unitPrice,
                      priceOverrideReason: 'Agreed price updated by grower',
                    }
                  : {}),
                totalPrice: Math.round(item.quantity * unitPrice * 100) / 100,
              },
            });
          } else {
            const productId = item.productId!;
            const product = await tx.product.findFirst({
              where: {
                id: productId,
                growerId: user.growerId,
                isDeleted: false,
              },
              select: {
                id: true,
                name: true,
                inventoryQty: true,
                isAvailable: true,
              },
            });

            if (!product)
              throw new OrderEditError(
                'This product is no longer available.',
                409
              );

            // Price is an agreed snapshot. Stock accounting follows all item edits atomically.
            const pricedProduct = await tx.product.findUniqueOrThrow({
              where: { id: productId },
              select: { price: true },
            });
            const unitPrice = item.unitPrice ?? Number(pricedProduct.price);
            await tx.orderItem.create({
              data: {
                orderId,
                productId,
                growerId: user.growerId!,
                quantity: item.quantity,
                unitPrice,
                catalogUnitPrice: Number(pricedProduct.price),
                priceOverrideReason:
                  unitPrice !== Number(pricedProduct.price)
                    ? 'Agreed price set by grower'
                    : null,
                totalPrice: Math.round(item.quantity * unitPrice * 100) / 100,
              },
            });
          }
        }

        const refreshedItems = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true, unitPrice: true },
        });
        await syncOrderInventory(
          tx,
          existingOrder,
          existingOrder.items,
          refreshedItems,
          existingOrder.status
        );
        subtotal = refreshedItems.reduce((sum, item) => {
          return (
            sum + Math.round(item.quantity * Number(item.unitPrice) * 100) / 100
          );
        }, 0);
      }

      const shippedAtValue =
        shippedAt !== undefined
          ? new Date(shippedAt)
          : status === 'SHIPPED' && !existingOrder.shippedAt
            ? new Date()
            : existingOrder.shippedAt;

      if (shippedAtValue && Number.isNaN(shippedAtValue.getTime())) {
        throw new OrderEditError('shippedAt must be a valid date');
      }

      const deliveredAtValue =
        status === 'DELIVERED' && !existingOrder.deliveredAt
          ? new Date()
          : existingOrder.deliveredAt;

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          updatedAt: new Date(
            Math.max(Date.now(), existingOrder.updatedAt.getTime() + 1)
          ),
          status: status || existingOrder.status,
          notes: notes !== undefined ? notes : existingOrder.notes,
          shippedAt: shippedAtValue,
          deliveredAt: deliveredAtValue,
          shippingFee: requestedShippingFee,
          tax: requestedTax,
          subtotal,
          totalAmount:
            Math.round((subtotal + requestedShippingFee + requestedTax) * 100) /
            100,
        },
        include: {
          dispensary: {
            select: {
              id: true,
              businessName: true,
              contactName: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              zip: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  productType: true,
                  inventoryQty: true,
                  isAvailable: true,
                  isDeleted: true,
                },
              },
            },
          },
        },
      });

      if (status && status !== existingOrder.status) {
        await tx.orderStatusEvent.create({
          data: {
            orderId,
            fromStatus: existingOrder.status,
            toStatus: status,
            actorUserId: user.id,
            actorRole: 'GROWER',
          },
        });
        await createNotification(tx, {
          userId: existingOrder.dispensary.userId,
          type: 'ORDER_STATUS_CHANGED',
          title: `Request ${getOrderStatusLabel(status).toLowerCase()}`,
          body: `Request #${existingOrder.orderId} is now ${getOrderStatusLabel(status)}.`,
          href: `/dispensary/orders/${existingOrder.id}`,
        });
      }

      return updated;
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    if (error instanceof OrderConflictError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof OrderEditError) {
      return buildEditResponse(error);
    }

    if (error instanceof OrderInventoryError) {
      return NextResponse.json(
        { error: error.message, code: error.code, issues: error.issues },
        { status: 409 }
      );
    }

    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Keep the legacy DELETE route compatible while retaining the order and its audit trail.
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session)
    return NextResponse.json(
      { error: 'Please sign in to continue.' },
      { status: 401 }
    );
  if (session.user.role !== 'GROWER' || !session.user.growerId)
    return NextResponse.json(
      { error: 'Your account does not have access to this action.' },
      { status: 403 }
    );
  return changeStatus(
    new NextRequest(request.url, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'CANCELLED',
        reason: 'Cancelled by grower',
      }),
    }),
    context
  );
}
