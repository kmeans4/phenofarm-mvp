import { PrismaClient } from '@prisma/client'

const prismaClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
})

export default prismaClient;
