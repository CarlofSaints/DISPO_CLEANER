"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/useAuth";
import UploadZone from "@/components/UploadZone";
import FieldReview from "@/components/FieldReview";
import VendorGroupBuilder from "@/components/VendorGroupBuilder";
import type { ParsedDispo, VendorGroup, GeneratedFile } from "@/types";

type Stage = "upload" | "vendor-confirm" | "field-review" | "group-builder" | "done";

export default function Home() {
  const router = useRouter();
  const { session, ready, logout } = useAuth();

  const [stage, setStage] = useState<Stage>("upload");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedDispo | null>(null);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string | null>>({});
  const [downloads, setDownloads] = useState<GeneratedFile[]>([]);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready) return null;
  if (!session) return null;

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authFetch("/api/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");

      setParsed(data as ParsedDispo);
      setStage("vendor-confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleVendorConfirm() {
    if (!parsed) return;
    // Always go to field review so the user can see/verify field matching
    setStage("field-review");
  }

  function handleFieldReviewConfirm(mapping: Record<string, string | null>) {
    setHeaderMapping(mapping);
    setStage("group-builder");
  }

  function handleCancel() {
    setParsed(null);
    setHeaderMapping({});
    setStage("upload");
  }

  async function handleRun(groups: VendorGroup[], week: string, channel: string) {
    if (!parsed) return;
    setRunning(true);
    setError(null);
    try {
      const res = await authFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parseId: parsed.parseId,
          groups,
          headerMapping,
          week,
          channel,
          vendorNumber: parsed.vendorNumber,
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
    <main
      className="min-h-screen"
      style={{
        backgroundImage: "url(/oj-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <div className="bg-oj-dark text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/oj-logo-white.png" alt="OuterJoin" className="h-7" />
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-oj-orange font-black text-lg tracking-tight">DISPO</span>
            <span className="text-white font-light text-lg tracking-tight">CLEANER</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {session.name} {session.surname}
          </span>
          {session.role === "admin" && (
            <a href="/admin/users" className="text-xs text-oj-orange hover:text-oj-orange-hover transition-colors">
              Admin
            </a>
          )}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Upload stage */}
        {stage === "upload" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-md">Upload DISPO Report</h1>
              <p className="text-white/80 text-sm mt-1 drop-shadow-sm">
                Upload the raw exported DISPO xlsx file — we&apos;ll clean and split it for you.
              </p>
            </div>
            <UploadZone onFile={handleFile} loading={loading} />
          </div>
        )}

        {/* Vendor confirmation stage */}
        {stage === "vendor-confirm" && parsed && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center space-y-5">
            {parsed.vendorNumber ? (
              <>
                <div className="text-5xl">&#128203;</div>
                <h2 className="text-xl font-bold text-gray-900">Vendor Detected</h2>
                <p className="text-gray-600">
                  You&apos;re about to clean a DISPO for vendor number:
                </p>
                <p className="text-3xl font-black text-oj-orange tracking-wide">
                  {parsed.vendorNumber}
                </p>
                {parsed.vendorNameFromSheet && parsed.vendorNameFromSheet !== parsed.vendorNumber && (
                  <p className="text-sm text-gray-400">
                    Sheet: {parsed.vendorNameFromSheet}
                  </p>
                )}
                <p className="text-gray-600">Would you like to continue?</p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVendorConfirm}
                    className="px-5 py-2.5 bg-oj-orange hover:bg-oj-orange-hover text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl">&#9888;&#65039;</div>
                <h2 className="text-xl font-bold text-red-600">No Vendor Number Found</h2>
                <p className="text-gray-600">
                  The sheet name contains no vendor number. The sheet name must start with
                  a numeric vendor code (e.g. <span className="font-mono font-semibold">2667 ROBERT BOSCH</span>).
                </p>
                {parsed.vendorNameFromSheet && (
                  <p className="text-sm text-gray-500">
                    Current sheet name: <span className="font-mono font-semibold">{parsed.vendorNameFromSheet}</span>
                  </p>
                )}
                <p className="text-gray-600">
                  Please fix the sheet name in the source file and try again.
                </p>
                <button
                  onClick={reset}
                  className="mt-2 px-6 py-2.5 bg-oj-orange hover:bg-oj-orange-hover text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Back to Upload
                </button>
              </>
            )}
          </div>
        )}

        {/* Group builder stage */}
        {stage === "group-builder" && parsed && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Build Reports</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Vendor <span className="font-semibold text-oj-orange">{parsed.vendorNumber}</span>
                    {" "}&mdash; {parsed.rowCount.toLocaleString()} rows
                    {parsed.sourceDate && (
                      <span className="ml-2 text-gray-400">&middot; Date: {parsed.sourceDate}</span>
                    )}
                  </p>
                </div>
                <button onClick={reset} className="text-xs text-gray-400 hover:text-oj-charcoal transition-colors">
                  &larr; New file
                </button>
              </div>
            </div>
            <VendorGroupBuilder vendors={parsed.vendors} vendorNames={parsed.vendorNames ?? {}} onRun={handleRun} running={running} />
          </div>
        )}

        {/* Done stage */}
        {stage === "done" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center space-y-4">
            <div className="text-4xl text-oj-orange">&#10003;</div>
            <h2 className="text-xl font-bold text-gray-900">Files Generated</h2>
            <p className="text-gray-500 text-sm">
              {downloads.length} file{downloads.length !== 1 ? "s" : ""} downloaded to your Downloads folder.
            </p>
            <ul className="text-left space-y-2 max-w-sm mx-auto">
              {downloads.map((f) => (
                <li key={f.filename} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-oj-orange">&#8595;</span>
                  <span className="font-mono">{f.filename}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={reset}
              className="mt-4 px-6 py-2.5 bg-oj-orange hover:bg-oj-orange-hover text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Clean another file
            </button>
          </div>
        )}
      </div>

      {/* Field review modal — always shown after vendor confirm */}
      {stage === "field-review" && parsed && (
        <FieldReview
          fileHeaders={parsed.headers}
          unknownHeaders={parsed.unknownHeaders ?? []}
          missingHeaders={parsed.missingHeaders ?? []}
          onConfirm={handleFieldReviewConfirm}
          onCancel={handleCancel}
        />
      )}
    </main>
  );
}
