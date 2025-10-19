export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'J' | '9' | 'A' | '10' | 'K' | 'Q';

export interface Card {
    id: string;   // e.g., "hearts-J"
    suit: Suit;
    rank: Rank;
    value: number;     // scoring points
    priority: number;  // smaller = higher priority (0 highest)
}

export const rankOrder: Rank[] = ['J', '9', 'A', '10', 'K', 'Q']; // high -> low
export const cardValues: Record<Rank, number> = {
    J: 3,
    '9': 2,
    A: 1,
    '10': 1,
    K: 0,
    Q: 0
};

export const generateDeck = (): Card[] => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['J', '9', 'A', '10', 'K', 'Q'];
    const deck: Card[] = [];

    for (const s of suits) {
        for (const r of ranks) {
            deck.push({
                id: `${s}-${r}`,
                suit: s,
                rank: r,
                value: cardValues[r],
                priority: rankOrder.indexOf(r)
            });
        }
    }
    return deck;
};
