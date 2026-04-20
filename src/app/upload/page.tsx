"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, ArrowLeft, Rocket, FlaskConical, Database, ChevronRight } from "lucide-react";
import Link from "next/link";

type PipelineStep = "idle" | "uploading" | "validating" | "valid" | "invalid" | "promoting" | "etl_running" | "silver_processed" | "etl_error" | "error";

export default function ValidationTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<PipelineStep>("idle");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [etlResult, setEtlResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [nombreFundacion, setNombreFundacion] = useState("Fundación Canguro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const getToken = () => localStorage.getItem("token") || "";

  const authHeaders = (extra?: Record<string, string>) => ({
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  });

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (f: File) => {
    const valid = [".csv", ".xlsx", ".xlsm"].some(ext => f.name.toLowerCase().endsWith(ext));
    if (valid) { setFile(f); setStep("idle"); setValidationResult(null); setEtlResult(null); setUploadId(null); }
    else alert("Solo se aceptan archivos CSV o Excel (.xlsx, .xlsm)");
  };

  const startUpload = async () => {
    if (!file) return;
    setStep("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`${API_URL}/api/v1/upload/ingestion/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Error al subir el archivo.");
      const { upload_id } = await uploadRes.json();
      setUploadId(upload_id);

      setStep("validating");
      const runRes = await fetch(`${API_URL}/api/v1/upload/validation/run?upload_id=${upload_id}`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!runRes.ok) throw new Error("No se pudo iniciar la validación.");

      pollValidation(upload_id);
    } catch (e: any) {
      setStep("error");
      setErrorMsg(e.message || "Error de conexión.");
    }
  };

  const pollValidation = (uid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/upload/validation/reports/${uid}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (data.status === "valid" || data.status === "invalid") {
          clearInterval(interval);
          setValidationResult(data);
          setStep(data.status);
        }
      } catch {
        clearInterval(interval);
        setStep("error");
        setErrorMsg("Error consultando el reporte de validación.");
      }
    }, 2000);
  };

  const promoteToSilver = async () => {
    if (!uploadId) return;
    setStep("promoting");

    try {
      const res = await fetch(
        `${API_URL}/api/v1/upload/pipeline/promote?upload_id=${uploadId}&nombre_fundacion=${encodeURIComponent(nombreFundacion)}`,
        { method: "POST", headers: authHeaders() }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al promover.");
      }
      setStep("etl_running");
      pollEtlStatus(uploadId);
    } catch (e: any) {
      setStep("error");
      setErrorMsg(e.message || "Error durante la promoción.");
    }
  };

  const pollEtlStatus = (uid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/etl/status/${uid}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setEtlResult(data);
        if (data.pipeline_status === "silver_processed" || data.pipeline_status === "etl_error") {
          clearInterval(interval);
          setStep(data.pipeline_status);
        }
      } catch {
        clearInterval(interval);
        setStep("etl_error");
      }
    }, 3000);
  };

  const isProcessing = ["uploading", "validating", "promoting", "etl_running"].includes(step);

  const stepLabels: Record<string, string> = {
    uploading: "Subiendo archivo...",
    validating: "Validando con motor EFETI...",
    promoting: "Promoviendo a Capa Bronze...",
    etl_running: "ETL Bronze → Silver en proceso...",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center">
            <UploadCloud className="mr-3 h-9 w-9 text-indigo-600" />
            Ingesta de Datos
          </h1>
          <p className="mt-2 text-slate-500 font-medium">Sube y valida archivos clínicos del Programa Canguro.</p>
        </div>

        {/* Pipeline Steps Indicator */}
        <div className="flex items-center space-x-2 mb-8">
          {[
            { label: "Subida", steps: ["uploading", "validating", "valid", "invalid", "promoting", "etl_running", "silver_processed", "etl_error"] },
            { label: "Validación", steps: ["valid", "invalid", "promoting", "etl_running", "silver_processed", "etl_error"] },
            { label: "Bronze → Silver", steps: ["promoting", "etl_running", "silver_processed", "etl_error"] },
          ].map((s, i) => {
            const active = s.steps.includes(step);
            const current = i === 0 && ["uploading", "validating"].includes(step)
              || i === 1 && ["valid", "invalid"].includes(step)
              || i === 2 && ["promoting", "etl_running"].includes(step);
            return (
              <div key={i} className="flex items-center">
                {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  step === "silver_processed" && i === 2 ? "bg-emerald-500 text-white" :
                  active ? "bg-indigo-600 text-white" :
                  "bg-slate-200 text-slate-500"
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all bg-white shadow-sm cursor-pointer
            ${isDragging ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20"}
            ${isProcessing ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv,.xlsx,.xlsm" />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-5 bg-indigo-50 rounded-2xl text-indigo-600">
              <UploadCloud size={44} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">Arrastra tu archivo aquí</p>
              <p className="text-sm text-slate-400 mt-1">Excel (.xlsx, .xlsm) o CSV</p>
            </div>
          </div>
        </div>

        {/* File selected */}
        {file && (
          <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {step === "idle" && (
                <button
                  onClick={startUpload}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Validar Ahora
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
            <Loader2 className="animate-spin text-indigo-500 shrink-0" size={24} />
            <p className="font-bold text-slate-700">{stepLabels[step] || "Procesando..."}</p>
          </div>
        )}

        {/* Validation Result */}
        {(step === "valid" || step === "invalid") && validationResult && (
          <div className={`mt-6 bg-white rounded-3xl p-8 border shadow-xl ${step === "valid" ? "border-emerald-100 shadow-emerald-100/50" : "border-red-100 shadow-red-100/50"}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase">Resultado de Validación</h3>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${step === "valid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {step === "valid" ? "✓ Válido" : `✗ ${validationResult.total_errors} errores`}
              </span>
            </div>

            {step === "valid" && (
              <>
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-4 mb-6">
                  <CheckCircle className="text-emerald-500 shrink-0" size={32} />
                  <div>
                    <p className="font-bold text-emerald-900">Archivo listo para ingresar al pipeline</p>
                    <p className="text-sm text-emerald-700 mt-1">Todas las reglas EFETI superadas. Puedes promover a la Capa Bronze.</p>
                  </div>
                </div>

                {/* Nombre fundacion input */}
                <div className="mb-6">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Nombre de la Fundación</label>
                  <input
                    type="text"
                    value={nombreFundacion}
                    onChange={e => setNombreFundacion(e.target.value)}
                    className="w-full mt-2 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    placeholder="Fundación Canguro"
                  />
                </div>

                <button
                  onClick={promoteToSilver}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center text-lg uppercase tracking-wide"
                >
                  Promover a Bronze → Silver
                </button>
              </>
            )}

            {step === "invalid" && validationResult.errors?.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
                <div className="px-6 py-3 bg-red-100/50 border-b border-red-100 flex justify-between items-center">
                  <span className="font-black text-sm text-red-900 uppercase">Reporte de Errores</span>
                  <span className="bg-red-600 text-white px-3 py-0.5 rounded-full text-xs font-bold">{validationResult.total_errors}</span>
                </div>
                <ul className="max-h-80 overflow-y-auto p-6 space-y-3 text-sm">
                  {validationResult.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex gap-4 p-3 bg-white/70 rounded-xl border border-red-50">
                      <span className="font-black text-red-600 whitespace-nowrap">Fila {err.row}</span>
                      <span className="font-bold text-slate-600">[{err.column}]</span>
                      <span className="text-red-800/80 font-medium">{err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ETL Status */}
        {(step === "etl_running" || step === "silver_processed" || step === "etl_error") && (
          <div className={`mt-6 bg-white rounded-3xl p-8 border shadow-xl ${
            step === "silver_processed" ? "border-emerald-100 shadow-emerald-100/50" :
            step === "etl_error" ? "border-red-100" :
            "border-indigo-100"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase">Pipeline Bronze → Silver</h3>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                step === "silver_processed" ? "bg-emerald-100 text-emerald-700" :
                step === "etl_error" ? "bg-red-100 text-red-700" :
                "bg-indigo-100 text-indigo-700"
              }`}>
                {step === "silver_processed" ? "✓ Completado" : step === "etl_error" ? "✗ Error ETL" : "En proceso..."}
              </span>
            </div>

            {step === "silver_processed" && etlResult && (
              <div className="space-y-4">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                    <Database size={28} />
                  </div>
                  <div>
                    <p className="font-black text-emerald-900 text-lg">¡Datos en Capa Silver!</p>
                    <p className="text-sm text-emerald-700 mt-1">El ETL completó la transformación Bronze → Silver exitosamente.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Mediciones en Silver</p>
                    <p className="text-3xl font-black text-indigo-600">{etlResult.mediciones_en_silver ?? "—"}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Upload ID</p>
                    <p className="text-xs font-mono text-slate-600 mt-2 break-all">{uploadId}</p>
                  </div>
                </div>
              </div>
            )}

            {step === "etl_running" && (
              <div className="flex items-center space-x-4 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Loader2 className="animate-spin text-indigo-500 shrink-0" size={24} />
                <div>
                  <p className="font-bold text-indigo-900">Transformando datos clínicos...</p>
                  <p className="text-sm text-indigo-700 mt-1">Mapeando variables EFETI y cargando en hecho_medicion_paciente.</p>
                </div>
              </div>
            )}

            {step === "etl_error" && (
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center space-x-4">
                <AlertCircle className="text-red-500 shrink-0" size={28} />
                <div>
                  <p className="font-bold text-red-900">Error en el ETL</p>
                  <p className="text-sm text-red-700 mt-1">Consulta los logs del servidor. Puedes re-ejecutar desde el panel admin.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div className="mt-6 bg-red-50 rounded-2xl p-6 border border-red-100 flex items-center space-x-4">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-900">Error en el proceso</p>
              <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
