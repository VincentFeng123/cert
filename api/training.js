// Vercel serverless function for training data
const trainingModules = {
  cpr: {
    id: 'cpr',
    title: 'CPR Training',
    description: 'Cardiopulmonary Resuscitation',
    steps: [
      {
        id: 'video',
        title: 'Watch & Learn',
        description: 'CPR Video Tutorial',
        content: {
          videoUrl: '/videos/cpr-demo.mp4',
          duration: 180,
          keyPoints: [
            'Proper hand placement',
            'Compression depth and rate',
            'Rescue breathing technique'
          ]
        }
      },
      {
        id: 'knowledge',
        title: 'Key Points',
        description: 'Essential CPR Knowledge',
        content: {
          points: [
            {
              title: 'Check Responsiveness',
              description: 'Tap shoulders and shout "Are you okay?"',
              icon: '👋'
            },
            {
              title: 'Call for Help',
              description: 'Call 911 immediately and ask for an AED',
              icon: '📞'
            },
            {
              title: 'Hand Placement',
              description: 'Place heel of hand on center of chest between nipples',
              icon: '✋'
            },
            {
              title: 'Compressions',
              description: 'Push at least 2 inches deep, 100-120 per minute',
              icon: '💪'
            },
            {
              title: 'Rescue Breaths',
              description: 'Give 2 breaths after every 30 compressions',
              icon: '💨'
            }
          ]
        }
      },
      {
        id: 'quiz',
        title: 'Test Knowledge',
        description: 'CPR Quiz',
        content: {
          questions: [
            {
              question: 'What is the correct compression rate for CPR?',
              options: ['60-80 per minute', '100-120 per minute', '140-160 per minute'],
              correctAnswer: 1,
              explanation: 'The recommended compression rate is 100-120 compressions per minute.'
            },
            {
              question: 'How deep should chest compressions be for an adult?',
              options: ['1 inch', 'At least 2 inches', '3-4 inches'],
              correctAnswer: 1,
              explanation: 'Compressions should be at least 2 inches deep for adults.'
            }
          ]
        }
      },
      {
        id: 'practice',
        title: 'Practice',
        description: 'Interactive Simulation',
        content: {
          simulationType: 'interactive',
          steps: [
            'Check responsiveness',
            'Call for help',
            'Position hands',
            'Begin compressions',
            'Provide rescue breaths'
          ]
        }
      }
    ]
  },
  heimlich: {
    id: 'heimlich',
    title: 'Heimlich Maneuver',
    description: 'Choking Response',
    steps: [
      {
        id: 'video',
        title: 'Watch & Learn',
        description: 'Heimlich Video Tutorial',
        content: {
          videoUrl: '/videos/heimlich-demo.mp4',
          duration: 150,
          keyPoints: [
            'Recognizing choking signs',
            'Proper positioning',
            'Abdominal thrust technique'
          ]
        }
      },
      {
        id: 'knowledge',
        title: 'Key Points',
        description: 'Essential Heimlich Knowledge',
        content: {
          points: [
            {
              title: 'Recognize Choking',
              description: 'Look for inability to speak, cough, or breathe',
              icon: '🚨'
            },
            {
              title: 'Position Yourself',
              description: 'Stand behind the person, kneel for children',
              icon: '🧍'
            },
            {
              title: 'Make a Fist',
              description: 'Place thumb side against abdomen above navel',
              icon: '👊'
            },
            {
              title: 'Abdominal Thrusts',
              description: 'Quick upward thrusts until object is expelled',
              icon: '⬆️'
            },
            {
              title: 'Follow Up',
              description: 'Seek medical attention even if successful',
              icon: '🏥'
            }
          ]
        }
      },
      {
        id: 'quiz',
        title: 'Test Knowledge',
        description: 'Heimlich Quiz',
        content: {
          questions: [
            {
              question: 'Where should you place your fist for the Heimlich maneuver?',
              options: ['On the chest', 'Above the navel, below ribcage', 'On the back'],
              correctAnswer: 1,
              explanation: 'Place your fist above the navel but below the ribcage.'
            },
            {
              question: 'What is the universal sign for choking?',
              options: ['Pointing to throat', 'Hands clutching throat', 'Waving hands'],
              correctAnswer: 1,
              explanation: 'Hands clutching the throat is the universal choking sign.'
            }
          ]
        }
      },
      {
        id: 'practice',
        title: 'Practice',
        description: 'Interactive Simulation',
        content: {
          simulationType: 'interactive',
          steps: [
            'Assess the situation',
            'Position behind patient',
            'Make a fist',
            'Position fist correctly',
            'Perform thrusts'
          ]
        }
      }
    ]
  }
};

export default function handler(req, res) {
  const { method, query } = req;
  
  if (method === 'GET') {
    const { moduleId } = query;
    
    if (moduleId) {
      // Get specific module
      const module = trainingModules[moduleId];
      if (module) {
        res.status(200).json(module);
      } else {
        res.status(404).json({ error: 'Module not found' });
      }
    } else {
      // Get all modules
      const modules = Object.values(trainingModules).map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        stepCount: module.steps.length
      }));
      res.status(200).json(modules);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}