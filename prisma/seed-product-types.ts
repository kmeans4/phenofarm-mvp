import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// New product type to subtype mappings based on requirements
const DEFAULT_PRODUCT_TYPES = [
  {
    type: 'Bulk Extract',
    subTypes: ['Badder', 'Crude', 'Crumble', 'Diamonds', 'Distillate', 'Full Plant', 'Honeycomb', 'Isolate', 'Kief', 'Live Resin', 'RSO', 'Shatter', 'Sugar Wax', 'Terp Sugar', 'Terpenes', 'Water Soluble', 'Wax']
  },
  {
    type: 'Cartridge',
    subTypes: ['CO2', 'CO2 Disposable', 'Cured Resin', 'Distillate', 'Distillate Disposable', 'High Terpene', 'Inhaler', 'Live Resin', 'Pax Pods', 'Syringe']
  },
  {
    type: 'Edibles',
    subTypes: ['Brownie', 'Candy', 'Chocolate', 'Coffee', 'Condiment', 'Cookie', 'Cooking', 'Frozen', 'Gummies', 'Popcorn', 'Snack Food', 'Tablets', 'Taffy', 'Tincture']
  },
  {
    type: 'Beverages',
    subTypes: [] // No subtypes
  },
  {
    type: 'Flower',
    subTypes: ['A Bud', 'B Bud', 'C Bud', 'Infused Flower', 'Popcorn']
  },
  {
    type: 'Live Plant',
    subTypes: ['Clones', 'Seedlings', 'Starts', 'Teens', 'Tissue Culture']
  },
  {
    type: 'Plant Material',
    subTypes: ['Fresh Frozen', 'Kief', 'Shake', 'Trim', 'Untrimmed Flower', 'Whole Plant']
  },
  {
    type: 'Prepack',
    subTypes: ['A Bud', 'B Bud', 'C Bud', 'Popcorn']
  },
  {
    type: 'Preroll',
    subTypes: ['Infused', 'Trim/Shake', 'Whole Flower', 'Whole Flower Blunt', 'Whole Flower Infused']
  },
  {
    type: 'Tincture',
    subTypes: ['Broad Spectrum', 'Full Spectrum', 'Full Spectrum THC Free', 'Isolate', 'Isolate THC Free', 'THC Free']
  },
  {
    type: 'Topicals & Wellness',
    subTypes: ['Balm', 'Bath Bomb', 'Bath Salt', 'Capsules', 'Cleanser', 'Cream', 'Essential Oil', 'Lip Balm', 'Lotion', 'Lubricant', 'Mask', 'Massage Oil', 'Muscle Gel', 'Salve', 'Serum', 'Shampoo', 'Soap', 'Suppositories', 'Toner', 'Transdermal Patches']
  }
]

async function main() {
  console.log('Seeding default product types...')
  
  for (const typeConfig of DEFAULT_PRODUCT_TYPES) {
    // Check if already exists globally (growerId = null)
    const existing = await prisma.productTypeConfig.findFirst({
      where: { type: typeConfig.type, growerId: null }
    })
    
    if (!existing) {
      await prisma.productTypeConfig.create({
        data: {
          type: typeConfig.type,
          subTypes: typeConfig.subTypes,
          growerId: null, // Global default
          isCustom: false
        }
      })
      console.log(`Created: ${typeConfig.type} (${typeConfig.subTypes.length} subtypes)`)
    } else {
      // Update existing with new subtypes
      await prisma.productTypeConfig.update({
        where: { id: existing.id },
        data: {
          subTypes: typeConfig.subTypes
        }
      })
      console.log(`Updated: ${typeConfig.type} (${typeConfig.subTypes.length} subtypes)`)
    }
  }
  
  console.log('Done seeding product types!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
