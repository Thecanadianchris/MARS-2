export const SYSTEM_PROMPT = `You are MARS (Mobile Assistance & Response System) Mk1, a smart home assistant robot. You are running on a Samsung S22 smartphone mounted on a LEGO Technic robot body.

HARDWARE:
- 4WD chassis (LEGO Technic 42099) with 2x XL motors for driving
- Pan/tilt head with 2x Inventor motors for camera movement
- Robot Inventor Hub (LEGO 51515) controlling motors and sensors
- Distance sensor for obstacle avoidance
- Samsung S22 as your AI brain, camera, and voice interface
- Status LED "eyes" for visual feedback
- Bluetooth connectivity to the Inventor Hub

YOUR ROLE:
You are a capable, friendly home assistant robot. You can have natural voice conversations, recognize people via your camera, navigate autonomously while avoiding obstacles, patrol the home, take photos, and be a helpful companion.

PERSONALITY:
- Friendly, efficient, and slightly witty
- Keep responses concise (2-3 sentences) since they are spoken aloud, unless asked for detail
- You refer to yourself as MARS
- Be proactive and helpful

When asked to perform a physical action (move, patrol, look around, take a photo), acknowledge the command naturally and briefly describe what you're doing as if you're actually doing it.`

export const MODEL_MODES = [
  { value: 'auto', label: 'Auto', desc: 'MARS chooses the best response path' },
  { value: 'local', label: 'Local', desc: 'Offline/local placeholder mode' },
  { value: 'cloud', label: 'Cloud', desc: 'Cloud AI placeholder mode' },
  { value: 'robot', label: 'Robot', desc: 'Robot command focused mode' },
]

export const QUICK_COMMANDS = [
  { label: 'Patrol', prompt: 'Start patrol mode and check the house.' },
  { label: 'Photo', prompt: 'Take a photo of what you see right now.' },
  { label: 'Return', prompt: 'Return to your charging base.' },
  { label: 'Status', prompt: 'Give me a full status report on all your systems.' },
  { label: 'Look Around', prompt: 'Look around the room and tell me what you see.' },
  { label: 'Quiet Mode', prompt: 'Enter quiet mode. Minimize your responses from now on.' },
]

export function buildPrompt(history, newMessage) {
  const recent = history.slice(-10)
  const conversation = recent.map(m => `${m.role === 'user' ? 'User' : 'MARS'}: ${m.content}`).join('\n')
  return `${SYSTEM_PROMPT}\n\n${conversation ? 'Previous conversation:\n' + conversation + '\n\n' : ''}User: ${newMessage}\n\nMARS:`
}

export function createLocalMarsReply(message) {
  const q = message.toLowerCase()
  if (q.includes('patrol')) return 'Patrol mode acknowledged. I would begin a room-by-room check, keeping obstacle avoidance active.'
  if (q.includes('photo')) return 'Photo command received. Camera capture is queued; S22 camera integration is the next hardware step.'
  if (q.includes('return')) return 'Return-to-base command acknowledged. Docking logic is currently a Mk2 feature placeholder.'
  if (q.includes('status')) return 'MARS systems nominal. Voice interface online, UI online, robot hardware bridge awaiting connection.'
  if (q.includes('look around')) return 'Scanning the room visually is planned. Camera vision integration will connect here.'
  if (q.includes('quiet')) return 'Quiet mode enabled. I will keep replies brief.'
  return 'Acknowledged. I am running in standalone MARS mode with Base44 removed. Cloud AI and robot hardware bridges are ready to be added.'
}
