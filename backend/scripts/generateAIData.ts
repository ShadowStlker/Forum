import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const usernames = [
    'alice', 'bob', 'carol', 'dave', 'eve',
    'frank', 'grace', 'heidi', 'ivan', 'judy'
  ]

  const users = []

  // Create users
  for (const username of usernames) {
    const email = `${username}@example.com`
    const passwordHash = await bcrypt.hash('password', 8)
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, username, passwordHash },
    })
    users.push(user)
  }

  console.log('Created users:', users.map(u => u.username))

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

  const posts = []

  // Create 2 posts per user
  let topicIndex = 0
  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      const title = `${aiTopics[topicIndex % aiTopics.length]} ${i + 1}`
      const body = `Discussion on ${aiTopics[topicIndex % aiTopics.length]}. This post covers some key concepts and recent developments.`
      const post = await prisma.post.create({
        data: {
          title,
          body,
          authorId: user.id,
        },
      })
      posts.push(post)
      topicIndex++
    }
  }

  console.log('Created posts:', posts.length)

  // Generate replies
  for (const post of posts) {
    const replyCount = Math.floor(Math.random() * 4) + 1 // 1-4 replies
    for (let r = 1; r <= replyCount; r++) {
      const replyAuthor = users[Math.floor(Math.random() * users.length)]
      const reply = await prisma.reply.create({
        data: {
          body: `Reply ${r} to ${post.title}`,
          authorId: replyAuthor.id,
          postId: post.id,
        },
      })

      // optional nested reply
      if (Math.random() < 0.2) {
        const nestedAuthor = users[Math.floor(Math.random() * users.length)]
        await prisma.reply.create({
          data: {
            body: `Nested reply to reply ${reply.id}`,
            authorId: nestedAuthor.id,
            postId: post.id,
            parentId: reply.id,
          },
        })
      }
    }
  }

  console.log('Created replies')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
