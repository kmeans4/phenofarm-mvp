// Copies are unsaved forms. Stock and SKU must be reviewed for each new listing.
export function productCopyFields(source: Record<string, unknown>) {
  const text = (key: string) => source[key] == null ? '' : String(source[key]);
  return {
    name: `${text('name').slice(0, 95)} Copy`,
    productType: text('productType'), subType: text('subType'),
    strainId: text('strainId'), batchId: text('batchId'),
    price: text('price'), unit: text('unit'), inventoryQty: '0', sku: '',
    brand: text('brand'), description: text('description'), ingredients: text('ingredients'),
    thcMin: text('thcMin'), thcMax: text('thcMax'), cbdMin: text('cbdMin'), cbdMax: text('cbdMax'),
    harvestDate: text('harvestDate').slice(0, 10),
    images: Array.isArray(source.images) ? source.images.filter((image): image is string => typeof image === 'string') : [],
    isPriceVisible: source.isPriceVisible !== false, isAvailable: true, isFeatured: false,
  };
}
