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
  const { moduleId, currentStep, stepData, learningGoal, focusAreas } = moduleContext || {};

  let basePrompt = "You are a friendly and knowledgeable first aid training assistant. You can see what's currently on the user's screen. Provide clear, concise, and accurate medical training information. Keep responses brief (2-3 sentences max). Be encouraging and supportive.";

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

  if (moduleId === 'cpr') {
    basePrompt += "\n\nYou are specifically helping with CPR (Cardiopulmonary Resuscitation) training. Focus on proper technique, compression depth (5-6cm), compression rate (100-120 per minute), and the 30:2 compression-to-breath ratio.";

    if (currentStep === 'video') {
      basePrompt += "\n\nCURRENT SCREEN: The user is viewing the CPR Video Tutorial step. They can see a YouTube video demonstrating CPR techniques. When they ask about what's on screen, tell them you can see they're watching the CPR training video.";
    } else if (currentStep === 'knowledge') {
      basePrompt += "\n\nCURRENT SCREEN: The user is viewing the CPR Study Guide with 7 detailed sections: 1) Scene Safety & Initial Steps (checking for dangers, calling 911), 2) Checking Breathing & Signs of Cardiac Arrest (agonal gasps are not normal breathing), 3) Chest Compressions (hand placement on lower sternum, 5-6cm depth, 100-120 BPM rate, straight arms), 4) Rescue Breaths (head tilt-chin lift, 1 second per breath), 5) CPR Cycle (30:2 ratio), 6) AED Use (follow voice prompts, resume CPR after shock), 7) Key Principles (high-quality compressions are critical). When they ask about what's on screen, reference these specific sections.";
    } else if (currentStep === 'quiz') {
      basePrompt += "\n\nCURRENT SCREEN: The user is taking the CPR Knowledge Quiz with multiple-choice questions about CPR procedures, compression techniques, rates, depths, and emergency response protocols. When they ask about what's on screen, tell them you can see they're taking the quiz. Help them understand concepts but don't give away quiz answers directly.";
    } else if (currentStep === 'practice') {
      basePrompt += "\n\nCURRENT SCREEN: The user is in the Interactive CPR Practice simulation with a 3D environment. They can see: a simulation scene, training step instructions on the left sidebar, and interactive elements to practice CPR. When they ask about what's on screen, tell them you can see the 3D practice simulation and guide them through the steps.";
    }
  } else if (moduleId === 'heimlich') {
    basePrompt += "\n\nYou are specifically helping with Heimlich Maneuver training for choking response. Focus on proper positioning, fist placement (above navel, below ribcage), and quick upward thrusts.";

    if (currentStep === 'practice') {
      basePrompt += "\n\nCURRENT SCREEN: The user is in the interactive practice phase. Provide real-time feedback on their technique.";
    }
  }

  return basePrompt;
}

function generateFallbackResponse(message, moduleContext) {
  const { moduleId, currentStep, learningGoal, focusAreas } = moduleContext || {};
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
        return "Yes, I can see what's on your screen! You're taking the CPR Knowledge Quiz. I can help explain concepts, but I won't give you the answers directly - that wouldn't help you learn! What concept would you like me to clarify?";
      } else if (currentStep === 'practice') {
        return "Yes, I can see what's on your screen! You're in the Interactive CPR Practice simulation with the 3D training environment. I can see the training instructions on the left sidebar. What step are you working on?";
      }
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
