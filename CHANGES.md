# Physics Fixes — Newton's Cradle

## Problems Fixed

The user reported "cartoonish" collisions where balls clip through each other and don't behave according to real physics. Here's what was wrong and how each fix aligns with the report.

---

## 1. Material Restitution Values (Constants.js)

### Bug
- **Metal restitution was 0.85** — a 15% energy loss per collision. Real steel balls have **e ≈ 0.95–0.98**. With 0.85, after 4 collisions propagating through 5 balls, only **27% of energy** reaches the last ball. The result: balls barely move, intermediate balls jitter.
- **Rubber restitution was 0.92** — physically absurd. Rubber is *less* elastic than steel (it deforms plastically, dissipates energy as heat). The report describes rubber as having "مرونة أقل" (less elasticity).

### Fix (per the report)
```
METAL.restitution:  0.85 → 0.96  (steel is near-ideal elastic)
RUBBER.restitution: 0.92 → 0.45  (rubber is highly inelastic)
RUBBER.density:     1100 → 1200  (more realistic)
WOOD.restitution:   0.65 → 0.60
WOOD.damping:       0.03 → 0.04
```

**Report reference:** الفكرة السابعة: معامل المرونة — measures elasticity loss. الفكرة الخامسة: خصائص المواد — steel is preferred for its high elasticity.

---

## 2. Sound Deduplication Bug (CradleSystem.js)

### Bug
`prevCollisionPairs` was a set that accumulated **forever** — once a collision pair triggered sound, that pair NEVER made sound again until `resetToAngle()` was called. On subsequent swings, the collisions were silent.

### Fix
Per-frame collision pair tracking:
1. A fresh `currentCollisionPairs` set is created at the start of each `update()` call
2. When collision is detected, sound plays only if: `!prevCollisionPairs.has(pid) && !currentCollisionPairs.has(pid)`
3. `currentCollisionPairs.add(pid)` happens **after** the sound check (preventing within-frame duplicate sounds on substeps 2..N)
4. At the end of `update()`, `prevCollisionPairs = currentCollisionPairs` (only pairs that actually collided this frame persist)

**Behavior:**
- Frame 1, substep 1: Collision detected → sound plays (not in prev, not in current) → added to current
- Frame 1, substep 2: Same pair → `currentCollisionPairs.has(pid)` is true → sound **skipped** ✓
- Frame 2: Still colliding → `prevCollisionPairs.has(pid)` is true → sound **skipped** ✓
- Frame 3: Balls separated → no collision → `prevCollisionPairs = {}`
- Frame 4: Balls re-collide → not in prev, not in current → sound **plays** ✓

---

## 3. Missing Air Drag (CradleSystem.js)

### Bug
The `PHYSICS.AIR_DAMPING = 0.05` constant existed in Constants.js but was **never used**. The user's damping slider defaulted to 0, meaning balls swung with zero air resistance — completely unrealistic.

### Fix
```javascript
const effectiveDamping = PHYSICS.AIR_DAMPING + globalDamping;
```
This ensures a baseline air drag of 0.05 is **always** present, and the user's damping slider adds on top. No dead zone in the 0–0.05 slider range (unlike `Math.max` clamping).

**Report reference:** الفكرة السادسة: التبدد — AIR_DRAG_LINEAR: 0.02 and AIR_DRAG_QUADRATIC: 0.005.

---

## 4. Post-Substep Separation Pass (CradleSystem.js)

### Bug
After the last substep, the pendulum arc correction in `stepPendulumSubstep` can push balls back toward each other, partially undoing the collision separation. This creates **persistent micro-clipping** that makes collisions look wrong.

### Fix
After the main substep loop, a secondary pass checks ALL ball pairs one more time and separates any residual overlap:
```javascript
for (let i = 0; i < this.balls.length; i++) {
    for (let j = i + 1; j < this.balls.length; j++) {
        if (detectCollision(b1, b2)) {
            resolveCollision(b1, b2);  // separates positions + shifts rope nodes
        }
    }
}
```
This catches the edge case where the very last substep's arc correction creates overlap that wouldn't be caught until the next frame.

**Report reference:** التطبيق العملي والقوانين الشاملة — position correction formula: `تصحيح الموقع`.

---

## 5. Rope Segments (Ball.js)

### Bug
Rope segments were set to 8. The report explicitly states: **"عدد الشرائح لكل حبل سيكون 15-30"** (15-30 segments per rope).

### Fix
```javascript
this.ropeSegments = 8 → 15;
```
More segments means smoother elastic rope behavior — better wave propagation, less stiffness, and more realistic rope dynamics following collision separation.

---

## Summary of Changed Files

| File | Changes |
|------|---------|
| `src/core/Constants.js` | Metal restitution 0.85→0.96, Rubber restitution 0.92→0.45, Rubber density 1100→1200 |
| `src/objects/CradleSystem.js` | Per-frame sound dedup, air drag baseline (0.05), post-substep separation pass |
| `src/objects/Ball.js` | ropeSegments 8→15 per report specification |

## How to Test

1. Run the project with `npm run dev`
2. Open the browser and drag the rightmost ball to ~30° and release
3. **Expected (real physics):** One ball swings out from the left side with nearly the same velocity. The collision sound plays once on impact. The motion continues for ~20+ seconds with gradual decay from air drag.
4. **Previously (broken):** The last ball barely moved, intermediate balls jittered, sound only played once ever, and balls appeared to clip through each other.
5. Try different materials in the UI dropdown:
   - **Metal:** Clean "one ball out" effect, bright collision sound
   - **Wood:** Duller sound, more energy loss, faster decay
   - **Rubber:** Very little bounce, soft thud sound, rapid energy dissipation
6. Reset with the angle slider to repeat the test
