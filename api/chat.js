// Vercel serverless function for AI chatbot
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, moduleContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback to context-aware responses if no API key
      return res.status(200).json({
        response: generateFallbackResponse(message, moduleContext)
      });
    }

    // Create system prompt based on module context
    const systemPrompt = generateSystemPrompt(moduleContext);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API error:', error);

    // Fallback to context-aware responses on error
    return res.status(200).json({
      response: generateFallbackResponse(message, moduleContext)
    });
  }
}

function generateSystemPrompt(moduleContext) {
  const { moduleId, currentStep, stepData, learningGoal, focusAreas, viewSummary, currentQuestionPrompt, studyMode } = moduleContext || {};

  let basePrompt = "You are a friendly and knowledgeable first aid training assistant. You can see exactly what's on the user's screen including any quiz questions, study materials, and their current progress. Provide clear, concise, and accurate medical training information. Keep responses brief (2-3 sentences max). Be encouraging and supportive.";

  if (learningGoal === 'certification') {
    basePrompt += "\n\nThe learner is preparing for certification. Emphasize precise numbers, rationale, and exam-style clarity.";
  } else if (learningGoal === 'refresh') {
    basePrompt += "\n\nThe learner is refreshing their knowledge quickly. Highlight the essentials and keep reminders focused.";
  } else if (learningGoal === 'confidence') {
    basePrompt += "\n\nThe learner wants to build confidence. Reinforce calm coaching and practical encouragement.";
  }

  if (Array.isArray(focusAreas) && focusAreas.length > 0) {
    basePrompt += `\n\nThey saved these focus areas for extra attention: ${focusAreas.join(', ')}. Gently tie advice back to these topics when it makes sense.`;
  }

  // Add current view summary - this tells the AI exactly what the user sees
  if (viewSummary) {
    basePrompt += `\n\nCURRENT VIEW: ${viewSummary}`;
  }

  if (moduleId === 'cpr') {
    basePrompt += "\n\nYou are specifically helping with CPR (Cardiopulmonary Resuscitation) training. Focus on proper technique, compression depth (5-6cm), compression rate (100-120 per minute), and the 30:2 compression-to-breath ratio.";

    if (currentStep === 'video') {
      basePrompt += "\n\nCURRENT SCREEN: The user is viewing the CPR Video Tutorial step. They can see a YouTube video demonstrating CPR techniques.";
    } else if (currentStep === 'knowledge') {
      const modeDesc = studyMode === 'flashcards' ? 'flashcard mode' : 'study guide mode';
      basePrompt += `\n\nCURRENT SCREEN: The user is studying CPR content in ${modeDesc}. The study guide covers: 1) Scene Safety & Initial Steps, 2) Checking Breathing & Signs of Cardiac Arrest, 3) Chest Compressions (5-6cm depth, 100-120 BPM), 4) Rescue Breaths (head tilt-chin lift), 5) CPR Cycle (30:2 ratio), 6) AED Use, 7) Key Principles.`;
    } else if (currentStep === 'quiz') {
      basePrompt += "\n\nCURRENT SCREEN: The user is taking the CPR Knowledge Quiz.";

      // Add the specific quiz question context
      if (currentQuestionPrompt) {
        basePrompt += `\n\nTHE CURRENT QUIZ QUESTION IS: "${currentQuestionPrompt}"`;
        basePrompt += "\n\nIMPORTANT: When the user asks for help with the question, provide a helpful HINT that guides their thinking WITHOUT directly telling them the answer. Explain the underlying concept, give them a thinking framework, or remind them of relevant facts from the study guide. Never say 'The answer is...' or directly state which option is correct.";

        // Add question-specific hints
        basePrompt += getQuizQuestionHint(currentQuestionPrompt);
      }
    } else if (currentStep === 'practice') {
      basePrompt += "\n\nCURRENT SCREEN: The user is in the Interactive CPR Practice simulation with a 3D environment. Guide them through the simulation steps.";
    }
  } else if (moduleId === 'heimlich') {
    basePrompt += "\n\nYou are specifically helping with Heimlich Maneuver training for choking response. Focus on proper positioning, fist placement (above navel, below ribcage), and quick upward thrusts.";

    if (currentStep === 'practice') {
      basePrompt += "\n\nCURRENT SCREEN: The user is in the interactive practice phase. Provide real-time feedback on their technique.";
    }
  }

  return basePrompt;
}

