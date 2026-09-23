import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { mergeProductTypeOptions } from '@/lib/product-types';

const MAX_TYPE_LENGTH = 100;
const MAX_SUBTYPE_LENGTH = 100;
const MAX_SUBTYPES = 100;

type ConfigInput =
  | { error: string }
  | { type: string; subTypes: string[] };

function validateConfigInput(body: unknown): ConfigInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be an object.' };
  }

  const input = body as { type?: unknown; subTypes?: unknown };
  if (typeof input.type !== 'string' || !input.type.trim()) {
    return { error: 'Type is required.' };
  }

  const type = input.type.trim();
  if (type.length > MAX_TYPE_LENGTH) {
    return { error: `Type must be ${MAX_TYPE_LENGTH} characters or fewer.` };
  }

  if (!Array.isArray(input.subTypes) || input.subTypes.length === 0) {
    return { error: 'subTypes must be a non-empty array.' };
  }
  if (input.subTypes.length > MAX_SUBTYPES) {
    return { error: `subTypes may contain at most ${MAX_SUBTYPES} items.` };
  }

  const subTypes: string[] = [];
  for (const subType of input.subTypes) {
    if (typeof subType !== 'string' || !subType.trim()) {
      return { error: 'Each subType must be a non-empty string.' };
    }
    const normalized = subType.trim();
    if (normalized.length > MAX_SUBTYPE_LENGTH) {
      return { error: `Each subType must be ${MAX_SUBTYPE_LENGTH} characters or fewer.` };
    }
    subTypes.push(normalized);
  }

  return { type, subTypes };
}

// GET product type configs (global defaults + grower's custom configs)
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    // Get global configs and grower's custom configs, then merge with code defaults.
    // This keeps API output aligned with lib/product-types.ts while preserving custom records.
    const configs = await db.productTypeConfig.findMany({
      where: {
        OR: [
          { growerId: null },
          { growerId }
        ]
      },
      orderBy: { type: 'asc' }
    });

    const merged = mergeProductTypeOptions(configs.map((config) => ({
      type: config.type,
      subTypes: config.subTypes,
    })));

    const mergedByType = new Map(merged.map((config) => [config.type, config.subTypes]));

    const normalizedConfigs = configs.map((config) => ({
      ...config,
      subTypes: mergedByType.get(config.type) || config.subTypes,
    }));

    for (const config of merged) {
      if (!normalizedConfigs.some((existing) => existing.type === config.type)) {
        normalizedConfigs.push({
          id: `default-${config.type}`,
          type: config.type,
          subTypes: config.subTypes,
          growerId: null,
          isCustom: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
        });
      }
    }

    normalizedConfigs.sort((a, b) => a.type.localeCompare(b.type));

    return NextResponse.json(normalizedConfigs, { status: 200 });
  } catch (error) {
    console.error('Error fetching product type configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create/update a custom product type config for the grower
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    const input = validateConfigInput(body);
    if ('error' in input) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }
    const { type, subTypes } = input;

    // Check if config already exists (either global or custom)
    const existing = await db.productTypeConfig.findFirst({
      where: { type, growerId: growerId }
    });

    if (existing) {
      // Update existing config
      const updated = await db.productTypeConfig.update({
        where: { id: existing.id },
        data: {
          subTypes,
          isCustom: true
        }
      });
      return NextResponse.json(updated, { status: 200 });
    } else {
      // Create new custom config
      const created = await db.productTypeConfig.create({
        data: {
          type,
          subTypes,
          growerId,
          isCustom: true
        }
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A product type config with this type already exists.' }, { status: 409 });
    }
    console.error('Error creating/updating product type config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
