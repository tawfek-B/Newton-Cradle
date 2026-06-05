export function updateLabel(labelData, value) {
    const { canvas, ctx, texture } = labelData;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    ctx.fillText(value, canvas.width / 2, canvas.height / 2);
  
    texture.needsUpdate = true;
  }
