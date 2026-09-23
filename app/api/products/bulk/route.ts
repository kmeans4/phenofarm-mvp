import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import { productImportTemplateCsv, validateProductImport } from '@/lib/product-import';
import { validateCsvImportFile } from '@/lib/upload-validation';
import { canCreateListings, FREE_LISTING_LIMIT_MESSAGE, getGrowerPlanLimits } from '@/lib/plans';

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

    const formData = await request.formData();
    const csvFile = formData.get('file');
    const dryRun = formData.get('dryRun') === 'true';

    if (!(csvFile instanceof File)) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const fileValidation = validateCsvImportFile(csvFile);
    if (!fileValidation.ok) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    const csvContent = await csvFile.text();
    const validation = validateProductImport(csvContent);

    const [growerPlan, listingCount] = await Promise.all([
      db.grower.findUnique({
        where: { id: user.growerId },
        select: { subscriptionPlan: true, subscriptionStatus: true },
      }),
      db.product.count({ where: { growerId: user.growerId, isDeleted: false } }),
    ]);
    const limits = getGrowerPlanLimits(growerPlan);
    if (!limits.csvImport) {
      return NextResponse.json(
        { error: 'CSV import is available on Pro and Business plans', code: 'PLAN_UPGRADE_REQUIRED', upgradeHref: '/grower/pricing' },
        { status: 402 }
      );
    }

    if (!canCreateListings(growerPlan, listingCount, validation.records.length)) {
      return NextResponse.json(
        { error: FREE_LISTING_LIMIT_MESSAGE, code: 'PLAN_LIMIT_REACHED', upgradeHref: '/grower/pricing' },
        { status: 402 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        success: validation.errors.length === 0,
        dryRun: true,
        totalRows: validation.totalRows,
        validRows: validation.records.length,
        errorRows: new Set(validation.errors.map((item) => item.row)).size,
        records: validation.records.map((record, index) => ({ row: index + 2, action: 'create', name: record.name, productType: record.productType, price: record.price })),
        errors: validation.errors,
      }, { status: validation.errors.length ? 422 : 200 });
    }

    if (validation.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Product import has row errors. Fix the CSV and upload again.',
        totalRows: validation.totalRows,
        validRows: validation.records.length,
        errorRows: new Set(validation.errors.map((item) => item.row)).size,
        errors: validation.errors,
      }, { status: 422 });
    }

    const createdProducts = await db.$transaction(async (tx) => {
      const strainIds = new Map<string, string>();
      for (const strainName of new Set(validation.records.map((record) => record.strainName).filter(Boolean) as string[])) {
        const strain = await tx.strain.upsert({
          where: { growerId_name: { growerId: user.growerId!, name: strainName } },
          update: {},
          create: { growerId: user.growerId!, name: strainName },
          select: { id: true },
        });
        strainIds.set(strainName, strain.id);
      }

      return tx.product.createMany({
        data: validation.records.map((record) => ({
          growerId: user.growerId!,
          name: record.name,
          productType: record.productType,
          subType: record.subType,
          strainId: record.strainName ? strainIds.get(record.strainName) : null,
          thcMin: record.thcMin,
          thcMax: record.thcMax,
          cbdMin: record.cbdMin,
          cbdMax: record.cbdMax,
          price: record.price,
          inventoryQty: record.inventoryQty,
          unit: record.unit,
          description: record.description,
          images: record.images,
          isAvailable: record.inventoryQty > 0 ? record.isAvailable : false,
          isPriceVisible: record.isPriceVisible,
          sku: record.sku,
          brand: record.brand,
          isDeleted: false,
        })),
      });
    });

    return NextResponse.json({
      success: true,
      totalRows: validation.totalRows,
      successCount: createdProducts.count,
      errorCount: 0,
      errors: [],
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');

    if (!session && !template) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (template === 'true') {
      return new NextResponse(productImportTemplateCsv(), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=product-template.csv',
        },
      });
    }

    return NextResponse.json({ error: 'Template not specified' }, { status: 400 });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
