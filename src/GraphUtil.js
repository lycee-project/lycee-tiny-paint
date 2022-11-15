
export function distPtSeg(
    x0, y0,
    x1, y1,
    x2, y2
) {
    const a = x2 - x1;
    const b = y2 - y1;
    const a2 = a * a;
    const b2 = b * b;
    const r2 = a2 + b2;
    const tt = -(a*(x1-x0)+b*(y1-y0));
    if( tt < 0 ) {
        return (x1-x0)*(x1-x0) + (y1-y0)*(y1-y0);
    }
    if( tt > r2 ) {
        return (x2-x0)*(x2-x0) + (y2-y0)*(y2-y0);
    }
    const f1 = a*(y1-y0)-b*(x1-x0);
    return (f1*f1)/r2;
}
