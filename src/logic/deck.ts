export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "J" | "9" | "A" | "10" | "K" | "Q" | "8" | "7" | "6";

export interface Card {
    suit: Suit;
    rank: Rank;
}

export function createDeck(numPlayers: number): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    let ranks: Rank[];

    if (numPlayers === 4) {
        // 32-card deck (8 per suit)
        ranks = ["J", "9", "A", "10", "K", "Q", "8", "7"];
    } else if (numPlayers === 6) {
        // 36-card deck (9 per suit)
        ranks = ["J", "9", "A", "10", "K", "Q", "8", "7", "6"];
    } else {
        throw new Error("Only 4 or 6 player games are supported");
    }

    const deck: Card[] = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }

    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}
