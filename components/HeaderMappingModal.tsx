"use client";
import { useState } from "react";
import { CANONICAL_HEADERS } from "@/constants/headers";

interface Props {
  unknownHeaders: string[];
  onConfirm: (mapping: Record<string, string | null>) => void;
  onCancel: () => void;
}

export default function HeaderMappingModal({ unknownHeaders, onConfirm, onCancel }: Props) {
  const [mapping, setMapping] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    unknownHeaders.forEach((h) => { init[h] = null; });
    return init;
  });

  function handleConfirm() {
    onConfirm(mapping);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Unrecognised Column Headers</h2>
          <p className="text-gray-500 text-sm mt-1">
            Map each unknown header to the correct canonical field, or skip it.
          </p>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {unknownHeaders.map((h) => (
            <div key={h} className="flex items-center gap-3">
              <span className="flex-1 font-mono text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg truncate">
                {h}
              </span>
              <span className="text-gray-400">→</span>
              <select
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={mapping[h] ?? ""}
                onChange={(e) => setMapping((prev) => ({ ...prev, [h]: e.target.value || null }))}
              >
                <option value="">— Skip this column —</option>
                {CANONICAL_HEADERS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel upload
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Confirm mapping
          </button>
        </div>
      </div>
    </div>
  );
}
