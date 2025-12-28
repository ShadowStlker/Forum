import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function randomSentence(): string {
  const words = [
    'Artificial', 'intelligence', 'machine', 'learning', 'neural', 'networks',
    'deep', 'model', 'data', 'algorithm', 'training', 'prediction',
    'classification', 'regression', 'optimization', 'reinforcement', 'policy',
    'environment', 'state', 'action', 'reward', 'supervised', 'unsupervised',
    'feature', 'engineering', 'bias', 'fairness', 'explainability', 'deployment',
  ]
  const len = Math.floor(Math.random() * 10) + 5
  return Array.from({ length: len })
    .map(() => words[Math.floor(Math.random() * words.length)])
    .join(' ') + '.'
}

function generateParagraph(): string {
  const sentences = Array.from({ length: Math.floor(Math.random() * 3) + 2 })
    .map(() => randomSentence())
    .join(' ')
  return sentences
}

function generateBody(): string {
  return `${generateParagraph()}

${generateParagraph()}`
}

async function main() {
  // Clear existing data
  await prisma.reply.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const usernames = [
    'alice', 'bob', 'carol', 'dave', 'eve',
    'frank', 'grace', 'heidi', 'ivan', 'judy',
  ]

  const aiTopics = [
    'AI in Healthcare',
    'Machine Learning Basics',
    'Deep Learning Advances',
    'Natural Language Processing',
    'Computer Vision Trends',
    'Reinforcement Learning',
    'AI Ethics',
    'Generative Models',
    'AI for Robotics',
    'Quantum Machine Learning',
  ]

  const users = []
  for (const username of usernames) {
    const email = `${username}@example.com`
    const passwordHash = await bcrypt.hash('password', 8)
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    })
    users.push(user)
  }

  console.log('Created users:', users.map(u => u.username).join(', '))

  let topicIdx = 0
  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      const title = `${aiTopics[topicIdx % aiTopics.length]} ${i + 1}`
      const body = generateBody()
      await prisma.post.create({
        data: {
          title,
          body,
          authorId: user.id,
        },
      })
      topicIdx++
    }
  }

  console.log('Created 20 posts with AI content')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
