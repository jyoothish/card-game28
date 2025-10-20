// engine.ts
import { createDeck } from "./deck";
import type { Card } from "./deck";

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
    currentTrick?: (Card & { playerIndex: number; isThurp?: boolean; isFolded?: boolean })[];
    teamPoints?: { [teamIndex: number]: number };
    teams?: { [teamIndex: number]: number[] };
    declaredBid?: { playerIndex: number; value: number };
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

        const teams = numPlayers === 4 ? { 0: [0, 2], 1: [1, 3] } : { 0: [0, 2, 4], 1: [1, 3, 5] };

        this.state = {
            phase: "init",
            players,
            dealerIndex: 0,
            deck,
            currentTurnIdx: 0,
            numPlayers,
            teams,
            teamPoints: { 0: 0, 1: 0 },
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

    /** Start play phase */
    startPlayPhase() {
        this.state.phase = "play";
        this.state.currentTrick = [];
        console.log("Play phase started. Current bid:", this.state.currentHighestBid);
    }

    /** Player plays a card */
    playCard(playerIndex: number, card: Card, options?: { isThurp?: boolean }) {
        const player = this.state.players[playerIndex];

        // Remove card from hand
        const idx = player.hand.findIndex(c => c === card);
        if (idx === -1) throw new Error("Card not in hand");
        player.hand.splice(idx, 1);

        // Add to current trick
        this.state.currentTrick!.push({ ...card, playerIndex, isThurp: options?.isThurp, isFolded: player.foldedCard === card });

        // Check if trick is complete
        if (this.state.currentTrick!.length === this.state.numPlayers) {
            this.resolveTrick();
            this.state.currentTrick = [];
        }

        // Move turn
        this.state.currentTurnIdx = (playerIndex + 1) % this.state.numPlayers;
    }

    /** Resolve a trick */
    resolveTrick() {
        const trick = this.state.currentTrick!;
        const leadCard = trick[0];
        const leadSuit = leadCard.suit;

        // Determine priority suit if Thurp/fold is shown
        const priorityCards = trick.filter(c => c.isThurp || c.isFolded);
        const prioritySuit = priorityCards.length ? priorityCards[0].suit : null;

        // Determine winner
        let winningCard = leadCard;
        for (const c of trick) {
            if (prioritySuit) {
                if (c.suit === prioritySuit && c.points > winningCard.points) {
                    winningCard = c;
                }
            } else {
                if (c.suit === leadSuit && c.points > winningCard.points) {
                    winningCard = c;
                }
            }
        }

        const winningPlayer = this.state.players[winningCard.playerIndex];
        const winningTeam = this.getTeamOfPlayer(winningPlayer.index);

        // Assign points (sum of card points in trick)
        const trickPoints = trick.reduce((sum, c) => sum + (c.points || 0), 0);
        this.state.teamPoints![winningTeam] += trickPoints;

        console.log(`Trick won by player ${winningPlayer.index} (team ${winningTeam}) with ${winningCard.rank}${winningCard.suit}. Trick points: ${trickPoints}`);
    }

    /** Get team index of a player */
    getTeamOfPlayer(playerIndex: number) {
        for (const [teamIndex, players] of Object.entries(this.state.teams!)) {
            if (players.includes(playerIndex)) return Number(teamIndex);
        }
        return -1;
    }

    /** Check end of round */
    checkRoundEnd() {
        const handsEmpty = this.state.players.every(p => p.hand.length === 0);
        if (!handsEmpty) return;

        const bid = this.state.currentHighestBid;
        if (!bid) return;

        const biddingTeam = this.getTeamOfPlayer(bid.playerIndex);
        const points = this.state.teamPoints![biddingTeam];

        if (points >= bid.value) {
            console.log(`Team ${biddingTeam} won the round! Points: ${points}`);
        } else {
            console.log(`Team ${biddingTeam} lost the round. Points: ${points}`);
        }

        this.prepareNextRound();
    }

    /** Prepare next round */
    prepareNextRound() {
        this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.numPlayers;
        this.state.phase = "init";
        this.state.deck = createDeck(this.state.numPlayers);
        this.state.players.forEach(p => {
            p.hand = [];
            p.foldedCard = undefined;
        });
        this.state.currentHighestBid = undefined;
        this.state.currentTurnIdx = this.state.dealerIndex;
        this.state.teamPoints = { 0: 0, 1: 0 };
        console.log("Next round prepared. Dealer:", this.state.dealerIndex);
    }
}
