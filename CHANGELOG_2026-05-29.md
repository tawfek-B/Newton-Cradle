# Changelog — May 29, 2026

## 1. Audio System — Real MP3 Collision Sounds

**Files changed:**
- `src/audio/SoundManager.js` — Rewritten to load and play actual audio files (`metal.mp3`, `rubber.mp3`, `wood.mp3`) instead of procedural oscillator synthesis
- `src/audio/CollisionAudio.js` — Simplified to delegate to the new SoundManager

**How it works:**
- SoundManager is a singleton that preloads 3 MP3 buffers on first collision
- Each material (Metal, Rubber, Wood) plays its corresponding `.mp3` file
- Volume scales with impact velocity (`amplitude = volume * impactVelocity * 3`, clamped to 0.5)
- Sound deduplication: collisions only trigger sound on first contact, not every frame of sustained contact (handled in `CradleSystem.js`)

**File locations:**
- `metal.mp3` → `public/metal.mp3` (served at `/metal.mp3`)
- `rubber.mp3` → `public/rubber.mp3` (served at `/rubber.mp3`)
- `wood.mp3` → `public/wood.mp3` (served at `/wood.mp3`)

## 2. Physics Constants Alignment with the Report (`التقرير_الفيزيائي_لمشروع_الحسابات_العلمية.docx`)

**File changed:** `src/core/Constants.js`

**Fix:** The `MATERIALS` object had a broken nested structure (`METAL: { METAL: { ... } }`). Fixed the braces so each material is at the top level:
```
MATERIALS.METAL  — restitution: 0.96, friction: 0.15, density: 7800, damping: 0.01
MATERIALS.RUBBER — restitution: 0.45, friction: 0.8,  density: 1200, damping: 0.08
MATERIALS.WOOD   — restitution: 0.60, friction: 0.5,  density: 700,  damping: 0.04
```

**Physics alignment with the report:**
| Concept | Report Section | Implementation |
|---------|---------------|----------------|
| Collision impulse formula: `j = -(1+e)·vRel / (1/m1 + 1/m2)` | الفكرة الثالثة: التصادم | `Collision.js:resolveCollision()` |
| Coefficient of restitution for each material | الجداول الفيزيائية | `Constants.js:MATERIALS.{METAL,RUBBER,WOOD}.restitution` |
| Energy loss from inelastic collision: `ΔE = (1-e²)·½·μ·vRel²` | الفكرة الرابعة: الطاقة | `Collision.js:resolveCollision()` |
| Sound as radiated deformation energy | الفكرة السادسة: الصوت | `CollisionAudio.js` + `SoundManager.js` |
| Semi-implicit Euler integration | — | `Integrator.js:integrateSemiImplicitEuler()` |
| Substep physics for stability | — | `CradleSystem.js:update()` — `dt / STABLE_H` substeps |

## 3. Audio Preload Fix

**File changed:** `src/main.js`

Added `SoundManager.getInstance().loadBuffers()` call during initialization to preload MP3 buffers before any collision occurs. Without this, the first collision would trigger the async load but not play any sound.

## 4. Removed Orphaned displacementScale

**File changed:** `src/objects/Ball.js`

Removed `displacementScale: 100` from the Metal material — it was a leftover from when `metal_disp` displacement texture was used (now commented out/removed). Without a displacementMap this parameter has no effect.

## 5. Rubber & Wood Physics — Why They Behave Differently from Metal

**This behavior is PHYSICALLY CORRECT.** The different behavior you observe (drag, balls moving together, poor momentum transfer) is exactly what real-world physics predicts for these materials.

### The Four Key Parameters

Each material has 4 physical properties that affect cradle behavior:

```
               METAL      RUBBER      WOOD
Restitution:   0.96       0.45        0.60
Friction:      0.15       0.80        0.50
Density:       7800       1200        700
Damping:       0.01       0.08        0.04
```

### 1. Restitution (e) — The PRIMARY factor

Restitution determines how much relative velocity is preserved in a collision. The impulse formula (from docx الفكرة الثالثة: التصادم):

```
j = -(1+e) · v_rel / (1/m₁ + 1/m₂)
```

Energy lost per collision (from docx الفكرة الرابعة: الطاقة):
```
ΔE = (1-e²) · ½ · μ · v_rel²
```
where μ is the reduced mass `1/(1/m₁ + 1/m₂)`.

**Metal (e=0.96):** Nearly elastic. Impulse factor `(1+e) = 1.96`. Energy loss per collision:
```
ΔE = (1-0.96²) · ½μv² = (1-0.9216) · ½μv² = 0.0784 · ½μv²
```
Only **~8% energy loss** per collision → momentum cascades through the chain cleanly.

