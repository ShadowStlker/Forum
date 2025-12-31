import express, { Request, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validatePost, validationErrorHandler, validateReply } from '../middleware/validation';
import { sanitizeInput } from '../middleware/sanitize';
import prisma from '../db';

const router = express.Router();

// Recursive function to fetch replies with nested replies
async function fetchRepliesWithChildren(parentId: number | null, postId: number, depth: number = 0): Promise<any[]> {
  const maxDepth = 10;
  if (depth > maxDepth) return [];
  
  const replies = await prisma.reply.findMany({
    where: {
      postId,
      parentId,
    },
    include: {
      author: { select: { email: true, username: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  
  // Add safety check to prevent infinite recursion
  if (replies.length === 0) return [];
  
  for (const reply of replies) {
    const children = await fetchRepliesWithChildren(reply.id, postId, depth + 1);
    (reply as any).replies = children;
  }
  
  return replies;
}

// Get all posts
router.get('/', async (_req, res) => {
  try {
    console.log('Fetching posts...');
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, email: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    for (const post of posts) {
      console.log(`Fetching replies for post ${post.id}...`);
      const replies = await fetchRepliesWithChildren(null, post.id);
      (post as any).replies = replies;
      (post as any).authorId = post.authorId; // expose authorId for client
    }
    
    console.log(`Successfully fetched ${posts.length} posts`);
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// Edit a post – only owner can edit
router.put('/:id', authMiddleware, validatePost, validationErrorHandler, sanitizeInput(['title', 'body']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, body } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const updated = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, body },
      include: { author: { select: { email: true, username: true } } },
    });
    console.log(`Successfully updated post ${id}`);
    res.json(updated);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Create a new post (requires auth)
router.post('/', authMiddleware, validatePost, validationErrorHandler, sanitizeInput(['title', 'body']), async (req: AuthRequest, res: Response) => {
  const { title, body } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body required' });
  }
  if (title.length > 255 || body.length > 5000) {
    return res.status(400).json({ message: 'Title or body too long' });
  }
  try {
    const post = await prisma.post.create({
      data: {
        title,
        body,
        authorId: req.user.id,
      },
      include: { author: { select: { email: true, username: true } } },
    });
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Failed to create post', error: err });
  }
});

// Create a reply to a post or another reply (requires auth)
router.post('/:id/replies', authMiddleware, validateReply, validationErrorHandler, sanitizeInput(['body']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { body, parentId } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!body) {
    return res.status(400).json({ message: 'Reply body required' });
  }
  if (body.length > 5000) {
    return res.status(400).json({ message: 'Reply too long' });
  }
  
  // Validate parentId
  if (parentId && (isNaN(parseInt(parentId)) || parseInt(parentId) <= 0)) {
    return res.status(400).json({ message: 'Invalid parentId' });
  }
  
  try {
    const reply = await prisma.reply.create({
      data: {
        body,
        authorId: req.user.id,
        postId: parseInt(id),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: { author: { select: { email: true, username: true } } },
    });
    res.status(201).json(reply);
  } catch (err) {
    console.error('Error creating reply:', err);
    res.status(500).json({ message: 'Failed to create reply', error: err });
  }
});

// Edit a post – only owner can edit
router.put('/:id', authMiddleware, validatePost, validationErrorHandler, sanitizeInput(['title', 'body']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, body } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const updated = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, body },
      include: { author: { select: { email: true, username: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update post' });
  }
});

export default router;
