import React, { useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, Plus, Minus, Info } from 'lucide-react';

const RANKS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
type Rank = typeof RANKS[number];

const RANK_LABELS: Record<Rank, string> = {
  "0": "0 (10/J/Q/K)",
  "1": "A",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
};

const FULL_SHOE: Record<Rank, number> = {
  "0": 128,
  "1": 32,
  "2": 32,
  "3": 32,
  "4": 32,
  "5": 32,
  "6": 32,
  "7": 32,
  "8": 32,
  "9": 32,
};

const STARTING_EV = {
  banker: -1.0579,
  player: -1.2351,
  tie: -14.3596,
};

const EOR: Record<'banker' | 'player' | 'tie', Record<Rank, number>> = {
  banker: {
    "0": 0.00188,
    "1": 0.00440,
    "2": 0.00522,
    "3": 0.00649,
    "4": 0.01157,
    "5": -0.00827,
    "6": -0.1132,
    "7": -0.00827,
    "8": -0.00502,
    "9": -0.00231,
  },
  player: {
    "0": -0.00178,
    "1": -0.00448,
    "2": -0.00543,
    "3": -0.00672,
    "4": -0.01195,
    "5": 0.00841,
    "6": 0.01128,
    "7": 0.00817,
    "8": 0.00533,
    "9": 0.00249,
  },
  tie: {
    "0": 0.05129,
    "1": 0.01293,
    "2": -0.02392,
    "3": -0.02141,
    "4": -0.02924,
    "5": -0.02644,
    "6": -0.11595,
    "7": -0.10914,
    "8": 0.06543,
    "9": 0.04260,
  },
};

const SCENARIOS: Record<string, Partial<Record<Rank, number>>> = {
  "1. More 4s + 5s removed": { "4": 1, "5": 1 },
  "2. More 6s + 7s removed": { "6": 1, "7": 1 },
  "3. More 8s + 9s removed": { "8": 1, "9": 1 },
  "4. More 6s + 7s + 8s + 9s removed": { "6": 1, "7": 1, "8": 1, "9": 1 },
  "5. More 4s + 5s + 8s + 9s removed": { "4": 1, "5": 1, "8": 1, "9": 1 },
};

