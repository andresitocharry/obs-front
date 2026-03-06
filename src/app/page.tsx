"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];

    // Simplification for PMV
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
      // Assuming Next.js is proxying or direct hit to FastAPI at localhost:8000
      const response = await fetch("http://localhost:8000/api/v1/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      // Poll for status
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
        const response = await fetch(`http://localhost:8000/api/v1/upload/${jobId}/status`);
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
    }, 2000); // Poll every 2 seconds
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-20 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Data Quality Gate
          </h1>
          <p className="text-lg text-slate-600">
            Fundación Canguro - Validación de Archivos Clínicos
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out bg-white shadow-sm hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer
            ${isDragging ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/20' : 'border-slate-300'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
              <UploadCloud size={40} />
            </div>
            <div>
              <p className="text-xl font-medium text-slate-700">Arrástra tu archivo aquí</p>
              <p className="text-sm text-slate-500 mt-1">Excel (.xlsx) o CSV soportados</p>
            </div>
          </div>
        </div>

        {/* Selected File Card */}
        {file && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {!uploading && (jobStatus?.status !== 'completed') && (
              <button
                onClick={startUpload}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Validar Archivo
              </button>
            )}
          </div>
        )}

        {/* Status Area */}
        {jobStatus && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              Estado de Validación
              {uploading && <Loader2 className="ml-2 animate-spin text-indigo-600" size={18} />}
              {jobStatus.status === 'completed' && <CheckCircle className="ml-2 text-emerald-500" size={18} />}
              {jobStatus.status === 'error' && <AlertCircle className="ml-2 text-red-500" size={18} />}
            </h3>

            {/* Progress/States */}
            <div className="space-y-2 text-sm text-slate-700 capitalize">
              Status: <span className="font-medium">{jobStatus.status}</span>
            </div>

            {/* Success Report */}
            {jobStatus.status === 'completed' && (
              <div className="mt-6">
                <p className="mb-4">
                  Filas procesadas: <span className="font-semibold">{jobStatus.processed_rows}</span> |
                  Errores encontrados: <span className={`font-semibold ${jobStatus.total_errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{jobStatus.total_errors}</span>
                </p>

                {jobStatus.total_errors > 0 ? (
                  <div className="bg-red-50 text-red-900 border border-red-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 border-b border-red-200 font-medium bg-red-100/50">
                      Reporte de Inconsistencias
                    </div>
                    <ul className="max-h-60 overflow-y-auto p-4 space-y-2 text-sm">
                      {jobStatus.errors.map((err: any, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-bold min-w-[50px]">Fila {err.row + 1}:</span>
                          <span>{err.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-medium">
                    ¡Archivo perfecto! Todas las validaciones dinámicas pasaron correctamente.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-12 text-center pb-8 border-t border-slate-200 pt-8">
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition flex items-center justify-center">
            Ver Configuración del Diccionario EFETI (Administrador) →
          </Link>
        </div>

      </div>
    </main>
  );
}
