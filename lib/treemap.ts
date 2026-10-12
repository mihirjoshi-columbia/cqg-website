// Squarified treemap (Bruls et al.): lays items out as rectangles whose areas are
// proportional to `value`, keeping them as close to square as possible.

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

function worstRatio(areas: number[], side: number): number {
    const sum = areas.reduce((a, b) => a + b, 0);
    const side2 = side * side;
    return Math.max(...areas.map((a) => Math.max((side2 * a) / (sum * sum), (sum * sum) / (side2 * a))));
}

export function treemap<T extends { value: number }>(items: T[], width: number, height: number): (T & Rect)[] {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const scale = (width * height) / sorted.reduce((sum, item) => sum + item.value, 0);
    const out: (T & Rect)[] = [];
    let { x, y, w, h } = { x: 0, y: 0, w: width, h: height };

    let i = 0;
    while (i < sorted.length) {
        const side = Math.min(w, h);
        let end = i + 1;
        let areas = [sorted[i].value * scale];
        while (end < sorted.length) {
            const next = [...areas, sorted[end].value * scale];
            if (worstRatio(next, side) > worstRatio(areas, side)) break;
            areas = next;
            end++;
        }

        // Lay the row along the short side as one strip.
        const thickness = areas.reduce((a, b) => a + b, 0) / side;
        let offset = 0;
        sorted.slice(i, end).forEach((item, k) => {
            const length = areas[k] / thickness;
            out.push(
                w >= h
                    ? { ...item, x, y: y + offset, w: thickness, h: length }
                    : { ...item, x: x + offset, y, w: length, h: thickness }
            );
            offset += length;
        });
        if (w >= h) {
            x += thickness;
            w -= thickness;
        } else {
            y += thickness;
            h -= thickness;
        }
        i = end;
    }
    return out;
}
