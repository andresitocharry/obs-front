"use client";

import { useEffect, useState } from "react";
import { Database, Plus, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SchemaRule {
    id: number;
    column_name: string;
    is_required: boolean;
    data_type: string;
    min_value?: number;
    max_value?: number;
    missing_value_code?: string;
}

export default function AdminSchemaPage() {
    const [rules, setRules] = useState<SchemaRule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/admin/schema/");
            const data = await res.json();
            setRules(data);
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Navigation */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Validaciones
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center">
                            <ShieldCheck className="mr-3 h-8 w-8 text-indigo-600" />
                            Administración de Reglas
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">Gestiona dinámicamente el Diccionario EFETI para validar los archivos.</p>
                    </div>
                    <button className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg font-medium text-white hover:bg-indigo-700 transition">
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Nueva Regla
                    </button>
                </div>

                {/* Content Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                            <Database className="mr-2 h-5 w-5 text-slate-500" />
                            Columnas Configuradas ({rules.length})
                        </h2>
                        <button
                            onClick={fetchRules}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            Actualizar
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Nombre Columna
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Req / Tipo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Rango (Min - Max)
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                                            Cargando reglas desde Supabase...
                                        </td>
                                    </tr>
                                ) : rules.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No hay reglas configuradas. Añade una para comenzar.
                                        </td>
                                    </tr>
                                ) : (
                                    rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-mono text-sm font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                                                    {rule.column_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rule.is_required ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                                        {rule.is_required ? 'Obligatorio' : 'Opcional'}
                                                    </span>
                                                    <span className="text-sm text-slate-500 border border-slate-200 px-2 py-0.5 rounded bg-slate-50">
                                                        {rule.data_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {rule.min_value !== null || rule.max_value !== null ? (
                                                    <div className="flex items-center space-x-1">
                                                        {rule.min_value !== null && <span className="font-medium">{rule.min_value}</span>}
                                                        <span className="text-slate-400">↔</span>
                                                        {rule.max_value !== null && <span className="font-medium">{rule.max_value}</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Sin restricciones</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-indigo-600 hover:text-indigo-900 mx-2">Editar</button>
                                                <button className="text-red-600 hover:text-red-900 ml-2">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
