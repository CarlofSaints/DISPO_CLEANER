"use client";
import { useState } from "react";
import { CANONICAL_HEADERS } from "@/constants/headers";

interface Props {
  /** Headers found in the file (after alias resolution) */
  fileHeaders: string[];
  /** File headers not matching any canonical header or date pattern */
  unknownHeaders: string[];
  /** Canonical headers not found in the file */
  missingHeaders: string[];
  onConfirm: (mapping: Record<string, string | null>) => void;
  onCancel: () => void;
}

export default function FieldReview({
  fileHeaders,
  unknownHeaders,
  missingHeaders,
  onConfirm,
  onCancel,
}: Props) {
  // Mapping: unknownFileHeader → canonicalHeader | null
  const [mapping, setMapping] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    unknownHeaders.forEach((h) => { init[h] = null; });
    return init;
  });

  const matchedCount = fileHeaders.length - unknownHeaders.length;

  // Canonical headers available for mapping: only those that are actually missing
  const mappedTargets = new Set(Object.values(mapping).filter(Boolean));
  const availableTargets = missingHeaders.filter(
    (h) => !mappedTargets.has(h) || Object.values(mapping).includes(h)
  );

  function handleConfirm() {
    onConfirm(mapping);
  }

  const hasIssues = unknownHeaders.length > 0 || missingHeaders.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Field Review</h2>
          <p className="text-gray-500 text-sm mt-1">
            {matchedCount} of {fileHeaders.length} file columns matched to expected fields.
            {!hasIssues && " Everything looks good."}
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Unrecognised file headers — map to canonical */}
          {unknownHeaders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Unrecognised Columns ({unknownHeaders.length})
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Map each to an expected field, or skip it.
              </p>
              <div className="space-y-2">
                {unknownHeaders.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg truncate">
                      {h}
                    </span>
                    <span className="text-gray-400 text-xs">&rarr;</span>
                    <select
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={mapping[h] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [h]: e.target.value || null }))
                      }
                    >
                      <option value="">— Skip —</option>
                      {CANONICAL_HEADERS.filter(
                        (ch) => !mappedTargets.has(ch) || mapping[h] === ch
                      ).map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing canonical headers */}
          {missingHeaders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Missing Expected Fields ({missingHeaders.filter((h) => !mappedTargets.has(h)).length})
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                These will be added as blank columns in the output.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingHeaders
                  .filter((h) => !mappedTargets.has(h))
                  .map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md"
                    >
                      {f}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* All good */}
          {!hasIssues && (
            <div className="text-center py-4">
              <div className="text-3xl text-green-500 mb-2">&#10003;</div>
              <p className="text-gray-600">All file columns matched successfully.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