// Helper function to provide question-specific hints without giving away answers
function getQuizQuestionHint(question) {
  const q = question.toLowerCase();

  if (q.includes('first thing') && q.includes('before starting cpr')) {
    return "\n\nHINT CONTEXT: This question is about priorities. Think about what happens if you rush in without checking your surroundings first - you could become a victim yourself.";
  }
  if (q.includes('does not respond')) {
    return "\n\nHINT CONTEXT: When someone is unresponsive, think about what resource you'll need that takes time to arrive. Professional help has equipment you don't.";
  }
  if (q.includes('hands be placed') || q.includes('hand placement')) {
    return "\n\nHINT CONTEXT: Think about where the heart is located in the chest. Compressions need to push directly on the heart to pump blood.";
  }
  if (q.includes('part of the hand')) {
    return "\n\nHINT CONTEXT: Consider which part of your hand gives the most stable, flat surface for pushing while minimizing injury risk.";
  }
  if (q.includes('how deep')) {
    return "\n\nHINT CONTEXT: Think about the standard measurement - it's roughly the height of a credit card (about 2-2.5 inches or 5-6 cm).";
  }
  if (q.includes('compression rate')) {
    return "\n\nHINT CONTEXT: Think of the song 'Stayin' Alive' - that beat is actually the target tempo. It's faster than a resting heart rate.";
  }
  if (q.includes('how many') && q.includes('compression') && q.includes('breath')) {
    return "\n\nHINT CONTEXT: The standard CPR ratio prioritizes compressions. Think 30:2 - what does that first number represent?";
  }
  if (q.includes('rescue breaths') && q.includes('how many')) {
    return "\n\nHINT CONTEXT: You want enough breaths to oxygenate but not so many that you delay compressions. It's a small number.";
  }
  if (q.includes('before giving a rescue breath')) {
    return "\n\nHINT CONTEXT: Air needs a clear path to the lungs. What position opens the airway? Think about the head and chin.";
  }
  if (q.includes('after each chest compression')) {
    return "\n\nHINT CONTEXT: The heart needs to fill with blood between compressions. What happens if you keep pressing down?";
  }
  if (q.includes('key sign') && q.includes('cpr is needed')) {
    return "\n\nHINT CONTEXT: CPR is for cardiac arrest. The key indicator is breathing status - not normal breathing or gasping is the red flag.";
  }
  if (q.includes('minimizing interruptions')) {
    return "\n\nHINT CONTEXT: Every pause in compressions means blood stops flowing. Think about what organs need constant blood supply.";
  }
  if (q.includes('when should cpr be stopped')) {
    return "\n\nHINT CONTEXT: There are multiple valid reasons to stop - recovery, professional takeover, and more. Consider all possibilities.";
  }
  if (q.includes('purpose of an aed')) {
    return "\n\nHINT CONTEXT: AED stands for Automated External Defibrillator. What does 'defibrillator' tell you about its function?";
  }
  if (q.includes('statement') && q.includes('true')) {
    return "\n\nHINT CONTEXT: Think about what the research shows - bystander CPR has a significant impact on survival rates.";
  }

  return "\n\nHINT CONTEXT: Think back to the study guide content. The answer relates to standard CPR protocols and best practices.";
}

