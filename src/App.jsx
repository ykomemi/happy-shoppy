import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

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

// ─── ITEM ROW ────────────────────────────────────────────────────────────────
function ItemRow({ item, onToggle, onDelete, T, isDark, newItem, removing }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
      opacity: item.done ? 0.55 : 1, marginBottom: 8,
      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "none",
      animation: removing ? "itemFadeOut 0.35s ease forwards" : newItem ? "itemPop 0.4s cubic-bezier(.34,1.56,.64,1) forwards" : "none",
    }}>
      <button onClick={() => onToggle(item.id)} style={{
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
      <button onClick={() => onDelete(item.id)} style={{
        background: "none", border: "none", fontSize: 16, cursor: "pointer",
        opacity: 0.35, padding: 4, color: isDark ? "white" : "#212121",
      }}>✕</button>
    </div>
  );
}

// ─── LIST PAGE ───────────────────────────────────────────────────────────────
function ListPage({ T, isDark, loading, suggestions, input, setInput, addManual, startVoice, listening, showMenu, setShowMenu, fileRef, addItem, showToast, todo, done, toggle, deleteItem, doneOpen, setDoneOpen, newItemId, removingId }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: "16px 16px 0", fontFamily: T.font }}>
      {loading && (
        <div style={{
          background: T.surface, borderRadius: 12, padding: 14, marginBottom: 16,
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>🤖 {t('list.aiReading')}</div>
          <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, background: T.primary, borderRadius: "50%", animation: "bounce 1.2s " + (i * 0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {/* Input row */}
      <div style={{ marginBottom: suggestions.length > 0 ? 8 : 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="add-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addManual()}
            placeholder={t('list.addPlaceholder')}
            style={{
              flex: 1, background: T.surface,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1.5px solid #e0e0e0",
              borderRadius: 28, padding: "12px 20px", fontFamily: T.font,
              fontSize: 15, fontWeight: 500,
              color: isDark ? "rgba(255,255,255,0.9)" : "#212121", outline: "none",
            }}
          />

          {/* Mic button */}
          <button
            onClick={startVoice}
            style={{
              width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
              background: listening ? "#e53935" : T.surface, flexShrink: 0,
              boxShadow: listening
                ? "0 0 0 6px rgba(229,57,53,0.25)"
                : (isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.12)"),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, transition: "background 0.2s, box-shadow 0.2s",
              animation: listening ? "pulse 1s infinite" : "none",
            }}
            title="Voice input"
          >🎙️</button>

          {/* FAB + */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => { if (input.trim()) { addManual(); } else { setShowMenu(m => !m); } }}
              style={{
                width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
                background: T.primary, color: "white", fontSize: 28, fontWeight: 300,
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
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
                    { icon: "✏️", label: t('list.typeItem'), sub: t('list.typeItemSub'), action: () => { setShowMenu(false); setTimeout(() => document.querySelector(".add-input")?.focus(), 50); } },
                    { icon: "📸", label: t('list.scanPhoto'), sub: t('list.scanPhotoSub'), action: () => { setShowMenu(false); fileRef.current.click(); } },
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

        {/* Autocomplete chips */}
        {suggestions.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginTop: 8, scrollbarWidth: "none" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { addItem(s); setInput(""); showToast("✅ " + t('list.added')); }} style={{
                flexShrink: 0, background: isDark ? "rgba(255,255,255,0.1)" : T.primaryLight,
                color: isDark ? "rgba(255,255,255,0.85)" : T.primaryDark,
                border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600,
                padding: "5px 12px", cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
              }}>{getEmoji(s)} {s}</button>
            ))}
          </div>
        )}
      </div>

      {(todo.length > 0 || done.length > 0) && (
        <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          {t('list.toBuy')} · {todo.length}
        </div>
      )}

      {todo.length === 0 && done.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🧺</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: isDark ? "rgba(255,255,255,0.7)" : "#424242" }}>{t('list.empty')}</div>
          <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#9e9e9e", fontWeight: 500 }}>{t('list.emptySub')}</div>
        </div>
      )}

      {todo.map(item => <ItemRow key={item.id} item={item} onToggle={toggle} onDelete={deleteItem} T={T} isDark={isDark} newItem={item.id === newItemId} removing={item.id === removingId} />)}

      {done.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setDoneOpen(o => !o)} style={{
            background: "none", border: "none", display: "flex", alignItems: "center",
            gap: 6, cursor: "pointer", marginBottom: 8, padding: 0, fontFamily: T.font,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.45)" : "#9e9e9e", textTransform: "uppercase", letterSpacing: 1 }}>{t('list.done')} · {done.length}</span>
            <span style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#bdbdbd", fontSize: 11, transition: "transform 0.25s", transform: doneOpen ? "rotate(180deg)" : "none" }}>▼</span>
          </button>
          {doneOpen && done.map(item => <ItemRow key={item.id} item={item} onToggle={toggle} onDelete={deleteItem} T={T} isDark={isDark} newItem={item.id === newItemId} removing={item.id === removingId} />)}
        </div>
      )}
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ T, isDark, history, restoreList }) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div style={{ padding: "16px", fontFamily: T.font }}>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : "#616161" }}>{t('history.empty')}</div>
          <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : "#9e9e9e", marginTop: 6 }}>{t('history.emptySub')}</div>
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
              <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "#9e9e9e", marginTop: 2 }}>{t('history.items', { count: entry.items.length })}</div>
            </div>
            <button onClick={() => restoreList(entry)} style={{
              background: T.primary, color: "white", border: "none", borderRadius: 20,
              padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
            }}>{t('history.restore')}</button>
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
              <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} style={{
                background: "none", border: "none", cursor: "pointer", fontFamily: T.font,
                fontSize: 12, fontWeight: 700, color: T.primary, padding: "3px 4px",
              }}>{expandedId === entry.id ? t('history.hide') : t('history.showAll')}</button>
            )}
          </div>
          {expandedId === entry.id && (
            <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 10, paddingTop: 10, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0" }}>
              {entry.items.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 14, color: isDark ? "rgba(255,255,255,0.8)" : "#424242", fontFamily: T.font }}>
                  <span>{it.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{it.name}</span>
                  {it.qty && <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: T.chipBg, padding: "1px 7px", borderRadius: 10 }}>{it.qty}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────────────
function SettingsPage({ T, isDark, settings, setSettings, history, setHistory, memory, setMemory, showToast }) {
  const { t } = useTranslation();
  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "ca", label: "Català" },
  ];
  return (
    <div style={{ padding: "16px", fontFamily: T.font }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{t('settings.theme')}</div>
        <div style={{ background: T.surface, borderRadius: 14, overflow: "hidden", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
          {Object.entries(THEMES).map(([key, theme], idx, arr) => (
            <div key={key} onClick={() => setSettings(s => ({ ...s, theme: key }))} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer",
              borderBottom: idx < arr.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0") : "none",
            }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: theme.headerBg, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.88)" : "#212121" }}>{theme.name}</span>
              {settings.theme === key && <span style={{ color: T.primary, fontSize: 18, fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{t('settings.historyLimit')}</div>
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

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{t('settings.language')}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {languages.map(lang => (
            <button key={lang.code} onClick={() => setSettings(s => ({ ...s, language: lang.code }))} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: T.font, fontSize: 14, fontWeight: 700,
              background: settings.language === lang.code ? T.primary : (isDark ? "rgba(255,255,255,0.1)" : T.primaryLight),
              color: settings.language === lang.code ? "white" : (isDark ? "rgba(255,255,255,0.7)" : T.primaryDark),
            }}>{lang.label}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{t('settings.data')}</div>
        <div style={{ background: T.surface, borderRadius: 14, overflow: "hidden", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
          <div onClick={() => { if (history.length === 0) return; setHistory([]); showToast(t('settings.historyCleared')); }} style={{
            padding: "15px 16px", cursor: history.length > 0 ? "pointer" : "default",
            color: history.length > 0 ? "#e53935" : (isDark ? "rgba(255,255,255,0.25)" : "#bdbdbd"),
            fontSize: 15, fontWeight: 600,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0",
          }}
            onMouseEnter={e => { if (history.length > 0) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fafafa"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            🗑️ {t('settings.clearHistory')}
          </div>
          <div onClick={() => { if (memory.length === 0) return; setMemory([]); showToast("Memory cleared"); }} style={{
            padding: "15px 16px", cursor: memory.length > 0 ? "pointer" : "default",
            color: memory.length > 0 ? "#e53935" : (isDark ? "rgba(255,255,255,0.25)" : "#bdbdbd"),
            fontSize: 15, fontWeight: 600,
          }}
            onMouseEnter={e => { if (memory.length > 0) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#fafafa"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            🧠 Clear autocomplete memory
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState("list");
  const [items, setItems] = useState(() => load("shopItems", []));
  const [history, setHistory] = useState(() => load("shopHistory", []));
  const [settings, setSettings] = useState(() => load("shopSettings", { theme: "default", historyLimit: 3, language: "en" }));
  const [memory, setMemory] = useState(() => load("shopMemory", []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState(null);
  const [newItemId, setNewItemId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const fileRef = useRef();
  const toastTimer = useRef();
  const voiceRef = useRef(null);
  const voiceTimer = useRef(null);

  const T = THEMES[settings.theme] || THEMES.default;
  const isDark = settings.theme === "space";

  useEffect(() => { persist("shopItems", items); }, [items]);
  useEffect(() => { persist("shopHistory", history); }, [history]);
  useEffect(() => { persist("shopSettings", settings); }, [settings]);
  useEffect(() => { persist("shopMemory", memory); }, [memory]);

  useEffect(() => {
    if (settings.language) i18n.changeLanguage(settings.language);
  }, [settings.language]);

  const prevAllDone = useRef(false);
  useEffect(() => {
    const total = items.length;
    const doneCount = items.filter(i => i.done).length;
    const allDone = total > 0 && doneCount === total;
    if (allDone && !prevAllDone.current) triggerConfetti();
    prevAllDone.current = allDone;
  }, [items]);

  const suggestions = input.length >= 2
    ? memory.filter(m => m.toLowerCase().includes(input.toLowerCase())).slice(0, 15)
    : [];

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function triggerConfetti() {
    const colors = [T.primary, T.secondary, T.accent, "#f9ca24", "#fd79a8"];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i, color: colors[i % colors.length],
      left: Math.random() * 100, delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.5, round: Math.random() > 0.5,
    }));
    setConfetti(pieces);
    showToast(t('completion'));
    setTimeout(() => setConfetti([]), 4500);
  }

  function playPop(type = "add") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(type === "add" ? 600 : 400, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(type === "add" ? 900 : 200, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  function addItem(name, qty = "") {
    if (!name.trim()) return;
    const trimmed = name.trim();
    const id = Date.now() + Math.random();
    setItems(prev => [{ id, name: trimmed, qty, emoji: getEmoji(trimmed), done: false }, ...prev]);
    setMemory(prev => [trimmed, ...prev.filter(m => m.toLowerCase() !== trimmed.toLowerCase())].slice(0, 100));
    setNewItemId(id);
    setTimeout(() => setNewItemId(null), 600);
    playPop("add");
  }

  function addManual() {
    if (!input.trim()) return;
    addItem(input);
    setInput("");
    showToast("✅ " + t('list.added'));
  }

  function toggle(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function deleteItem(id) {
    setRemovingId(id);
    playPop("remove");
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      setRemovingId(null);
    }, 350);
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
    showToast(t('clear.savedToHistory'));
  }

  function restoreList(entry) {
    setItems(entry.items.map(i => ({ ...i, done: false })));
    setPage("list");
    showToast("✅ " + t('history.restored'));
  }

  function shareList() {
    const todo = items.filter(i => !i.done);
    const done = items.filter(i => i.done);
    const title = t('themes.' + settings.theme);
    let text = T.icon + " " + title + "\n\n";
    if (todo.length) text += todo.map(i => i.emoji + " " + i.name + (i.qty ? " – " + i.qty : "")).join("\n");
    if (done.length) text += "\n\n✅ Done:\n" + done.map(i => "✓ " + i.name).join("\n");
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast("📋 " + t('list.copied'))).catch(() => showToast(t('list.couldntCopy')));
    }
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast(t('list.voiceNotSupported')); return; }
    if (listening) { try { voiceRef.current?.stop(); } catch {} return; }
    const recognition = new SR();
    voiceRef.current = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => { setListening(false); clearTimeout(voiceTimer.current); };
    recognition.onerror = () => { setListening(false); showToast(t('list.voiceNotSupported')); };
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      if (/\band\b|,|\n/i.test(text)) {
        const parts = text.split(/\band\b|,|\n/i).map(s => s.trim()).filter(Boolean);
        parts.forEach(p => addItem(p));
        showToast("✨ " + t('list.addedItems', { count: parts.length }));
      } else {
        setInput(text);
      }
    };
    try {
      recognition.start();
      voiceTimer.current = setTimeout(() => { try { recognition.stop(); } catch {} }, 5000);
    } catch { showToast(t('list.voiceNotSupported')); }
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
        showToast("🤔 " + t('list.noItemsFound'));
      } else {
        parsed.forEach(item => addItem(item.name, item.qty || ""));
        showToast("✨ " + t('list.addedItems', { count: parsed.length }));
      }
    } catch (err) {
      console.error(err);
      showToast("❌ " + t('list.couldntRead'));
    } finally {
      setLoading(false);
    }
  }

  const todo = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const pct = items.length ? Math.round(done.length / items.length * 100) : 0;
  const pageTitles = { list: t('themes.' + settings.theme), history: t('history.title'), settings: t('settings.title') };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 64 }}>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
        {confetti.map(c => (
          <div key={c.id} style={{
            position: "absolute", width: c.size || 9, height: c.size || 9, background: c.color,
            left: c.left + "vw", top: c.top !== undefined ? c.top + "vh" : undefined,
            borderRadius: c.round ? "50%" : 2,
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
            <div style={{ display: "flex" }}>
              <button onClick={shareList} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px 12px", fontFamily: T.font }}>{t('list.share')}</button>
              <button onClick={() => setShowClearModal(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px 12px", fontFamily: T.font }}>{t('list.clear')}</button>
            </div>
          )}
        </div>
        {page === "list" && items.length > 0 && (
          <div style={{ height: 3, background: "rgba(255,255,255,0.25)" }}>
            <div style={{ height: "100%", background: "rgba(255,255,255,0.85)", width: pct + "%", transition: "width 0.4s ease" }} />
          </div>
        )}
      </div>

      {page === "list" && (
        <ListPage
          T={T} isDark={isDark} loading={loading} suggestions={suggestions}
          input={input} setInput={setInput} addManual={addManual}
          startVoice={startVoice} listening={listening}
          showMenu={showMenu} setShowMenu={setShowMenu} fileRef={fileRef}
          addItem={addItem} showToast={showToast}
          todo={todo} done={done} toggle={toggle} deleteItem={deleteItem}
          doneOpen={doneOpen} setDoneOpen={setDoneOpen}
          newItemId={newItemId} removingId={removingId}
        />
      )}
      {page === "history" && (
        <HistoryPage T={T} isDark={isDark} history={history} restoreList={restoreList} />
      )}
      {page === "settings" && (
        <SettingsPage
          T={T} isDark={isDark} settings={settings} setSettings={setSettings}
          history={history} setHistory={setHistory}
          memory={memory} setMemory={setMemory} showToast={showToast}
        />
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div onClick={() => setShowClearModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500 }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto",
            background: T.surface, borderRadius: "24px 24px 0 0", padding: 24,
            animation: "slideUp 0.25s ease", fontFamily: T.font,
          }}>
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: isDark ? "rgba(255,255,255,0.9)" : "#212121", marginBottom: 8 }}>{t('clear.title')}</div>
            <div style={{ textAlign: "center", fontSize: 14, color: isDark ? "rgba(255,255,255,0.5)" : "#757575", marginBottom: 28, lineHeight: 1.5 }}>{t('clear.subtitle')}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowClearModal(false)} style={{
                flex: 1, padding: "14px 0", borderRadius: 14, cursor: "pointer", fontFamily: T.font,
                fontSize: 15, fontWeight: 700, background: "none",
                border: "2px solid " + (isDark ? "rgba(255,255,255,0.2)" : "#e0e0e0"),
                color: isDark ? "rgba(255,255,255,0.8)" : "#424242",
              }}>{t('clear.cancel')}</button>
              <button onClick={() => { clearAll(); setShowClearModal(false); }} style={{
                flex: 1, padding: "14px 0", borderRadius: 14, cursor: "pointer", fontFamily: T.font,
                fontSize: 15, fontWeight: 700, border: "none",
                background: T.primary, color: "white",
              }}>{t('clear.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: T.surface, zIndex: 100,
        boxShadow: isDark ? "0 -2px 12px rgba(0,0,0,0.5)" : "0 -2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #eeeeee",
      }}>
        {[
          { id: "list", icon: "🛒", label: t('nav.list') },
          { id: "history", icon: "📋", label: t('nav.history') },
          { id: "settings", icon: "⚙️", label: t('nav.settings') },
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
        div::-webkit-scrollbar { display: none; }
        @keyframes fall { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.88) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 4px rgba(229,57,53,0.3)} 50%{box-shadow:0 0 0 10px rgba(229,57,53,0.12)} }
        @keyframes itemPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.08);opacity:1} 80%{transform:scale(0.96)} 100%{transform:scale(1)} }
        @keyframes itemFadeOut { 0%{transform:translateX(0);opacity:1;max-height:60px} 100%{transform:translateX(60px);opacity:0;max-height:0;padding:0;margin:0} }
      `}</style>
    </div>
  );
}
