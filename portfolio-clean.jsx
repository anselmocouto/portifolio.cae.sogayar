import { useState, useMemo } from "react";

// ── Dados fictícios (virão do Supabase) ──────────────────────────────
const PERFIL = {
  nome: "Lucas Andrade",
  headline: "Estudante de Jornalismo",
  bio: "Olá! Meu nome é Lucas Andrade, sou estudante de Jornalismo em Botucatu, SP. Atualmente colaboro com o jornal-laboratório da universidade e produzo reportagens, vídeos e podcasts. Leia minha carta de apresentação abaixo!",
  cidade: "Botucatu, SP",
  email: "lucas.andrade@email.com",
  statement: `Eu não planejava me apaixonar por jornalismo. Quando entrei na universidade, imaginava seguir outro caminho — mas bastou a primeira apuração de rua, gravador na mão e caderno no bolso, para entender que contar histórias reais era o que eu queria fazer.

Desde então, venho construindo um repertório que passa pela reportagem escrita, pelo vídeo documental, pelo podcast e pelo jornalismo de dados. Cada formato me ensinou algo diferente: a escrita me deu rigor, o vídeo me deu olhar, o áudio me deu escuta, e os dados me deram ceticismo saudável.

Este portfólio reúne os trabalhos que melhor representam essa trajetória — e que continuam me lembrando por que escolhi esta profissão.`,
};

const CATEGORIAS = ["Reportagem", "Vídeo", "Podcast", "Fotojornalismo", "Dados"];

const PROJETOS = [
  { id: 1, categoria: "Reportagem", titulo: "O último tropeiro da Cuesta: memória e estrada na Serra de Botucatu", veiculo: "Jornal da Unesp", data: "Mai 2026", resumo: "Perfil de fôlego sobre o ofício em extinção dos tropeiros, com três semanas de apuração em campo." },
  { id: 2, categoria: "Vídeo", titulo: "Minidoc: a feira livre que resiste há 90 anos", veiculo: "TV Universitária", data: "Abr 2026", resumo: "Documentário de 8 minutos — roteiro, captação e edição." },
  { id: 3, categoria: "Podcast", titulo: "Pauta Aberta #12 — Desinformação nas eleições municipais", veiculo: "Podcast independente", data: "Abr 2026", resumo: "Episódio com dois pesquisadores convidados. Pauta, roteiro e apresentação." },
  { id: 4, categoria: "Fotojornalismo", titulo: "Ensaio: a seca vista do fundo da represa", veiculo: "Exposição acadêmica", data: "Abr 2026", resumo: "Série de 14 fotografias sobre o nível histórico da represa do Rio Pardo." },
  { id: 5, categoria: "Dados", titulo: "Onde o SUS demora mais: análise das filas de especialidades", veiculo: "Trabalho acadêmico", data: "Mar 2026", resumo: "Raspagem e análise de dados públicos, com visualizações interativas." },
  { id: 6, categoria: "Reportagem", titulo: "Estudantes de baixa renda e a conta que não fecha no bandejão", veiculo: "Agência do campus", data: "Mar 2026", resumo: "Matéria investigativa sobre o reajuste do restaurante universitário." },
];

