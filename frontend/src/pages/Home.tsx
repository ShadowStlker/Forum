import React from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import EditPostModal from '../components/EditPostModal';

interface Reply {
  id: number;
  body: string;
  author: { email: string; username: string };
  createdAt: string;
  replies?: Reply[];
}

interface Post {
  id: number;
  title: string;
  body: string;
  author: { email: string; username: string };
  createdAt: string;
  replies: Reply[];
}

function countAllReplies(replies: Reply[]): number {
  let count = 0;
  for (const reply of replies) {
    count++;
    if (reply.replies) {
      count += countAllReplies(reply.replies);
    }
  }
  return count;
}

interface ReplyComponentProps {
  reply: Reply;
  postId: number;
  isAuthenticated: boolean;
  onCreateReply: (postId: number, parentId: number | null, body: string) => Promise<void>;
  depth: number;
}

const ReplyComponent: React.FC<ReplyComponentProps> = ({ reply, postId, isAuthenticated, onCreateReply, depth }) => {
  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [replyBody, setReplyBody] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onCreateReply(postId, reply.id, replyBody);
    setReplyBody('');
    setShowReplyForm(false);
    setLoading(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-purple-800 pl-4' : ''} mb-3`}>
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-700 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-900 rounded-full flex items-center justify-center border border-purple-700">
              <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-200">{reply.author.username || reply.author.email}</span>
            <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-gray-300 mb-3">{reply.body}</p>
        <button
          onClick={() => isAuthenticated ? setShowReplyForm(!showReplyForm) : void 0}
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
          disabled={!isAuthenticated}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
          {showReplyForm ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {showReplyForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            required
            disabled={loading}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-white placeholder-gray-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                  Reply
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="text-gray-400 hover:text-gray-300 px-3 py-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-3">
          {reply.replies.map((childReply) => (
            <ReplyComponent
              key={childReply.id}
              reply={childReply}
              postId={postId}
              isAuthenticated={isAuthenticated}
              onCreateReply={onCreateReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface HomeProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const Home: React.FC<HomeProps> = ({ searchTerm, setSearchTerm }) => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  // Filter posts based on search term
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.body.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [loading, setLoading] = React.useState(true);
  const [showPostForm, setShowPostForm] = React.useState(false);
  const [postTitle, setPostTitle] = React.useState('');
  const [postBody, setPostBody] = React.useState('');
  const [mainReplyBodies, setMainReplyBodies] = React.useState<Record<number, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = React.useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));
const [currentUser, setCurrentUser] = React.useState<{ id: number; email: string; username: string } | null>(null);
const [editingPost, setEditingPost] = React.useState<any>(null);
// Editing state is handled by EditPostModal component

  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

React.useEffect(() => {
  fetchPosts();
  if (isAuthenticated) {
    api.get('/auth/profile').then(res => setCurrentUser(res.data));
  }
}, []);


  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please login to create a post');
      return;
    }
    try {
      await api.post('/posts', { title: postTitle, body: postBody });
      setPostTitle('');
      setPostBody('');
      setShowPostForm(false);
      setError(null);
      fetchPosts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleCreateReply = async (postId: number, parentId: number | null, body: string) => {
    if (!isAuthenticated) {
      setError('Please login to reply');
      return;
    }
    try {
      await api.post(`/posts/${postId}/replies`, { body, parentId });
      setError(null);
      fetchPosts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reply');
    }
  };

  const handleMainReply = async (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateReply(postId, null, mainReplyBodies[postId]);
    setMainReplyBodies((prev) => ({ ...prev, [postId]: '' }));
  };

  const togglePostExpansion = (postId: number) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

return (
  <div>
    {editingPost && (
      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={fetchPosts}
      />
    )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-red-200">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={() => isAuthenticated ? setShowPostForm(!showPostForm) : navigate('/login')}
        className="fixed bottom-6 right-8 flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-all shadow-xl hover:shadow-2xl z-50 hover:scale-105"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        {showPostForm ? 'Cancel' : 'Create New Post'}
      </button>

      {showPostForm && isAuthenticated && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create New Post</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreatePost}>
                <input
                  type="text"
                  placeholder="Post title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none mb-4 text-lg text-white placeholder-gray-500"
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-40 resize-none text-lg text-white placeholder-gray-500"
                />
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Publish Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

<div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold text-white">Recent Posts</h1>
  <input
    type="text"
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    placeholder="Search posts..."
    className="bg-gray-800 text-white border border-gray-700 rounded-md px-9 py-4 text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
  />
</div>
      {posts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700 shadow-sm mb-24">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-gray-400 text-lg">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6 pb-24">
          {filteredPosts.map((p) => (
  <div key={p.id} className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
    <div
      onClick={() => togglePostExpansion(p.id)}
      className="p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-2xl font-bold text-white flex-1">{p.title}</h2>
        <div className="flex items-center gap-2 ml-4">
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedPosts.has(p.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center border border-purple-700">
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <span className="font-medium text-gray-200">{p.author.username || p.author.email}</span>
        </div>
        <span className="text-gray-500">•</span>
        <span className="text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
        {!expandedPosts.has(p.id) && (
          <>
            <span className="text-gray-500">•</span>
            <div className="flex items-center gap-1 text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{countAllReplies(p.replies)}</span>
            </div>
          </>
        )}
        {p.author.id === currentUser?.id && (
          <button onClick={() => setEditingPost(p)} className="ml-auto text-sm text-purple-400 hover:text-purple-200">Edit</button>
        )}
      </div>
    </div>

    {expandedPosts.has(p.id) && (
      <>
        <div className="px-6 pb-4 border-t border-gray-700">
          <p className="text-gray-300 leading-relaxed">{p.body}</p>
        </div>

        <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="font-semibold text-gray-200">
              {countAllReplies(p.replies)} {countAllReplies(p.replies) === 1 ? 'Reply' : 'Replies'}
            </h3>
          </div>

          {p.replies.length > 0 && (
            <div className="mb-4">
              {p.replies.map((reply) => (
                <ReplyComponent
                  key={reply.id}
                  reply={reply}
                  postId={p.id}
                  isAuthenticated={isAuthenticated}
                  onCreateReply={handleCreateReply}
                  depth={0}
                />
              ))}
            </div>
          )}

          <form onSubmit={(e) => handleMainReply(p.id, e)} className="flex gap-2">
            <input
              type="text"
              placeholder={isAuthenticated ? "Write a reply..." : "Login to reply..."}
              value={mainReplyBodies[p.id] || ''}
              onChange={(e) => setMainReplyBodies((prev) => ({ ...prev, [p.id]: e.target.value }))}
              required
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 text-sm"
              disabled={!isAuthenticated}
            />
            <button
              type="submit"
              disabled={!isAuthenticated}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              Reply
            </button>
          </form>
        </div>
      </>
    )}
  </div>
))}
            <div key={p.id} className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div
                onClick={() => togglePostExpansion(p.id)}
                className="p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white flex-1">{p.title}</h2>
                  <div className="flex items-center gap-2 ml-4">
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedPosts.has(p.id) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center border border-purple-700">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-gray-200">{p.author.username || p.author.email}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                  {!expandedPosts.has(p.id) && (
                    <>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>{countAllReplies(p.replies)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {expandedPosts.has(p.id) && (
                <>
                  <div className="px-6 pb-4 border-t border-gray-700">
                    <p className="text-gray-300 leading-relaxed">{p.body}</p>
                  </div>

                  <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <h3 className="font-semibold text-gray-200">
                        {countAllReplies(p.replies)} {countAllReplies(p.replies) === 1 ? 'Reply' : 'Replies'}
                      </h3>
                    </div>

                    {p.replies.length > 0 && (
                      <div className="mb-4">
                        {p.replies.map((reply) => (
                          <ReplyComponent
                            key={reply.id}
                            reply={reply}
                            postId={p.id}
                            isAuthenticated={isAuthenticated}
                            onCreateReply={handleCreateReply}
                            depth={0}
                          />
                        ))}
                      </div>
                    )}

                    <form onSubmit={(e) => handleMainReply(p.id, e)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={isAuthenticated ? "Write a reply..." : "Login to reply..."}
                        value={mainReplyBodies[p.id] || ''}
                        onChange={(e) => setMainReplyBodies((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        required
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-500 text-sm"
                        disabled={!isAuthenticated}
                      />
                      <button
                        type="submit"
                        disabled={!isAuthenticated}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                        Reply
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
