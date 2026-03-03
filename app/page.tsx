"use client";
import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import HeaderMappingModal from "@/components/HeaderMappingModal";
import MissingFieldsModal from "@/components/MissingFieldsModal";
import VendorGroupBuilder from "@/components/VendorGroupBuilder";
import type { ParsedDispo, VendorGroup, GeneratedFile } from "@/types";

type Stage = "upload" | "header-mapping" | "missing-fields" | "group-builder" | "done";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedDispo | null>(null);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string | null>>({});
  const [downloads, setDownloads] = useState<GeneratedFile[]>([]);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");

      setParsed(data as ParsedDispo);

      if (data.unknownHeaders?.length > 0) {
        setStage("header-mapping");
      } else if (data.missingHeaders?.length > 0) {
        setStage("missing-fields");
      } else {
        setStage("group-builder");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleHeaderMappingConfirm(mapping: Record<string, string | null>) {
    setHeaderMapping(mapping);
    if (parsed?.missingHeaders && parsed.missingHeaders.length > 0) {
      setStage("missing-fields");
    } else {
      setStage("group-builder");
    }
  }

  function handleMissingFieldsContinue() {
    setStage("group-builder");
  }

  function handleCancel() {
    setParsed(null);
    setHeaderMapping({});
    setStage("upload");
  }

  async function handleRun(groups: VendorGroup[]) {
    if (!parsed) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDate: parsed.sourceDate,
          headers: parsed.headers,
          rows: parsed.rows,
          groups,
          headerMapping,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generate failed");

      const files: GeneratedFile[] = data.files;
      setDownloads(files);

      files.forEach((f, i) => {
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${f.base64}`;
          a.download = f.filename;
          a.click();
        }, i * 400);
      });

      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setParsed(null);
    setHeaderMapping({});
    setDownloads([]);
    setError(null);
    setStage("upload");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
        <span className="text-orange-500 font-black text-xl tracking-tight">DISPO</span>
        <span className="text-white font-light text-xl tracking-tight">CLEANER</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Upload stage */}
        {stage === "upload" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload DISPO Report</h1>
              <p className="text-gray-500 text-sm mt-1">
                Upload the raw exported DISPO xlsx file — we&apos;ll clean and split it for you.
              </p>
            </div>
            <UploadZone onFile={handleFile} loading={loading} />
          </div>
        )}

        {/* Group builder stage */}
        {stage === "group-builder" && parsed && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Build Reports</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {parsed.rows.length.toLocaleString()} rows &mdash; {parsed.vendors.length} vendors found
                    {parsed.sourceDate && (
                      <span className="ml-2 text-gray-400">&middot; Date: {parsed.sourceDate}</span>
                    )}
                  </p>
                </div>
                <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  &larr; New file
                </button>
              </div>
            </div>
            <VendorGroupBuilder vendors={parsed.vendors} onRun={handleRun} running={running} />
          </div>
        )}

        {/* Done stage */}
        {stage === "done" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <div className="text-4xl">&#10003;</div>
            <h2 className="text-xl font-bold text-gray-900">Files Generated</h2>
            <p className="text-gray-500 text-sm">
              {downloads.length} file{downloads.length !== 1 ? "s" : ""} downloaded to your Downloads folder.
            </p>
            <ul className="text-left space-y-2 max-w-sm mx-auto">
              {downloads.map((f) => (
                <li key={f.filename} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">&#8595;</span>
                  <span className="font-mono">{f.filename}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={reset}
              className="mt-4 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Clean another file
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {stage === "header-mapping" && parsed && (
        <HeaderMappingModal
          unknownHeaders={parsed.unknownHeaders}
          onConfirm={handleHeaderMappingConfirm}
          onCancel={handleCancel}
        />
      )}

      {stage === "missing-fields" && parsed && (
        <MissingFieldsModal
          missingFields={parsed.missingHeaders}
          onContinue={handleMissingFieldsContinue}
          onCancel={handleCancel}
        />
      )}
    </main>
  );
}
