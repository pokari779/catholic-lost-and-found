"use client";

import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
type DemoAccount = "me" | "userA" | "userB";

const accountLabels: Record<DemoAccount, string> = {
  me: "내 계정",
  userA: "문의자 A",
  userB: "문의자 B"
};
type Post = {
  id: number;
  type: "분실" | "습득";
  name: string;
  category: string;
  place: string;
  date: string;
  detail: string;
  solved?: boolean;
  image?: string;
  ownerId?: "me" | "userA" | "userB";
  authorName?: string;
};

type ChatMessage = {
  id: number;
  sender: DemoAccount | "other";
  text: string;
  time: string;
  readBy?: DemoAccount[];
};

type ChatMap = Record<string, ChatMessage[]>;

const samples: Post[] = [
  { id: 1, type: "습득", name: "검은색 에어팟 케이스", category: "전자기기", place: "중앙도서관", date: "2026-11-05", detail: "열람실 근처에서 발견했어요.", authorName: "익명 01" },
  { id: 2, type: "분실", name: "갈색 카드지갑", category: "지갑·카드", place: "학생미래인재관", date: "2026-11-05", detail: "갈색 가죽 카드지갑입니다.", authorName: "익명 02" },
  { id: 3, type: "습득", name: "흰색 충전기", category: "전자기기", place: "다솔관", date: "2026-11-04", detail: "강의실 책상 아래에 있었어요.", authorName: "익명 03" },
  { id: 4, type: "습득", name: "검은색 우산", category: "의류·생활", place: "학생회관", date: "2026-11-06", detail: "입구 우산꽂이에서 발견했어요.", authorName: "익명 04" },
  { id: 5, type: "분실", name: "은색 갤럭시 버즈", category: "전자기기", place: "중앙도서관", date: "2026-11-06", detail: "케이스와 이어버드가 함께 들어 있습니다.", authorName: "익명 05" },
  { id: 6, type: "습득", name: "파란색 필통", category: "문구", place: "미카엘관", date: "2026-11-03", detail: "강의실 뒷자리에서 발견했어요.", authorName: "익명 06" }
];
const categories = ["전자기기", "지갑·카드", "의류·생활", "문구", "기타"];

function categoryMark(category: string) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  switch (category) {
    case "전자기기":
      return <svg {...common}>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>;

    case "지갑·카드":
      return <svg {...common}>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 14h2" />
        <path d="M6 6V4h12v2" />
      </svg>;

    case "의류·생활":
      return <svg {...common}>
        <path d="M8 4l4 2 4-2 5 4-3 4-2-2v10H8V10l-2 2-3-4z" />
      </svg>;

    case "문구":
      return <svg {...common}>
        <path d="M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z" />
        <path d="M14.5 6.5l3 3M4 20l1-4" />
      </svg>;

    default:
      return <svg {...common}>
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
        <path d="M3 7l9 4 9-4M12 11v10" />
      </svg>;
  }
}

function currentTime() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

