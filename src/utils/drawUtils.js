export function drawSkeleton(landmarks, ctx) {
    ctx.fillStyle = "red";

    for (let point of landmarks) {
        const x = point.x * ctx.canvas.width;
        const y = point.y * ctx.canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export function calculateAngle(a, b, c) {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) -
        Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180) {
        angle = 360 - angle;
    }
    return angle;
}
