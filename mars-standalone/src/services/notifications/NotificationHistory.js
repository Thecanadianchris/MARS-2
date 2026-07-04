/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NotificationHistory
 *
 * Purpose:
 * Maintains in-memory notification history for the current
 * M2.5 frontend session.
 *
 * Version:
 * v0.13.9
 * Date Code:
 * 040726
 * ==========================================================
 */

class NotificationHistory {
  constructor() {
    this.items = []
  }

  add(notification) {
    const safeNotification = notification || {}
    const item = {
      id: safeNotification.id || `MARS-NOTIF-${Date.now()}-${this.items.length + 1}`,
      createdAt: safeNotification.createdAt || Date.now(),
      status: safeNotification.status || 'queued',
      ...safeNotification
    }

    this.items.unshift(item)
    this.items = this.items.slice(0, 20)
    return item
  }

  all() {
    return [...this.items]
  }

  clear() {
    this.items = []
  }
}

export default new NotificationHistory()
