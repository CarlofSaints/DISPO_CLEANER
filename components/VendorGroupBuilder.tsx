"use client";
import { useState } from "react";
import type { VendorGroup } from "@/types";

const WEEKS = ["W1", "W2", "W3", "W4", "W5"] as const;
const CHANNELS = ["MB", "MAKRO"] as const;

const isDC = (v: string) => /[a-zA-Z]/.test(v);

interface Props {
  vendors: string[];
  vendorNames: Record<string, string>;
  onRun: (groups: VendorGroup[], week: string, channel: string) => void;
  running: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function VendorGroupBuilder({ vendors, vendorNames, onRun, running }: Props) {
  const [groups, setGroups] = useState<VendorGroup[]>([{ id: makeId(), vendors: [] }]);
  const [week, setWeek] = useState("");
  const [channel, setChannel] = useState("");

  const realVendors = vendors.filter((v) => !isDC(v));
  const dcVendors = vendors.filter((v) => isDC(v));

  function addGroup() {
    setGroups((prev) => [...prev, { id: makeId(), vendors: [] }]);
  }

  function removeGroup(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function toggleVendor(groupId: string, vendor: string) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.vendors.includes(vendor);
        return {
          ...g,
          vendors: has ? g.vendors.filter((v) => v !== vendor) : [...g.vendors, vendor],
        };
      })
    );
  }

  const canRun =
    groups.some((g) => g.vendors.length > 0) && week !== "" && channel !== "";

  function handleRun() {
    const valid = groups.filter((g) => g.vendors.length > 0);
    onRun(valid, week, channel);
  }

  const sel =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-6">
      {/* Week + Channel */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Week
          </label>
          <select value={week} onChange={(e) => setWeek(e.target.value)} className={sel}>
            <option value="">Select week…</option>
            {WEEKS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Channel
          </label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={sel}>
            <option value="">Select channel…</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-4">These are used to name your file</p>

      {/* DC info */}
      {dcVendors.length > 0 && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <span className="font-semibold">DCs auto-included:</span>{" "}
          {dcVendors.join(", ")} — filtered to only the articles matching your selected vendor.
        </div>
      )}

      {/* Group builder */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Select Vendor Groups</h2>
        <button
          onClick={addGroup}
          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add report group
        </button>
      </div>

      <div className="grid gap-4">
        {groups.map((group, idx) => (
          <div key={group.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Report {idx + 1}
                {group.vendors.length > 0 && (
                  <span className="ml-2 text-orange-600">
                    ({group.vendors.map((v) => vendorNames[v] ? `${vendorNames[v]} (${v})` : v).join(", ")})
                  </span>
                )}
              </span>
              {groups.length > 1 && (
                <button
                  onClick={() => removeGroup(group.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {realVendors.map((vendor) => {
                const selected = group.vendors.includes(vendor);
                const name = vendorNames[vendor];
                return (
                  <button
                    key={vendor}
                    onClick={() => toggleVendor(group.id, vendor)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                      ${selected
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:border-orange-400"
                      }
                    `}
                  >
                    {name ? `${name} (${vendor})` : vendor}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={handleRun}
          disabled={!canRun || running}
          className={`
            w-full py-3 rounded-xl text-white font-bold text-base transition-all
            ${canRun && !running
              ? "bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
            }
          `}
        >
          {running
            ? "Generating files..."
            : `Run Cleaner — ${groups.filter((g) => g.vendors.length > 0).length} report(s)`}
        </button>
        {(!week || !channel) && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Select week and channel above to enable Run
          </p>
        )}
      </div>
    </div>
  );
}
