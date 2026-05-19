// Handles motion trail generation, updates, fading,
// and rendering behind moving objects.
export function updateTrail(ball) {
    ball.trailPoints.push(ball.pos.clone());
  
    if (ball.trailPoints.length > ball.maxTrail) {
      ball.trailPoints.shift();
    }
  
    const positions = [];
  
    for (const p of ball.trailPoints) {
      positions.push(p.x, p.y, p.z);
    }
  
    ball.trailGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
  }