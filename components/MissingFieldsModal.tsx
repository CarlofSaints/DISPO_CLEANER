"use client";

interface Props {
  missingFields: string[];
  onContinue: () => void;
  onCancel: () => void;
}

export default function MissingFieldsModal({ missingFields, onContinue, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-900">Missing Expected Fields</h2>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            The following expected columns were not found in the uploaded file.
            They will be added as blank columns in the output. Do you want to continue?
          </p>
        </div>
        <div className="p-6">
          <ul className="space-y-1 max-h-60 overflow-y-auto">
            {missingFields.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel upload
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}
