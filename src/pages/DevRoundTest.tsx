import { useEffect } from "react";
import { GameEngine } from "../logic/engine";

export default function DevRoundTest() {
    useEffect(() => {
        const engine = new GameEngine(4);
        engine.startRound();

        try {
            engine.makeBid(0, null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.log("Dealer cannot pass (expected):", err.message);
            } else {
                console.log("Unknown error:", err);
            }
        }

        engine.makeBid(0, 14);
        console.log("Bidding1 finished state:", engine.state);
        console.log("highestBid:", engine.state.currentHighestBid);

        // Dealer folds a card from their hand
        const cardToFold = engine.state.players[0].hand[0];
        engine.foldCard(0, cardToFold);

    }, []);

    return <div>Check console for round + bidding + folding logic ✅</div>;
}
