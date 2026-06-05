export function drawGraph(ctx, data, width, height, color) {
    if (data.length < 2) return;

    const max = Math.max(...data.map(Math.abs), 1);
    const step = width / (data.length - 1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((val, i) => {
        const x = i * step;
        const y = height / 2 - (val / max) * (height / 2 - 4);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.stroke();
}
