"use client";
import { useState } from "react";

interface Props {
  missingFields: string[];
  unmappedUnknowns?: string[]; // file headers not yet mapped to anything
  onContinue: (extraMapping?: Record<string, string | null>) => void;
  onCancel: () => void;
}

export default function MissingFieldsModal({
  missingFields,
  unmappedUnknowns = [],
  onContinue,
  onCancel,
}: Props) {
  // For each missing field, allow the user to map it to an unmapped unknown
  const [mapping, setMapping] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    missingFields.forEach((f) => { init[f] = null; });
    return init;
  });

  // Track which unknowns have been used so they don't appear twice
  const usedUnknowns = new Set(Object.values(mapping).filter(Boolean));

  function handleContinue() {
    const hasMapping = Object.values(mapping).some(Boolean);
    onContinue(hasMapping ? mapping : undefined);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#9888;&#65039;</span>
            <h2 className="text-xl font-bold text-gray-900">Missing Expected Fields</h2>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {unmappedUnknowns.length > 0
              ? "These expected columns were not found. You can match them to unrecognised columns from your file, or leave them blank."
              : "The following expected columns were not found in the uploaded file. They will be added as blank columns in the output."}
          </p>
        </div>
        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
          {missingFields.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                {f}
              </span>
              {unmappedUnknowns.length > 0 && (
                <>
                  <span className="text-gray-400 text-xs">&larr;</span>
                  <select
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={mapping[f] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [f]: e.target.value || null }))
                    }
                  >
                    <option value="">— Leave blank —</option>
                    {unmappedUnknowns
                      .filter((u) => !usedUnknowns.has(u) || mapping[f] === u)
                      .map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                  </select>
                </>
              )}
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
            onClick={handleContinue}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
