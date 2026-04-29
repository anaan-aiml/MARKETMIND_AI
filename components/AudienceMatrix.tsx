import React, { useEffect, useState } from "react";
import { AppState } from "../types";
import { segmentAudience } from "../services/groqService";

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
}

const AudienceMatrix: React.FC<Props> = ({ state, updateState }) => {
  const [loading, setLoading] = useState(false);

  const handleSegment = async () => {
    if (loading) return; // prevent double clicks
    setLoading(true);

    try {
      const segments = await segmentAudience(state?.rawCsv || "");

      updateState({
        segments: Array.isArray(segments) ? segments : []
      });
    } catch (error) {
      console.error("Segmentation failed:", error);
      updateState({ segments: [] });
    } finally {
      setLoading(false);
    }
  };

  // Auto-run only once if no segments exist
  useEffect(() => {
    if (!state?.segments || state.segments.length === 0) {
      handleSegment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeSegments = state?.segments ?? [];

  return (
    <div className="space-y-10 text-slate-200">
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-black text-white uppercase">
          Audience Matrix
        </h2>

        <button
          onClick={handleSegment}
          disabled={loading}
          className="px-6 py-3 bg-cyan-500 text-black font-black rounded-lg disabled:opacity-50 transition-all"
        >
          {loading ? "Training AI Clusters..." : "Retrain Clusters"}
        </button>
      </div>

      {safeSegments.length === 0 && !loading && (
        <div className="p-10 border border-slate-700 rounded-lg text-center text-slate-400">
          No segments available.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {safeSegments.map((segment, index) => (
          <div
            key={index}
            className="p-6 bg-slate-900 border border-slate-700 rounded-xl transition-all hover:border-cyan-500"
          >
            <h3 className="text-xl font-black text-white mb-2">
              {segment.name}
            </h3>

            <p className="text-xs text-slate-400 mb-3">
              Cohort Size: {segment.size}
            </p>

            <p
              className={`text-xs font-black uppercase mb-3 ${
                segment.risk === "high"
                  ? "text-rose-400"
                  : segment.risk === "med"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              Risk: {segment.risk}
            </p>

            <p className="text-xs text-slate-300 italic">
              {segment.strategy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudienceMatrix;
