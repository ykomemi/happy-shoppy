import { useState, useRef, useEffect } from "react";

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  default: {
    name: "🛒 Classic", primary: "#1976d2", primaryDark: "#1565c0",
    primaryLight: "#e3f2fd", secondary: "#ff6f00", accent: "#43a047",
    bg: "#f5f5f5", surface: "#ffffff",
    headerBg: "linear-gradient(135deg,#1976d2,#1565c0)",
    headerText: "white", chipBg: "#ff6f00", font: "Roboto,sans-serif",
    title: "My Shopping List", icon: "🛒",
  },
  princess: {
    name: "👸 Princess", primary: "#c2185b", primaryDark: "#880e4f",
    primaryLight: "#fce4ec", secondary: "#f06292", accent: "#ab47bc",
    bg: "#fdf6f9", surface: "#ffffff",
    headerBg: "linear-gradient(135deg,#e91e63,#c2185b)",
    headerText: "white", chipBg: "#ab47bc", font: "'Nunito',sans-serif",
    title: "My Royal List", icon: "👸",
  },
  soccer: {
    name: "⚽ Football", primary: "#2e7d32", primaryDark: "#1b5e20",
    primaryLight: "#e8f5e9", secondary: "#f57f17", accent: "#1565c0",
    bg: "#f1f8f1", surface: "#ffffff",
    headerBg: "linear-gradient(135deg,#2e7d32,#1b5e20)",
    headerText: "white", chipBg: "#f57f17", font: "Roboto,sans-serif",
    title: "Match Day Shop", icon: "⚽",
  },
  nature: {
    name: "🌿 Nature", primary: "#558b2f", primaryDark: "#33691e",
    primaryLight: "#f1f8e9", secondary: "#ef6c00", accent: "#00838f",
    bg: "#f4f9f0", surface: "#ffffff",
    headerBg: "linear-gradient(135deg,#558b2f,#33691e)",
    headerText: "white", chipBg: "#ef6c00", font: "'Nunito',sans-serif",
    title: "Fresh & Natural", icon: "🌿",
  },
  space: {
    name: "🚀 Space", primary: "#7c4dff", primaryDark: "#651fff",
    primaryLight: "#ede7f6", secondary: "#00bcd4", accent: "#ff4081",
    bg: "#0d0d1a", surface: "#1a1a2e",
    headerBg: "linear-gradient(135deg,#1a1a2e,#0d0d1a)",
    headerText: "white", chipBg: "#7c4dff", font: "Roboto,sans-serif",
    title: "Space Supplies", icon: "🚀",
  },
};

// ─── EMOJIS ──────────────────────────────────────────────────────────────────
const EMOJIS = {
  milk:"🥛",leche:"🥛",bread:"🍞",pan:"🍞",egg:"🥚",eggs:"🥚",huevos:"🥚",
  butter:"🧈",mantequilla:"🧈",cheese:"🧀",queso:"🧀",apple:"🍎",manzana:"🍎",
  banana:"🍌",plátano:"🍌",orange:"🍊",naranja:"🍊",tomato:"🍅",tomate:"🍅",
  potato:"🥔",patata:"🥔",onion:"🧅",cebolla:"🧅",garlic:"🧄",ajo:"🧄",
  chicken:"🍗",pollo:"🍗",beef:"🥩",carne:"🥩",fish:"🐟",pescado:"🐟",
  rice:"🍚",arroz:"🍚",pasta:"🍝",sugar:"🍬",azúcar:"🍬",salt:"🧂",sal:"🧂",
  oil:"🫙",aceite:"🫙",water:"💧",agua:"💧",juice:"🧃",zumo:"🧃",
  coffee:"☕",café:"☕",tea:"🍵",yogurt:"🥛",yogur:"🥛",yogurts:"🥛",
  soap:"🧼",jabón:"🧼",shampoo:"🧴",chocolate:"🍫",cereal:"🥣",
  grape:"🍇",grapes:"🍇",mandarin:"🍊",cucumber:"🥒",cucumbers:"🥒",
  pizza:"🍕",soup:"🍲",paper:"🧻",kitchen:"🧻",cafe:"☕",
};

