"use client";

import { ArrowRight, ShieldCheck, Database, BarChart3, ChevronRight, Layers, FileCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 shadow-sm" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">DQG <span className="text-indigo-600">Gate</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#arquitectura" className="hover:text-indigo-600 transition-colors">Arquitectura</a>
            <a href="#proceso" className="hover:text-indigo-600 transition-colors">Proceso</a>
            <Link href="/login" className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-md">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide uppercase border border-indigo-100">
              <Zap size={14} />
              <span>Calidad de Datos en Tiempo Real</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
              El Guardián de tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Datos Clínicos</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              Garantizamos la integridad de la información para la Fundación Canguro mediante la Arquitectura Medallón y validaciones dinámicas inteligentes.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <Link href="/login" className="group px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center">
                Comenzar Validación
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#arquitectura" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                Ver Arquitectura
              </a>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-50"></div>
            <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
              <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-50">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="ml-auto text-xs font-mono text-slate-400">validation_report.v1.json</div>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Validación de Esquema", status: "completed", val: "100%" },
                  { label: "Check de Tipos de Datos", status: "completed", val: "Validado" },
                  { label: "Validación de Rangos Clínicos", status: "processing", val: "84%" },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className={item.status === 'completed' ? 'text-emerald-600 font-bold' : 'text-indigo-600 font-bold'}>{item.val}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${item.status === 'completed' ? 'bg-emerald-500 w-full' : 'bg-indigo-500 w-[84%]'}`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100"></div>)}
                </div>
                <span className="text-xs text-slate-500 font-medium">Validado por DQG Engine 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medallion Architecture Section */}
      <section id="arquitectura" className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">El Viaje del Dato: Arquitectura Medallón</h2>
            <p className="text-lg text-slate-600">
              Una vez el archivo supera el Data Quality Gate, inicia un proceso ETL estructurado que transforma el dato crudo en información accionable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-200 to-transparent -translate-y-1/2 -z-0"></div>
            
            {/* Bronze */}
            <div className="relative z-10 group">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl duration-300">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform">
                  <Database size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Capa Bronze</h3>
                <p className="text-slate-500 font-medium mb-4 text-sm uppercase tracking-wider">Raw (Crudo)</p>
                <p className="text-slate-600 leading-relaxed">
                  Almacenamiento seguro del dato original tal cual llega de las fuentes. Datos cifrados y preservados sin alteraciones.
                </p>
              </div>
            </div>

            {/* Silver */}
            <div className="relative z-10 group">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl duration-300">
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                  <Layers size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Capa Silver</h3>
                <p className="text-slate-500 font-medium mb-4 text-sm uppercase tracking-wider">Cleansed (Limpio)</p>
                <p className="text-slate-600 leading-relaxed">
                  Estandarización, imputación de nulos y mapeo clínico de referencia. Aquí el dato adquiere consistencia y estructura.
                </p>
              </div>
            </div>

            {/* Gold */}
            <div className="relative z-10 group">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl duration-300">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Capa Gold</h3>
                <p className="text-slate-500 font-medium mb-4 text-sm uppercase tracking-wider">Curated (Curado)</p>
                <p className="text-slate-600 leading-relaxed">
                  Transformación final hacia modelos dimensionales (Estrella). Optimizado para herramientas de BI, reportes y IA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-6">
          <div className="flex items-center space-x-2 grayscale opacity-60">
            <div className="bg-slate-400 p-1 rounded-md">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-600 uppercase">Fundación Canguro</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Data Quality Gate. Todos los derechos reservados.</p>
          <div className="flex space-x-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
