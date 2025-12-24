# CPR 3D Training Upgrade Roadmap

## 1. Audit Summary (March 2024)
- **Model fidelity**: `CPRSimulation` currently loads `/models/basic_human_mesh.glb` but falls back to primitive meshes when it fails. The model lacks high-frequency surface detail, realistic materials, or separated meshes for arms/head that would support nuanced animation.
- **Animation & rigging**: Breathing is simulated via incremental Y translation; no skeletal rig, blend shapes, or compression deformation on the torso. Head-tilt interaction rotates a single mesh without constraints or secondary motion.
- **Lighting & rendering**: Scene uses one `ambientLight`, one `directionalLight`, and a `pointLight`. There is no tone mapping, shadows, post-processing, or environment lighting. Materials are flat, so depth cues are weak.
- **Interaction system**: Inputs rely on simple click targets. No physics volumes, depth sensing, or controller abstractions. Drag interaction uses pointer deltas only.
- **Performance**: No Level of Detail (LOD) strategy, texture atlases, or GPU profiling. Canvas is fixed at 600px height with static render settings.
- **Telemetry**: Compression cadence and errors are only stored in component state; no structured metrics exist for analytics or adaptive coaching.

## 2. Prioritized Backlog
| Priority | Track | Key Outcomes |
| --- | --- | --- |
| P0 | Telemetry | Capture compression cadence, accuracy, failure modes, and step transitions for analytics + AI coaching. |
| P1 | Asset Upgrade | Replace fallback mesh with hero patient + responder hands, authored LODs, baked normal maps, and texture atlases. |
| P1 | Interaction | Add collision helpers, depth cues, and controller abstraction layer to support mouse/touch/gamepad/hand tracking. |
| P2 | Animation | Rig patient with IK spine, deformable chest, and secondary breathing/feedback clips synced to compression metrics. |
| P2 | Rendering | Introduce staged lighting presets, tone mapping, SSAO, and post-processing with mobile fallbacks. |
| P3 | XR/Device Support | Investigate Leap Motion or WebXR controllers for advanced practice sessions. |

## 3. Asset Production Plan
1. **Hero Patient Model**
   - Sculpt high-poly patient mesh with clean topology for chest deformation.
   - Bake normal + ambient occlusion maps into 2K atlas; create LOD0-LOD2 meshes.
   - Deliver stylized PBR material variants (training dummy vs. realistic skin) for theming.
2. **Responder Hands**
   - Model and rig hands with ~30 bones for expressive compression poses.
   - Author blend shapes for finger spread/grip cues; supply gloved + bare variants.
3. **Environment Dressing**
   - Low-poly room shell with modular props (AED, medical bag) and baked lighting hints.
   - Provide collider meshes aligned with new interaction volumes.

## 4. Animation Enhancements
- Build Maya/Blender rig with spine IK, chest deformers, and head/neck constraints.
- Produce animation clips:
  - `Idle_Breathing_Light` (loop)
  - `Compression_Response` (triggered per compression with subtle body reaction)
  - `Compression_Failure` (visual cue when pacing drifts)
  - `Airway_Prep` (head-tilt with jaw slack)
- Export as GLTF/GLB with animation tracks, named markers for event syncing.
- Add animation state machine in `CPRSimulation` to blend between loops based on telemetry events.

## 5. Interaction & Physics Layer
- Implement collider definitions around chest, shoulders, and head using `THREE.Mesh` + `Raycaster`.
- Add helper gizmos (transparent planes, outlines) that activate when hands align correctly.
- Abstract input with a `ControllerAdapter` (mouse, touch, gamepad, Leap Motion) that emits standardized interaction events (`press`, `compress`, `tilt`, `release`).
- Integrate lightweight physics (e.g., `cannon-es`) or custom spring equations for compression depth feedback.
- Provide haptic-like feedback via visual pulses, audio cues, and optional `navigator.vibrate()` on supported devices.

## 6. Lighting & Rendering Upgrades
- Author HDRI skybox for ambient lighting; add `Environment` from `@react-three/drei`.
- Configure directional key light + rim light with soft shadows; enable cascaded shadow maps or contact shadows.
- Introduce post-processing pipeline (`@react-three/postprocessing`) featuring:
  - Tone mapping + color grading LUTs.
  - Screen-space ambient occlusion (SSAO) for crevice definition.
  - Bloom or subtle vignette to focus on the patient.
- Add quality presets:
  - **High**: full effects, 2K textures, 60 FPS target.
  - **Balanced**: reduced SSAO samples, 1K textures.
  - **Mobile**: baked lighting, no post FX, simplified shaders.

## 7. Telemetry & Analytics
- **Events to capture**
  - Step transitions (`scene`, `hands`, `compressions`, `airway`).
  - Compression events with count, live BPM, depth estimate, variance.
  - Failure states (`pace_low`, `pace_high`, `depth_insufficient`).
  - Recovery events (user retries, success after feedback).
- **Storage & routing**
  - Local session buffer (last 200 events) for chatbot adaptive prompts.
  - Optional POST endpoint (`/api/telemetry`) for aggregated analytics.
  - Emit `CustomEvent<'cpr-telemetry'>` for in-app subscribers (coach overlays, badges).
- **AI assistant integration**
  - Feed structured telemetry summary into `SimpleChatbot` context.
  - Trigger targeted tips when cadence drifts or user stalls.

## 8. Phased Execution
1. **Foundation (Week 1-2)**
   - Land telemetry hooks (in-progress via this update).
   - Finalize asset briefs & outsource modeling.
   - Prototype lighting presets using current mesh.
2. **Production (Week 3-6)**
   - Import hero assets + LOD pipeline.
   - Integrate animation controller & interaction adapters.
   - Validate performance (CPU/GPU profiling) on desktop + mobile.
3. **Polish & Analytics (Week 7-8)**
   - Tune post-processing & quality tiers.
   - Wire telemetry summaries into chatbot and dashboards.
   - Author regression tests for interaction edge cases.

## 9. Acceptance Criteria
- High-poly patient + responder assets render at ≥55 FPS on target hardware with automatic LOD swaps.
- Compression animations sync within ±0.1s of telemetry events.
- Interaction layer supports mouse + touch (baseline) and stubs for extended controllers.
- Telemetry dashboard (prototype) visualizes average cadence, error rate, completion funnels.
- Chatbot references live telemetry (“You’re averaging 92 BPM—try to speed up slightly.”).

---
**Owners**: 3D Artist, Technical Artist, Frontend Engineer, Product Designer  
**Latest Update**: Telemetry scaffolding underway; asset commissions queued post-approval.
