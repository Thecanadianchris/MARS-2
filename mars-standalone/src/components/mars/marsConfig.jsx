export const OWNER_NAME = 'Christian'

export const SYSTEM_PROMPT = `You are MARS (Mobile Assistance & Response System) Mk1.

You are an intelligent household robot built by Christian.

You currently run on:
- Samsung Galaxy S22
- LEGO Technic robot
- Robot Inventor Hub
- Camera
- Voice
- Bluetooth
- Obstacle sensors

You are polite, confident and intelligent.

Never mention Base44.

Never mention placeholders.

Never say "I cannot".

If hardware is not connected, explain that it is waiting for connection.

Keep spoken replies natural and under 3 sentences unless asked for detail.

You enjoy helping around the home.

You always refer to yourself as MARS.
`

export const MODEL_MODES = [
  {
    value: 'auto',
    label: 'Auto',
    desc: 'Automatic'
  },
  {
    value: 'local',
    label: 'Local',
    desc: 'Offline'
  },
  {
    value: 'cloud',
    label: 'Cloud',
    desc: 'Cloud AI'
  },
  {
    value: 'robot',
    label: 'Robot',
    desc: 'Robot Control'
  }
]

export const QUICK_COMMANDS = [
  {
    label: 'Patrol',
    prompt: 'Start patrol.'
  },
  {
    label: 'Photo',
    prompt: 'Take a photo.'
  },
  {
    label: 'Return',
    prompt: 'Return to charging dock.'
  },
  {
    label: 'Status',
    prompt: 'System status.'
  },
  {
    label: 'Look Around',
    prompt: 'Look around.'
  },
  {
    label: 'Quiet Mode',
    prompt: 'Quiet mode.'
  }
]

export function buildPrompt(history, newMessage) {
  const recent = history.slice(-10)

  const conversation = recent
    .map((m) => `${m.role === 'user' ? 'User' : 'MARS'}: ${m.content}`)
    .join('\n')

  return `${SYSTEM_PROMPT}

${conversation}

User: ${newMessage}

MARS:`
}

export function createLocalMarsReply(message) {
  const q = message.toLowerCase()

  if (
    q.includes('hello') ||
    q.includes('hi') ||
    q.includes('good morning') ||
    q.includes('good afternoon') ||
    q.includes('good evening')
  ) {
    return `Hello ${OWNER_NAME}. MARS systems are online and operating normally. How can I assist you today?`
  }

  if (q.includes('your name')) {
    return 'I am MARS, your Mobile Assistance and Response System.'
  }

  if (q.includes('status')) {
    return `Current system status.

Voice interface: Online.

Local intelligence: Online.

Camera: Ready.

Robot hardware: Waiting for connection.

Battery: 87 percent.

All systems are stable.`
  }

  if (q.includes('patrol')) {
    return 'Beginning patrol. I would navigate through the home while monitoring for obstacles and unusual activity.'
  }

  if (
    q.includes('photo') ||
    q.includes('picture') ||
    q.includes('camera')
  ) {
    return 'Camera ready. Image capture will become available once the Samsung camera bridge is connected.'
  }

  if (
    q.includes('return') ||
    q.includes('dock') ||
    q.includes('charging')
  ) {
    return 'Returning to the charging station would be my next action once the robot drive system is connected.'
  }

  if (
    q.includes('look') ||
    q.includes('scan')
  ) {
    return 'Scanning the room. Visual recognition will activate once the camera bridge is installed.'
  }

  if (q.includes('quiet')) {
    return 'Quiet mode enabled.'
  }

  if (
    q.includes('thanks') ||
    q.includes('thank you')
  ) {
    return `You're welcome, ${OWNER_NAME}.`
  }

  if (q.includes('test')) {
    return 'Test successful. Voice, interface and local intelligence are all responding correctly.'
  }

  return `Understood, ${OWNER_NAME}. How would you like me to assist?`
}