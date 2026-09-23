import type { PracticeDefinition } from '../../lib/practice-types'

// Source: FBI Active Shooter Event Quick Reference Guide.
// https://www.fbi.gov/file-repository/reports-and-publications/active-shooter-event-quick-reference-guide_2015.pdf
export const gunViolencePractice: PracticeDefinition = {
  slug: 'gun-violence',
  title: 'A clear route to safety',
  introduction: 'An emergency alert reports a threat elsewhere in the building. Your side exit is clear and leads away from the reported danger. Help the learner move to safety, then communicate with responders.',
  scope: 'This miniature scene is not to scale and does not establish a safe distance. Practice decisions only: follow your local emergency plan, the conditions around you, and responders’ instructions. No weapon or confrontation practice is included.',
  steps: [
    {
      id: 'identify-exit',
      title: 'Find the safe route',
      instruction: 'The side exit is confirmed clear and leads away from the reported danger. Select it in the scene. The other corridor has not been confirmed safe.',
      targets: [
        { id: 'safe-exit', label: 'Choose the clear side exit', correct: true, feedback: 'This exit leads away from the reported danger and is available to you.' },
        { id: 'unsafe-corridor', label: 'Investigate the other corridor', correct: false, feedback: 'Do not approach to investigate. Use the available safe route away from the danger.' },
      ],
      success: 'You identified an available route away from the reported threat. If there were no safe route, you would need to shelter out of view instead.',
    },
    {
      id: 'leave-belongings',
      title: 'Leave promptly',
      instruction: 'Your bag is on the bench. Choose the exit to leave now, without delaying to retrieve belongings. Watch the learner move through the clear doorway.',
      targets: [
        { id: 'leave-now', label: 'Leave through the exit now', correct: true, feedback: 'Leave belongings behind and keep moving along the safe route.' },
        { id: 'collect-bag', label: 'Go back for the bag', correct: false, feedback: 'A bag is replaceable. Returning for possessions delays your escape and could expose you to danger.' },
      ],
      motionMs: 1300,
      success: 'You moved out of the building without stopping for belongings.',
    },
    {
      id: 'move-to-safety',
      title: 'Keep moving away',
      instruction: 'Do not stop in the doorway. In this scenario, the marked outside area is away from the danger and is safe to reach. Select it to continue moving.',
      targets: [
        { id: 'safe-point', label: 'Move to the safe outside area', correct: true, feedback: 'Continue away from the danger. In a real emergency, follow the conditions and official directions; this model does not show a safe distance.' },
        { id: 'wait-at-door', label: 'Wait beside the doorway', correct: false, feedback: 'Do not linger at an exit or block people escaping. Continue to a location that is safe in the actual conditions.' },
      ],
      motionMs: 1100,
      success: 'You reached the scenario’s safe area and kept the exit clear.',
    },
    {
      id: 'call-when-safe',
      title: 'Contact emergency services',
      instruction: 'You are now in a safe location and can speak safely. Select the phone to call 911 in the US. Give your location, what is happening, and only details you actually know.',
      targets: [
        { id: 'call-emergency', label: 'Call emergency services from safety', correct: true, feedback: 'Give the exact location and known facts. Follow the dispatcher’s instructions; do not guess or return to investigate.' },
        { id: 'return-to-call', label: 'Return inside to gather details', correct: false, feedback: 'Do not return for more information. Tell the dispatcher what you know from your safe location.' },
      ],
      motionMs: 850,
      success: 'You contacted emergency services from safety. This simulation does not place a real call.',
    },
    {
      id: 'meet-responders',
      title: 'Keep hands empty and visible',
      instruction: 'Responders have arrived and are giving directions. Put the phone away, keep your hands empty and visible, and avoid sudden movements toward them.',
      targets: [
        { id: 'visible-hands', label: 'Show empty hands and follow directions', correct: true, feedback: 'Keep your hands visible, remain calm, and follow responders’ instructions.' },
        { id: 'approach-officers', label: 'Rush toward a responder with the phone', correct: false, feedback: 'Avoid sudden approaches and objects in your hands. Follow directions calmly with empty, visible hands.' },
      ],
      motionMs: 950,
      success: 'You put the phone away and showed empty hands while following the responder’s directions.',
    },
    {
      id: 'support-safely',
      title: 'Stay safe and support others',
      instruction: 'Responders direct you to remain here. Another evacuee is worried about someone inside. Stay in the safe area, listen, and share the concern with responders instead of re-entering.',
      targets: [
        { id: 'stay-and-support', label: 'Stay here and alert responders', correct: true, feedback: 'Listen calmly and pass known information to responders. Let trained responders handle the area they are securing.' },
        { id: 'reenter-building', label: 'Go back inside to search', correct: false, feedback: 'Do not re-enter an unsafe area. Share the missing person’s last known location with responders and follow their instructions.' },
      ],
      motionMs: 800,
      success: 'You completed the sequence: choose a safe route, leave promptly, move away, call when safe, follow responders, and support others without re-entering.',
    },
  ],
}
