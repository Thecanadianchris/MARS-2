/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * VoiceCommandRegistry
 *
 * Purpose:
 * Defines the command catalogue for the v0.14.1 Voice
 * Intelligence Foundation without depending on live audio,
 * wake word detection, browser speech APIs or Android audio.
 *
 * Version:
 * v0.14.1
 * Date Code:
 * 060726
 * ==========================================================
 */

export const VOICE_COMMAND_CATEGORIES = Object.freeze({
  SYSTEM: 'system',
  DIAGNOSTICS: 'diagnostics',
  CAPABILITY: 'capability',
  SAFETY: 'safety',
})

export const VOICE_COMMAND_STATUS = Object.freeze({
  ACTIVE: 'active',
  PLANNED: 'planned',
  DEFERRED: 'deferred',
})

export const DEFAULT_VOICE_COMMANDS = Object.freeze([
  {
    id: 'wake-mars',
    phrase: 'wake mars',
    aliases: ['hey mars', 'mars wake up', 'okay mars'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'WAKE_MARS',
    description: 'Activates the simulated MARS voice command routing layer.',
  },
  {
    id: 'voice-status',
    phrase: 'voice status',
    aliases: ['check voice', 'voice diagnostics', 'voice system status'],
    category: VOICE_COMMAND_CATEGORIES.DIAGNOSTICS,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'VOICE_STATUS',
    description: 'Reports the current Voice Intelligence Foundation status.',
  },
  {
    id: 'system-status',
    phrase: 'system status',
    aliases: ['mars status', 'diagnostics status', 'check system'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'SYSTEM_STATUS',
    description: 'Routes to the existing diagnostics capability.',
  },
  {
    id: 'describe-scene',
    phrase: 'describe scene',
    aliases: ['what can you see', 'look around', 'vision status'],
    category: VOICE_COMMAND_CATEGORIES.CAPABILITY,
    status: VOICE_COMMAND_STATUS.PLANNED,
    intent: 'VISION_DESCRIBE_SCENE',
    description: 'Future command route into the Vision capability.',
  },
  {
    id: 'cancel-command',
    phrase: 'cancel',
    aliases: ['stop', 'never mind', 'ignore that'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'CANCEL_COMMAND',
    description: 'Cancels the current voice command route.',
  },
  {
    id: 'help',
    phrase: 'help',
    aliases: ['what can i say', 'list commands', 'available commands'],
    category: VOICE_COMMAND_CATEGORIES.SYSTEM,
    status: VOICE_COMMAND_STATUS.ACTIVE,
    intent: 'HELP',
    description: 'Lists currently registered voice commands and routes.',
  },
  {
    id: 'assistive-check',
    phrase: 'check protected user',
    aliases: ['check finley', 'protected user status', 'assistive status'],
    category: VOICE_COMMAND_CATEGORIES.SAFETY,
    status: VOICE_COMMAND_STATUS.DEFERRED,
    intent: 'PROTECTED_USER_STATUS',
    description: 'Future route into protected-user alerting after v0.17.',
  },
])

function normalisePhrase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

class VoiceCommandRegistry {
  constructor(commands = DEFAULT_VOICE_COMMANDS) {
    this.commands = [...commands]
  }

  listCommands() {
    return this.commands.map((command) => ({ ...command, aliases: [...(command.aliases || [])] }))
  }

  getActiveCommands() {
    return this.listCommands().filter((command) => command.status === VOICE_COMMAND_STATUS.ACTIVE)
  }

  getCommandById(id) {
    return this.listCommands().find((command) => command.id === id) || null
  }

  findByPhrase(input) {
    const phrase = normalisePhrase(input)

    if (!phrase) {
      return null
    }

    return this.listCommands().find((command) => {
      const phrases = [command.phrase, ...(command.aliases || [])].map(normalisePhrase)
      return phrases.some((candidate) => candidate === phrase || phrase.includes(candidate))
    }) || null
  }

  getStatus() {
    const commands = this.listCommands()
    const activeCount = commands.filter((command) => command.status === VOICE_COMMAND_STATUS.ACTIVE).length
    const plannedCount = commands.filter((command) => command.status === VOICE_COMMAND_STATUS.PLANNED).length
    const deferredCount = commands.filter((command) => command.status === VOICE_COMMAND_STATUS.DEFERRED).length

    return {
      version: 'v0.14.1',
      commandCount: commands.length,
      activeCount,
      plannedCount,
      deferredCount,
      categories: [...new Set(commands.map((command) => command.category))],
      ready: commands.length > 0 && activeCount > 0,
    }
  }
}

export { normalisePhrase }
export default new VoiceCommandRegistry()
