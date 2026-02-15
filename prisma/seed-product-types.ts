import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_PRODUCT_TYPES = [
  {
    type: 'Flower',
    subTypes: ['By the Pound', '3.5g Jar', '7g Jar', '14g Bag', '28g Bag', 'Pre-roll (single)', 'Pre-rolls (5pk)', 'Pre-rolls (10pk)']
  },
  {
    type: 'Edibles',
    subTypes: ['Gummy (single)', 'Gummies (10pk)', 'Chocolate Bar', 'Brownie', 'Beverage (12oz)', 'Beverage (16oz)']
  },
  {
    type: 'Cartridge',
    subTypes: ['0.5g', '1g', '2g', 'Live Resin', 'Distillate']
  },
  {
    type: 'Bulk Extract',
    subTypes: ['1g', '5g', '14g', '28g']
  },
  {
    type: 'Drink',
    subTypes: ['12oz Can', '16oz Can', '4pk', '6pk']
  },
  {
    type: 'Merchandise',
    subTypes: ['T-Shirt', 'Hoodie', 'Hat', 'Sticker', 'Accessory']
  },
  {
    type: 'Prepack',
    subTypes: ['1g', '3.5g', '7g', '14g']
  },
  {
    type: 'Tincture',
    subTypes: ['30ml', '60ml']
  },
  {
    type: 'Topicals',
    subTypes: ['Balm', 'Lotion', 'Cream', 'Salve']
  },
  {
    type: 'Plant Material',
    subTypes: ['Trim', 'Shake', 'Biomass']
  },
  {
    type: 'Live Plant',
    subTypes: ['Clone', 'Seedling']
  },
  {
    type: 'Seed',
    subTypes: ['Regular (5pk)', 'Feminized (5pk)', 'Auto (5pk)']
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
      console.log(`Created: ${typeConfig.type}`)
    } else {
      console.log(`Already exists: ${typeConfig.type}`)
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
