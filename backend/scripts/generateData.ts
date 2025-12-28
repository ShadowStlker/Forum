import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const usernames = ['alice', 'bob', 'carol', 'dave', 'eve']
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

  const posts = []

  // Create 20 posts distributed among users
  for (let i = 1; i <= 20; i++) {
    const author = users[(i - 1) % users.length]
    const post = await prisma.post.create({
      data: {
        title: `Post ${i} by ${author.username}`,
        body: `This is the body of post ${i}.`,
        authorId: author.id,
      },
    })
    posts.push(post)
  }

  console.log('Created posts:', posts.length)

  // Create replies
  for (const post of posts) {
    // number of replies for this post
    const replyCount = Math.floor(Math.random() * 5) + 1 // 1-5
    for (let r = 1; r <= replyCount; r++) {
      const replyAuthor = users[Math.floor(Math.random() * users.length)]
      const reply = await prisma.reply.create({
        data: {
          body: `Reply ${r} to post ${post.id}`,
          authorId: replyAuthor.id,
          postId: post.id,
        },
      })

      // optional nested reply
      if (Math.random() < 0.3) {
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