// Fallback hints for when API is unavailable
function getFallbackQuizHint(question) {
  const q = question.toLowerCase();

  if (q.includes('first thing') && q.includes('before starting cpr')) {
    return `For "${question}" - Think about your own safety first. What could happen if you rush in without looking around? You need to protect yourself before you can help others.`;
  }
  if (q.includes('does not respond')) {
    return `For "${question}" - When someone is unconscious, you'll need professional medical help. They have equipment and training you don't. What's the first step to get that help on the way?`;
  }
  if (q.includes('hands be placed') || q.includes('hand placement')) {
    return `For "${question}" - Your compressions need to push on the heart. Think about where the heart sits in the chest - it's in the center, behind the breastbone.`;
  }
  if (q.includes('part of the hand')) {
    return `For "${question}" - You want a stable, flat surface to push with. Think about which part of your hand would give you the best surface for effective compressions.`;
  }
  if (q.includes('how deep')) {
    return `For "${question}" - The depth is measured in centimeters. Think about 5-6 cm - that's about 2 to 2.5 inches, or roughly the height of a credit card.`;
  }
  if (q.includes('compression rate')) {
    return `For "${question}" - Think of the song 'Stayin' Alive' by the Bee Gees. That beat is actually the target compression rate. It's between 100 and 120 per minute.`;
  }
  if (q.includes('how many') && q.includes('compression') && q.includes('breath')) {
    return `For "${question}" - The standard CPR cycle uses a 30:2 ratio. That means you do a set of compressions, then give rescue breaths. How many compressions in that first number?`;
  }
  if (q.includes('rescue breaths') && q.includes('how many')) {
    return `For "${question}" - In the 30:2 ratio, the second number tells you how many breaths. It's a small number - just enough to get oxygen in without delaying compressions too long.`;
  }
  if (q.includes('before giving a rescue breath')) {
    return `For "${question}" - Air needs a clear path to the lungs. If the airway is blocked by the tongue, it won't work. What position opens the airway? Think about tilting and lifting.`;
  }
  if (q.includes('after each chest compression')) {
    return `For "${question}" - The heart needs to refill with blood between each push. If you lean on the chest, what happens to the heart's ability to fill?`;
  }
  if (q.includes('key sign') && q.includes('cpr is needed')) {
    return `For "${question}" - CPR is for cardiac arrest, when the heart stops. The main sign is related to breathing - either not breathing at all, or gasping (which isn't normal breathing).`;
  }
  if (q.includes('minimizing interruptions')) {
    return `For "${question}" - Every time you stop compressions, blood stops flowing. The brain and heart need constant blood supply. What happens when that flow is interrupted?`;
  }
  if (q.includes('when should cpr be stopped')) {
    return `For "${question}" - There are several valid reasons to stop CPR. Think about what success looks like (recovery), when professionals arrive, and practical limitations. Are there multiple correct scenarios?`;
  }
  if (q.includes('purpose of an aed')) {
    return `For "${question}" - AED stands for Automated External Defibrillator. 'Defibrillator' gives you a clue - it's about the electrical rhythm of the heart.`;
  }
  if (q.includes('statement') && q.includes('true')) {
    return `For "${question}" - Think about the statistics. Research shows that bystander CPR makes a significant difference in survival. What does the evidence say about its effectiveness?`;
  }

  return `For the current question, think back to what you learned in the study guide. Focus on the key CPR numbers: 100-120 BPM, 5-6 cm depth, 30:2 ratio. Which of these concepts applies here?`;
}

