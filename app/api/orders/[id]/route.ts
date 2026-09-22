import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import {
  canTransitionOrderStatus,
  getOrderStatusLabel,
  getInvalidOrderStatusTransitionMessage,
  isOrderStatus,
  type OrderStatusValue,
} from '@/lib/order-workflow';
import { claimOrder, restoreInventory, OrderConflictError } from '@/lib/order-mutations';
import { PATCH as changeStatus } from './status/route';
import { createNotification } from '@/lib/notifications';

interface OrderItemUpdateInput {
  id?: string;
  productId?: string;
  quantity: number;
}

interface InventoryIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

class OrderEditError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

class InventoryConflictError extends Error {
  issues: InventoryIssue[];

  constructor(issues: InventoryIssue[]) {
    super('Insufficient inventory for one or more edited items');
    this.issues = issues;
  }
}

const ITEM_EDITABLE_STATUSES = new Set<OrderStatusValue>(['PENDING', 'CONFIRMED', 'PROCESSING']);

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
    throw new OrderEditError('Each item quantity must be a whole number between 1 and 9999');
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
    const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : undefined;
    const productId = typeof record.productId === 'string' && record.productId.trim()
      ? record.productId.trim()
      : undefined;

    if (!id && !productId) {
      throw new OrderEditError('Each item must include an existing item id or productId');
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderId = (await context.params).id;

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        growerId: user.growerId,
      },
      include: {
        dispensary: { select: { id: true, businessName: true, contactName: true, phone: true, address: true, city: true, state: true, zip: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true, productType: true, inventoryQty: true, isAvailable: true, isDeleted: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof OrderConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
            product: { select: { id: true, name: true, inventoryQty: true, isAvailable: true, isDeleted: true } },
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
    const requestedShippingFee = body.shippingFee !== undefined
      ? parseMoney(body.shippingFee, 'shippingFee')
      : Number(existingOrder.shippingFee);
    const requestedTax = body.tax !== undefined
      ? parseMoney(body.tax, 'tax')
      : Number(existingOrder.tax);

    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 1000)) {
      throw new OrderEditError('Notes must be less than 1000 characters');
    }

    if (status !== undefined && !isOrderStatus(status)) {
      throw new OrderEditError('Invalid status');
    }

    if (status && !canTransitionOrderStatus(existingOrder.status, status)) {
      return NextResponse.json({
        error: getInvalidOrderStatusTransitionMessage(existingOrder.status, status),
      }, { status: 400 });
    }

    const isCancellation = status === 'CANCELLED' && existingOrder.status !== 'CANCELLED';
    const existingItemsById = new Map(existingOrder.items.map((item) => [item.id, item]));
    const existingIds = new Set(existingItemsById.keys());
    const requestedExistingIds = new Set(requestedItems?.filter((item) => item.id).map((item) => item.id as string) || []);
    const removedItems = requestedItems
      ? existingOrder.items.filter((item) => !requestedExistingIds.has(item.id))
      : [];

    if (requestedItems) {
      for (const item of requestedItems) {
        if (item.id && !existingItemsById.has(item.id)) {
          throw new OrderEditError('One or more edited items do not belong to this order', 403);
        }

        const existingItem = item.id ? existingItemsById.get(item.id) : null;
        if (existingItem && item.productId && item.productId !== existingItem.productId) {
          throw new OrderEditError('Changing the product on an existing request line is not supported. Remove the line and add a new one instead.');
        }
      }
    }

    const hasLineChanges = requestedItems
      ? requestedItems.length !== existingOrder.items.length ||
        requestedItems.some((item) => {
          if (!item.id || !existingIds.has(item.id)) return true;
          const existingItem = existingItemsById.get(item.id);
          return !existingItem ||
            existingItem.quantity !== item.quantity;
        }) ||
        removedItems.length > 0
      : false;

    const hasPricingChanges =
      requestedShippingFee !== Number(existingOrder.shippingFee) ||
      requestedTax !== Number(existingOrder.tax);

    if ((hasLineChanges || hasPricingChanges) && !ITEM_EDITABLE_STATUSES.has(existingOrder.status as OrderStatusValue)) {
      throw new OrderEditError(
        'Items, shipping, and tax can only be edited before a request is ready, delivered, or cancelled.',
        409
      );
    }

    if (isCancellation && (hasLineChanges || hasPricingChanges)) {
      throw new OrderEditError('Cancel the request separately before making item or pricing edits.', 409);
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      await claimOrder(tx, existingOrder);
      if (isCancellation) {
        // Return the inventory that was reserved when the request was created
        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await restoreInventory(tx, item.productId, item.quantity);
        }
      }

      let subtotal = existingOrder.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      if (requestedItems && !isCancellation) {
        for (const item of removedItems) {
          await restoreInventory(tx, item.productId, item.quantity);
          await tx.orderItem.delete({ where: { id: item.id } });
        }

        for (const item of requestedItems) {
          if (item.id) {
            const existingItem = existingItemsById.get(item.id)!;
            // Existing agreed prices are immutable snapshots; quantity edits cannot reprice a line.
            const unitPrice = Number(existingItem.unitPrice);
            const quantityDelta = item.quantity - existingItem.quantity;

            if (quantityDelta > 0) {
              const updateResult = await tx.product.updateMany({
                where: {
                  id: existingItem.productId,
                  growerId: user.growerId,
                  isDeleted: false,
                  isAvailable: true,
                  inventoryQty: { gte: quantityDelta },
                },
                data: { inventoryQty: { decrement: quantityDelta } },
              });

              if (updateResult.count === 0) {
                const latest = await tx.product.findFirst({
                  where: { id: existingItem.productId, growerId: user.growerId },
                  select: { id: true, name: true, inventoryQty: true },
                });
                throw new InventoryConflictError([{
                  productId: existingItem.productId,
                  productName: latest?.name || existingItem.product?.name || 'Unknown product',
                  requested: quantityDelta,
                  available: Number(latest?.inventoryQty || 0),
                }]);
              }
            } else if (quantityDelta < 0) {
              await restoreInventory(tx, existingItem.productId, Math.abs(quantityDelta));
            }

            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                unitPrice,
                totalPrice: Math.round(item.quantity * unitPrice * 100) / 100,
              },
            });
          } else {
            const productId = item.productId!;
            const product = await tx.product.findFirst({
              where: { id: productId, growerId: user.growerId, isDeleted: false },
              select: { id: true, name: true, price: true, inventoryQty: true, isAvailable: true },
            });

            if (!product || !product.isAvailable || product.inventoryQty < item.quantity) {
              throw new InventoryConflictError([{
                productId,
                productName: product?.name || 'Unknown product',
                requested: item.quantity,
                available: Number(product?.inventoryQty || 0),
              }]);
            }

            const unitPrice = Number(product.price);
            const updateResult = await tx.product.updateMany({
              where: {
                id: productId,
                growerId: user.growerId,
                isDeleted: false,
                isAvailable: true,
                inventoryQty: { gte: item.quantity },
              },
              data: { inventoryQty: { decrement: item.quantity } },
            });

            if (updateResult.count === 0) {
              const latest = await tx.product.findFirst({
                where: { id: productId, growerId: user.growerId },
                select: { id: true, name: true, inventoryQty: true },
              });
              throw new InventoryConflictError([{
                productId,
                productName: latest?.name || product.name,
                requested: item.quantity,
                available: Number(latest?.inventoryQty || 0),
              }]);
            }

            await tx.orderItem.create({
              data: {
                orderId,
                productId,
                growerId: user.growerId!,
                quantity: item.quantity,
                unitPrice,
                catalogUnitPrice: unitPrice,
                totalPrice: Math.round(item.quantity * unitPrice * 100) / 100,
              },
            });
          }
        }

        const refreshedItems = await tx.orderItem.findMany({
          where: { orderId },
          select: { quantity: true, unitPrice: true },
        });
        subtotal = refreshedItems.reduce((sum, item) => {
          return sum + Math.round(item.quantity * Number(item.unitPrice) * 100) / 100;
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
          status: status || existingOrder.status,
          notes: notes !== undefined ? notes : existingOrder.notes,
          shippedAt: shippedAtValue,
          deliveredAt: deliveredAtValue,
          shippingFee: requestedShippingFee,
          tax: requestedTax,
          subtotal,
          totalAmount: Math.round((subtotal + requestedShippingFee + requestedTax) * 100) / 100,
        },
        include: {
          dispensary: { select: { id: true, businessName: true, contactName: true, phone: true, address: true, city: true, state: true, zip: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, unit: true, productType: true, inventoryQty: true, isAvailable: true, isDeleted: true } },
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
    if (error instanceof OrderConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof OrderEditError) {
      return buildEditResponse(error);
    }

    if (error instanceof InventoryConflictError) {
      return NextResponse.json(
        { error: error.message, issues: error.issues },
        { status: 409 }
      );
    }

    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Keep the legacy DELETE route compatible while retaining the order and its audit trail.
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'GROWER' || !session.user.growerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return changeStatus(new NextRequest(request.url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) }), context);
}
