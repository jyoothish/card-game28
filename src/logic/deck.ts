export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "J" | "9" | "A" | "10" | "K" | "Q" | "8" | "7" | "6";

export interface Card {
    suit: Suit;
    rank: Rank;
    points: number; // <-- new property
}

export function createDeck(numPlayers: number): Card[] {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    let ranks: Rank[];

    if (numPlayers === 4) {
        ranks = ["J", "9", "A", "10", "K", "Q", "8", "7"];
    } else if (numPlayers === 6) {
        ranks = ["J", "9", "A", "10", "K", "Q", "8", "7", "6"];
    } else {
        throw new Error("Only 4 or 6 player games are supported");
    }

    const pointsMap: Record<Rank, number> = {
        J: 3,
        "9": 2,
        A: 1,
        "10": 1,
        K: 0,
        Q: 0,
        "8": 0,
        "7": 0,
        "6": 0,
    };

    const deck: Card[] = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank, points: pointsMap[rank] });
        }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}
