import { useState, useRef, useEffect } from "react";


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

export default function ShoppingList() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopItems") || "[]");
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef();
  const toastTimer = useRef();
  const menuRef = useRef();

  useEffect(() => {
    localStorage.setItem("shopItems", JSON.stringify(items));
    const total = items.length;
    const doneCount = items.filter(i => i.done).length;
    if (total > 0 && doneCount === total) triggerConfetti();
  }, [items]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function triggerConfetti() {
    const colors = ["#f9ca24","#f0932b","#2ecc71","#686de0","#fd79a8","#eb4d4b"];
    const pieces = Array.from({length: 55}, (_, i) => ({
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
    setItems(prev => prev.map(i => i.id === id ? {...i, done: !i.done} : i));
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearAll() {
    if (items.length === 0) return;
    if (confirm("Clear the whole list?")) { setItems([]); showToast("🗑️ Cleared!"); }
  }

  function shareList() {
    const todo = items.filter(i => !i.done);
    const done = items.filter(i => i.done);
    let text = "🛒 Shopping List\n\n";
    if (todo.length) text += todo.map(i => `${i.emoji} ${i.name}${i.qty ? " – " + i.qty : ""}`).join("\n");
    if (done.length) text += "\n\n✅ Done:\n" + done.map(i => `✓ ${i.name}`).join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("📋 Copied!"))
      .catch(() => showToast("Couldn't copy"));
  }

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "image/jpeg";
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaType,
          imageData: base64,
          prompt: `Extract any shopping list items from this image. Return ONLY a JSON array, no markdown, no explanation. Each object: {"name":"item name","qty":"quantity if visible else empty string"}. Example: [{"name":"Milk","qty":"2L"},{"name":"Bread","qty":""}]. If nothing found return [].`
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast("🤔 No items found in image");
      } else {
        parsed.forEach(item => addItem(item.name, item.qty || ""));
        showToast(`✨ Added ${parsed.length} items!`);
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

  const ItemRow = ({ item }) => (
    <div style={{
      background:"white", borderRadius:16, padding:"13px 14px",
      display:"flex", alignItems:"center", gap:11,
      boxShadow:"0 3px 14px rgba(0,0,0,0.07)",
      borderLeft: item.done ? "4px solid #2ecc71" : "4px solid transparent",
      opacity: item.done ? 0.55 : 1, marginBottom:10,
    }}>
      <button onClick={() => toggle(item.id)} style={{
        width:36, height:36, borderRadius:"50%",
        border: item.done ? "none" : "2.5px solid #e0e0e0",
        background: item.done ? "#2ecc71" : "white",
        cursor:"pointer", fontSize:18, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900,
      }}>{item.done ? "✓" : ""}</button>
      <span style={{fontSize:24, flexShrink:0}}>{item.emoji}</span>
      <span style={{flex:1, fontSize:16, fontWeight:700, fontFamily:"Nunito,sans-serif",
        textDecoration: item.done ? "line-through" : "none", color: item.done ? "#b2bec3" : "#2d3436"
      }}>{item.name}</span>
      {item.qty && <span style={{
        fontSize:12, fontWeight:800, color:"white",
        background:"#f0932b", padding:"2px 8px", borderRadius:10, flexShrink:0
      }}>{item.qty}</span>}
      <button onClick={() => deleteItem(item.id)} style={{
        background:"none", border:"none", fontSize:17, cursor:"pointer",
        opacity:0.35, padding:4, color:"#2d3436"
      }}>✕</button>
    </div>
  );

  return (
    <div style={{fontFamily:"Nunito,sans-serif", background:"#fef9f0", minHeight:"100vh", maxWidth:430, margin:"0 auto", paddingBottom:110}}>

      {/* Confetti */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
        {confetti.map(c => (
          <div key={c.id} style={{
            position:"absolute", width:10, height:10, background:c.color,
            left:c.left+"vw", borderRadius: c.round ? "50%" : 2,
            animation:`fall ${c.dur}s ${c.delay}s linear forwards`,
          }}/>
        ))}
      </div>

      {/* Toast */}
      {toast && <div style={{
        position:"fixed", top:18, left:"50%", transform:"translateX(-50%)",
        background:"#2d3436", color:"white", padding:"11px 20px",
        borderRadius:16, fontSize:14, fontWeight:700, zIndex:1000,
        boxShadow:"0 6px 24px rgba(0,0,0,0.2)", whiteSpace:"nowrap",
      }}>{toast}</div>}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#f9ca24,#f0932b)", padding:"20px 20px 34px", position:"relative", overflow:"hidden"}}>
        <div style={{position:"absolute", bottom:-18, left:0, right:0, height:36, background:"#fef9f0", borderRadius:"50% 50% 0 0 / 100% 100% 0 0"}}/>
        <div style={{position:"relative", zIndex:1}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"Fredoka One,cursive", fontSize:28, color:"white", textShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>🛒 My Shopping List</div>
              <div style={{color:"rgba(255,255,255,0.85)", fontSize:13, fontWeight:600, marginTop:3}}>Let's go shopping! 🌟</div>
            </div>
            <div style={{fontSize:36}}>🛍️</div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{display:"flex", justifyContent:"space-between", color:"white", fontSize:12, fontWeight:700, marginBottom:5}}>
              <span>{done.length} of {items.length} items</span>
              <span>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.3)", borderRadius:20, height:10, overflow:"hidden"}}>
              <div style={{height:"100%", background:"white", borderRadius:20, width:pct+"%", transition:"width 0.4s cubic-bezier(.34,1.56,.64,1)"}}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:"24px 16px 0"}}>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImage}/>

        {/* AI Loading */}
        {loading && (
          <div style={{background:"white", borderRadius:16, padding:16, marginBottom:20, boxShadow:"0 3px 14px rgba(0,0,0,0.07)", textAlign:"center"}}>
            <div style={{fontSize:14, fontWeight:700, color:"#686de0"}}>🤖 AI is reading your list...</div>
            <div style={{display:"flex", gap:5, justifyContent:"center", marginTop:8}}>
              {[0,1,2].map(i => <div key={i} style={{width:8,height:8,background:"#686de0",borderRadius:"50%",animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}

        {/* Input + popover */}
        <div style={{display:"flex", gap:10, marginBottom:20, position:"relative"}}>
          <input
            className="add-input-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addManual()}
            placeholder="Add item manually..."
            style={{flex:1, background:"white", border:"2.5px solid #e0e0e0", borderRadius:14, padding:"13px 16px", fontFamily:"Nunito,sans-serif", fontSize:15, fontWeight:700, color:"#2d3436", outline:"none"}}
          />
          <div style={{position:"relative", flexShrink:0}} ref={menuRef}>
            <button
              onClick={() => { if (input.trim()) { addManual(); } else { setShowMenu(m => !m); } }}
              style={{
                background: showMenu ? "#27ae60" : "#2ecc71", border:"none", borderRadius:14,
                width:52, height:52, fontSize:26, cursor:"pointer",
                boxShadow:"0 4px 14px rgba(46,204,113,0.4)", color:"white", transition:"background 0.2s",
              }}
            >+</button>

            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:199}}/>
                <div style={{position:"absolute", bottom:60, right:0, background:"white", borderRadius:18, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", overflow:"hidden", zIndex:200, minWidth:200, animation:"popIn 0.18s cubic-bezier(.34,1.56,.64,1)"}}>
                  <div onClick={() => { setShowMenu(false); setTimeout(() => document.querySelector(".add-input-field")?.focus(), 50); }}
                    style={{display:"flex", alignItems:"center", gap:12, padding:"15px 18px", cursor:"pointer", borderBottom:"1px solid #f0f0f0"}}
                    onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
                    onMouseLeave={e => e.currentTarget.style.background="white"}>
                    <span style={{fontSize:24, width:32, textAlign:"center"}}>✏️</span>
                    <div>
                      <div style={{fontWeight:800, fontSize:14, color:"#2d3436"}}>Type an item</div>
                      <div style={{fontSize:12, color:"#b2bec3", fontWeight:600}}>Add manually</div>
                    </div>
                  </div>
                  <div onClick={() => { setShowMenu(false); fileRef.current.click(); }}
                    style={{display:"flex", alignItems:"center", gap:12, padding:"15px 18px", cursor:"pointer"}}
                    onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
                    onMouseLeave={e => e.currentTarget.style.background="white"}>
                    <span style={{fontSize:24, width:32, textAlign:"center"}}>📸</span>
                    <div>
                      <div style={{fontWeight:800, fontSize:14, color:"#2d3436"}}>Scan a photo</div>
                      <div style={{fontSize:12, color:"#b2bec3", fontWeight:600}}>AI reads the list</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* To buy */}
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
          <span style={{fontFamily:"Fredoka One,cursive", fontSize:20}}>To buy</span>
          <span style={{background:"#f0932b", color:"white", fontSize:12, fontWeight:800, padding:"2px 9px", borderRadius:20}}>{todo.length}</span>
        </div>

        {todo.length === 0 && done.length === 0 && (
          <div style={{textAlign:"center", padding:"40px 20px"}}>
            <div style={{fontSize:56, marginBottom:12}}>🧺</div>
            <div style={{fontFamily:"Fredoka One,cursive", fontSize:22, marginBottom:6}}>List is empty!</div>
            <div style={{fontSize:14, color:"#b2bec3", fontWeight:600}}>Tap + to add items or scan a photo</div>
          </div>
        )}

        {todo.map(item => <ItemRow key={item.id} item={item}/>)}

        {done.length > 0 && (
          <div style={{marginTop:16}}>
            <button onClick={() => setDoneOpen(o => !o)} style={{background:"none", border:"none", display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:10, padding:0}}>
              <span style={{fontFamily:"Fredoka One,cursive", fontSize:18, color:"#b2bec3"}}>✅ Done ({done.length})</span>
              <span style={{color:"#b2bec3", transition:"transform 0.3s", transform: doneOpen?"rotate(180deg)":"none"}}>▼</span>
            </button>
            {doneOpen && done.map(item => <ItemRow key={item.id} item={item}/>)}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"white", padding:"14px 16px", boxShadow:"0 -4px 20px rgba(0,0,0,0.08)", display:"flex", gap:12, zIndex:100}}>
        <button onClick={clearAll} style={{flex:1, background:"#fff0f0", border:"none", borderRadius:14, padding:14, fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:800, color:"#eb4d4b", cursor:"pointer"}}>🗑️ Clear</button>
        <button onClick={shareList} style={{flex:2, background:"linear-gradient(135deg,#2ecc71,#27ae60)", border:"none", borderRadius:14, padding:14, fontFamily:"Nunito,sans-serif", fontSize:14, fontWeight:800, color:"white", cursor:"pointer", boxShadow:"0 4px 14px rgba(46,204,113,0.35)"}}>📋 Copy List</button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Fredoka+One&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus { border-color: #2ecc71 !important; }
        @keyframes fall { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.85) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}
