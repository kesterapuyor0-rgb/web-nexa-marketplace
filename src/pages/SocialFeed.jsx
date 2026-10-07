import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
export const SocialFeed = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState("");
  const loadPosts = async () => {
    const response = await fetch("/api/feed");
    if (response.ok) setPosts((await response.json()).posts || []);
  };
  useEffect(() => {
    loadPosts();
  }, []);
  const publish = async (event) => {
    event.preventDefault();
    if (!body.trim() || !token) return;
    await fetch("/api/feed", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    setBody("");
    await loadPosts();
  };
  const like = async (id) => {
    if (!token) return;
    await fetch(`/api/feed/${id}/like`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    await loadPosts();
  };
  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">WebNexa Social</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Discover what the community is buying</h1>
      </div>
      {token && <form onSubmit={publish} className="rounded-2xl border border-zinc-800 bg-[#18181e] p-4">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Share a review, unboxing, or product tip..." className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-purple-500" />
          <button className="mt-3 inline-flex items-center gap-2 rounded-xl cta-gradient px-4 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" /> Publish post</button>
        </form>}
      {posts.map((post) => <article key={post.id} className="rounded-2xl border border-zinc-800 bg-[#18181e] p-5">
          <div className="flex items-center gap-2 text-xs text-zinc-400"><span className="font-semibold text-white">{post.handle}</span><span>•</span><span>{new Date(post.created_at).toLocaleDateString()}</span></div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{post.body}</p>
          {post.media_url && <img src={post.media_url} alt="" className="mt-4 max-h-96 w-full rounded-xl object-cover" />}
          <div className="mt-4 flex gap-4 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
            <button onClick={() => like(post.id)} className="inline-flex items-center gap-1.5 hover:text-pink-300"><Heart className="h-4 w-4" /> {post.likes_count}</button>
            <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Comments</span>
            <span className="ml-auto inline-flex items-center gap-1.5"><Video className="h-4 w-4" /> Community post</span>
          </div>
        </article>)}
    </div>;
};
