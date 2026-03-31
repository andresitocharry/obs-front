"use client";

import { useEffect, useState } from "react";
import { Database, Plus, ShieldCheck, Loader2, ArrowLeft, Trash2, Edit3, X, Save, LogOut, Calculator, AlertTriangle, ChevronRight, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    username: string;
    role: string;
    created_at: string;
}

interface SchemaRule {
    id: number;
    column_name: string;
    is_required: boolean;
    data_type: string;
    min_value?: number;
    max_value?: number;
    missing_value_code?: string;
}

interface Indicator {
    id: number;
    name: string;
    description: string;
    calculation_formula: string;
    dependencies: string[];
}

export default function AdminSchemaPage() {
    const [activeTab, setActiveTab] = useState<"fields" | "indicators" | "users">("fields");
    const [rules, setRules] = useState<SchemaRule[]>([]);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<SchemaRule | null>(null);
    const [dependencyError, setDependencyError] = useState<{message: string, indicators: string[]} | null>(null);
    const [userError, setUserError] = useState("");
    const [formData, setFormData] = useState<Partial<SchemaRule>>({
        column_name: "",
        data_type: "str",
        is_required: true,
        min_value: undefined,
        max_value: undefined
    });
    const [newUserForm, setNewUserForm] = useState({
        username: "",
        password: "",
        role: "foundation"
    });
    
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        try {
            if (activeTab === "fields") {
                const res = await fetch(`${API_URL}/api/v1/admin/schema/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch fields");
                const data = await res.json();
                setRules(data);
            } else if (activeTab === "indicators") {
                const res = await fetch(`${API_URL}/api/v1/admin/indicators/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch indicators");
                const data = await res.json();
                setIndicators(data);
            } else if (activeTab === "users") {
                const res = await fetch(`${API_URL}/api/v1/admin/users`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserError("");
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/register`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newUserForm)
            });

            if (res.ok) {
                setUserModalOpen(false);
                setNewUserForm({ username: "", password: "", role: "foundation" });
                fetchData();
            } else {
                const data = await res.json();
                setUserError(data.detail || "Error al crear usuario");
            }
        } catch (error) {
            setUserError("Error de conexión al servidor");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const url = editingRule 
            ? `${API_URL}/api/v1/admin/schema/${editingRule.id}` 
            : `${API_URL}/api/v1/admin/schema/`;
        
        try {
            const res = await fetch(url, {
                method: editingRule ? "PUT" : "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setModalOpen(false);
                setEditingRule(null);
                fetchData();
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const handleDelete = async (id: number) => {
        setDependencyError(null);
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/schema/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (errorData.detail && typeof errorData.detail === 'object') {
                    setDependencyError(errorData.detail);
                } else {
                    alert("Error al eliminar el campo.");
                }
                return;
            }
            
            fetchData();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const openEdit = (rule: SchemaRule) => {
        setEditingRule(rule);
        setFormData(rule);
        setModalOpen(true);
    };

    const openNew = () => {
        setEditingRule(null);
        setFormData({ column_name: "", data_type: "str", is_required: true });
        setModalOpen(true);
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 selection:bg-indigo-100 italic">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Portal Inicio
                    </Link>
                    <button onClick={() => {localStorage.clear(); router.push("/login")}} className="flex items-center text-sm font-bold text-red-500 hover:text-red-700">
                        <LogOut className="mr-2 h-4 w-4" />
                        Salir
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center uppercase">
                            <ShieldCheck className="mr-3 h-10 w-10 text-indigo-600" />
                            Gestión Clínica
                        </h1>
                        <p className="mt-2 text-slate-500 font-medium text-lg">Define la calidad y métricas de la Fundación Canguro.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-8 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab("fields")}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center ${activeTab === "fields" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Database className="mr-2 h-4 w-4" />
                        Diccionario
                    </button>
                    <button 
                        onClick={() => setActiveTab("indicators")}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center ${activeTab === "indicators" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calculator className="mr-2 h-4 w-4" />
                        Indicadores
                    </button>
                    <button 
                        onClick={() => setActiveTab("users")}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center ${activeTab === "users" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Usuarios
                    </button>
                </div>

                {/* Main Content Area */}
                {activeTab === "fields" ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-700">Campos Obligatorios</h2>
                            <button 
                                onClick={openNew}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Campo
                            </button>
                        </div>

                        {dependencyError && (
                            <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-start">
                                    <AlertTriangle className="text-red-600 mr-4 mt-1 shrink-0" size={24} />
                                    <div>
                                        <h3 className="text-red-900 font-black text-lg uppercase">Acción Bloqueada</h3>
                                        <p className="text-red-700 font-medium mt-1">{dependencyError.message}</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {dependencyError.indicators.map((ind, i) => (
                                                <span key={i} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-black uppercase border border-red-200">
                                                    {ind}
                                                </span>
                                            ))}
                                        </div>
                                        <button onClick={() => setDependencyError(null)} className="mt-4 text-sm font-bold text-red-400 hover:text-red-600 underline">Cerrar advertencia</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Columna</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rango</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></td></tr>
                                    ) : rules.map(rule => (
                                        <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="font-mono text-sm font-bold text-slate-900">{rule.column_name}</div>
                                                {rule.is_required && <span className="text-[10px] font-black text-amber-500 uppercase">Obligatorio</span>}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 uppercase">{rule.data_type}</span>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-sm text-slate-500">
                                                {rule.min_value !== null ? rule.min_value : '∞'} - {rule.max_value !== null ? rule.max_value : '∞'}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(rule)} className="p-2 text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-100"><Edit3 size={18} /></button>
                                                    <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : activeTab === "indicators" ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-700">Diccionario de Indicadores</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                <div className="col-span-2 py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></div>
                            ) : indicators.map(indicator => (
                                <div key={indicator.id} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                            <Calculator size={24} />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{indicator.name}</h3>
                                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">{indicator.description}</p>
                                    
                                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-indigo-700">
                                        <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Fórmula de Cálculo</p>
                                        {indicator.calculation_formula}
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <p className="text-[10px] text-slate-400 uppercase font-black">Dependencias del Diccionario</p>
                                        <div className="flex flex-wrap gap-2">
                                            {indicator.dependencies.map((dep, i) => (
                                                <span key={i} className="flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                    <ChevronRight className="mr-1 h-3 w-3 text-indigo-400" />
                                                    {dep}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-700">Gestión de Usuarios</h2>
                            <button 
                                onClick={() => setUserModalOpen(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Nuevo Usuario
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rol</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha Creación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-300" /></td></tr>
                                    ) : users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-slate-900 cursor-default">{user.username}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-slate-500 font-mono">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Field Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">{editingRule ? "EDITAR CAMPO" : "NUEVO CAMPO"}</h2>
                                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase">Nombre Interno</label>
                                    <input 
                                        type="text" required value={formData.column_name}
                                        onChange={(e) => setFormData({...formData, column_name: e.target.value})}
                                        className="w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-black text-slate-700 ml-1 uppercase">Tipo</label>
                                        <select 
                                            value={formData.data_type}
                                            onChange={(e) => setFormData({...formData, data_type: e.target.value})}
                                            className="w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                                        >
                                            <option value="str">Texto</option>
                                            <option value="int">Entero</option>
                                            <option value="float">Decimal</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-3 pt-8">
                                        <input 
                                            type="checkbox" checked={formData.is_required}
                                            onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                                            className="w-5 h-5 accent-indigo-600 rounded"
                                        />
                                        <span className="text-sm font-bold text-slate-600">Es Obligatorio</span>
                                    </div>
                                </div>
                                <div className="flex space-x-4 pt-6">
                                    <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">CANCELAR</button>
                                    <button type="submit" className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center">
                                        <Save className="mr-2" size={20} /> GUARDAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {userModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">NUEVO USUARIO</h2>
                                <button onClick={() => {setUserModalOpen(false); setUserError("");}} className="p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
                            </div>

                            {userError && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center animate-pulse">
                                    <AlertTriangle className="mr-2 h-5 w-5" />
                                    {userError}
                                </div>
                            )}

                            <form onSubmit={handleRegisterUser} className="space-y-6">
                                <div>
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase">Usuario / Email</label>
                                    <input 
                                        type="text" required value={newUserForm.username}
                                        placeholder="Ej: nuevo.admin"
                                        onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                                        className="w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase">Contraseña</label>
                                    <input 
                                        type="password" required value={newUserForm.password} minLength={6}
                                        placeholder="Min. 6 caracteres"
                                        onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                                        className="w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase">Rol</label>
                                    <select 
                                        value={newUserForm.role}
                                        onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                                        className="w-full mt-2 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none truncate"
                                    >
                                        <option value="foundation">Fundación / Médico (Solo sube archivos)</option>
                                        <option value="admin">Administrador (Gestiona portal)</option>
                                    </select>
                                </div>
                                
                                <div className="flex space-x-4 pt-6">
                                    <button type="button" onClick={() => {setUserModalOpen(false); setUserError("");}} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">CANCELAR</button>
                                    <button type="submit" className="flex-2 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center shrink-0">
                                        <UserPlus className="mr-2" size={20} /> CREAR
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