export default function PortfolioClean() {
  const [categoriaAtiva, setCategoriaAtiva] = useState(null); // null = todas
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" });
  const [enviado, setEnviado] = useState(false);

  const visiveis = useMemo(
    () => (categoriaAtiva ? PROJETOS.filter(p => p.categoria === categoriaAtiva) : PROJETOS),
    [categoriaAtiva]
  );

  const irPara = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="pc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .pc-root {
          --bg: #F5F6F8;
          --card: #FFFFFF;
          --ink: #1F2937;
          --sub: #4B5563;
          --muted: #6B7280;
          --line: #E5E7EB;
          --slate: #3F4A5C;
          --slate-hover: #2F3949;
          background: var(--bg); color: var(--ink);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh; -webkit-font-smoothing: antialiased;
          scroll-behavior: smooth;
        }
        .pc-wrap { max-width: 1160px; margin: 0 auto; padding: 0 32px; }

        /* Navbar */
        .pc-nav {
          position: sticky; top: 0; z-index: 40;
          background: #fff; border-bottom: 1px solid var(--line);
        }
        .pc-nav-inner {
          max-width: 1160px; margin: 0 auto; padding: 18px 32px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pc-logo { font-size: 20px; font-weight: 700; letter-spacing: -.01em; cursor: pointer; }
        .pc-links { display: flex; gap: 30px; flex-wrap: wrap; }
        .pc-link {
          background: none; border: none; cursor: pointer;
          font: 500 15px 'Inter', sans-serif; color: var(--sub);
          padding: 4px 2px; border-bottom: 2px solid transparent;
          transition: color .15s, border-color .15s;
        }
        .pc-link:hover { color: var(--ink); }
        .pc-link[data-on="true"] { color: var(--ink); border-color: var(--slate); }
        .pc-link:focus-visible { outline: 2px solid var(--slate); outline-offset: 3px; }

        /* Hero */
        .pc-hero {
          display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px;
          align-items: center; padding: 88px 0 96px;
        }
        .pc-h1 {
          font-size: clamp(44px, 5.5vw, 68px); font-weight: 700;
          letter-spacing: -.025em; line-height: 1.06; margin: 0 0 10px;
        }
        .pc-sub { font-size: 26px; font-weight: 500; color: #34405A; margin: 0 0 26px; }
        .pc-bio { font-size: 17px; line-height: 1.75; color: var(--sub); max-width: 54ch; margin: 0 0 30px; }
        .pc-btn {
          display: inline-block; background: var(--slate); color: #fff; border: none; cursor: pointer;
          font: 600 15px 'Inter', sans-serif; padding: 14px 26px; border-radius: 10px;
          box-shadow: 0 2px 8px rgba(31,41,55,.18);
          transition: background .15s, transform .15s;
        }
        .pc-btn:hover { background: var(--slate-hover); transform: translateY(-1px); }
        .pc-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

        .pc-foto {
          border-radius: 18px; overflow: hidden; aspect-ratio: 4/4.4;
          background: linear-gradient(160deg, #C8853A, #8A5A22 55%, #5A3A14);
          position: relative; box-shadow: 0 10px 34px rgba(31,41,55,.14);
          display: flex; align-items: flex-end; justify-content: center;
        }
        .pc-foto-ini {
          font-size: 120px; font-weight: 700; color: rgba(255,255,255,.9);
          margin-bottom: 24px; letter-spacing: -.02em;
        }
        .pc-foto-hint {
          position: absolute; top: 14px; left: 14px;
          background: rgba(0,0,0,.35); color: #fff; font-size: 12px; font-weight: 500;
          border-radius: 8px; padding: 6px 10px;
        }

        /* Seções */
        .pc-section-title {
          font-size: 38px; font-weight: 700; letter-spacing: -.02em;
          text-align: center; margin: 0 0 44px;
        }
        .pc-projetos { padding: 72px 0; }

        .pc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 24px; }
        .pc-card {
          background: var(--card); border: 1px solid var(--line); border-radius: 14px;
          padding: 26px; display: flex; flex-direction: column; gap: 12px;
          cursor: pointer; transition: box-shadow .18s, transform .18s;
        }
        .pc-card:hover { box-shadow: 0 10px 28px rgba(31,41,55,.10); transform: translateY(-2px); }
        .pc-card-cat { font-size: 12.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); }
        .pc-card h3 { font-size: 19px; font-weight: 600; line-height: 1.4; letter-spacing: -.01em; margin: 0; }
        .pc-card p { font-size: 14.5px; line-height: 1.65; color: var(--sub); margin: 0; flex: 1; }
        .pc-card-foot { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 12px; }

        /* Statement */
        .pc-statement { background: #fff; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 80px 0; }
        .pc-statement-body { max-width: 760px; margin: 0 auto; }
        .pc-statement-body p { font-size: 17.5px; line-height: 1.85; color: var(--sub); margin: 0 0 26px; }

        /* Contato */
        .pc-contato { padding: 80px 0 96px; }
        .pc-contato-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 64px; align-items: start; }
        .pc-info { display: flex; gap: 18px; margin-bottom: 34px; align-items: flex-start; }
        .pc-info-icon {
          width: 54px; height: 54px; flex-shrink: 0; border-radius: 12px;
          background: var(--slate); color: #fff; display: flex; align-items: center;
          justify-content: center; font-size: 22px;
        }
        .pc-info b { font-size: 19px; font-weight: 700; display: block; margin-bottom: 4px; }
        .pc-info span { font-size: 15.5px; color: var(--sub); }

        .pc-label { display: block; font-size: 15px; font-weight: 500; margin: 0 0 8px; }
        .pc-input, .pc-textarea {
          width: 100%; box-sizing: border-box; background: #fff;
          border: 1px solid #D1D5DB; border-radius: 10px;
          font: 400 15px 'Inter', sans-serif; color: var(--ink);
          padding: 14px 16px; margin-bottom: 22px;
          transition: border-color .15s, box-shadow .15s;
        }
        .pc-input:focus, .pc-textarea:focus {
          outline: none; border-color: var(--slate);
          box-shadow: 0 0 0 3px rgba(63,74,92,.14);
        }
        .pc-textarea { min-height: 150px; resize: vertical; }
        .pc-ok { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; border-radius: 10px; padding: 14px 16px; font-size: 14.5px; }

        .pc-footer { border-top: 1px solid var(--line); padding: 26px 0; text-align: center; font-size: 13.5px; color: var(--muted); }

        @media (max-width: 860px) {
          .pc-hero { grid-template-columns: 1fr; gap: 40px; padding: 56px 0 64px; }
          .pc-contato-grid { grid-template-columns: 1fr; gap: 40px; }
          .pc-links { gap: 18px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pc-root { scroll-behavior: auto; }
          .pc-card, .pc-btn { transition: none; }
        }
      `}</style>

      {/* ── Navbar com categorias ── */}
      <nav className="pc-nav">
        <div className="pc-nav-inner">
          <span className="pc-logo" onClick={() => { setCategoriaAtiva(null); irPara("topo"); }}>Portfólio</span>
          <div className="pc-links">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                className="pc-link"
                data-on={categoriaAtiva === cat}
                onClick={() => { setCategoriaAtiva(cat); irPara("projetos"); }}
              >
                {cat}
              </button>
            ))}
            <button className="pc-link" onClick={() => irPara("contato")}>Contato</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="pc-wrap" id="topo">
        <section className="pc-hero">
          <div>
            <h1 className="pc-h1">{PERFIL.nome}</h1>
            <p className="pc-sub">{PERFIL.headline}</p>
            <p className="pc-bio">{PERFIL.bio}</p>
            <button className="pc-btn" onClick={() => irPara("statement")}>Carta de Apresentação</button>
          </div>
          <div className="pc-foto">
            <span className="pc-foto-hint">foto de perfil (Storage)</span>
            <span className="pc-foto-ini">LA</span>
          </div>
        </section>
      </header>

      {/* ── Projetos ── */}
      <main className="pc-wrap pc-projetos" id="projetos">
        <h2 className="pc-section-title">
          {categoriaAtiva ? categoriaAtiva : "Projetos"}
        </h2>
        <div className="pc-grid">
          {visiveis.map(p => (
            <article key={p.id} className="pc-card">
              <span className="pc-card-cat">{p.categoria}</span>
              <h3>{p.titulo}</h3>
              <p>{p.resumo}</p>
              <div className="pc-card-foot">
                <span>{p.veiculo}</span>
                <span>{p.data}</span>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* ── Carta de apresentação ── */}
      <section className="pc-statement" id="statement">
        <div className="pc-wrap">
          <h2 className="pc-section-title">Carta de Apresentação</h2>
          <div className="pc-statement-body">
            {PERFIL.statement.split("\n\n").map((par, i) => <p key={i}>{par}</p>)}
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section className="pc-wrap pc-contato" id="contato">
        <h2 className="pc-section-title">Entre em Contato</h2>
        <div className="pc-contato-grid">
          <div>
            <div className="pc-info">
              <span className="pc-info-icon">✉</span>
              <div><b>Email</b><span>{PERFIL.email}</span></div>
            </div>
            <div className="pc-info">
              <span className="pc-info-icon">📍</span>
              <div><b>Localização</b><span>{PERFIL.cidade}</span></div>
            </div>
          </div>

          <div>
            {enviado ? (
              <div className="pc-ok">Mensagem enviada! Obrigado pelo contato — respondo em breve.</div>
            ) : (
              <div>
                <label className="pc-label">Nome</label>
                <input className="pc-input" placeholder="Seu nome"
                  value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                <label className="pc-label">Email</label>
                <input className="pc-input" placeholder="seu.email@exemplo.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label className="pc-label">Mensagem</label>
                <textarea className="pc-textarea" placeholder="Sua mensagem..."
                  value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })} />
                <button className="pc-btn" onClick={() => setEnviado(true)}>Enviar mensagem</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="pc-footer">
        © 2026 {PERFIL.nome} · Portfólio de Jornalismo
      </footer>
    </div>
  );
}