// 사진 용량이 localStorage 한도를 넘지 않도록 긴 변을 1000px로 줄여 저장합니다.
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("이미지 파일을 확인해 주세요."));
      image.onload = () => {
        const maxSide = 1000;
        const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("사진을 처리하지 못했습니다."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(samples);
  const [currentAccount, setCurrentAccount] = useState<DemoAccount>("me");

useEffect(() => {
  const savedAccount = localStorage.getItem("gade-lost-found-account");
  if (savedAccount === "me" || savedAccount === "userA" || savedAccount === "userB") {
    setCurrentAccount(savedAccount);
  }
}, []);

useEffect(() => {
  localStorage.setItem("gade-lost-found-account", currentAccount);
}, [currentAccount]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chats, setChats] = useState<ChatMap>({});
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [tab, setTab] = useState<"전체" | "분실" | "습득">("전체");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [form, setForm] = useState({
    type: "분실" as "분실" | "습득",
    name: "",
    category: "전자기기",
    place: "",
    date: new Date().toISOString().slice(0, 10),
    detail: "",
    image: ""
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gade-lost-found-posts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPosts(parsed);
      }
    } catch {
      setPosts(samples);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("gade-lost-found-posts", JSON.stringify(posts));
    } catch {
      alert("저장 공간이 부족합니다. 사진 크기를 줄이거나 일부 게시글을 삭제해 주세요.");
    }
  }, [posts, isLoaded]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gade-lost-found-chats");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") setChats(parsed);
      }
    } catch {
      setChats({});
    }
    setChatsLoaded(true);
  }, []);

  useEffect(() => {
    if (!chatsLoaded) return;
    try {
      localStorage.setItem("gade-lost-found-chats", JSON.stringify(chats));
    } catch {
      alert("메시지를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
    }
  }, [chats, chatsLoaded]);

  const filtered = useMemo(() => posts.filter(p =>
    (tab === "전체" || p.type === tab) &&
    (category === "전체" || p.category === category) &&
    (p.name + p.place + p.detail).toLowerCase().includes(query.toLowerCase())
  ), [posts, tab, category, query]);

  const selectedPost = selected ? posts.find(p => p.id === selected.id) || selected : null;
  const activeThreadParts = activeThreadKey ? activeThreadKey.split(":") : [];
  const chatPostId = activeThreadParts.length === 2 ? Number(activeThreadParts[0]) : null;
  const activePeerId = activeThreadParts.length === 2 ? activeThreadParts[1] as DemoAccount : null;
  const chatPost = chatPostId === null ? null : posts.find(p => p.id === chatPostId) || null;
  const activeMessages = activeThreadKey ? chats[activeThreadKey] || [] : [];
  const inboxThreads = useMemo(() => (Object.entries(chats) as [string, ChatMessage[]][])
    .filter(([key, messages]) => /^\d+:(me|userA|userB)$/.test(key) && Array.isArray(messages) && messages.length > 0)
    .map(([key, messages]) => {
      const [postIdText, peerIdText] = key.split(":");
      const post = posts.find(p => p.id === Number(postIdText));
      const peerId = peerIdText as DemoAccount;
      const otherAccount = post?.ownerId === currentAccount ? peerId : post?.ownerId;
      return { key, post, peerId, otherAccount, messages, lastMessage: messages[messages.length - 1] };
    })
    .filter(thread => thread.post && thread.otherAccount && (thread.post.ownerId === currentAccount || thread.peerId === currentAccount))
    .sort((a, b) => b.lastMessage.id - a.lastMessage.id), [chats, posts, currentAccount]);
  const unreadThreadCount = inboxThreads.filter(thread => thread.messages.some(message =>
    message.sender !== currentAccount && message.sender !== "other" && !(message.readBy || []).includes(currentAccount)
  )).length;

  // 대화방을 열면 상대방이 보낸 메시지를 현재 계정이 읽은 것으로 저장합니다.
  useEffect(() => {
    if (!chatsLoaded || !activeThreadKey) return;
    setChats(prev => {
      const messages = prev[activeThreadKey] || [];
      let changed = false;
      const updated = messages.map(message => {
        if (message.sender !== currentAccount && message.sender !== "other" && !(message.readBy || []).includes(currentAccount)) {
          changed = true;
          return { ...message, readBy: [...(message.readBy || []), currentAccount] };
        }
        return message;
      });
      return changed ? { ...prev, [activeThreadKey]: updated } : prev;
    });
  }, [activeThreadKey, currentAccount, chatsLoaded]);

  function resetForm() {
    setForm({
      type: "분실",
      name: "",
      category: "전자기기",
      place: "",
      date: new Date().toISOString().slice(0, 10),
      detail: "",
      image: ""
    });
    setEditingId(null);
  }

  function openNewPost() {
    resetForm();
    setShowForm(true);
  }

  function openEditPost(post: Post) {
    if (!post.ownerId || post.ownerId !== currentAccount) {
      alert("본인이 작성한 게시글만 수정할 수 있습니다.");
      return;
    }
    setForm({
      type: post.type,
      name: post.name,
      category: post.category,
      place: post.place,
      date: post.date,
      detail: post.detail,
      image: post.image || ""
    });
    setEditingId(post.id);
    setSelected(null);
    setShowForm(true);
  }

  function savePost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim() || !form.place.trim()) return;

    if (editingId !== null) {
      const target = posts.find(p => p.id === editingId);
      if (!target || target.ownerId !== currentAccount) {
        alert("본인이 작성한 게시글만 수정할 수 있습니다.");
        setShowForm(false);
        resetForm();
        return;
      }
      setPosts(prev => prev.map(p => p.id === editingId && p.ownerId === currentAccount ? { ...p, ...form, name: form.name.trim(), place: form.place.trim() } : p));
      setSelected(posts.find(p => p.id === editingId) || null);
    } else {
      const post: Post = {
        ...form,
        id: Date.now(),
        name: form.name.trim(),
        place: form.place.trim(),
        ownerId: currentAccount,
        authorName: accountLabels[currentAccount]
      };
      setPosts(prev => [post, ...prev]);
    }
    setShowForm(false);
    resetForm();
  }

  function deletePost(post: Post) {
    if (!post.ownerId || post.ownerId !== currentAccount) {
      alert("본인이 작성한 게시글만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 게시글을 삭제할까요? 삭제한 게시글은 복구할 수 없습니다.")) return;
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setChats(prev => {
      const next = { ...prev };
      delete next[String(post.id)];
      Object.keys(next).forEach(key => {
        if (key.startsWith(`${post.id}:`)) delete next[key];
      });
      return next;
    });
    setActiveThreadKey(null);
    setSelected(null);
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("사진은 8MB 이하의 파일을 선택해 주세요.");
      e.target.value = "";
      return;
    }
    try {
      const image = await resizeImage(file);
      setForm(prev => ({ ...prev, image }));
    } catch {
      alert("사진을 불러오지 못했습니다. 다른 이미지 파일을 선택해 주세요.");
    }
  }

  function openPostChat(post: Post) {
    if (!post.ownerId) {
      alert("이 익명 시연 게시글에는 대화 상대 계정이 지정되어 있지 않습니다. 새로 등록한 게시글에서 메시지를 보내 주세요.");
      return;
    }
    if (post.ownerId === currentAccount) {
      setSelected(null);
      setShowInbox(true);
      return;
    }
    setActiveThreadKey(`${post.id}:${currentAccount}`);
    setMessageText("");
    setSelected(null);
  }

  function openInboxThread(threadKey: string) {
    setShowInbox(false);
    setActiveThreadKey(threadKey);
    setMessageText("");
  }

  function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeThreadKey || !chatPost || !activePeerId || !messageText.trim()) return;
    if (currentAccount !== chatPost.ownerId && currentAccount !== activePeerId) {
      alert("이 대화에 참여할 권한이 없습니다.");
      return;
    }
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: currentAccount,
      text: messageText.trim(),
      time: currentTime()
    };
    setChats(prev => ({ ...prev, [activeThreadKey]: [...(prev[activeThreadKey] || []), newMessage] }));
    setMessageText("");
  }

  const matches = selectedPost ? posts.filter(p => p.id !== selectedPost.id).map(p => {
    let score = 0;
    if (p.category === selectedPost.category) score += 40;
    if (p.place === selectedPost.place) score += 30;
    if (p.date === selectedPost.date) score += 20;
    const a = selectedPost.name.split(" ")[0], b = p.name.split(" ")[0];
    if (a && b && (selectedPost.name.includes(b) || p.name.includes(a))) score += 10;
    return { ...p, score };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3) : [];

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(25, 20, 22, .58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    overflowY: "auto"
  };

  const extraModalStyle: CSSProperties = {
    background: "#fff",
    color: "#292326",
    width: "min(100%, 560px)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 24px 80px rgba(0,0,0,.22)",
    position: "relative"
  };

  const fieldStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e5dfe1",
    borderRadius: 10,
    padding: "11px 12px",
    marginTop: 7,
    font: "inherit",
    background: "#fff",
    color: "#292326"
  };

  return <main>
    <header className="topbar">
      <a className="brand" href="#"><span className="brandMark">G</span><span>가대 <b>LOST & FOUND</b><small> CATHOLIC UNIVERSITY</small></span></a>
      <nav>
  <a href="#board">게시판</a>
  <a href="#guide">이용안내</a>
  <select
    value={currentAccount}
    onChange={e => setCurrentAccount(e.target.value as DemoAccount)}
    style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid #e5dfe1" }}
  >
    <option value="me">내 계정</option>
    <option value="userA">문의자 A</option>
    <option value="userB">문의자 B</option>
  </select>
  <button className="outline small" onClick={() => setShowInbox(true)}>받은 메시지{unreadThreadCount > 0 ? ` (${unreadThreadCount})` : ""}</button>
  <button className="primary small" onClick={openNewPost}>+ 게시글 등록</button>
