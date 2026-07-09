import { useState, useMemo } from "react";

// ── Mock data (virá do Supabase) ─────────────────────────────────────
const CATS_INICIAIS = [
  { id: "c1", name: "Reportagem", color: "#3F4A5C", count: 2 },
  { id: "c2", name: "Vídeo", color: "#B3261E", count: 1 },
  { id: "c3", name: "Podcast", color: "#6B4FA0", count: 1 },
  { id: "c4", name: "Fotojornalismo", color: "#1E6E5C", count: 1 },
  { id: "c5", name: "Dados", color: "#B36A00", count: 1 },
];

const PROJ_INICIAIS = [
  { id: "p1", titulo: "O último tropeiro da Cuesta", categoria: "Reportagem", veiculo: "Jornal da Unesp", data: "2026-05-12", status: "published", featured: true, arquivos: 2 },
  { id: "p2", titulo: "Minidoc: a feira livre que resiste há 90 anos", categoria: "Vídeo", veiculo: "TV Universitária", data: "2026-04-28", status: "published", featured: false, arquivos: 1 },
  { id: "p3", titulo: "Pauta Aberta #12 — Desinformação nas eleições", categoria: "Podcast", veiculo: "Independente", data: "2026-04-15", status: "published", featured: false, arquivos: 1 },
  { id: "p4", titulo: "Ensaio: a seca vista do fundo da represa", categoria: "Fotojornalismo", veiculo: "Exposição acadêmica", data: "2026-04-02", status: "draft", featured: true, arquivos: 14 },
];

const MSGS_INICIAIS = [
  { id: "m1", nome: "Carla Menezes", email: "carla@redacao.com.br", msg: "Olá Lucas! Gostei muito da matéria dos tropeiros. Temos uma vaga de estágio abrindo — podemos conversar?", data: "02 Jul 2026", lida: false },
  { id: "m2", nome: "Prof. Ricardo Tavares", email: "ricardo@unesp.br", msg: "Parabéns pelo ensaio fotográfico. Gostaria de usá-lo como exemplo em aula, com os devidos créditos.", data: "28 Jun 2026", lida: true },
];

const VAZIO = { titulo: "", categoria: "Reportagem", veiculo: "", data: "", resumo: "", link: "", status: "draft", featured: false };

