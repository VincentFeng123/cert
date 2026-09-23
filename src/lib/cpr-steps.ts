// Clinical rate and hand-position guidance: AHA 2025 Adult Basic Life Support.
// https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support
export const CPR_SIMULATION_STEPS = [
  {
    id: 0,
    title: 'Scene Safety',
    instruction: 'Review the practice scene before approaching. In an emergency, check for hazards, check responsiveness and breathing, and call for help and an AED.',
    cameraPosition: [2.65, 3.25, 3.1] as [number, number, number],
    cameraTarget: [0, 0.1, -0.1] as [number, number, number],
    completionMethod: 'Select Review the scene, then confirm you are ready to continue.',
  },
  {
    id: 1,
    title: 'Hand Placement',
    instruction: 'Place the heel of one hand on the center of the chest, on the lower half of the breastbone, and place your other hand on top.',
    cameraPosition: [1.8, 3.15, 2.35] as [number, number, number],
    cameraTarget: [0, 0.25, -0.15] as [number, number, number],
    completionMethod: 'Select the green chest target or use Place hands to rehearse the position.',
  },
  {
    id: 2,
    title: 'Chest Compressions',
    instruction: 'Practice a steady rhythm of 100–120 taps per minute. Each tap animates a compression; this browser exercise cannot measure compression depth or physical technique.',
    cameraPosition: [1.8, 3.15, 2.35] as [number, number, number],
    cameraTarget: [0, 0.25, -0.15] as [number, number, number],
    requiredCompressions: 30,
    minBPM: 100,
    maxBPM: 120,
    completionMethod: 'Complete 30 taps with an average of 100–120 BPM and at least 80% of intervals in that range. This is the app’s rhythm practice goal, not a clinical assessment.',
  },
]
