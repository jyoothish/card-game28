import type { Card } from './cards';

export const shuffle = (arr: Card[], seedRandom?: () => number): Card[] => {
    const a = arr.slice();
    const rnd = seedRandom ?? Math.random;
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
