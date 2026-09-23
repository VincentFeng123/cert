export type TrainingChoice = { label: string; feedback: string; correct: boolean; next?: string }
export type TrainingDecision = { id: string; title: string; situation: string; prompt: string; choices: TrainingChoice[] }
export type TrainingScenario = { id: string; title: string; description: string; decisions: TrainingDecision[] }
export type TrainingModuleData = {
  slug: string
  title: string
  shortTitle: string
  eyebrow: string
  description: string
  duration: string
  illustration: 'choking' | 'safety' | 'support'
  scope: string
  takeaway: string
  objectives: string[]
  lessons: { title: string; summary: string; details: string[]; recall: string }[]
  quiz: { question: string; options: string[]; correct: number; explanation: string }[]
  scenarios: TrainingScenario[]
  sources: { title: string; url: string }[]
}

export const heimlichModule: TrainingModuleData = {
  slug: 'heimlich', title: 'Heimlich Training Module', shortTitle: 'Choking response', eyebrow: 'FIRST AID · ADULTS & CHILDREN OVER 1', duration: '15–20 min', illustration: 'choking',
  description: 'Recognize a blocked airway, respond in the right sequence, and know when to switch to CPR.',
  scope: 'Educational practice for adult and child choking. Infants need different care. Take an instructor-led first aid course to learn and practice physical skills; this module does not provide certification.',
  takeaway: 'For severe choking: 5 back blows, then 5 abdominal thrusts if needed. Reassess as you go.',
  objectives: ['Distinguish effective coughing from severe choking.', 'Learn back blows, abdominal thrusts, and important exceptions.', 'Choose the next safe action as a person’s condition changes.'],
  lessons: [
    { title: 'Recognize the emergency', summary: 'Someone who can cough forcefully still has airflow.', details: ['Encourage effective coughing and stay nearby. Watch for changes.', 'Inability to speak, breathe, or cough effectively, a weak or silent cough, or high-pitched sounds can signal severe choking.', 'Check scene safety, ask whether they are choking, get consent if responsive, and have someone call 911.'], recall: 'When is coughing enough? Encourage an effective cough; act when the person cannot cough, speak, or breathe effectively.' },
    { title: 'Start with back blows', summary: 'Support the chest and bend the person forward.', details: ['Stand slightly behind and to the side; kneel if needed for a small child.', 'With the heel of your hand, give up to 5 separate, firm blows between the shoulder blades.', 'Stop if the obstruction clears. If it does not, move to abdominal thrusts.'], recall: 'What comes first for severe choking? Up to 5 back blows, with the person supported and leaning forward.' },
    { title: 'Follow with abdominal thrusts', summary: 'Place your fist above the navel and below the breastbone.', details: ['Stand behind the person, with a stable stance. Put the thumb side of your fist against the abdomen and grasp it with your other hand.', 'Give up to 5 separate inward-and-upward thrusts.', 'If needed, repeat cycles of 5 back blows and 5 thrusts until the airway clears or the person becomes unresponsive.'], recall: 'Where does the fist go? Above the navel and well below the breastbone, followed by inward-and-upward thrusts.' },
    { title: 'Adapt to the person', summary: 'Abdominal thrusts are not right for everyone.', details: ['Use chest thrusts instead of abdominal thrusts during pregnancy or if you cannot reach around the abdomen.', 'A child over 1 receives the same sequence; adjust your position to their size.', 'Never give an infant abdominal thrusts. Infant choking uses back blows and chest thrusts with a different supported position; learn it in a pediatric course.'], recall: 'What changes during pregnancy? Replace abdominal thrusts with chest thrusts.' },
    { title: 'Reassess and continue care', summary: 'Unresponsiveness changes the response immediately.', details: ['If the person becomes unresponsive, lower them onto a firm, flat surface and begin CPR with compressions according to your training. Ensure 911 has been called and get an AED.', 'When opening the airway before breaths, remove an object only if you can see it. Never perform a blind finger sweep.', 'If the obstruction clears, stop blows and thrusts, monitor breathing, and follow emergency medical advice. Seek medical assessment after thrusts or if symptoms remain.'], recall: 'What if they become unresponsive? Lower safely, begin CPR with compressions, and ensure emergency help and an AED are coming.' },
  ],
  quiz: [
    { question: 'A person can speak and cough forcefully. What should you do first?', options: ['Immediately give abdominal thrusts', 'Encourage coughing and watch closely', 'Give them food to push the blockage down'], correct: 1, explanation: 'An effective cough moves air. Encourage it and stay with them; intervene if coughing becomes ineffective or they cannot speak or breathe.' },
    { question: 'What is the initial sequence for a responsive adult with severe choking?', options: ['5 back blows, then 5 abdominal thrusts if needed', '30 abdominal thrusts without checking', '2 rescue breaths while they stand'], correct: 0, explanation: 'Use up to 5 back blows, then up to 5 abdominal thrusts. Stop if the airway clears and repeat if the person remains severely choking.' },
    { question: 'Where do you position a fist for an abdominal thrust?', options: ['Directly over the ribs', 'At the bottom of the abdomen', 'Above the navel, below the breastbone'], correct: 2, explanation: 'Place the thumb side of the fist above the navel and well below the breastbone. Grasp it and pull inward and upward.' },
    { question: 'How should you adapt care for a pregnant person with severe choking?', options: ['Use chest thrusts instead of abdominal thrusts', 'Do not provide help until an ambulance arrives', 'Use abdominal thrusts in exactly the same position'], correct: 0, explanation: 'Use back blows and chest thrusts for a pregnant person, rather than abdominal thrusts. Have someone call 911.' },
    { question: 'The choking person becomes unresponsive. What changes?', options: ['Continue standing abdominal thrusts', 'Sweep the mouth with a finger even if nothing is visible', 'Lower them safely and begin CPR with compressions'], correct: 2, explanation: 'Start CPR on a firm, flat surface according to your training. Ensure help and an AED are coming. Only remove an object from the mouth if it is visible.' },
  ],
  scenarios: [
    { id: 'responsive', title: 'At the dinner table', description: 'Recognize severe choking and work through the response.', decisions: [
      { id: 'recognize', title: 'Notice the change', situation: 'An adult stops eating, grips their throat, and cannot speak or cough. The area is safe and another person is beside you.', prompt: 'What is your next action?', choices: [
        { label: 'Ask if they are choking, get consent, and direct the bystander to call 911.', correct: true, next: 'blows', feedback: 'This is severe choking. Get emergency help moving while you begin care.' },
        { label: 'Ask them to drink water.', correct: false, feedback: 'Water does not resolve a blocked airway and delays care. Recognize severe choking and get help.' },
        { label: 'Leave them alone to see whether it passes.', correct: false, feedback: 'A person unable to speak or cough needs immediate care. Ask the bystander to call so you can stay.' },
      ] },
      { id: 'blows', title: 'Begin care', situation: 'The person nods for help. The bystander is calling 911. They are still responsive but cannot cough.', prompt: 'Choose the first physical action.', choices: [
        { label: 'Lay them down and give breaths.', correct: false, feedback: 'They are responsive. Begin choking care with back blows, rather than rescue breaths.' },
        { label: 'Support their chest, lean them forward, and give up to 5 back blows.', correct: true, next: 'thrusts', feedback: 'Give separate blows between the shoulder blades, stopping if the obstruction clears.' },
        { label: 'Put your fingers deep into their mouth.', correct: false, feedback: 'A blind finger sweep can push an object deeper. Do not reach for an object you cannot see.' },
      ] },
      { id: 'thrusts', title: 'Reassess after back blows', situation: 'Five back blows have not cleared the obstruction. The person remains responsive and is not pregnant; you can reach around their abdomen.', prompt: 'What follows?', choices: [
        { label: 'Wait for emergency responders without further care.', correct: false, feedback: 'Continue care while help is on the way. Severe choking still needs action.' },
        { label: 'Give 5 inward-and-upward abdominal thrusts, then repeat the cycle if needed.', correct: true, feedback: 'Place the fist above the navel and below the breastbone. Stop when the airway clears; switch to CPR if they become unresponsive.' },
        { label: 'Keep giving back blows indefinitely without reassessing.', correct: false, feedback: 'After 5 unsuccessful back blows, alternate with 5 abdominal thrusts and watch for a change in condition.' },
      ] },
    ] },
    { id: 'changing-condition', title: 'When the situation changes', description: 'Adapt care and respond to unresponsiveness.', decisions: [
      { id: 'adapt', title: 'Use the right technique', situation: 'A pregnant adult has severe choking. A bystander has called 911. Five back blows have not cleared the airway.', prompt: 'How do you adapt the next action?', choices: [
        { label: 'Use chest thrusts instead of abdominal thrusts.', correct: true, next: 'collapse', feedback: 'Pregnancy is an important exception: replace abdominal thrusts with chest thrusts.' },
        { label: 'Apply abdominal thrusts lower down.', correct: false, feedback: 'Changing the abdominal position is not the solution. Use chest thrusts during pregnancy.' },
        { label: 'Stop care because pregnancy prevents treatment.', correct: false, feedback: 'Continue appropriate care while emergency help is coming. Use chest thrusts rather than abdominal thrusts.' },
      ] },
      { id: 'collapse', title: 'The person becomes unresponsive', situation: 'Despite your efforts, the person loses responsiveness. The airway has not cleared.', prompt: 'What is the next response?', choices: [
        { label: 'Hold them upright and continue thrusts.', correct: false, feedback: 'Unresponsiveness requires a change to CPR on a firm, flat surface.' },
        { label: 'Lower them safely, start CPR with compressions, and ask for an AED.', correct: true, next: 'airway', feedback: 'Begin CPR according to your training and follow dispatcher guidance.' },
        { label: 'Give them a few minutes to recover before acting.', correct: false, feedback: 'Do not delay. Unresponsiveness with choking is an emergency requiring CPR.' },
      ] },
      { id: 'airway', title: 'Check the airway', situation: 'You are trained to give CPR breaths. After compressions, you open the airway and cannot see an object in the mouth.', prompt: 'Should you sweep the mouth?', choices: [
        { label: 'Yes—sweep until you find the obstruction.', correct: false, feedback: 'Never perform a blind finger sweep: it may push the object deeper.' },
        { label: 'No—remove only a visible object and continue CPR according to training.', correct: true, feedback: 'Continue CPR and follow the dispatcher and AED. Remove an object only when it is visible.' },
      ] },
    ] },
  ],
  sources: [
    { title: 'American Red Cross · Adult & child choking', url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/adult-child-choking' },
    { title: 'British Red Cross · Choking first aid', url: 'https://www.redcross.org.uk/first-aid/learn-first-aid/choking' },
  ],
}

export const gunViolenceModule: TrainingModuleData = {
  slug: 'gun-violence', title: 'Gun Violence Response Module', shortTitle: 'Emergency safety', eyebrow: 'PERSONAL SAFETY · EMERGENCY RESPONSE', duration: '12–15 min', illustration: 'safety',
  description: 'Practice calm decisions about getting to safety, contacting help, and caring for others when it is safe.',
  scope: 'Non-graphic educational scenarios, with no weapon handling or combat simulation. Follow local emergency plans and responders. This module is not a professional safety or first aid certification.',
  takeaway: 'Get to safety first. Call for help when safe. Provide care only when the scene is safe.',
  objectives: ['Choose between a safe exit and sheltering out of view.', 'Share useful information with emergency responders.', 'Recognize life-threatening bleeding and know the limits of your training.'],
  lessons: [
    { title: 'Notice exits before an emergency', summary: 'Know more than one way out and follow your location’s emergency plan.', details: ['Identify accessible exits and places where you could shelter out of view.', 'Take alerts seriously. Do not approach a threat to investigate or film it.', 'Help others evacuate if you can without putting yourself in danger.'], recall: 'What helps before an emergency? Notice exits, accessible routes, and your location’s emergency plan.' },
    { title: 'Escape when there is a safe route', summary: 'Move away from the danger; leave belongings behind.', details: ['Use a safe, accessible exit away from the threat. Do not delay for bags or other possessions.', 'Warn others away from danger if you can do so safely.', 'Once safe, call 911. Do not re-enter until authorities say it is safe.'], recall: 'A safe route is available. What matters most? Leave promptly, leave belongings, and keep moving away from danger.' },
    { title: 'Shelter if you cannot safely escape', summary: 'Stay out of view, secure the space, and silence your phone.', details: ['Choose a hiding place out of sight; lock or block entry if possible.', 'Silence sound and vibration on your phone. Remain quiet.', 'Physical resistance is a last resort only if your life is in imminent danger. This module focuses on escape, shelter, and seeking help.'], recall: 'No safe escape route? Shelter out of view, secure the space if possible, and silence your phone.' },
    { title: 'Communicate and follow responders', summary: 'Call when safe and provide facts, not guesses.', details: ['Give your location, the location of the threat if known, and information about injuries.', 'If speaking is unsafe, text 911 only where supported. Follow local emergency instructions.', 'When officers arrive, keep your hands empty and visible, avoid sudden movements, and follow instructions.'], recall: 'What information comes first on an emergency call? Your exact location and what is happening, then known details.' },
    { title: 'Help only when it is safe', summary: 'Life-threatening bleeding needs immediate help.', details: ['After scene safety is established, get consent if the person is responsive and call 911 or ask someone to call.', 'Use gloves or a barrier if available and press firmly and continuously on the bleeding wound with a dressing or clean cloth.', 'For life-threatening limb bleeding, use a tourniquet if trained. Do not practice wound packing or tourniquet use on a person through this app; take hands-on training and follow dispatcher guidance.'], recall: 'When can you give care? Once it is safe. Call for help and apply firm, continuous pressure to severe external bleeding.' },
  ],
  quiz: [
    { question: 'There is a clear, safe exit away from a threat. What should you prioritize?', options: ['Collect your bag and then leave', 'Leave belongings and move to safety', 'Move toward the sound to understand what is happening'], correct: 1, explanation: 'Escape if you can safely. Leave belongings, move away from the threat, and call for help once safe.' },
    { question: 'You cannot reach an exit safely. What is the best available response?', options: ['Stay out of view, secure the room if possible, and silence your phone', 'Stand near a window to watch', 'Keep your phone ringing so responders can find you'], correct: 0, explanation: 'Shelter out of view, lock or block entry if possible, and silence both sounds and vibration.' },
    { question: 'What should you share with an emergency dispatcher first?', options: ['A rumor you heard online', 'A video recording', 'Your location and what is happening'], correct: 2, explanation: 'Give the location and nature of the emergency, then details you actually know. Follow the dispatcher’s instructions.' },
    { question: 'How should you act when law enforcement arrives?', options: ['Run toward officers while waving an object', 'Keep hands empty and visible and follow instructions', 'Ignore instructions while retrieving belongings'], correct: 1, explanation: 'Keep your hands visible and empty, avoid sudden movements, and follow responders’ directions.' },
    { question: 'Once the scene is safe, someone has severe external bleeding. What is an appropriate initial action?', options: ['Call for help and apply firm, continuous direct pressure', 'Remove the dressing repeatedly to check underneath', 'Delay until you find specialized equipment'], correct: 0, explanation: 'Call 911 and apply firm, steady pressure using a dressing or clean cloth. Use a tourniquet for life-threatening limb bleeding if trained.' },
  ],
  scenarios: [
    { id: 'safe-exit', title: 'A clear way out', description: 'Leave safely and communicate with responders.', decisions: [
      { id: 'exit', title: 'Choose a safe exit', situation: 'An emergency alert reports an armed threat on the other side of a building. An accessible side exit beside you leads away from that area.', prompt: 'What do you do?', choices: [
        { label: 'Leave through the safe exit and leave your bag behind.', correct: true, next: 'call', feedback: 'Move away from danger without delaying for possessions.' },
        { label: 'Return to a distant room to collect your things.', correct: false, feedback: 'Do not trade a safe route for belongings. Leave them behind.' },
        { label: 'Go toward the reported threat to verify the alert.', correct: false, feedback: 'Do not approach to investigate. Use the safe route away from danger.' },
      ] },
      { id: 'call', title: 'You have reached safety', situation: 'You are well away from the building and can safely call 911.', prompt: 'How do you begin the call?', choices: [
        { label: 'Describe unverified posts you saw online.', correct: false, feedback: 'Lead with your location and observed facts. Avoid guessing.' },
        { label: 'Give the address and report the threat and known injuries.', correct: true, next: 'responders', feedback: 'Accurate location and observed information help emergency responders. Follow the dispatcher.' },
      ] },
      { id: 'responders', title: 'Responders arrive', situation: 'Officers direct people toward a safe assembly area.', prompt: 'What is the safest response?', choices: [
        { label: 'Keep hands empty and visible and follow the directions.', correct: true, feedback: 'Avoid sudden movements and stay out of responders’ way. Do not return until authorities allow it.' },
        { label: 'Approach an officer quickly while holding your bag.', correct: false, feedback: 'Keep hands empty and visible, avoid sudden movements, and follow directions.' },
      ] },
    ] },
    { id: 'shelter-care', title: 'When the exit is unsafe', description: 'Shelter, then assist only after the danger has passed.', decisions: [
      { id: 'shelter', title: 'The route is blocked', situation: 'The threat is in the corridor between you and the exit. You can enter a nearby room with a lock.', prompt: 'Which action reduces your exposure?', choices: [
        { label: 'Move into the room, secure the door, stay out of view, and silence your phone.', correct: true, next: 'wait', feedback: 'When you cannot safely escape, shelter out of view and make the space secure if possible.' },
        { label: 'Step into the corridor to record what is happening.', correct: false, feedback: 'Do not expose yourself to investigate or record. Shelter when the exit is unsafe.' },
      ] },
      { id: 'wait', title: 'An uncertain update', situation: 'A social media post says everything is over, but authorities have not given an all-clear.', prompt: 'What should guide your next action?', choices: [
        { label: 'Follow official emergency instructions and remain sheltered while it is safest.', correct: true, next: 'care', feedback: 'Rely on official instructions and the actual conditions, not an unverified post.' },
        { label: 'Leave immediately because the post sounds confident.', correct: false, feedback: 'An unverified post cannot establish scene safety. Follow emergency instructions.' },
      ] },
      { id: 'care', title: 'It is now safe to help', situation: 'Responders have secured the area. A responsive person nearby has heavy bleeding from an arm. Emergency care is being requested.', prompt: 'What can you do while help arrives?', choices: [
        { label: 'With consent, use a barrier if available and apply firm, steady pressure to the wound.', correct: true, feedback: 'Sustained direct pressure can help control severe bleeding. Use a tourniquet if trained and follow emergency guidance.' },
        { label: 'Lift the dressing every few seconds to look.', correct: false, feedback: 'Repeatedly lifting the dressing interrupts pressure. Keep pressure firm and continuous.' },
        { label: 'Try an unfamiliar invasive technique.', correct: false, feedback: 'Give care within your training. Get emergency help and start with firm direct pressure.' },
      ] },
    ] },
  ],
  sources: [
    { title: 'FBI · Active shooter quick-reference guide', url: 'https://www.fbi.gov/how-we-can-help-you/active-shooter-safety-resources/active-shooter-event-quick-reference-guide' },
    { title: 'Ready.gov · Active shooter preparedness', url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_active-shooter_hazard-info-sheet.pdf' },
    { title: 'American Red Cross · Life-threatening bleeding', url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/bleeding-life-threatening-external' },
  ],
}

export const domesticViolenceModule: TrainingModuleData = {
  slug: 'domestic-violence', title: 'Domestic Violence Awareness', shortTitle: 'Support & safety', eyebrow: 'AWARENESS · SURVIVOR-CENTERED SUPPORT', duration: '12–15 min', illustration: 'support',
  description: 'Recognize concerning patterns, listen without judgment, and support someone’s choices and safety.',
  scope: 'Educational, non-graphic scenarios. You can pause at any time. This module is not crisis counseling. In immediate danger, contact local emergency services when safe. U.S. support: 800-799-SAFE (7233), text START to 88788, or TheHotline.org.',
  takeaway: 'Listen. Believe. Respect their choices. Help them connect with support when it is safe.',
  objectives: ['Recognize that abuse includes control, isolation, and threats.', 'Practice supportive language without blame or pressure.', 'Understand safety planning and safer ways to reach support.'],
  lessons: [
    { title: 'Recognize patterns of control', summary: 'Abuse can be emotional, financial, sexual, digital, or physical.', details: ['Isolation from friends, monitoring messages, threats, and control over money can be warning signs.', 'Abuse can affect people of any background or gender. Visible injuries are not required.', 'The person experiencing abuse is never responsible for someone else’s abusive behavior.'], recall: 'Does abuse require a physical injury? No. Coercion, threats, isolation, and financial or digital control can also be abuse.' },
    { title: 'Make space to listen', summary: 'Choose a private moment and check whether it is safe to talk.', details: ['Describe your concern gently, then let them decide what to share.', 'Validate their experience: “You do not deserve this. I am here for you.”', 'Avoid blame, interrogation, or demands for proof. Ask what support would feel helpful.'], recall: 'What does a supportive response sound like? “I believe you. This is not your fault. What would help you right now?”' },
    { title: 'Keep decisions in their hands', summary: 'Support their autonomy, even when the next step is uncertain.', details: ['Do not pressure them to leave, confront their partner, or announce plans on their behalf.', 'Leaving can increase danger. A trained advocate can help them think through options at their pace.', 'Stay supportive if they are not ready to leave or return to the relationship.'], recall: 'Why avoid “just leave”? It can dismiss real barriers and risk. Support their decisions and offer safety-planning resources.' },
    { title: 'Plan for safety together', summary: 'A safety plan is personal and can help while staying, leaving, or after leaving.', details: ['If they want, help connect with an advocate to explore safe contacts, places, transport, and essential items.', 'Ask how and when it is safe to contact them. Do not post identifying details or their location.', 'For immediate danger or a life-threatening emergency, contact emergency services when safe. Avoid stepping into a violent confrontation.'], recall: 'When is a safety plan useful? At any stage: remaining in a relationship, preparing to leave, or after leaving.' },
    { title: 'Connect with support safely', summary: 'Consider whether devices or accounts might be monitored.', details: ['A safer device, such as one the abusive person cannot access, may be better for seeking support.', 'Private browsing and quick-exit buttons do not erase all traces. Changes to devices or accounts can be noticed; discuss options with an advocate.', 'In the U.S., The Hotline is available at 800-799-7233, by texting START to 88788, or through TheHotline.org. Choose a contact method that feels safe.'], recall: 'Does a quick exit erase browsing history? No. Consider safer devices and contact an advocate for tailored digital-safety planning.' },
  ],
  quiz: [
    { question: 'Which behavior can be a warning sign of abuse?', options: ['Respecting time with friends', 'Asking for mutual consent', 'Controlling money and isolating someone from friends'], correct: 2, explanation: 'Abuse is often a pattern of power and control. It can include financial control, isolation, monitoring, threats, and physical harm.' },
    { question: 'A friend tells you their partner threatens them. Which response is most supportive?', options: ['“Why haven’t you left?”', '“I believe you. You don’t deserve this. What would help?”', '“I will confront your partner tonight.”'], correct: 1, explanation: 'Listen, validate, and ask what they need. Avoid blame or actions that remove their control or could increase danger.' },
    { question: 'Your friend is not ready to leave. What should you do?', options: ['Respect their choice and offer safety-planning support', 'Stop talking to them until they leave', 'Announce their situation publicly to force action'], correct: 0, explanation: 'Leaving can be complicated and dangerous. Continue offering support and resources without taking over decisions.' },
    { question: 'When can a personalized safety plan help?', options: ['Only after a police report', 'Only after leaving permanently', 'While staying, preparing to leave, or after leaving'], correct: 2, explanation: 'Safety planning is useful at any stage and should fit the person’s situation. An advocate can help explore options.' },
    { question: 'What is true about online safety?', options: ['Incognito mode guarantees no one can monitor you', 'Devices may be monitored; quick exit does not erase all traces', 'It is always safe to send detailed plans to a shared account'], correct: 1, explanation: 'Browsing, messages, and accounts can be monitored. Consider a safer device and contact method and seek tailored advice from an advocate.' },
  ],
  scenarios: [
    { id: 'conversation', title: 'A friend opens up', description: 'Listen and support a next step chosen by your friend.', decisions: [
      { id: 'listen', title: 'Listen first', situation: 'During a private conversation, a friend says their partner checks their phone and threatens them. They have confirmed it is safe to talk now.', prompt: 'How do you respond?', choices: [
        { label: '“I believe you. This is not your fault. What support would help?”', correct: true, next: 'choice', feedback: 'A validating response opens space for them to share without blame or pressure.' },
        { label: '“You must leave tonight or I cannot help.”', correct: false, feedback: 'An ultimatum can increase isolation. Their safety and choices need to guide support.' },
        { label: '“I will call your partner and settle this.”', correct: false, feedback: 'Confrontation could increase danger. Focus on your friend’s safety and wishes.' },
      ] },
      { id: 'choice', title: 'Let them choose the next step', situation: 'Your friend wants help exploring options but has not decided what to do. There is no immediate danger in this moment.', prompt: 'Which supportive offer would you make? Either can be appropriate if they want it.', choices: [
        { label: 'Offer to listen and discuss a safety plan while they stay.', correct: true, next: 'staying', feedback: 'Safety planning can help even when leaving is not currently an option.' },
        { label: 'Offer to help contact an advocate to discuss leaving safely.', correct: true, next: 'leaving', feedback: 'An advocate can help explore their options without deciding for them.' },
        { label: 'Make the decision and arrange a move without asking.', correct: false, feedback: 'Taking over can increase danger and disempower your friend. Ask what they want.' },
      ] },
      { id: 'staying', title: 'Support while they stay', situation: 'Your friend wants to stay for now and asks you to remain in contact.', prompt: 'What is a useful next step?', choices: [
        { label: 'Agree on when and how it is safe to contact them, and offer advocate resources.', correct: true, feedback: 'Safe contact and continued support respect their autonomy and reduce isolation.' },
        { label: 'Send repeated detailed messages to their monitored phone.', correct: false, feedback: 'Messages may be monitored. Agree on a safe contact method first.' },
      ] },
      { id: 'leaving', title: 'Explore leaving safely', situation: 'Your friend would like to speak with an advocate about leaving. Their partner has access to their phone.', prompt: 'How can you help?', choices: [
        { label: 'Ask about a safer device and contact method, then help if they want.', correct: true, feedback: 'Tailor contact to their safety. An advocate can help plan for the risks around leaving.' },
        { label: 'Post their plan and destination on social media.', correct: false, feedback: 'Public information could expose their plans or location and increase danger.' },
      ] },
    ] },
    { id: 'safer-contact', title: 'Reaching support safely', description: 'Consider privacy and appropriate help in a crisis.', decisions: [
      { id: 'device', title: 'Consider the device', situation: 'Someone wants to look for support but is concerned that their partner monitors their phone.', prompt: 'Which suggestion is appropriate?', choices: [
        { label: '“Private browsing guarantees your activity cannot be seen.”', correct: false, feedback: 'Private browsing does not prevent all monitoring or erase all traces.' },
        { label: '“Could you use a safer device or contact method and discuss digital safety with an advocate?”', correct: true, next: 'contact', feedback: 'A device the abusive person cannot access may be safer. Individual safety planning matters.' },
      ] },
      { id: 'contact', title: 'Offer a resource', situation: 'They have chosen a safer way to reach support and ask for a U.S. domestic violence resource.', prompt: 'Which information can you offer?', choices: [
        { label: 'The Hotline: call 800-799-7233, text START to 88788, or visit TheHotline.org.', correct: true, next: 'emergency', feedback: 'Offer the options and let them choose a method that is safe for their situation.' },
        { label: 'Promise the app can provide emergency intervention.', correct: false, feedback: 'This is an educational app. Connect them with a live support service or emergency services when needed.' },
      ] },
      { id: 'emergency', title: 'Immediate danger', situation: 'Later, you witness a life-threatening violent incident. You can move to safety and contact emergency services.', prompt: 'What is the safest response?', choices: [
        { label: 'Move to safety, contact emergency services, and follow their directions.', correct: true, feedback: 'Immediate life-threatening danger needs emergency help. Avoid placing yourself in the confrontation.' },
        { label: 'Step into the violence to physically confront the person.', correct: false, feedback: 'You could be seriously hurt and increase the danger. Move to safety and get emergency help.' },
      ] },
    ] },
  ],
  sources: [
    { title: 'The Hotline · Warning signs of abuse', url: 'https://www.thehotline.org/identify-abuse/domestic-abuse-warning-signs/' },
    { title: 'The Hotline · Ways to support a survivor', url: 'https://www.thehotline.org/support-others/ways-to-support-a-domestic-violence-survivor/' },
    { title: 'The Hotline · Safety planning', url: 'https://www.thehotline.org/plan-for-safety/' },
    { title: 'The Hotline · Internet safety', url: 'https://www.thehotline.org/plan-for-safety/internet-safety/' },
  ],
}
