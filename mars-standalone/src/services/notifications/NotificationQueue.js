/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * NotificationQueue
 *
 * Purpose:
 * Maintains a local queue of generated MARS notifications.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

class NotificationQueue {
  constructor() {
    this.queue = []
  }

  enqueue(notification) {
    const safeNotification = notification || {}
    const queued = {
      id: safeNotification.id || `NTF-${Date.now()}-${this.queue.length + 1}`,
      status: 'queued',
      createdAt: Date.now(),
      ...safeNotification
    }

    this.queue.push(queued)
    return queued
  }

  getAll() {
    return [...this.queue]
  }

  getPending() {
    return this.queue.filter((notification) => notification.status === 'queued')
  }

  markDelivered(notificationId) {
    const notification = this.queue.find((item) => item.id === notificationId)

    if (!notification) {
      return null
    }

    notification.status = 'delivered'
    notification.deliveredAt = Date.now()
    return { ...notification }
  }

  clear() {
    this.queue = []
  }
}

export default new NotificationQueue()
