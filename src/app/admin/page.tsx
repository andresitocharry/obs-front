"use client";

import { useEffect, useState } from "react";
import {
  Database, ShieldCheck, Loader2, ArrowLeft, LogOut,
  Users, UserPlus, X, AlertTriangle, ChevronRight,
  Layers, GitBranch, BookOpen, Tag, Activity, CheckCircle2, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

interface User { id: string; username: string; role: string; created_at: string; }

interface Variable {
  id: string; nombre_analisis: string; nombre_bd: string;
  tipo_dato?: string; basica: boolean;
}

interface Evento {
  id: string; nombre: string; descripcion?: string; activo: boolean;
  fecha_inicio?: string; fecha_fin?: string;
}

interface Fase {
  id: string; nombre_analisis: string; nombre_bd: string; descripcion?: string;
  num_fase: number; ultimo: boolean; activo: boolean;
  fecha_inicio?: string; fecha_fin?: string;
}

interface Episodio {
  id: string; nombre_analisis: string; nombre_bd: string; descripcion?: string;
  activo: boolean; fecha_inicio?: string; fecha_fin?: string;
}

type TabId = "mapa" | "variables" | "eventos" | "fases" | "episodios" | "users";

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("mapa");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userError, setUserError] = useState("");
  const [newUserForm, setNewUserForm] = useState({ username: "", password: "", role: "foundation" });
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const getToken = () => localStorage.getItem("token") || "";
  const authH = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchTab(tab);
  }, [tab]);

  const fetchTab = async (t: TabId) => {
    setLoading(true);
    try {
      const endpoints: Partial<Record<TabId, string>> = {
        variables: "/api/v1/efeti/variables",
        eventos:   "/api/v1/efeti/eventos",
        fases:     "/api/v1/efeti/fases",
        episodios: "/api/v1/efeti/episodios",
        users:     "/api/v1/admin/users",
        mapa:      "/api/v1/efeti/variables",
      };
      const url = endpoints[t];
      if (!url) { setLoading(false); return; }

      const res = await fetch(`${API_URL}${url}`, { headers: authH() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (t === "variables" || t === "mapa") setVariables(data);
      else if (t === "eventos") setEventos(data);
      else if (t === "fases") setFases(data);
      else if (t === "episodios") setEpisodios(data);
      else if (t === "users") setUsers(data);

      // For mapa, also fetch fases and eventos
      if (t === "mapa") {
        const [fasesRes, eventosRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/efeti/fases`, { headers: authH() }),
          fetch(`${API_URL}/api/v1/efeti/eventos`, { headers: authH() }),
        ]);
        if (fasesRes.ok) setFases(await fasesRes.json());
        if (eventosRes.ok) setEventos(await eventosRes.json());
      }
    } catch (e) {
      console.error("fetchTab error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault(); setUserError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify(newUserForm),
      });
      if (res.ok) { setUserModalOpen(false); setNewUserForm({ username: "", password: "", role: "foundation" }); fetchTab("users"); }
      else { const d = await res.json(); setUserError(d.detail || "Error al crear usuario."); }
    } catch { setUserError("Error de conexión."); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeVars = variables.length;
  const basicaVars = variables.filter(v => v.basica).length;
  const activeFases = fases.filter(f => f.activo).length;
  const activeEventos = eventos.filter(e => e.activo).length;

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; Icon: any }[] = [
    { id: "mapa",      label: "Mapa EFETI",  Icon: Layers },
    { id: "variables", label: "Variables",   Icon: Database },
    { id: "eventos",   label: "Eventos",     Icon: Tag },
    { id: "fases",     label: "Fases",       Icon: GitBranch },
    { id: "episodios", label: "Episodios",   Icon: BookOpen },
    { id: "users",     label: "Usuarios",    Icon: Users },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Nav */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Portal Inicio
          </Link>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="flex items-center text-sm font-bold text-red-500 hover:text-red-700">
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center">
            <ShieldCheck className="mr-3 h-10 w-10 text-indigo-600" />
            Gobernanza EFETI
          </h1>
          <p className="mt-2 text-slate-500 font-medium text-lg">Modelo de Metadatos — Programa Canguro.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Variables Activas",  value: activeVars,   color: "text-indigo-600",  Icon: Database },
            { label: "Variables Básicas",  value: basicaVars,   color: "text-emerald-500", Icon: CheckCircle2 },
            { label: "Fases Activas",      value: activeFases,  color: "text-violet-600",  Icon: GitBranch },
            { label: "Eventos Activos",    value: activeEventos,color: "text-amber-500",   Icon: Tag },
          ].map(s => (
            <div key={s.label} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{loading && s.value === 0 ? "—" : s.value}</p>
              </div>
              <s.Icon className="text-slate-200" size={22} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center text-sm ${
                tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <t.Icon className="mr-2 h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MAPA EFETI ── */}
        {tab === "mapa" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 uppercase">Mapa del Modelo EFETI</h2>
            <p className="text-slate-500 font-medium -mt-3">Jerarquía clínica: Eventos → Fases → Variables del Protocolo Canguro.</p>

            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" size={32} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Events summary card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
                  <Tag size={32} className="mb-4 opacity-80" />
                  <h3 className="text-3xl font-black">{eventos.length}</h3>
                  <p className="font-black uppercase tracking-wider mt-1 opacity-80 text-sm">Eventos Clínicos</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {eventos.slice(0, 5).map(e => (
                      <span key={e.id} className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${e.activo ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
                        {e.nombre.slice(0, 16)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fases summary */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100">
                  <GitBranch size={32} className="mb-4 text-violet-500" />
                  <h3 className="text-3xl font-black text-slate-900">{fases.length}</h3>
                  <p className="font-black uppercase tracking-wider mt-1 text-slate-400 text-sm">Fases del Protocolo</p>
                  <div className="mt-4 space-y-2">
                    {fases.filter(f => f.activo).slice(0, 4).map(f => (
                      <div key={f.id} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">{f.nombre_analisis}</span>
                        {f.ultimo && <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Última</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables density card */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100">
                  <Database size={32} className="mb-4 text-emerald-500" />
                  <h3 className="text-3xl font-black text-slate-900">{variables.length}</h3>
                  <p className="font-black uppercase tracking-wider mt-1 text-slate-400 text-sm">Variables Totales</p>
                  <div className="grid grid-cols-10 gap-1 mt-4">
                    {variables.slice(0, 60).map((v, i) => (
                      <div key={i} className={`h-2 w-2 rounded-full ${v.basica ? "bg-emerald-400" : "bg-indigo-100"}`} title={v.nombre_bd} />
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 mt-4 text-[10px] font-black text-slate-400 uppercase">
                    <span className="flex items-center"><span className="h-2 w-2 bg-emerald-400 rounded-full mr-1.5" />Básica</span>
                    <span className="flex items-center"><span className="h-2 w-2 bg-indigo-100 rounded-full mr-1.5" />Seguimiento</span>
                  </div>
                </div>

                {/* Tipo dato breakdown */}
                {["int", "float", "str"].map(tipo => {
                  const count = variables.filter(v => v.tipo_dato === tipo).length;
                  return (
                    <div key={tipo} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-5">
                      <div className="p-4 bg-slate-50 rounded-2xl text-slate-500">
                        <Activity size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">{count}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Tipo <span className="font-mono text-indigo-600">{tipo}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VARIABLES ── */}
        {tab === "variables" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">Diccionario de Variables</h2>
                <p className="text-slate-400 text-sm mt-1">{variables.length} totales · {variables.filter(v => v.basica).length} básicas</p>
              </div>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">SCD Tipo 2</span>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Variable BD", "Nombre Display", "Tipo", "Flags", "Estado"].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></td></tr>
                  ) : variables.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900">{v.nombre_bd}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{v.nombre_analisis || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-black rounded font-mono uppercase">{v.tipo_dato ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {v.basica && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase">Básica</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center text-[10px] font-black uppercase text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-emerald-500" />Activa
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EVENTOS ── */}
        {tab === "eventos" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase">Eventos Clínicos</h2>
              <p className="text-slate-400 text-sm mt-1">Hitos del protocolo de seguimiento Canguro.</p>
            </div>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {eventos.map(ev => (
                  <div key={ev.id} className={`bg-white p-7 rounded-[2rem] border shadow-lg transition-all hover:shadow-xl ${ev.activo ? "border-slate-100 shadow-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Tag size={22} /></div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ev.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {ev.activo ? "Activo" : "Histórico"}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg uppercase">{ev.nombre}</h3>
                    {ev.descripcion && <p className="text-slate-500 text-sm mt-2">{ev.descripcion}</p>}
                    {(ev.fecha_inicio || ev.fecha_fin) && (
                      <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 space-x-2">
                        <Clock size={12} />
                        <span>{ev.fecha_inicio ?? "?"} → {ev.fecha_fin ?? "vigente"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FASES ── */}
        {tab === "fases" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase">Fases del Protocolo</h2>
              <p className="text-slate-400 text-sm mt-1">Etapas clínicas del Programa Madre Canguro.</p>
            </div>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {fases.map(f => (
                  <div key={f.id} className={`bg-white p-7 rounded-[2rem] border shadow-lg transition-all hover:shadow-xl ${f.activo ? "border-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-violet-50 text-violet-500 rounded-2xl"><GitBranch size={22} /></div>
                      <div className="flex gap-1.5">
                        {f.ultimo && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full uppercase">Última Fase</span>}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${f.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                          {f.activo ? "Activa" : "Histórica"}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg uppercase">{f.nombre_analisis}</h3>
                    {f.descripcion && <p className="text-slate-500 text-sm mt-2">{f.descripcion}</p>}
                    {(f.fecha_inicio || f.fecha_fin) && (
                      <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 space-x-2">
                        <Clock size={12} />
                        <span>{f.fecha_inicio ?? "?"} → {f.fecha_fin ?? "vigente"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EPISODIOS ── */}
        {tab === "episodios" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase">Episodios</h2>
              <p className="text-slate-400 text-sm mt-1">Instancias de atención dentro de cada fase.</p>
            </div>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></div>
            ) : episodios.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <BookOpen className="mx-auto text-slate-300 mb-4" size={40} />
                <p className="text-slate-400 font-bold">No hay episodios registrados aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {episodios.map(ep => (
                  <div key={ep.id} className={`bg-white p-7 rounded-[2rem] border shadow-lg ${ep.activo ? "border-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><BookOpen size={22} /></div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ep.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {ep.activo ? "Activo" : "Histórico"}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg uppercase">{ep.nombre_analisis}</h3>
                    {ep.descripcion && <p className="text-slate-500 text-sm mt-2">{ep.descripcion}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USUARIOS ── */}
        {tab === "users" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase">Gestión de Usuarios</h2>
              <button
                onClick={() => setUserModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100"
              >
                <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </button>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Usuario", "Rol", "Fecha Creación"].map(h => (
                      <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{u.username}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-400 font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Nuevo Usuario</h2>
                <button onClick={() => { setUserModalOpen(false); setUserError(""); }} className="p-2 hover:bg-slate-50 rounded-full"><X size={22} /></button>
              </div>
              {userError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />{userError}
                </div>
              )}
              <form onSubmit={handleRegisterUser} className="space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Usuario</label>
                  <input type="text" required value={newUserForm.username} placeholder="nuevo.usuario"
                    onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Contraseña</label>
                  <input type="password" required minLength={6} value={newUserForm.password} placeholder="Min. 6 caracteres"
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Rol</label>
                  <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                    <option value="foundation">Fundación / Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => { setUserModalOpen(false); setUserError(""); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center">
                    <UserPlus className="mr-2" size={18} /> Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
