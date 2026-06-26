const STORAGE_KEY = 'mars_memory'

export function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveMemory(memory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
}

export function remember(key, value) {
  const memory = loadMemory()
  memory[key.toLowerCase()] = value
  saveMemory(memory)
}

export function recall(key) {
  const memory = loadMemory()
  return memory[key.toLowerCase()]
}

export function recallAll() {
  return loadMemory()
}

export function clearMemory() {
  localStorage.removeItem(STORAGE_KEY)
}