export default function App() {
  const [removals, setRemovals] = useState<Record<Rank, number>>({
    "0": 0, "1": 0, "2": 0, "3": 0, "4": 0,
    "5": 0, "6": 0, "7": 0, "8": 0, "9": 0,
  });

  const [scenarioMultiplier, setScenarioMultiplier] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  // Core Calculation Helpers
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(4)}%`;

  const totalRemoved = useMemo(() => {
    return Object.values(removals).reduce((acc, count) => acc + count, 0);
  }, [removals]);

  const cardsRemaining = 416 - totalRemoved;
  const decksRemaining = (cardsRemaining / 52).toFixed(2);

  const adjustments = useMemo(() => {
    const calc = (bet: 'banker' | 'player' | 'tie') =>
      RANKS.reduce((acc, rank) => acc + (removals[rank] * EOR[bet][rank]), 0);

    return {
      banker: calc('banker'),
      player: calc('player'),
      tie: calc('tie'),
    };
  }, [removals]);

  const liveEv = useMemo(() => ({
    banker: STARTING_EV.banker + adjustments.banker,
    player: STARTING_EV.player + adjustments.player,
    tie: STARTING_EV.tie + adjustments.tie,
  }), [adjustments]);

  const highestEvBet = useMemo(() => {
    const pairs: [string, number][] = [
      ['Banker', liveEv.banker],
      ['Player', liveEv.player],
      ['Tie', liveEv.tie],
    ];
    return pairs.reduce((max, current) => current[1] > max[1] ? current : max);
  }, [liveEv]);

  const handleRankChange = (rank: Rank, delta: number) => {
    setRemovals(prev => ({
      ...prev,
      [rank]: Math.max(0, Math.min(FULL_SHOE[rank], prev[rank] + delta)),
    }));
  };

  const handleRankInputChange = (rank: Rank, value: string) => {
    const parsed = parseInt(value, 10);
    const valid = isNaN(parsed) ? 0 : Math.max(0, Math.min(FULL_SHOE[rank], parsed));
    setRemovals(prev => ({ ...prev, [rank]: valid }));
  };

  const resetShoe = () => {
    if (window.confirm("Reset all removed-card counts to zero?")) {
      setRemovals({ "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 });
    }
  };

  const loadScenario = (name: string) => {
    const scenario = SCENARIOS[name];
    if (!scenario) return;

    const mult = Math.max(1, Math.min(32, scenarioMultiplier));
    const updated = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 };

    (Object.keys(scenario) as Rank[]).forEach(rank => {
      updated[rank] = Math.min(FULL_SHOE[rank], (scenario[rank] || 0) * mult);
    });

    setRemovals(updated);
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-[#eff6ff] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs font-bold tracking-wider text-[#67e8f9] uppercase">Training and Simulation Tool</p>
        <h1 className="text-3xl font-extrabold">8-Deck Baccarat EOR Calculator</h1>
	<h2 className="text-1xl font-bold">Developed by: Long Nguyen</h2>
        <p className="text-sm text-[#b5c2d8]">
          Record exposed cards for training. Banker, Player, and Tie first-order EOR estimates update immediately.
        </p>
      </header>

      {/* Top Shoe Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0c1d31] p-4 rounded-xl border border-slate-800">
        <div className="bg-[#102b48] p-3 rounded-lg">
          <p className="text-xs text-[#b5c2d8]">Cards removed</p>
          <p className="text-2xl font-bold">{totalRemoved}</p>
        </div>
        <div className="bg-[#102b48] p-3 rounded-lg">
          <p className="text-xs text-[#b5c2d8]">Cards remaining</p>
          <p className="text-2xl font-bold">{cardsRemaining}</p>
        </div>
        <div className="bg-[#102b48] p-3 rounded-lg">
          <p className="text-xs text-[#b5c2d8]">Decks remaining</p>
          <p className="text-2xl font-bold">{decksRemaining}</p>
        </div>
        <div className="flex flex-col justify-center space-y-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center space-x-1.5 bg-[#1d5d82] hover:bg-[#277aa9] text-white text-xs font-bold py-2 px-3 rounded-lg transition"
          >
            <Info className="w-4 h-4" />
            <span>View Warning</span>
          </button>
          <button
            onClick={resetShoe}
            className="flex items-center justify-center space-x-1.5 bg-[#a2253b] hover:bg-[#c32d49] text-white text-xs font-bold py-2 px-3 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Shoe</span>
          </button>
        </div>
      </div>

      {/* Live Counting Section */}
      <div className="bg-[#0c1d31] p-5 rounded-xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Live Card Counting</h2>
          <p className="text-xs text-[#b5c2d8]">Click + for each observed point value. Use - only to correct a mistaken entry.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {RANKS.map((rank) => (
            <div key={rank} className="bg-[#07111f] p-2.5 rounded-lg flex flex-col justify-between border border-slate-800">
              <div>
                <p className="text-xs font-bold truncate">{RANK_LABELS[rank]}</p>
                <p className="text-[10px] text-[#b5c2d8]">{FULL_SHOE[rank] - removals[rank]} left</p>
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <button
                  onClick={() => handleRankChange(rank, -1)}
                  className="w-6 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={removals[rank]}
                  onChange={(e) => handleRankInputChange(rank, e.target.value)}
                  className="w-full h-7 bg-[#102b48] text-center text-xs font-bold rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  onClick={() => handleRankChange(rank, 1)}
                  className="w-6 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EV Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Banker', payout: 'Standard model: 0.95:1', ev: liveEv.banker, base: STARTING_EV.banker, adj: adjustments.banker },
          { name: 'Player', payout: 'Pays 1:1', ev: liveEv.player, base: STARTING_EV.player, adj: adjustments.player },
          { name: 'Tie', payout: 'Pays 8:1', ev: liveEv.tie, base: STARTING_EV.tie, adj: adjustments.tie },
        ].map((item) => (
          <div key={item.name} className="bg-[#0c1d31] p-5 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xl font-bold">{item.name}</h3>
            <p className="text-xs text-[#b5c2d8]">{item.payout}</p>
            <p className="text-2xl font-extrabold text-[#fda4af]">{formatPercent(item.ev)}</p>
            <div className="pt-2 text-xs text-[#b5c2d8] border-t border-slate-800/60 space-y-0.5">
              <p>Base: {formatPercent(item.base)}</p>
              <p>Live EOR adjustment: {formatPercent(item.adj)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Current EOR Reading Banner */}
      <div className="bg-[#0c1d31] p-4 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-[#67e8f9]">Current EOR Reading</h3>
        <p className="text-xs text-[#b5c2d8] mt-1">
          Highest current estimated EV: <span className="font-bold text-white">{highestEvBet[0]} ({formatPercent(highestEvBet[1])})</span>.
          This is a first-order EOR estimate for education and simulation; the highest value may still be negative.
        </p>
      </div>

      {/* Scenarios Table */}
      <div className="bg-[#0c1d31] p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">All Requested Removal Scenarios</h3>
            <p className="text-xs text-[#b5c2d8]">Select a scenario row and click Load Selected Scenario.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#b5c2d8]">Cards per rank:</span>
            <input
              type="number"
              min="1"
              max="32"
              value={scenarioMultiplier}
              onChange={(e) => setScenarioMultiplier(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))}
              className="w-16 h-8 bg-[#102b48] text-center text-xs font-bold rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#183954] text-white">
              <tr>
                <th className="p-3">Removal Scenario</th>
                <th className="p-3 text-center">Banker EV</th>
                <th className="p-3 text-center">Player EV</th>
                <th className="p-3 text-center">Tie EV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(SCENARIOS).map(([name, scenario]) => {
                const mult = Math.max(1, Math.min(32, scenarioMultiplier));
                const rems: Record<Rank, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 };
                (Object.keys(scenario) as Rank[]).forEach(r => {
                  rems[r] = Math.min(FULL_SHOE[r], (scenario[r] || 0) * mult);
                });

                const bEv = STARTING_EV.banker + RANKS.reduce((acc, r) => acc + (rems[r] * EOR.banker[r]), 0);
                const pEv = STARTING_EV.player + RANKS.reduce((acc, r) => acc + (rems[r] * EOR.player[r]), 0);
                const tEv = STARTING_EV.tie + RANKS.reduce((acc, r) => acc + (rems[r] * EOR.tie[r]), 0);

                const isSelected = selectedScenario === name;

                return (
                  <tr
                    key={name}
                    onClick={() => setSelectedScenario(name)}
                    onDoubleClick={() => loadScenario(name)}
                    className={`cursor-pointer transition ${isSelected ? 'bg-[#1d5d82] text-white' : 'hover:bg-slate-800/50'}`}
                  >
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-center">{formatPercent(bEv)}</td>
                    <td className="p-3 text-center">{formatPercent(pEv)}</td>
                    <td className="p-3 text-center">{formatPercent(tEv)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => selectedScenario && loadScenario(selectedScenario)}
            disabled={!selectedScenario}
            className="bg-[#1d5d82] hover:bg-[#277aa9] disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg transition"
          >
            Load Selected Scenario
          </button>
          <span className="text-xs text-[#b5c2d8]">Tip: double-click a scenario row to load it immediately.</span>
        </div>
      </div>

      {/* Model Assumptions */}
      <div className="bg-[#0c1d31] p-5 rounded-xl border border-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-[#67e8f9]">Model Assumptions</h3>
        <p className="text-xs text-[#b5c2d8] leading-relaxed">
          This educational calculator uses first-order eight-deck standard baccarat EOR values. Banker uses conventional 5% commission assumptions and Tie pays 8:1. EZ Baccarat pushes a winning three-card Banker 7; therefore, the displayed Banker value is not an exact EZ Baccarat Banker EV. Deep shoe compositions can also introduce nonlinear effects.
        </p>
      </div>

      {/* Disclaimer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c1d31] border border-amber-400/40 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-2 text-[#67e8f9]">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Important Notice</span>
            </div>
            <h2 className="text-2xl font-extrabold">Training and Educational Use Only</h2>
            <div className="text-xs text-[#d5e0ef] space-y-3 leading-relaxed">
              <p>This software is provided solely for training, educational, and simulation purposes.</p>
              <p>Do not use it at real casino tables, during live gambling, or in any manner that violates applicable laws, regulations, casino policies, or terms of service.</p>
              <p>You are solely responsible for deciding how you use this application and for any risks, losses, legal consequences, or other outcomes arising from its use. The developer and distributor do not provide gambling, legal, or financial advice and assume no responsibility for decisions you make based on this software.</p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-[#fbbf24] hover:bg-[#fcd34d] text-[#07111f] font-bold text-sm py-3 rounded-xl transition"
            >
              I Understand — Enter Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

