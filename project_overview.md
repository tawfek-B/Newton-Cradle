# Newton's Cradle — Project Overview

## What This Project Is

A 3D interactive Newton's Cradle simulation built with **Three.js** and **Vite**. Users can switch between three materials (Metal, Rubber, Wood), adjust physical parameters (mass, gravity, damping, rope length, release angle), and visualize force vectors in real-time.

---

## Physics Architecture

### Core Pipeline (per frame)

```
For each substep:
  1. Pendulum substep (gravity + rope forces + integration + damping) — per ball
  2. Collision detection & resolution — all pairs, cascade iterations
  3. Arc projection — snap balls back to pendulum arc after collision
  4. Rope node shifting — move rope nodes to follow collision separation

After all substeps:
  5. Compute analytics (angular velocity, tension, energy)
  6. Sync meshes and update visualizations
```

### Files & Their Roles

| File | Role | Key Functions |
|------|------|---------------|
| `src/core/Constants.js` | All physics constants | Gravity, material properties, collision settings |
| `src/physics/Integrator.js` | Numerical integration | Semi-implicit Euler (primary), Verlet, RK4 |
| `src/physics/Pendulum.js` | Pendulum dynamics | `stepPendulumSubstep()`, `computePendulumAnalytics()` |
| `src/physics/Collision.js` | Collision response | `resolveCollision()` — impulse-based with position correction |
| `src/physics/Damping.js` | Velocity damping | Exponential decay: `v *= exp(-d·dt)` |
| `src/physics/Energy.js` | Energy tracking | KE + PE, energy drift monitoring |
| `src/physics/Constraints.js` | Rope/constraint geometry | Tension computation, angular/acceleration analytics |
| `src/physics/RopePhysics.js` | Elastic rope simulation | Spring-mass rope model with stiffness/damping/air drag |
| `src/objects/Ball.js` | Ball entity | Geometry, materials (textures), ropes, trail rendering |
| `src/objects/Rope.js` | Rope entity | Segmented line connecting anchor to ball |
| `src/objects/CradleSystem.js` | System orchestrator | Main update loop, collision cascade, sound triggering |
| `src/audio/SoundManager.js` | Audio playback | Loads & plays MP3 files per material on collision |
| `src/audio/CollisionAudio.js` | Audio bridge | Threshold check + delegates to SoundManager |

---

## Physics Verification Against the Report

### The following concepts from the docx report are implemented:

| Concept | Docx Section | Implementation | Status |
|---------|-------------|----------------|--------|
| **Conservation of momentum** | الفكرة الأولى: حفظ الزخم | Collision impulse formula `j = -(1+e)·v_rel / (1/m1 + 1/m2)` | ✅ |
| **Conservation of energy** | الفكرة الثانية: حفظ الطاقة | `computeEnergy()` tracks KE + PE, monitors drift | ✅ |
| **Inelastic collisions** | الفكرة الثالثة: التصادم | `resolveCollision()` uses coefficient of restitution | ✅ |
| **Energy loss formula** | الفكرة الرابعة: الطاقة | `ΔE = (1-e²)·½·μ·v_rel²` computed on each collision | ✅ |
| **Hertzian contact** | الفكرة الخامسة: الاتصال الهرتزي | `computeHertzianForce()` with stiffness + damping | ✅ |
| **Sound from deformation** | الفكرة السادسة: الصوت | MP3 playback scaled by impact velocity | ✅ |
| **Pendulum dynamics** | البندول البسيط | Each ball treated as pendulum with length L and gravity g | ✅ |
| **Newton's 2nd law** | قوانين نيوتن | `F = ma` applied in `stepPendulumSubstep()` | ✅ |
| **Air resistance** | قانون التبدد الخطي | `AIR_DRAG_LINEAR` and `AIR_DRAG_QUADRATIC` constants | ✅ |
| **Hooke's law (rope tension)** | قانون هووك | Elastic rope model with stiffness constant in `RopePhysics.js` | ✅ |
| **Material properties** | خصائص المواد | Individual restitution, friction, density, damping per material | ✅ |
| **Numerical integration** | التحديث العددي | Semi-implicit Euler integration | ✅ |

### Material Properties Compared to Real Physics

| Property | Metal (e=0.96) | Rubber (e=0.45) | Wood (e=0.60) | Real-world expectation |
|----------|---------------|----------------|---------------|----------------------|
| Restitution | 0.96 | 0.45 | 0.60 | ✅ Metal ≈ 0.90-0.98, Rubber ≈ 0.30-0.50, Wood ≈ 0.50-0.70 |
| Density (kg/m³) | 7800 | 1200 | 700 | ✅ Steel ≈ 7800, Rubber ≈ 1100-1300, Wood ≈ 500-900 |
| Damping | 0.01 | 0.08 | 0.04 | ✅ Rubber has high internal damping (hysteresis) |
| Friction | 0.15 | 0.80 | 0.50 | ✅ Rubber has very high friction coefficient |

### Why Rubber & Wood Don't "Work" Like Metal

**This is physically correct.** See `CHANGELOG_2026-05-29.md` section 5 for detailed math.

In short:
- **Rubber** loses ~80% of collision energy per impact, has 8× more damping, 6.5× less mass, and high friction → balls stick/drag rather than transferring momentum
- **Wood** loses ~64% of collision energy per impact, has 4× more damping, 11× less mass → similar poor momentum propagation
- **Metal** (steel) is the classic cradle material precisely because its near-elastic collisions (only ~8% loss) and high density enable clean momentum transfer

---

## Visual & Interactive Features

- **Material switching** — Metal / Rubber / Wood with distinct visual textures
- **Parameter controls** — Mass, damping, gravity, rope length, release angle
- **Vector visualization** — Velocity, acceleration, tension, weight, centripetal, tangential with labeled sprites
- **Trail rendering** — Color-coded position trails
- **HUD** — Real-time values for all vector components
- **Orbit controls** — Rotate/zoom/pan camera
- **Double-click** — Fullscreen toggle
- **HDRI environment** — Realistic lighting from `.exr` map
- **Collision sounds** — Distinct MP3 per material, volume scaled by impact force

---

## Project Structure

```
Newton-Cradle/
├── public/                     # Static assets (served at /)
│   ├── balls/                  # Material textures (Metal, Rubber, Wood)
│   ├── table/                  # Table textures
│   ├── metal.mp3               # Metal collision sound
│   ├── rubber.mp3              # Rubber collision sound
│   ├── wood.mp3                # Wood collision sound
│   └── vintage_measuring_lab_*.exr  # HDR environment map
├── src/
│   ├── audio/                  # Sound system
│   ├── core/                   # Constants, time, input, debug
│   ├── objects/                # Ball, Rope, CradleSystem
│   ├── physics/                # All physics modules
│   ├── rendering/              # Vector, trail, label, graph rendering
│   ├── ui/                     # GUI, debug panel, graph UI
│   ├── utils/                  # Math, vector, physics utilities
│   ├── world/                  # Scene, camera, renderer, cradle arm, table, HUD
│   ├── main.js                 # Entry point — loop, UI setup, orchestration
│   └── style.css               # Global styles
├── index.html                  # HTML shell
├── package.json                # Dependencies (three.js, lil-gui, vite)
└── *.md                        # Documentation files
```
