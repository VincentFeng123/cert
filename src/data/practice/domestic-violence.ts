import type { PracticeDefinition } from '../../lib/practice-types'

// Reviewed against The Hotline's survivor-support, safety-planning, and internet-safety guidance.
// https://www.thehotline.org/support-others/ways-to-support-a-domestic-violence-survivor/
// https://www.thehotline.org/resources/talking-about-relationship-abuse/
// https://www.thehotline.org/plan-for-safety/
// https://www.thehotline.org/plan-for-safety/internet-safety/
export const domesticViolencePractice: PracticeDefinition = {
  slug: 'domestic-violence',
  title: 'A supportive conversation',
  introduction: 'Meet Alex and Jordan in a quiet community room. Rehearse six ways to support someone who has shared concerns about a controlling partner. Choose actions in the 3D room or use the buttons below.',
  scope: 'A fictional, non-graphic conversation rehearsal. Nobody is in immediate danger in this scene. Real safety plans depend on the person’s wishes and circumstances; this practice is not crisis counseling. In the U.S., call 800-799-7233, text START to 88788, or visit TheHotline.org using a safe contact method. In immediate danger, contact emergency services when safe.',
  steps: [
    {
      id: 'privacy',
      title: 'Ask before talking',
      instruction: 'Alex has mentioned problems at home. Before discussing details, ask whether this private space and this moment feel safe. Let Alex decide whether to continue.',
      motionMs: 1400,
      targets: [
        { id: 'ask-private', label: 'Check that it is safe to talk', correct: true, feedback: 'Ask permission first. Alex agrees to talk here, and the chairs turn toward each other for a private conversation.' },
        { id: 'start-public', label: 'Share the story with others', correct: false, feedback: 'Do not disclose their situation to others without their permission. First ask if and where they feel safe talking.' },
      ],
      success: 'Alex chooses to continue. Privacy and consent come before the conversation.',
    },
    {
      id: 'listen',
      title: 'Make room to listen',
      instruction: 'Alex describes a partner checking messages and limiting contact with friends. Listen without interrupting, demanding proof, or trying to take over.',
      motionMs: 1600,
      targets: [
        { id: 'listen', label: 'Listen without interrupting', correct: true, feedback: 'Give Alex room to speak. An attentive posture and a gentle acknowledgment can show that you are listening.' },
        { id: 'interrupt', label: 'Interrupt with your solution', correct: false, feedback: 'A quick solution can shut down the conversation. Listen first and let Alex describe what matters to them.' },
      ],
      success: 'You listened and acknowledged Alex’s concerns without taking control.',
    },
    {
      id: 'validate',
      title: 'Respond without blame',
      instruction: 'Alex worries that the abuse is their fault. Choose a response that validates their experience. Support does not require judging them or their decisions.',
      motionMs: 1400,
      targets: [
        { id: 'believe', label: '“You do not deserve this.”', correct: true, feedback: 'Let Alex know you believe them and that abuse is not their fault. Stay supportive and nonjudgmental.' },
        { id: 'blame', label: '“Why did you let it happen?”', correct: false, feedback: 'That places blame on the person experiencing abuse. Responsibility belongs to the person choosing abusive behavior.' },
      ],
      success: 'You affirmed that Alex deserves safety and support.',
    },
    {
      id: 'choice',
      title: 'Keep the choice with them',
      instruction: 'Alex is unsure about the next step. Ask what would help. Do not pressure them to leave, confront their partner, or decide on their behalf.',
      motionMs: 1600,
      targets: [
        { id: 'ask-wishes', label: '“What support would help?”', correct: true, feedback: 'Alex asks to explore support options. Their preferences guide the conversation and any next steps.' },
        { id: 'decide-for-them', label: 'Make the decision for Alex', correct: false, feedback: 'Taking over can remove their control and increase danger. Ask about their wishes and offer options without pressure.' },
      ],
      success: 'Alex chooses to explore resources. You offer help on their terms.',
    },
    {
      id: 'resources',
      title: 'Consider a safer contact method',
      instruction: 'Alex wants to speak with an advocate, but their own phone may be monitored. Discuss a safer device and contact method before offering a resource.',
      motionMs: 1800,
      targets: [
        { id: 'safer-device', label: 'Offer a safer device, with consent', correct: true, feedback: 'Alex agrees to use a device their partner cannot access. Share The Hotline’s contact options and let Alex choose how to reach an advocate.' },
        { id: 'shared-phone', label: 'Send details to the monitored phone', correct: false, feedback: 'Messages and browsing can be monitored. Incognito mode and quick exit cannot erase all traces. Ask about a safer method first.' },
      ],
      success: 'You checked how to share support safely. The device moves toward Alex only after they agree.',
    },
    {
      id: 'plan',
      title: 'Explore a plan together',
      instruction: 'Alex would like help thinking about a safe next step. Discuss safe contact and options with an advocate. A personalized plan can help while staying, preparing to leave, or after leaving.',
      motionMs: 1800,
      targets: [
        { id: 'plan-together', label: 'Plan around Alex’s choices', correct: true, feedback: 'Together, identify a safe way to stay in contact and offer advocate support. The diagram shows possible options, not a direction Alex must take.' },
        { id: 'force-leave', label: 'Tell Alex to leave immediately', correct: false, feedback: 'Leaving may increase danger and may not be possible right now. Support their decisions and a plan suited to their circumstances.' },
      ],
      success: 'Conversation complete: ask, listen, validate, respect choice, connect safely, and plan together. Alex remains in control.',
    },
  ],
}