function generateFallbackResponse(message, moduleContext) {
  const { moduleId, currentStep, learningGoal, focusAreas, viewSummary, currentQuestionPrompt } = moduleContext || {};
  const lowerMessage = message.toLowerCase();

  const focusReminder = Array.isArray(focusAreas) && focusAreas.length > 0
    ? `Focus especially on ${focusAreas.join(', ')} as you revisit the material. `
    : '';
  const goalTone = learningGoal === 'certification'
    ? 'Certification mindset—aim for precise form and textbook cadence. '
    : learningGoal === 'refresh'
    ? 'Quick refresh mode—zero in on the high-yield numbers and sequence. '
    : learningGoal === 'confidence'
    ? 'Keep the confidence-building energy going—steady breaths and consistent compressions. '
    : '';

  // Build screen context description
  let screenContext = "";
  if (moduleId === 'cpr') {
    if (currentStep === 'video') {
      screenContext = "I can see you're on the CPR Video Tutorial step. ";
    } else if (currentStep === 'knowledge') {
      screenContext = "I can see you're viewing the CPR Study Guide with all 7 sections covering scene safety, compressions (5-6cm depth, 100-120 BPM), rescue breaths, and more. ";
    } else if (currentStep === 'quiz') {
      screenContext = "I can see you're taking the CPR Knowledge Quiz. ";
    } else if (currentStep === 'practice') {
      screenContext = "I can see you're in the 3D practice simulation. ";
    }
  }

  // Check for "what's on screen" type questions
  if (lowerMessage.includes('see') || lowerMessage.includes('screen') || lowerMessage.includes('showing') || lowerMessage.includes('display') || lowerMessage.includes('looking at')) {
    if (moduleId === 'cpr') {
      if (currentStep === 'video') {
        return "Yes, I can see what's on your screen! You're currently watching the CPR Video Tutorial. What would you like to know about the video content?";
      } else if (currentStep === 'knowledge') {
        return "Yes, I can see what's on your screen! You're viewing the CPR Study Guide with 7 sections covering scene safety, compressions (5-6cm depth, 100-120 BPM rate), rescue breaths (30:2 ratio), AED use, and key principles. What specific section can I help you with?";
      } else if (currentStep === 'quiz') {
        if (currentQuestionPrompt) {
          return `Yes, I can see the quiz question: "${currentQuestionPrompt}" - I can give you a hint if you'd like, but I won't give the answer directly. Would you like a hint?`;
        }
        return "Yes, I can see what's on your screen! You're taking the CPR Knowledge Quiz. I can help explain concepts, but I won't give you the answers directly - that wouldn't help you learn! What concept would you like me to clarify?";
      } else if (currentStep === 'practice') {
        return "Yes, I can see what's on your screen! You're in the Interactive CPR Practice simulation with the 3D training environment. I can see the training instructions on the left sidebar. What step are you working on?";
      }
    }
  }

  // Quiz-specific help with hints (when user asks for help on a question)
  if (currentStep === 'quiz' && currentQuestionPrompt) {
    if (lowerMessage.includes('hint') || lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('answer') || lowerMessage.includes('question')) {
      return getFallbackQuizHint(currentQuestionPrompt);
    }
  }

  // CPR-specific responses with screen context
  if (moduleId === 'cpr') {
    if (lowerMessage.includes('hand') || lowerMessage.includes('placement')) {
      return screenContext + goalTone + "Place the heel of one hand on the center of the chest (lower half of the sternum), then place your other hand on top with fingers interlaced. Keep your arms straight! " + focusReminder;
    }
    if (lowerMessage.includes('depth') || lowerMessage.includes('deep')) {
      return screenContext + goalTone + "Compress at least 5-6 cm (2-2.5 inches) deep for adults. Use your body weight and keep your arms straight for effective compressions. " + focusReminder;
    }
    if (lowerMessage.includes('rate') || lowerMessage.includes('fast') || lowerMessage.includes('bpm')) {
      return screenContext + goalTone + "Aim for 100-120 compressions per minute. Think of the beat of 'Stayin' Alive' by the Bee Gees - that's the perfect rhythm! " + focusReminder;
    }
    if (lowerMessage.includes('breath') || lowerMessage.includes('rescue')) {
      return screenContext + goalTone + "After 30 compressions, give 2 rescue breaths. Tilt the head back, lift the chin, pinch the nose, and blow until you see the chest rise. Each breath should last about 1 second. " + focusReminder;
    }
    if (lowerMessage.includes('aed')) {
      return screenContext + goalTone + "An AED (Automated External Defibrillator) can restore a normal heart rhythm. Turn it on, follow the voice prompts, and resume CPR immediately after delivering a shock. " + focusReminder;
    }
  }

  // Heimlich-specific responses
  if (moduleId === 'heimlich') {
    if (lowerMessage.includes('fist') || lowerMessage.includes('placement')) {
      return "Make a fist with one hand and place the thumb side against the person's abdomen, just above the navel and below the ribcage. Grasp your fist with your other hand.";
    }
    if (lowerMessage.includes('thrust') || lowerMessage.includes('push')) {
      return "Perform quick, upward thrusts into the abdomen. Don't be afraid to use force - this is a life-threatening emergency. Continue until the object is expelled.";
    }
  }

  // Generic helpful responses
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return screenContext + (currentStep === 'practice'
      ? goalTone + "I'm here to guide you through the practice simulation! Follow the on-screen instructions and feel free to ask about specific techniques. " + focusReminder
      : goalTone + "I'm here to help with your training! Ask me about proper technique, safety considerations, or any step you're unsure about. " + focusReminder);
  }

  if (lowerMessage.includes('thank')) {
    return "You're welcome! Keep up the great work with your training. These skills can save lives!";
  }

  // Default response with screen awareness
  return screenContext + (currentStep === 'practice'
    ? goalTone + "I can see what you're working on! Focus on following the proper technique shown in the simulation. What specific question do you have? " + focusReminder
    : goalTone + "I can see the content you're viewing. What specific question can I help you with? " + focusReminder);
}