function getEmoji(name) {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(EMOJIS)) {
    if (lower.includes(k)) return v;
  }
  return "🛒";
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function persist(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("list");
  const [items, setItems] = useState(() => load("shopItems", []));
  const [history, setHistory] = useState(() => load("shopHistory", []));
  const [settings, setSettings] = useState(() => load("shopSettings", { theme: "default", historyLimit: 3 }));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef();
  const toastTimer = useRef();

  const T = THEMES[settings.theme] || THEMES.default;
  const isDark = settings.theme === "space";

  useEffect(() => { persist("shopItems", items); }, [items]);
  useEffect(() => { persist("shopHistory", history); }, [history]);
  useEffect(() => { persist("shopSettings", settings); }, [settings]);

  // Confetti trigger on all-done
  const prevAllDone = useRef(false);
  useEffect(() => {
    const total = items.length;
    const doneCount = items.filter(i => i.done).length;
    const allDone = total > 0 && doneCount === total;
    if (allDone && !prevAllDone.current) triggerConfetti();
    prevAllDone.current = allDone;
  }, [items]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function triggerConfetti() {
    const colors = [T.primary, T.secondary, T.accent, "#f9ca24", "#fd79a8"];
    const pieces = Array.from({length: 60}, (_, i) => ({
      id: i, color: colors[i % colors.length],
      left: Math.random() * 100, delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.5, round: Math.random() > 0.5,
    }));
    setConfetti(pieces);
    showToast("🎉 All done! Great job!");
    setTimeout(() => setConfetti([]), 4500);
  }

  function addItem(name, qty = "") {
    if (!name.trim()) return;
    setItems(prev => [{ id: Date.now() + Math.random(), name: name.trim(), qty, emoji: getEmoji(name), done: false }, ...prev]);
  }

  function addManual() {
    if (!input.trim()) return;
    addItem(input);
    setInput("");
    showToast("✅ Added!");
  }

  function toggle(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearAll() {
    if (items.length === 0) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      items: [...items],
    };
    setHistory(prev => [entry, ...prev].slice(0, settings.historyLimit));
    setItems([]);
    showToast("Saved to history");
  }

  function restoreList(entry) {
    setItems(entry.items.map(i => ({ ...i, done: false })));
    setPage("list");
    showToast("✅ List restored!");
  }

  function shareList() {
    const todo = items.filter(i => !i.done);
    const done = items.filter(i => i.done);
    let text = T.icon + " " + T.title + "\n\n";
    if (todo.length) text += todo.map(i => i.emoji + " " + i.name + (i.qty ? " – " + i.qty : "")).join("\n");
    if (done.length) text += "\n\n✅ Done:\n" + done.map(i => "✓ " + i.name).join("\n");
    navigator.clipboard.writeText(text).then(() => showToast("📋 Copied!")).catch(() => showToast("Couldn't copy"));
  }

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "image/jpeg";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + import.meta.env.VITE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: "gpt-4o", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: "data:" + mediaType + ";base64," + base64 } },
            { type: "text", text: 'Extract any shopping list items from this image. Return ONLY a JSON array, no markdown, no explanation. Each object: {"name":"item name","qty":"quantity if visible else empty string"}. Example: [{"name":"Milk","qty":"2L"},{"name":"Bread","qty":""}]. If nothing found return [].' }
          ]}]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast("🤔 No items found in image");
      } else {
        parsed.forEach(item => addItem(item.name, item.qty || ""));
        showToast("✨ Added " + parsed.length + " items!");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Couldn't read image");
    } finally {
      setLoading(false);
    }
  }

  const todo = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const pct = items.length ? Math.round(done.length / items.length * 100) : 0;

  const pageTitles = { list: T.title, history: "History", settings: "Settings" };

  // ── Item Row ────────────────────────────────────────────────────────────────
  const ItemRow = ({ item }) => (
    <div style={{
      background: T.surface, borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
      opacity: item.done ? 0.55 : 1, marginBottom: 8,
      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "none",
    }}>
      <button onClick={() => toggle(item.id)} style={{
        width: 24, height: 24, borderRadius: 4, flexShrink: 0, cursor: "pointer",
        border: item.done ? "none" : "2px solid " + (isDark ? "rgba(255,255,255,0.3)" : "#bdbdbd"),
        background: item.done ? T.primary : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 14, fontWeight: 900,
      }}>{item.done ? "✓" : ""}</button>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 600, fontFamily: T.font,
        textDecoration: item.done ? "line-through" : "none",
        color: item.done ? (isDark ? "rgba(255,255,255,0.35)" : "#9e9e9e") : (isDark ? "rgba(255,255,255,0.92)" : "#212121"),
      }}>{item.name}</span>
      {item.qty && <span style={{
        fontSize: 11, fontWeight: 700, color: "white", background: T.chipBg,
        padding: "2px 8px", borderRadius: 10, flexShrink: 0,
      }}>{item.qty}</span>}
      <button onClick={() => deleteItem(item.id)} style={{
        background: "none", border: "none", fontSize: 16, cursor: "pointer",
        opacity: 0.35, padding: 4, color: isDark ? "white" : "#212121",
      }}>✕</button>
    </div>
  );

  // ── List Page ───────────────────────────────────────────────────────────────
  const ListPage = () => (
    <div style={{ padding: "16px 16px 0", fontFamily: T.font }}>

      {loading && (
        <div style={{
          background: T.surface, borderRadius: 12, padding: 14, marginBottom: 16,
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>🤖 AI is reading your list...</div>
          <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, background: T.primary, borderRadius: "50%", animation: "bounce 1.2s " + (i * 0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {/* Search / input row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", position: "relative" }}>
        <input
          className="add-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addManual()}
          placeholder="Add item..."
          style={{
            flex: 1, background: T.surface, border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1.5px solid #e0e0e0",
            borderRadius: 28, padding: "12px 20px", fontFamily: T.font,
            fontSize: 15, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.9)" : "#212121",
            outline: "none",
          }}
        />
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => { if (input.trim()) { addManual(); } else { setShowMenu(m => !m); } }}
            style={{
              width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
              background: T.primary, color: "white", fontSize: 28, fontWeight: 300,
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >+</button>

          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{
                position: "absolute", top: 60, right: 0, background: T.surface, borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 200,
                minWidth: 200, animation: "popIn 0.18s cubic-bezier(.34,1.56,.64,1)",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}>
                {[
                  { icon: "✏️", label: "Type an item", sub: "Add manually", action: () => { setShowMenu(false); setTimeout(() => document.querySelector(".add-input")?.focus(), 50); } },
                  { icon: "📸", label: "Scan a photo", sub: "AI reads the list", action: () => { setShowMenu(false); fileRef.current.click(); } },
                ].map((opt, idx) => (
                  <div key={idx} onClick={opt.action} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer",
                    borderBottom: idx === 0 ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0") : "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? "rgba(255,255,255,0.9)" : "#212121" }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "#9e9e9e", fontWeight: 500 }}>{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* To buy section */}
      {(todo.length > 0 || done.length > 0) && (
        <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          To buy · {todo.length}
        </div>
      )}

      {todo.length === 0 && done.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🧺</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: isDark ? "rgba(255,255,255,0.7)" : "#424242" }}>List is empty!</div>
          <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#9e9e9e", fontWeight: 500 }}>Tap + to add items or scan a photo</div>
        </div>
      )}

      {todo.map(item => <ItemRow key={item.id} item={item} />)}

      {done.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setDoneOpen(o => !o)} style={{
            background: "none", border: "none", display: "flex", alignItems: "center",
            gap: 6, cursor: "pointer", marginBottom: 8, padding: 0, fontFamily: T.font,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.45)" : "#9e9e9e", textTransform: "uppercase", letterSpacing: 1 }}>Done · {done.length}</span>
            <span style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#bdbdbd", fontSize: 11, transition: "transform 0.25s", transform: doneOpen ? "rotate(180deg)" : "none" }}>▼</span>
          </button>
          {doneOpen && done.map(item => <ItemRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );

  // ── History Page ────────────────────────────────────────────────────────────
  const HistoryPage = () => (
    <div style={{ padding: "16px", fontFamily: T.font }}>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : "#616161" }}>No history yet</div>
          <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : "#9e9e9e", marginTop: 6 }}>Clear a list to save it here</div>
        </div>
      ) : history.map(entry => (
        <div key={entry.id} style={{
          background: T.surface, borderRadius: 14, padding: "16px", marginBottom: 12,
          boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
          border: isDark ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: isDark ? "rgba(255,255,255,0.9)" : "#212121" }}>{entry.date}</div>
              <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "#9e9e9e", marginTop: 2 }}>{entry.items.length} items</div>
            </div>
            <button onClick={() => restoreList(entry)} style={{
              background: T.primary, color: "white", border: "none", borderRadius: 20,
              padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
            }}>Restore</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {entry.items.slice(0, 6).map((it, i) => (
              <span key={i} style={{
                background: isDark ? "rgba(255,255,255,0.1)" : T.primaryLight,
                color: isDark ? "rgba(255,255,255,0.8)" : T.primaryDark,
                borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
              }}>{it.emoji} {it.name}</span>
            ))}
            {entry.items.length > 6 && (
              <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "#9e9e9e", padding: "3px 4px" }}>+{entry.items.length - 6} more</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Settings Page ───────────────────────────────────────────────────────────
  const SettingsPage = () => (
    <div style={{ padding: "16px", fontFamily: T.font }}>
      {/* Theme Picker */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Theme</div>
        <div style={{ background: T.surface, borderRadius: 14, overflow: "hidden", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
          {Object.entries(THEMES).map(([key, theme], idx, arr) => (
            <div key={key} onClick={() => setSettings(s => ({ ...s, theme: key }))} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer",
              borderBottom: idx < arr.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0") : "none",
            }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: theme.headerBg, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.88)" : "#212121" }}>{theme.name}</span>
              {settings.theme === key && <span style={{ color: T.primary, fontSize: 18, fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* History Limit */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>History limit</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 5, 10].map(n => (
            <button key={n} onClick={() => setSettings(s => ({ ...s, historyLimit: n }))} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: T.font, fontSize: 15, fontWeight: 700,
              background: settings.historyLimit === n ? T.primary : (isDark ? "rgba(255,255,255,0.1)" : T.primaryLight),
              color: settings.historyLimit === n ? "white" : (isDark ? "rgba(255,255,255,0.7)" : T.primaryDark),
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Data */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Data</div>
        <div style={{ background: T.surface, borderRadius: 14, overflow: "hidden", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
          <div onClick={() => { if (history.length === 0) return; setHistory([]); showToast("History cleared"); }} style={{
            padding: "15px 16px", cursor: history.length > 0 ? "pointer" : "default",
            color: history.length > 0 ? "#e53935" : (isDark ? "rgba(255,255,255,0.25)" : "#bdbdbd"),
            fontSize: 15, fontWeight: 600,
          }}
            onMouseEnter={e => { if (history.length > 0) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fafafa"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            🗑️ Clear all history
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 64 }}>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
        {confetti.map(c => (
          <div key={c.id} style={{
            position: "absolute", width: 9, height: 9, background: c.color,
            left: c.left + "vw", borderRadius: c.round ? "50%" : 2,
            animation: "fall " + c.dur + "s " + c.delay + "s linear forwards",
          }} />
        ))}
      </div>

      {/* Snackbar Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)",
          background: "#323232", color: "white", padding: "12px 22px",
          borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 1000,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)", whiteSpace: "nowrap", fontFamily: T.font,
        }}>{toast}</div>
      )}

      {/* Top App Bar */}
      <div style={{
        background: T.headerBg, color: T.headerText, padding: "0 4px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 8px" }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, paddingLeft: 8, fontFamily: T.font }}>{pageTitles[page]}</div>
          {page === "list" && items.length > 0 && (
            <div style={{ display: "flex", gap: 0 }}>
              <button onClick={shareList} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px 12px", fontFamily: T.font }}>Share</button>
              <button onClick={clearAll} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px 12px", fontFamily: T.font }}>Clear</button>
            </div>
          )}
        </div>
        {/* Linear Progress */}
        {page === "list" && items.length > 0 && (
          <div style={{ height: 3, background: "rgba(255,255,255,0.25)" }}>
            <div style={{ height: "100%", background: "rgba(255,255,255,0.85)", width: pct + "%", transition: "width 0.4s ease" }} />
          </div>
        )}
      </div>

      {/* Page Content */}
      {page === "list" && <ListPage />}
      {page === "history" && <HistoryPage />}
      {page === "settings" && <SettingsPage />}

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: T.surface, zIndex: 100,
        boxShadow: isDark ? "0 -2px 12px rgba(0,0,0,0.5)" : "0 -2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #eeeeee",
      }}>
        {[
          { id: "list", icon: "🛒", label: "List" },
          { id: "history", icon: "📋", label: "History" },
          { id: "settings", icon: "⚙️", label: "Settings" },
        ].map(tab => {
          const active = page === tab.id;
          return (
            <button key={tab.id} onClick={() => setPage(tab.id)} style={{
              flex: 1, border: "none", background: "none", cursor: "pointer",
              padding: "10px 0 8px", fontFamily: T.font, position: "relative",
            }}>
              {active && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2.5, background: T.primary, borderRadius: "0 0 3px 3px" }} />}
              <div style={{ fontSize: 22 }}>{tab.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: active ? T.primary : (isDark ? "rgba(255,255,255,0.4)" : "#9e9e9e"), marginTop: 2 }}>{tab.label}</div>
            </button>
          );
        })}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Nunito:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .add-input::placeholder { color: ${isDark ? "rgba(255,255,255,0.35)" : "#9e9e9e"}; }
        .add-input:focus { outline: 2px solid ${T.primary}; border-color: transparent !important; }
        @keyframes fall { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.88) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}
