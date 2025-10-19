// engine.ts
import { createDeck } from "./deck";
import type { Card } from "./deck";
// import { dealSecondSet } from "./deal";

export interface PlayerState {
    index: number;
    hand: Card[];
    foldedCard?: Card;
}

export interface GameState {
    phase: "init" | "deal1" | "bidding1" | "fold" | "deal2" | "bidding2" | "play" | "end";
    players: PlayerState[];
    dealerIndex: number;
    deck: Card[];
    currentHighestBid?: { playerIndex: number; value: number };
    currentTurnIdx: number;
    numPlayers: number;
}

export class GameEngine {
    state: GameState;

    constructor(numPlayers: number) {
        if (![4, 6].includes(numPlayers)) {
            throw new Error("Only 4 or 6 players are supported");
        }

        const deck = createDeck(numPlayers);
        const players: PlayerState[] = Array.from({ length: numPlayers }, (_, i) => ({
            index: i,
            hand: [],
        }));

        this.state = {
            phase: "init",
            players,
            dealerIndex: 0,
            deck,
            currentTurnIdx: 0,
            numPlayers,
        };
    }

    /** Start a new round */
    startRound() {
        const { numPlayers } = this.state;
        const cardsPerPlayer = numPlayers === 4 ? 4 : 3;

        console.log(`Starting round, dealer=${this.state.dealerIndex}`);

        // deal first set
        for (let i = 0; i < numPlayers * cardsPerPlayer; i++) {
            const player = this.state.players[i % numPlayers];
            player.hand.push(this.state.deck[i]);
        }

        // update remaining deck
        this.state.deck = this.state.deck.slice(numPlayers * cardsPerPlayer);
        this.state.phase = "bidding1";
        this.state.currentTurnIdx = this.state.dealerIndex;

        console.log("After deal1 hands:", this.state.players.map(p => p.hand.length));
    }

    /** First bidding phase (dealer must call min 14) */
    makeBid(playerIndex: number, bidValue: number | null) {
        const { phase, dealerIndex, currentHighestBid } = this.state;

        if (phase !== "bidding1" && phase !== "bidding2") {
            throw new Error("Not in bidding phase");
        }

        // Dealer cannot pass in first round
        if (phase === "bidding1" && playerIndex === dealerIndex && bidValue === null) {
            throw new Error("Opener is forced to bid and cannot pass");
        }

        const minBid = phase === "bidding1" ? 14 : 21;
        const maxBid = phase === "bidding1" ? 20 : 28;

        if (bidValue !== null && (bidValue < minBid || bidValue > maxBid)) {
            throw new Error(`Invalid bid value (${bidValue}), must be between ${minBid}-${maxBid}`);
        }

        if (bidValue !== null) {
            if (!currentHighestBid || bidValue > currentHighestBid.value) {
                this.state.currentHighestBid = { playerIndex, value: bidValue };
            }
        }

        this.state.currentTurnIdx = (playerIndex + 1) % this.state.numPlayers;
    }

    /** Dealer folds one card after bidding1 */
    foldCard(playerIndex: number, card: Card) {
        const player = this.state.players[playerIndex];
        if (player.foldedCard) throw new Error("Already folded");

        player.foldedCard = card;
        player.hand = player.hand.filter(c => c !== card);

        // Deal second set
        console.log("Dealing second set...");
        this.dealSecondSet();
    }

    /** Second dealing phase */
    dealSecondSet() {
        const { numPlayers, deck, players } = this.state;
        const cardsPerPlayer = numPlayers === 4 ? 4 : 3;
        const totalNeeded = numPlayers * cardsPerPlayer;

        if (deck.length < totalNeeded) {
            console.warn("⚠️ Not enough cards for second deal, dealing whatever remains");
        }

        for (let i = 0; i < totalNeeded && i < deck.length; i++) {
            players[i % numPlayers].hand.push(deck[i]);
        }

        this.state.deck = deck.slice(totalNeeded);
        this.state.phase = "bidding2";
        this.state.currentTurnIdx = this.state.dealerIndex;

        console.log("After deal2 hands:", players.map(p => p.hand.length));
    }
}
