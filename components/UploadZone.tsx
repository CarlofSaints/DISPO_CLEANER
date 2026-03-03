"use client";
import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export default function UploadZone({ onFile, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
        ${dragging ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
      <div className="text-4xl mb-3">📂</div>
      {loading ? (
        <p className="text-gray-500 font-medium">Processing file...</p>
      ) : (
        <>
          <p className="text-gray-700 font-semibold text-lg">Drop your DISPO file here</p>
          <p className="text-gray-400 text-sm mt-1">or click to browse — .xlsx files only</p>
        </>
      )}
    </div>
  );
}
