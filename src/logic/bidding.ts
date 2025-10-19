export type BidAction =
    | { type: 'bid'; playerIndex: number; value: number }
    | { type: 'pass'; playerIndex: number };

export interface BiddingState {
    phase: 'bidding1' | 'bidding2';
    order: number[];            // player order (start from dealer)
    currentTurnIdx: number;     // index into order
    passed: Set<number>;
    currentHighest: { playerIndex: number; value: number } | null;
    finished: boolean;
    // additional control:
    forcedOpener?: number;      // player index who must open (only used for bidding1)
    minBid: number;
    maxBid?: number | null;     // e.g., bidding2 max 28
}

/**
 * Create bidding state.
 * phase: 'bidding1' or 'bidding2'
 * forcedOpener: provide a playerIndex to require that player to bid (not pass) on their first turn (for bidding1)
 */
export const createBiddingState = (playersCount: number, startIndex: number, phase: 'bidding1' | 'bidding2', forcedOpener?: number): BiddingState => {
    const order = Array.from({ length: playersCount }, (_, i) => (startIndex + i) % playersCount);
    const minBid = phase === 'bidding1' ? 14 : 21;
    const maxBid = phase === 'bidding2' ? 28 : undefined;
    return {
        phase,
        order,
        currentTurnIdx: 0,
        passed: new Set(),
        currentHighest: null,
        finished: false,
        forcedOpener,
        minBid,
        maxBid: maxBid ?? null
    };
};

export const applyBid = (state: BiddingState, action: BidAction) => {
    if (state.finished) throw new Error('Bidding already finished');
    const currentPlayer = state.order[state.currentTurnIdx];
    if (action.playerIndex !== currentPlayer) throw new Error('Not player turn to bid');
    // forced opener rule
    if (state.forcedOpener === action.playerIndex && state.currentTurnIdx === 0) {
        // opener must bid (cannot pass)
        if (action.type === 'pass') throw new Error('Opener is forced to bid and cannot pass');
    }
    if (action.type === 'pass') {
        state.passed.add(action.playerIndex);
    } else {
        // bid validation
        if (action.value < state.minBid) throw new Error(`Bid must be >= ${state.minBid}`);
        if (state.currentHighest && action.value <= state.currentHighest.value) throw new Error('Bid must be higher than current highest');
        if (state.maxBid && action.value > state.maxBid) throw new Error(`Bid cannot exceed ${state.maxBid}`);
        state.currentHighest = { playerIndex: action.playerIndex, value: action.value };
        // reset passed set because a fresh bid re-opens other players' chance
        state.passed = new Set();
    }

    // advance turn
    state.currentTurnIdx = (state.currentTurnIdx + 1) % state.order.length;

    // finish conditions:
    // If there is a currentHighest: finished when only that player remains not passed.
    if (state.currentHighest) {
        const nonPassers = state.order.filter(p => !state.passed.has(p));
        if (nonPassers.length === 1 && nonPassers[0] === state.currentHighest.playerIndex) {
            state.finished = true;
        }
    } else {
        // if everyone passed and no highest, finished
        if (state.passed.size === state.order.length) state.finished = true;
    }

    return state;
};
