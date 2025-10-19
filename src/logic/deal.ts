import { createDeck } from "./deck";
import type { Card } from "./deck";

export function dealFirstSet(numPlayers: number): Card[][] {
    const deck = createDeck(numPlayers);
    const hands: Card[][] = Array.from({ length: numPlayers }, () => []);

    const cardsPerPlayer = numPlayers === 4 ? 4 : 3; // first set
    const totalCardsNeeded = numPlayers * cardsPerPlayer;

    if (deck.length < totalCardsNeeded) {
        throw new Error("Not enough cards for first deal");
    }

    for (let i = 0; i < totalCardsNeeded; i++) {
        hands[i % numPlayers].push(deck[i]);
    }

    // return both deck (remaining) and hands
    return hands;
}

export function dealSecondSet(
    remainingDeck: Card[],
    currentHands: Card[][],
    numPlayers: number
): Card[][] {
    const cardsPerPlayer = numPlayers === 4 ? 4 : 3; // second set

    const totalCardsNeeded = numPlayers * cardsPerPlayer;
    if (remainingDeck.length < totalCardsNeeded) {
        console.warn("⚠️ Not enough cards for second deal, dealing remaining only");
    }

    for (let i = 0; i < totalCardsNeeded && i < remainingDeck.length; i++) {
        currentHands[i % numPlayers].push(remainingDeck[i]);
    }

    return currentHands;
}
