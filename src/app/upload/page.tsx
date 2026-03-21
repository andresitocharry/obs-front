"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ValidationTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
      setJobStatus(null);
    } else {
      alert("Por favor sube solo archivos CSV o Excel (.xlsx)");
    }
  };

  const startUpload = async () => {
    if (!file) return;

    setUploading(true);
    setJobStatus({ status: "uploading" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/v1/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      pollStatus(data.job_id);

    } catch (error) {
      console.error(error);
      setJobStatus({ status: "error", message: "Fallo de conexión con el servidor." });
      setUploading(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/v1/upload/${jobId}/status`);
        const data = await response.json();

        setJobStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          setUploading(false);
        }
      } catch (error) {
        clearInterval(interval);
        setUploading(false);
        setJobStatus({ status: "error", message: "No se pudo consultar el estado." });
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-12 px-4 italic">
      <div className="max-w-4xl w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Herramienta de Validación</h1>
          <p className="text-slate-600">Fundación Canguro - Panel de Carga de Archivos Clínicos</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all bg-white shadow-sm hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer
            ${isDragging ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-200'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xlsx" />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
              <UploadCloud size={48} />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-800">Arrástra tu archivo aquí</p>
              <p className="text-sm text-slate-500 mt-1">Soporta Excel (.xlsx) o archivos CSV</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {!uploading && (jobStatus?.status !== 'completed') && (
              <button onClick={startUpload} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Validar Ahora
              </button>
            )}
          </div>
        )}

        {jobStatus && (
          <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold mb-6 flex items-center text-slate-800">
              Resultado del Proceso
              {uploading && <Loader2 className="ml-3 animate-spin text-indigo-600" size={20} />}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Estado</p>
                <p className="font-bold capitalize text-indigo-600">{jobStatus.status}</p>
              </div>
              {jobStatus.status === 'completed' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Inconsistencias</p>
                  <p className={`font-bold ${jobStatus.total_errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {jobStatus.total_errors}
                  </p>
                </div>
              )}
            </div>

            {jobStatus.status === 'completed' && jobStatus.total_errors > 0 && (
              <div className="bg-red-50 text-red-900 border border-red-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-3 border-b border-red-100 font-bold bg-red-100/50 flex justify-between items-center text-sm">
                  <span>Reporte de Errores</span>
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]">{jobStatus.total_errors}</span>
                </div>
                <ul className="max-h-80 overflow-y-auto p-6 space-y-3 text-sm scrollbar-thin scrollbar-thumb-red-200">
                  {jobStatus.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex gap-4 p-3 bg-white/50 rounded-lg border border-red-50">
                      <span className="font-bold text-red-600 whitespace-nowrap">Fila {err.row + 1}</span>
                      <span className="text-red-800/80 leading-relaxed font-medium">{err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {jobStatus.status === 'completed' && jobStatus.total_errors === 0 && (
              <div className="p-10 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <p className="text-xl font-bold">¡Validación Exitosa!</p>
                  <p className="mt-2 text-emerald-700/80">El archivo cumple con el 100% de las reglas del diccionario EFETI.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
