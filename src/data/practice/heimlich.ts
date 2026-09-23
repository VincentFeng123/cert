import type { PracticeDefinition } from '../../lib/practice-types'

// Guidance checked against Red Cross adult choking care and AHA 2025 Adult BLS:
// https://www.redcross.org/take-a-class/resources/learn-first-aid/adult-child-choking
// https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support
export const heimlichPractice: PracticeDefinition = {
  slug: 'heimlich',
  title: 'Adult choking response',
  introduction: 'Rehearse the sequence with a responsive adult. This scenario stays blocked through the first cycle, then clears. In real life, stop blows or thrusts as soon as the airway clears.',
  scope: 'Sequence practice only: the animation cannot assess your hand placement or force. This scenario is not for infants. Pregnancy or inability to encircle the abdomen requires chest thrusts. If the person becomes unresponsive, lower them safely and begin CPR according to your training.',
  steps: [
    {
      id: 'recognize',
      title: 'Recognize severe choking',
      instruction: 'The scene is safe. The adult is holding their throat and cannot speak or cough effectively. Identify what they need.',
      targets: [
        { id: 'recognize-severe', label: 'Recognize severe choking', correct: true, feedback: 'They need immediate help.' },
        { id: 'offer-water', label: 'Offer a drink of water', correct: false, feedback: 'Do not offer water to someone with a blocked airway. Identify the severe choking signs.' },
      ],
      success: 'Severe choking recognized. Get help promptly.',
    },
    {
      id: 'get-help',
      title: 'Get consent and help',
      instruction: 'Ask if you may help; the adult nods. Direct someone nearby to call emergency services while you give care.',
      targets: [
        { id: 'call-help', label: 'Send someone to call 911', correct: true, feedback: 'Help is being called while you stay with the adult.' },
        { id: 'leave-alone', label: 'Leave the person alone', correct: false, feedback: 'Keep supporting and observing them. Ask someone nearby to call for help.' },
      ],
      success: 'Consent acknowledged and emergency help requested.',
    },
    {
      id: 'support-forward',
      title: 'Support and lean forward',
      instruction: 'Move to the side and slightly behind. Support their chest with one arm and help them bend forward at the waist.',
      targets: [
        { id: 'support-forward', label: 'Support the chest and lean forward', correct: true, feedback: 'The helper supports the adult in a forward-leaning position.' },
        { id: 'tilt-back', label: 'Tilt their head backward', correct: false, feedback: 'For back blows, support their chest and lean their upper body forward.' },
      ],
      motionMs: 900,
      success: 'Forward support position rehearsed.',
    },
    {
      id: 'back-blows',
      title: 'Give separate back blows',
      instruction: 'Use the heel of your hand between the shoulder blades. Rehearse five separate blows. The airway remains blocked in this scenario; stop sooner in real life if it clears.',
      targets: [
        { id: 'back-blow', label: 'Rehearse one back blow', correct: true, feedback: 'One separate back-blow animation recorded.' },
      ],
      repetitions: 5,
      motionMs: 900,
      success: 'Five back blows rehearsed. The airway is still blocked in this scenario.',
    },
    {
      id: 'fist-position',
      title: 'Prepare abdominal thrusts',
      instruction: 'Bring the adult upright and stand behind them. Place the thumb side of your fist just above the navel, below the breastbone. Cover it with your other hand.',
      targets: [
        { id: 'fist-position', label: 'Position hands above the navel', correct: true, feedback: 'The hands are shown above the navel, below the breastbone.' },
        { id: 'press-ribs', label: 'Place hands on the ribs', correct: false, feedback: 'The target is the abdomen above the navel, not the ribs or breastbone.' },
      ],
      motionMs: 800,
      success: 'Abdominal hand position rehearsed.',
    },
    {
      id: 'abdominal-thrusts',
      title: 'Rehearse inward and upward',
      instruction: 'Rehearse five separate inward-and-upward thrusts. Watch for a change after each one. These animations illustrate direction, not the force needed in a real emergency.',
      targets: [
        { id: 'abdominal-thrust', label: 'Rehearse one abdominal thrust', correct: true, feedback: 'One inward-and-upward animation recorded.' },
      ],
      repetitions: 5,
      motionMs: 900,
      success: 'The obstruction clears in this scenario. Reassess before doing anything else.',
    },
    {
      id: 'reassess',
      title: 'Airway clear: stop and observe',
      instruction: 'The adult can now speak and breathe. Choose the next action. If the airway had stayed blocked, repeat the back-blow and thrust cycle; unresponsiveness requires CPR.',
      targets: [
        { id: 'stop-monitor', label: 'Stop thrusts and keep observing', correct: true, feedback: 'Stay with the adult and follow the emergency dispatcher’s advice.' },
        { id: 'continue-thrusts', label: 'Keep giving abdominal thrusts', correct: false, feedback: 'Stop blows and thrusts when the obstruction clears. Continue to observe their breathing.' },
      ],
      success: 'Response sequence complete. Continue learning with hands-on instruction.',
    },
  ],
}