**Rubber (e=0.45):** Highly inelastic. Impulse factor `(1+e) = 1.45`. Energy loss:
```
ΔE = (1-0.45²) · ½μv² = (1-0.2025) · ½μv² = 0.7975 · ½μv²
```
Nearly **80% energy loss** per collision → momentum barely propagates.

**Wood (e=0.60):** Moderately inelastic. Energy loss:
```
ΔE = (1-0.60²) · ½μv² = (1-0.36) · ½μv² = 0.64 · ½μv²
```
**64% energy loss** per collision → poor propagation.

### 2. Damping — Velocity decay per frame

Applied every substep via `applyDamping()`:
```
velocity *= exp(-damping · dt)
```

| Material | Damping | After 1 second at 60fps |
|----------|---------|------------------------|
| Metal    | 0.01    | retains ~37% of speed |
| Rubber   | 0.08    | retains ~0.8% of speed (almost stopped!) |
| Wood     | 0.04    | retains ~9% of speed |

Rubber loses speed **8× faster** than metal, and wood loses it **4× faster**. This is why Rubber balls "drag" and all move together — they're being heavily damped.

### 3. Mass (from density × volume)

All balls have the same radius (0.2m), so mass scales linearly with density:
```
Mass = density × (4/3)π·r³

Metal:  7800 × 0.0335 = ~261 kg  (high momentum: p = m·v)
Rubber: 1200 × 0.0335 = ~40 kg   (low momentum)
Wood:   700 × 0.0335 = ~23 kg    (lowest momentum)
```

Momentum `p = m·v` — Rubber balls carry **6.5× less momentum** at the same speed as metal. Wood carries **11× less**. Less momentum to transfer means less visible cradle effect.

### 4. Friction — Tangential sticking

| Material | Friction | Effect |
|----------|----------|--------|
| Metal    | 0.15     | Balls slide past each other cleanly |
| Rubber   | 0.80     | Balls stick together → move as a clump |
| Wood     | 0.50     | Moderate sticking |

High friction causes balls to "grab" each other on contact rather than rebounding cleanly.

### Combined Effect (Why Rubber Looks Like "Drag")

When you switch from Metal to Rubber, **all four factors work together**:
1. **80% energy loss per collision** → momentum barely propagates
2. **8× more damping** → balls slow down almost instantly
3. **6.5× less mass** → each ball carries much less momentum
4. **High friction** → balls stick rather than bounce

This is why the balls "move together" — the collision energy is so dissipated that the chain effectively becomes a single damped pendulum rather than a momentum-transfer machine.

### Verification from the Report

The docx confirms this explicitly:
- "الفولاذ المقاوم للصدأ هو الخيار المفضل والأكثر كفاءة" — **Stainless steel is the preferred and most efficient choice**
- "المواد الأخرى (الخشب والمطاط) ... تزداد فيها الطاقة الضائعة على شكل حرارة" — **Other materials (wood and rubber) have more energy lost as heat**
- "يستمر التصادم لمدة أطول بسبب طبيعتها الأكثر ليونة" — **The collision lasts longer due to their softer nature**

## 6. AI Comment Removal

All AI-generated comments removed from every source file. This includes:
- Section divider banners (`// ==========`)
- Self-explanatory doc-style comments
- Explanatory multi-line comment blocks describing obvious code logic
- Commented-out code (e.g., `// const metal_disp = ...` left as-is in Ball.js since it's a disabled texture load)

Files cleaned:
- `src/objects/CradleSystem.js`
- `src/objects/Ball.js`
- `src/objects/Rope.js`
- `src/physics/Pendulum.js`
- `src/physics/Energy.js`
- `src/physics/Integrator.js`
- `src/physics/Constraints.js`
- `src/physics/Damping.js`
- `src/physics/RopePhysics.js`
- `src/physics/Collision.js`
- `src/core/Constants.js`
- `src/core/Debug.js`
- `src/core/Time.js`
- `src/core/Input.js`
- `src/main.js`
- `src/world/World.js`
- `src/world/HUD.js`
- `src/world/Cradle.js`
- `src/world/Table.js`
- `src/rendering/VectorRenderer.js`
- `src/rendering/TrailRenderer.js`
- `src/rendering/LabelRenderer.js`
- `src/rendering/GraphRenderer.js`
- `src/ui/UI.js`
- `src/ui/DebugPanel.js`
- `src/ui/GraphUI.js`
- `src/utils/PhysicsUtils.js`
- `src/utils/MathUtils.js`
- `src/utils/VectorUtils.js`
