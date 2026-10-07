import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { io } from "socket.io-client";
export const Messages = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const loadMessages = async () => {
    if (!token) return;
    const response = await fetch("/api/messages", { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setMessages((await response.json()).messages || []);
  };
  useEffect(() => {
    loadMessages();
    const socket = io({ path: "/socket.io" });
    const conversationId = [token, recipientId].filter(Boolean).sort().join(":");
    socket.emit("join-conversation", conversationId);
    socket.on("message", loadMessages);
    return () => {
      socket.off("message", loadMessages);
      socket.disconnect();
    };
  }, [token]);
  const send = async (event) => {
    event.preventDefault();
    if (!token || !recipientId.trim() || !body.trim()) return;
    await fetch("/api/messages", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: recipientId, body }) });
    setBody("");
    const conversationId = [token, recipientId].filter(Boolean).sort().join(":");
    const socket = io({ path: "/socket.io" });
    socket.emit("send-message", { conversationId, body });
    socket.disconnect();
    await loadMessages();
  };
  if (!token) return <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-zinc-400">Sign in to access messages.</div>;
  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-purple-300">WebNexa Direct</p><h1 className="mt-2 text-3xl font-bold text-white">Messages</h1></div>
      <div className="rounded-2xl border border-zinc-800 bg-[#18181e] p-5">
        <div className="mb-4 flex min-h-72 flex-col gap-3">
          {messages.length === 0 ? <div className="m-auto text-center text-sm text-zinc-500"><MessageCircle className="mx-auto mb-2 h-8 w-8" />Start a conversation with a buyer or vendor.</div> : messages.map((message) => <div key={message.id} className="rounded-xl bg-zinc-900 p-3 text-sm text-zinc-200"><span>{message.body}</span><span className="ml-2 text-[10px] text-zinc-600">{new Date(message.created_at).toLocaleTimeString()}</span></div>)}
        </div>
        <form onSubmit={send} className="space-y-2 border-t border-zinc-800 pt-4">
          <input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="Recipient account ID" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-500" />
          <div className="flex gap-2"><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-500" /><button className="rounded-xl cta-gradient px-4 text-white"><Send className="h-4 w-4" /></button></div>
        </form>
      </div>
    </div>;
};
