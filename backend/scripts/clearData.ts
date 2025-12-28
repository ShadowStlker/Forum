import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete replies first due to foreign key constraints
  await prisma.reply.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  console.log('Database cleared')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
