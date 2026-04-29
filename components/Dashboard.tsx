import React, { useState, useEffect } from "react";
import { AppState, GroundingSource } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { getMarketIntelligence } from "../services/groqService";

interface Props {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
}

const Dashboard: React.FC<Props> = ({ state }) => {
  const [marketPulse, setMarketPulse] = useState<{
    text: string;
    sources: GroundingSource[];
  } | null>(null);

  const [isPulseLoading, setIsPulseLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  /* =========================
     LOAD VOICES PROPERLY
  ========================= */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /* =========================
     IMPROVED SPEAK FUNCTION
  ========================= */
  const speak = (text: string) => {
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      const preferred =
        voices.find(v => v.lang === "en-US" && v.localService) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0];

      if (preferred) utterance.voice = preferred;

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }
  };

  const stopVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  /* =========================
     FETCH MARKET PULSE
  ========================= */
  const fetchPulse = async () => {
    setIsPulseLoading(true);
    try {
      const data = await getMarketIntelligence();
      setMarketPulse(
        data?.text
          ? data
          : {
              text: "Market pulse unavailable.",
              sources: []
            }
      );
    } catch (error) {
      console.error("Pulse error:", error);
      setMarketPulse({
        text: "Unable to fetch market pulse.",
        sources: []
      });
    } finally {
      setIsPulseLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  /* =========================
     EXECUTIVE BRIEFING
  ========================= */
  const handleBriefing = () => {
    if (!state?.insights?.length) return;

    const summary = state.insights
      .map(
        i =>
          `${i.title} is ${i.value}. Change ${i.percentage}.`
      )
      .join(" ");

    speak(`Executive briefing activated. ${summary}`);
  };

  const safeInsights = state?.insights ?? [];
  const safeSalesData = state?.salesData ?? [];

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-6xl font-black text-white uppercase">
            Intelligence
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest">
            Live Neural Monitoring Station
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setVoiceEnabled(prev => !prev);
              window.speechSynthesis.resume();
            }}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition ${
              voiceEnabled
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
          </button>

          {voiceEnabled && (
            <button
              onClick={stopVoice}
              className="px-4 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase"
            >
              Stop Voice
            </button>
          )}

          <button
            onClick={fetchPulse}
            disabled={isPulseLoading}
            className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase text-slate-300"
          >
            {isPulseLoading ? "Syncing..." : "Refresh Pulse"}
          </button>

          <button
            onClick={handleBriefing}
            className="px-6 py-3 bg-cyan-600 rounded-xl text-xs font-black uppercase text-white"
          >
            Executive Briefing
          </button>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {safeInsights.map(insight => (
          <div
            key={insight.id}
            className="p-6 rounded-xl border border-slate-800 bg-slate-900"
          >
            <p className="text-xs text-slate-500 uppercase mb-3">
              {insight.title}
            </p>

            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white">
                {insight.value}
              </h3>

              <span
                className={`text-xs font-black px-2 py-1 rounded ${
                  insight.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {insight.percentage}
              </span>
            </div>

            {voiceEnabled && (
              <button
                onClick={() =>
                  speak(
                    `${insight.title}. Value ${insight.value}. Change ${insight.percentage}`
                  )
                }
                className="mt-4 text-xs text-cyan-400 uppercase"
              >
                🔊 Speak
              </button>
            )}
          </div>
        ))}
      </div>

      {/* CHART + MARKET PULSE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-xl border border-slate-800 bg-slate-900 h-[450px]">
          <h3 className="text-xs text-slate-500 uppercase mb-6">
            Revenue Velocity Matrix
          </h3>

          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={safeSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                fill="#22d3ee"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-8 rounded-xl border border-slate-800 bg-slate-900 flex flex-col h-[450px]">
          <h3 className="text-xs text-cyan-400 uppercase mb-4">
            Neural Market Pulse
          </h3>

          <div className="flex-1 overflow-y-auto text-sm text-slate-300 italic">
            {marketPulse?.text || "Pulse Standby"}
          </div>

          {voiceEnabled && marketPulse && (
            <button
              onClick={() => speak(marketPulse.text)}
              className="mt-4 text-xs text-cyan-400 uppercase"
            >
              🔊 Speak Pulse
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
