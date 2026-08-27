export type Bet = "banker" | "player" | "tie";
export type Rank = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type RemovalCounts = Record<Rank, number>;

export const RANKS: Rank[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];

export const RANK_LABELS: Record<Rank, string> = {
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

// Cards in an 8-deck shoe.
export const FULL_SHOE: Record<Rank, number> = {
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

// Standard 8-deck baccarat base EVs.
// Banker = 5% commission version.
// See note in App: EZ Banker should eventually use an EZ-specific exact engine.
export const STARTING_EV: Record<Bet, number> = {
  banker: -1.0579,
  player: -1.2351,
  tie: -14.3596,
};

// Percentage-point EV change after one card of that point value is removed.
// Source basis: standard 8-deck baccarat EOR values.
export const EOR: Record<Bet, Record<Rank, number>> = {
  banker: {
    "0": 0.00188,
    "1": 0.0044,
    "2": 0.00522,
    "3": 0.00649,
    "4": 0.01157,
    "5": -0.00827,
    "6": -0.01132,
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
    "9": 0.0426,
  },
};

export const emptyRemovals = (): RemovalCounts => ({
  "0": 0,
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
  "6": 0,
  "7": 0,
  "8": 0,
  "9": 0,
});

export const totalRemoved = (removals: RemovalCounts): number =>
  RANKS.reduce((total, rank) => total + removals[rank], 0);

export const cardsRemaining = (removals: RemovalCounts): number =>
  416 - totalRemoved(removals);

export const decksRemaining = (removals: RemovalCounts): number =>
  cardsRemaining(removals) / 52;

export const calculateAdjustment = (
  bet: Bet,
  removals: RemovalCounts,
): number =>
  RANKS.reduce(
    (total, rank) => total + removals[rank] * EOR[bet][rank],
    0,
  );

export const calculateEv = (bet: Bet, removals: RemovalCounts): number =>
  STARTING_EV[bet] + calculateAdjustment(bet, removals);

export const scenarioPresets: Record<string, RemovalCounts> = {
  "Scenario 1: 4s + 5s": {
    ...emptyRemovals(),
    "4": 1,
    "5": 1,
  },
  "Scenario 2: 6s + 7s": {
    ...emptyRemovals(),
    "6": 1,
    "7": 1,
  },
  "Scenario 3: 8s + 9s": {
    ...emptyRemovals(),
    "8": 1,
    "9": 1,
  },
  "Scenario 4: 6s + 7s + 8s + 9s": {
    ...emptyRemovals(),
    "6": 1,
    "7": 1,
    "8": 1,
    "9": 1,
  },
  "Scenario 5: 4s + 5s + 8s + 9s": {
    ...emptyRemovals(),
    "4": 1,
    "5": 1,
    "8": 1,
    "9": 1,
  },
};