</nav>
    </header>

    <section className="hero">
      <div className="heroText">
        <span className="eyebrow">CATHOLIC UNIVERSITY LOST & FOUND</span>
        <h1>잃어버린 물건,<br/><em>함께 찾아봐요.</em></h1>
        <p>가톨릭대학교 구성원을 위한 교내 분실물 통합 서비스</p>
        <div className="heroActions"><button className="primary" onClick={openNewPost}>분실물 등록하기 <span>→</span></button><a className="textLink" href="#board">게시글 둘러보기 ↓</a></div>
      </div>
      <div className="heroVisual"><div className="orbit orbit1"></div><div className="orbit orbit2"></div><div className="heroIcon">⌕</div><div className="floating f1">🎧 <span>에어팟 케이스</span></div><div className="floating f2">👛 <span>카드지갑</span></div><div className="floating f3">☂️ <span>우산</span></div></div>
    </section>

    <section className="stats">
      <div><strong>{posts.length.toString().padStart(2, "0")}</strong><span>등록된 게시글</span></div>
      <div><strong>{posts.filter(p => p.type === "분실").length.toString().padStart(2, "0")}</strong><span>분실 신고</span></div>
      <div><strong>{posts.filter(p => p.type === "습득").length.toString().padStart(2, "0")}</strong><span>습득 신고</span></div>
      <div className="statNote">작은 제보 하나가<br/>소중한 물건을 찾아줍니다.</div>
    </section>

    <section className="board" id="board">
      <div className="sectionHead"><div><span className="eyebrow">COMMUNITY BOARD</span><h2>분실물 게시판</h2><p>교내에서 잃어버리거나 발견한 물건을 확인해 보세요.</p></div><button className="outline" onClick={openNewPost}>+ 게시글 등록</button></div>
      <div className="toolbar">
        <div className="tabs">{(["전체", "분실", "습득"] as const).map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className="filters">
          <select value={category} onChange={e => setCategory(e.target.value)}><option>전체</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="물건명, 장소 검색..." />
        </div>
      </div>
      <div className="cards">
        {filtered.map(p => <button className="postCard" key={p.id} onClick={() => setSelected(p)}>
          <div className="cardTop"><span className={p.type === "분실" ? "lost" : "found"}>{p.type} {p.type === "분실" ? "신고" : "물품"}</span><span className="date">{p.date.slice(5).replace("-", ".")}</span></div>
          {p.image ? <img src={p.image} alt={`${p.name} 사진`} style={{ width: "100%", height: 155, objectFit: "cover", borderRadius: 12, margin: "12px 0" }} /> : <div className="itemIcon" style={{ background: "#f8e9ed", color: "#842d45", borderRadius: 16, width: 58, height: 58, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700, margin: "14px 0" }}>{categoryMark(p.category)}</div>}
          <h3>{p.name}</h3>
<p style={{ color: "#888", fontSize: 12, margin: "5px 0" }}>
  작성자: {p.authorName || (p.id <= 6 ? `익명 ${String(p.id).padStart(2, "0")}` : "익명")}
</p>
<p className="place">⌖ {p.place}</p>
<p className="detail">{p.detail}</p>
          <div className="cardBottom"><span><b style={{ color: "#842d45", marginRight: 6 }}>{categoryMark(p.category)}</b>{p.category}</span><b>자세히 보기 ↗</b></div>
          {p.solved && <span style={{ display: "inline-block", marginTop: 8, color: "#28744d", fontSize: 12, fontWeight: 700 }}>✓ 해결 완료</span>}
        </button>)}
      </div>
      {filtered.length === 0 && <div className="empty">검색 결과가 없습니다.</div>}
      <p className="sampleNote">※ 초기 게시글은 서비스 시연을 위한 가상 데이터입니다.</p>
    </section>

    <section className="guide" id="guide"><span className="eyebrow">HOW IT WORKS</span><h2>잃어버린 물건을 찾는 방법</h2><div className="steps"><div><b>01</b><h3>게시글 등록</h3><p>분실 또는 습득 정보를 간단히 등록해요.</p></div><div><b>02</b><h3>유사 게시글 확인</h3><p>물건 종류와 장소 등으로 유사한 글을 찾아요.</p></div><div><b>03</b><h3>주인 확인 및 반환</h3><p>물건의 특징을 확인한 뒤 안전하게 반환해요.</p></div></div></section>
    <footer><b>가대 LOST & FOUND</b><span>가톨릭대학교 교내 분실물 통합 서비스 · 시연용 목업</span></footer>

    {showForm && <div style={overlayStyle} onClick={() => { setShowForm(false); resetForm(); }}>
      <form className="modal" onSubmit={savePost} onClick={e => e.stopPropagation()} style={extraModalStyle}>
        <button type="button" className="close" onClick={() => { setShowForm(false); resetForm(); }}>×</button>
        <span className="eyebrow">{editingId !== null ? "EDIT POST" : "NEW POST"}</span>
        <h2>{editingId !== null ? "게시글 수정" : "게시글 등록"}</h2>
        <div className="typeChoice"><button type="button" className={form.type === "분실" ? "chosen" : ""} onClick={() => setForm({ ...form, type: "분실" })}>분실했어요</button><button type="button" className={form.type === "습득" ? "chosen" : ""} onClick={() => setForm({ ...form, type: "습득" })}>발견했어요</button></div>
        <label style={{ display: "block", marginTop: 14 }}>물건 이름<input style={fieldStyle} required placeholder="예: 검은색 무선 이어폰" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label style={{ display: "block", marginTop: 14 }}>카테고리<select style={fieldStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label style={{ display: "block", marginTop: 14 }}>장소<input style={fieldStyle} required placeholder="예: 중앙도서관" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })}/></label>
        <label style={{ display: "block", marginTop: 14 }}>날짜<input style={fieldStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label>
        <label style={{ display: "block", marginTop: 14 }}>상세 특징<textarea style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }} placeholder="색상, 모양, 발견 위치 등을 적어주세요." value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}/></label>
        <label style={{ display: "block", marginTop: 14 }}>사진 첨부 <span style={{ color: "#888", fontSize: 12 }}>(8MB 이하, 자동으로 용량 조정)</span><input style={{ ...fieldStyle, padding: 8 }} type="file" accept="image/*" onChange={handleImageChange}/></label>
        {form.image && <div style={{ marginTop: 12 }}><img src={form.image} alt="첨부 사진 미리보기" style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "#f7f4f5", borderRadius: 12 }}/><button type="button" className="outline" style={{ marginTop: 8 }} onClick={() => setForm({ ...form, image: "" })}>사진 삭제</button></div>}
        <button className="primary submit" type="submit">{editingId !== null ? "수정 내용 저장" : "게시글 등록하기"}</button>
      </form>
    </div>}

    {selectedPost && <div style={overlayStyle} onClick={() => setSelected(null)}>
      <div className="modal detailModal" onClick={e => e.stopPropagation()} style={extraModalStyle}>
        <button className="close" onClick={() => setSelected(null)}>×</button>
        <span className={selectedPost.type === "분실" ? "lost" : "found"}>{selectedPost.type} {selectedPost.type === "분실" ? "신고" : "물품"}</span>
        <h2>{selectedPost.name}</h2>
        {selectedPost.image && <img src={selectedPost.image} alt={`${selectedPost.name} 사진`} style={{ width: "100%", maxHeight: 300, objectFit: "contain", background: "#f7f4f5", borderRadius: 12, margin: "14px 0" }}/>}
        <p className="place">⌖ {selectedPost.place}　·　{selectedPost.date}</p>
        <p>{selectedPost.detail || "상세 설명이 등록되지 않았습니다."}</p>
        <p style={{ color: "#842d45", fontWeight: 700 }}>{categoryMark(selectedPost.category)} {selectedPost.category}</p>
        {selectedPost.solved && <p style={{ color: "#28744d", fontWeight: 700 }}>✓ 해결 완료</p>}
        <div className="matchBox"><b>유사 게시글 자동 매칭</b><p>카테고리·장소·날짜·물건명 기준의 목업 점수입니다.</p>{matches.length ? matches.map(m => <div className="matchRow" key={m.id}><span>{m.name} · {m.place}</span><b>{m.score}%</b></div>) : <p>현재 유사 게시글이 없습니다.</p>}</div>
        <p className="privacy">안전한 반환을 위해 물건의 고유한 특징을 확인하고, 학생증·카드 등 개인정보가 보이는 사진은 등록하지 마세요.</p>
        <button className="primary submit" onClick={() => openPostChat(selectedPost)}>{selectedPost.ownerId === currentAccount ? "받은 메시지 확인" : "메시지 보내기"}</button>
        {selectedPost.ownerId === currentAccount && <>
          <button className="outline submit" onClick={() => openEditPost(selectedPost)}>게시글 수정</button>
          <button className="outline submit" style={{ color: "#a52e43", borderColor: "#e7cbd1" }} onClick={() => deletePost(selectedPost)}>게시글 삭제</button>
          <button className="outline submit" onClick={() => { setPosts(prev => prev.map(p => p.id === selectedPost.id && p.ownerId === currentAccount ? { ...p, solved: !p.solved } : p)); setSelected(null); }}>{selectedPost.solved ? "해결 완료 취소" : "해결 완료로 표시"}</button>
        </>}
      </div>
    </div>}

    {showInbox && <div style={overlayStyle} onClick={() => setShowInbox(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ ...extraModalStyle, width: "min(100%, 560px)" }}>
        <button className="close" onClick={() => setShowInbox(false)}>×</button>
        <span className="eyebrow">INBOX</span>
        <h2>받은 메시지</h2>
        <p style={{ color: "#888", fontSize: 13 }}>현재 계정: {accountLabels[currentAccount]} · 게시글과 문의자별로 대화가 분리됩니다.</p>
        {inboxThreads.length === 0 ? <div style={{ textAlign: "center", color: "#999", padding: "42px 12px" }}>아직 받은 메시지가 없습니다.<br/>다른 계정으로 전환해 내 게시글에 문의를 남겨 보세요.</div> : <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          {inboxThreads.map(thread => <button key={thread.key} className="outline" onClick={() => openInboxThread(thread.key)} style={{ width: "100%", textAlign: "left", padding: 14, borderRadius: 12 }}>
            <span style={{ display: "block", color: "#842d45", fontWeight: 700, fontSize: 13 }}>{thread.otherAccount ? accountLabels[thread.otherAccount] : "대화 상대"}</span>
            <b style={{ display: "block", margin: "4px 0" }}>{thread.post?.name}</b>
            <span style={{ display: "block", color: "#777", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.lastMessage.text}</span>
            <small style={{ display: "block", color: "#aaa", marginTop: 5 }}>{thread.lastMessage.time}</small>
            {thread.messages.some(message => message.sender !== currentAccount && message.sender !== "other" && !(message.readBy || []).includes(currentAccount)) && <small style={{ display: "inline-block", marginTop: 6, color: "#842d45", fontWeight: 700 }}>안 읽은 메시지</small>}
          </button>)}
        </div>}
        <p className="privacy" style={{ marginTop: 18 }}>시연용 대화는 현재 브라우저에만 저장되며 실제 다른 기기로 전송되지는 않습니다.</p>
      </div>
    </div>}

    {chatPost && activeThreadKey && <div style={overlayStyle} onClick={() => { setActiveThreadKey(null); setMessageText(""); }}>
      <div onClick={e => e.stopPropagation()} style={{ ...extraModalStyle, width: "min(100%, 500px)", height: "min(680px, 88vh)", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #eee5e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><span className="eyebrow">DEMO CHAT</span><h2 style={{ margin: "5px 0 0", fontSize: 20 }}>{chatPost.name}</h2><small style={{ color: "#888" }}>{activePeerId ? accountLabels[activePeerId] : "대화 상대"}와의 대화</small></div>
          <button className="close" onClick={() => { setActiveThreadKey(null); setMessageText(""); }}>×</button>
        </div>
        <div style={{ padding: 16, background: "#faf7f8", flex: 1, overflowY: "auto" }}>
          <div style={{ textAlign: "center", color: "#888", fontSize: 12, margin: "4px 0 16px" }}>이 대화는 발표 시연을 위한 브라우저 내 저장 대화입니다.</div>
          {activeMessages.length === 0 && <div style={{ textAlign: "center", color: "#999", padding: "50px 10px" }}>아직 메시지가 없습니다.<br/>첫 메시지를 보내 보세요!</div>}
          {activeMessages.map(message => {
            const mine = message.sender === currentAccount;
            const senderLabel = message.sender === "other" ? "이전 대화" : accountLabels[message.sender];
            const otherAccount = chatPost?.ownerId === currentAccount ? activePeerId : chatPost?.ownerId;
            const isRead = !!otherAccount && (message.readBy || []).includes(otherAccount);
            return <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", margin: "10px 0" }}>
              <div style={{ maxWidth: "82%" }}>
                <div style={{ background: mine ? "#842d45" : "#fff", color: mine ? "#fff" : "#333", border: mine ? "none" : "1px solid #eee", borderRadius: 14, padding: "10px 13px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.text}</div>
                <small style={{ display: "block", textAlign: mine ? "right" : "left", color: "#999", marginTop: 4 }}>
                  {mine && message.sender !== "other" ? <span style={{ color: isRead ? "#842d45" : "#aaa", fontWeight: isRead ? 700 : 400 }}>{isRead ? "읽음" : "안읽음"} · </span> : null}
                  {senderLabel} · {message.time}
                </small>
              </div>
            </div>;
          })}
        </div>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #eee5e8" }}>
          <input value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="메시지를 입력하세요..." style={{ ...fieldStyle, margin: 0, flex: 1 }} />
          <button className="primary" type="submit" disabled={!messageText.trim()}>전송</button>
        </form>
      </div>
    </div>}
  </main>;
}