export default function AdminPrototipo() {
  const [tela, setTela] = useState("projetos");
  const [projetos, setProjetos] = useState(PROJ_INICIAIS);
  const [cats, setCats] = useState(CATS_INICIAIS);
  const [msgs, setMsgs] = useState(MSGS_INICIAIS);
  const [editando, setEditando] = useState(null); // null | 'novo' | projeto
  const [form, setForm] = useState(VAZIO);
  const [novaCat, setNovaCat] = useState("");
  const [busca, setBusca] = useState("");

  const naoLidas = msgs.filter(m => !m.lida).length;
  const filtrados = useMemo(
    () => projetos.filter(p => p.titulo.toLowerCase().includes(busca.toLowerCase())),
    [projetos, busca]
  );

  const abrirNovo = () => { setForm(VAZIO); setEditando("novo"); };
  const abrirEdicao = (p) => {
    setForm({ titulo: p.titulo, categoria: p.categoria, veiculo: p.veiculo, data: p.data, resumo: p.resumo ?? "", link: p.link ?? "", status: p.status, featured: p.featured });
    setEditando(p);
  };
  const salvar = () => {
    if (!form.titulo.trim()) return;
    if (editando === "novo") {
      setProjetos([{ id: crypto.randomUUID(), ...form, arquivos: 0 }, ...projetos]);
    } else {
      setProjetos(projetos.map(p => (p.id === editando.id ? { ...p, ...form } : p)));
    }
    setEditando(null);
  };
  const excluir = (id) => setProjetos(projetos.filter(p => p.id !== id));
  const addCat = () => {
    if (!novaCat.trim()) return;
    setCats([...cats, { id: crypto.randomUUID(), name: novaCat.trim(), color: "#3F4A5C", count: 0 }]);
    setNovaCat("");
  };

  const MENU = [
    { id: "projetos", label: "Projetos", icon: "▤" },
    { id: "categorias", label: "Categorias", icon: "◧" },
    { id: "mensagens", label: `Mensagens${naoLidas ? ` (${naoLidas})` : ""}`, icon: "✉" },
    { id: "config", label: "Configurações", icon: "⚙" },
  ];

  return (
    <div className="ad-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .ad-root {
          --bg:#F5F6F8; --card:#FFF; --ink:#1F2937; --sub:#4B5563; --muted:#6B7280;
          --line:#E5E7EB; --slate:#3F4A5C; --slate-h:#2F3949; --ok:#0E7A4E; --warn:#B45309;
          display:flex; min-height:100vh; background:var(--bg); color:var(--ink);
          font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
        }
        /* Sidebar */
        .ad-side { width:236px; flex-shrink:0; background:#fff; border-right:1px solid var(--line); padding:22px 14px; display:flex; flex-direction:column; gap:4px; }
        .ad-brand { font-size:17px; font-weight:700; padding:4px 12px 18px; }
        .ad-brand small { display:block; font-size:11.5px; font-weight:500; color:var(--muted); margin-top:2px; }
        .ad-item { display:flex; align-items:center; gap:10px; background:none; border:none; cursor:pointer; text-align:left;
          font:500 14.5px 'Inter',sans-serif; color:var(--sub); padding:11px 12px; border-radius:10px; transition:background .12s,color .12s; }
        .ad-item:hover { background:#F0F1F4; color:var(--ink); }
        .ad-item[data-on="true"] { background:var(--slate); color:#fff; }
        .ad-item:focus-visible { outline:2px solid var(--slate); outline-offset:2px; }
        .ad-side-foot { margin-top:auto; font-size:12px; color:var(--muted); padding:12px; border-top:1px solid var(--line); }

        /* Main */
        .ad-main { flex:1; padding:30px 36px; min-width:0; }
        .ad-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
        .ad-h1 { font-size:24px; font-weight:700; letter-spacing:-.01em; margin:0; }
        .ad-btn { background:var(--slate); color:#fff; border:none; cursor:pointer; font:600 14px 'Inter',sans-serif;
          padding:11px 18px; border-radius:10px; transition:background .12s; }
        .ad-btn:hover { background:var(--slate-h); }
        .ad-btn:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
        .ad-btn-ghost { background:#fff; color:var(--sub); border:1px solid var(--line); }
        .ad-btn-ghost:hover { background:#F0F1F4; color:var(--ink); }
        .ad-btn-danger { background:#fff; color:#B3261E; border:1px solid #F1C4C0; }
        .ad-btn-danger:hover { background:#FDF2F1; }

        .ad-input, .ad-select, .ad-textarea { width:100%; box-sizing:border-box; background:#fff; border:1px solid #D1D5DB;
          border-radius:10px; font:400 14.5px 'Inter',sans-serif; color:var(--ink); padding:12px 14px; }
        .ad-input:focus, .ad-select:focus, .ad-textarea:focus { outline:none; border-color:var(--slate); box-shadow:0 0 0 3px rgba(63,74,92,.14); }
        .ad-textarea { min-height:110px; resize:vertical; }
        .ad-label { display:block; font-size:13.5px; font-weight:600; margin:0 0 6px; }
        .ad-field { margin-bottom:18px; }

        /* Tabela / lista */
        .ad-card { background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
        .ad-row { display:grid; grid-template-columns:1fr 130px 110px 120px 96px; gap:12px; align-items:center;
          padding:15px 20px; border-bottom:1px solid var(--line); font-size:14px; }
        .ad-row:last-child { border-bottom:none; }
        .ad-row-head { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); background:#FAFAFB; }
        .ad-titulo { font-weight:600; cursor:pointer; }
        .ad-titulo:hover { text-decoration:underline; }
        .ad-titulo small { display:block; font-weight:400; font-size:12.5px; color:var(--muted); margin-top:2px; }
        .ad-badge { font-size:11.5px; font-weight:600; border-radius:999px; padding:4px 10px; display:inline-block; }
        .ad-pub { background:#ECFDF5; color:var(--ok); }
        .ad-draft { background:#FEF6E7; color:var(--warn); }
        .ad-star { color:#B45309; font-size:13px; }
        .ad-acoes { display:flex; gap:8px; justify-content:flex-end; }
        .ad-mini { background:none; border:1px solid var(--line); border-radius:8px; cursor:pointer; padding:6px 10px;
          font:500 12.5px 'Inter',sans-serif; color:var(--sub); }
        .ad-mini:hover { background:#F0F1F4; color:var(--ink); }
        .ad-mini-danger { color:#B3261E; border-color:#F1C4C0; }
        .ad-mini-danger:hover { background:#FDF2F1; }

        /* Upload */
        .ad-drop { border:2px dashed #C7CCD4; border-radius:12px; padding:26px; text-align:center; color:var(--muted);
          font-size:14px; cursor:pointer; transition:border-color .15s, background .15s; }
        .ad-drop:hover { border-color:var(--slate); background:#FAFAFB; }
        .ad-drop b { display:block; color:var(--sub); margin-bottom:4px; }

        /* Form em duas colunas */
        .ad-form-grid { display:grid; grid-template-columns:2fr 1fr; gap:26px; align-items:start; }
        .ad-panel { background:#fff; border:1px solid var(--line); border-radius:14px; padding:24px; }
        .ad-check { display:flex; align-items:center; gap:10px; font-size:14.5px; margin-bottom:14px; cursor:pointer; }
        .ad-check input { width:17px; height:17px; accent-color:var(--slate); }

        /* Mensagens */
        .ad-msg { padding:18px 20px; border-bottom:1px solid var(--line); display:flex; gap:14px; align-items:flex-start; }
        .ad-msg:last-child { border-bottom:none; }
        .ad-msg[data-nova="true"] { background:#F6F8FC; }
        .ad-avatar { width:40px; height:40px; border-radius:50%; background:var(--slate); color:#fff; flex-shrink:0;
          display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:600; }
        .ad-msg-top { display:flex; justify-content:space-between; gap:10px; margin-bottom:4px; flex-wrap:wrap; }
        .ad-msg b { font-size:14.5px; }
        .ad-msg small { color:var(--muted); font-size:12.5px; }
        .ad-msg p { margin:4px 0 8px; font-size:14px; line-height:1.6; color:var(--sub); }
        .ad-dot { width:9px; height:9px; border-radius:50%; background:#2563EB; margin-top:6px; flex-shrink:0; }

        /* Categorias */
        .ad-cat-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--line); }
        .ad-cat-row:last-child { border-bottom:none; }
        .ad-swatch { width:20px; height:20px; border-radius:6px; flex-shrink:0; }
        .ad-cat-nome { font-weight:600; font-size:14.5px; flex:1; }
        .ad-cat-count { font-size:12.5px; color:var(--muted); }
        .ad-cat-add { display:flex; gap:10px; padding:16px 20px; border-top:1px solid var(--line); background:#FAFAFB; }

        @media (max-width:880px) {
          .ad-side { width:64px; padding:22px 8px; }
          .ad-brand, .ad-item span.lbl, .ad-side-foot { display:none; }
          .ad-form-grid { grid-template-columns:1fr; }
          .ad-row { grid-template-columns:1fr 96px; }
          .ad-row > :nth-child(2), .ad-row > :nth-child(3), .ad-row > :nth-child(4) { display:none; }
        }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className="ad-side">
        <div className="ad-brand">Portfólio<small>Painel do editor</small></div>
        {MENU.map(m => (
          <button key={m.id} className="ad-item" data-on={tela === m.id} onClick={() => { setTela(m.id); setEditando(null); }}>
            <span aria-hidden="true">{m.icon}</span><span className="lbl">{m.label}</span>
          </button>
        ))}
        <div className="ad-side-foot">Lucas Andrade<br />lucas@email.com</div>
      </aside>

      {/* ── Conteúdo ── */}
      <main className="ad-main">

        {/* PROJETOS: lista */}
        {tela === "projetos" && !editando && (
          <>
            <div className="ad-head">
              <h1 className="ad-h1">Projetos</h1>
              <div style={{ display: "flex", gap: 12, flex: 1, maxWidth: 480, justifyContent: "flex-end" }}>
                <input className="ad-input" style={{ maxWidth: 260 }} placeholder="Buscar projeto..."
                  value={busca} onChange={e => setBusca(e.target.value)} />
                <button className="ad-btn" onClick={abrirNovo}>+ Novo projeto</button>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-row ad-row-head">
                <span>Título</span><span>Categoria</span><span>Data</span><span>Status</span><span></span>
              </div>
              {filtrados.map(p => (
                <div key={p.id} className="ad-row">
                  <span className="ad-titulo" onClick={() => abrirEdicao(p)}>
                    {p.featured && <span className="ad-star" title="Destaque">★ </span>}{p.titulo}
                    <small>{p.veiculo} · {p.arquivos} arquivo{p.arquivos !== 1 ? "s" : ""}</small>
                  </span>
                  <span>{p.categoria}</span>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.data}</span>
                  <span><span className={`ad-badge ${p.status === "published" ? "ad-pub" : "ad-draft"}`}>
                    {p.status === "published" ? "Publicado" : "Rascunho"}</span></span>
                  <span className="ad-acoes">
                    <button className="ad-mini" onClick={() => abrirEdicao(p)}>Editar</button>
                    <button className="ad-mini ad-mini-danger" onClick={() => excluir(p.id)}>Excluir</button>
                  </span>
                </div>
              ))}
              {filtrados.length === 0 && (
                <div style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  Nenhum projeto encontrado. Clique em "+ Novo projeto" para começar.
                </div>
              )}
            </div>
          </>
        )}

        {/* PROJETOS: formulário */}
        {tela === "projetos" && editando && (
          <>
            <div className="ad-head">
              <h1 className="ad-h1">{editando === "novo" ? "Novo projeto" : "Editar projeto"}</h1>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="ad-btn ad-btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
                <button className="ad-btn" onClick={salvar}>Salvar</button>
              </div>
            </div>
            <div className="ad-form-grid">
              <div className="ad-panel">
                <div className="ad-field">
                  <label className="ad-label">Título *</label>
                  <input className="ad-input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
                </div>
                <div className="ad-field">
                  <label className="ad-label">Resumo (aparece no card)</label>
                  <textarea className="ad-textarea" value={form.resumo} onChange={e => setForm({ ...form, resumo: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="ad-field">
                    <label className="ad-label">Veículo</label>
                    <input className="ad-input" value={form.veiculo} onChange={e => setForm({ ...form, veiculo: e.target.value })} />
                  </div>
                  <div className="ad-field">
                    <label className="ad-label">Data de publicação</label>
                    <input className="ad-input" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  </div>
                </div>
                <div className="ad-field">
                  <label className="ad-label">Link da matéria original</label>
                  <input className="ad-input" placeholder="https://..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label className="ad-label">Arquivos do projeto</label>
                  <div className="ad-drop" onClick={() => alert("Aqui abrirá o seletor de arquivos → upload para o bucket project-files.")}>
                    <b>Arraste arquivos ou clique para enviar</b>
                    PDF da matéria, fotos, áudio, vídeo — funciona como backup permanente do clipping
                  </div>
                </div>
              </div>

              <div className="ad-panel">
                <div className="ad-field">
                  <label className="ad-label">Categoria</label>
                  <select className="ad-select" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    {cats.map(c => <option key={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ad-field">
                  <label className="ad-label">Status</label>
                  <select className="ad-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Rascunho (não aparece no site)</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
                <label className="ad-check">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                  Marcar como destaque
                </label>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label className="ad-label">Capa do projeto</label>
                  <div className="ad-drop" onClick={() => alert("Upload da capa → bucket public-assets.")}>
                    <b>Enviar imagem de capa</b> JPG ou PNG
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CATEGORIAS */}
        {tela === "categorias" && (
          <>
            <div className="ad-head"><h1 className="ad-h1">Categorias</h1></div>
            <div className="ad-card">
              {cats.map(c => (
                <div key={c.id} className="ad-cat-row">
                  <span className="ad-swatch" style={{ background: c.color }} />
                  <span className="ad-cat-nome">{c.name}</span>
                  <span className="ad-cat-count">{c.count} projeto{c.count !== 1 ? "s" : ""}</span>
                  <button className="ad-mini">Renomear</button>
                  <button className="ad-mini ad-mini-danger" onClick={() => setCats(cats.filter(x => x.id !== c.id))}>Excluir</button>
                </div>
              ))}
              <div className="ad-cat-add">
                <input className="ad-input" placeholder="Nova categoria..." value={novaCat}
                  onChange={e => setNovaCat(e.target.value)} />
                <button className="ad-btn" onClick={addCat}>Adicionar</button>
              </div>
            </div>
          </>
        )}

        {/* MENSAGENS */}
        {tela === "mensagens" && (
          <>
            <div className="ad-head"><h1 className="ad-h1">Mensagens recebidas</h1></div>
            <div className="ad-card">
              {msgs.map(m => (
                <div key={m.id} className="ad-msg" data-nova={!m.lida}>
                  {!m.lida && <span className="ad-dot" title="Não lida" />}
                  <span className="ad-avatar">{m.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>
                  <div style={{ flex: 1 }}>
                    <div className="ad-msg-top"><b>{m.nome} <small>· {m.email}</small></b><small>{m.data}</small></div>
                    <p>{m.msg}</p>
                    {!m.lida && (
                      <button className="ad-mini" onClick={() => setMsgs(msgs.map(x => x.id === m.id ? { ...x, lida: true } : x))}>
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CONFIGURAÇÕES */}
        {tela === "config" && (
          <>
            <div className="ad-head">
              <h1 className="ad-h1">Configurações do site</h1>
              <button className="ad-btn" onClick={() => alert("Salvará em site_settings.")}>Salvar alterações</button>
            </div>
            <div className="ad-form-grid">
              <div className="ad-panel">
                <div className="ad-field"><label className="ad-label">Nome completo</label>
                  <input className="ad-input" defaultValue="Lucas Andrade" /></div>
                <div className="ad-field"><label className="ad-label">Subtítulo</label>
                  <input className="ad-input" defaultValue="Estudante de Jornalismo" /></div>
                <div className="ad-field"><label className="ad-label">Bio (hero)</label>
                  <textarea className="ad-textarea" defaultValue="Olá! Meu nome é Lucas Andrade..." /></div>
                <div className="ad-field" style={{ marginBottom: 0 }}><label className="ad-label">Carta de apresentação</label>
                  <textarea className="ad-textarea" style={{ minHeight: 180 }} defaultValue="Eu não planejava me apaixonar por jornalismo..." /></div>
              </div>
              <div className="ad-panel">
                <div className="ad-field"><label className="ad-label">Email de contato</label>
                  <input className="ad-input" defaultValue="lucas@email.com" /></div>
                <div className="ad-field"><label className="ad-label">Cidade</label>
                  <input className="ad-input" defaultValue="Botucatu, SP" /></div>
                <div className="ad-field"><label className="ad-label">Foto de perfil</label>
                  <div className="ad-drop" onClick={() => alert("Upload → public-assets")}><b>Enviar foto</b></div></div>
                <div className="ad-field" style={{ marginBottom: 0 }}><label className="ad-label">Banner do topo</label>
                  <div className="ad-drop" onClick={() => alert("Upload → public-assets")}><b>Enviar banner</b></div></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
