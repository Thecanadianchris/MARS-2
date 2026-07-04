/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ProtectedUserService
 *
 * Purpose:
 * Applies protected-user handling rules without making medical
 * claims or diagnostic conclusions.
 *
 * Version:
 * v0.13.2
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { USER_ROLES } from './UserRoles'

class ProtectedUserService {
  isProtectedUser(userProfile) {
    return Boolean(
      userProfile &&
      (userProfile.role === USER_ROLES.PROTECTED_USER || userProfile.protected)
    )
  }

  getObservationPriority(userProfile) {
    if (!this.isProtectedUser(userProfile)) {
      return 'normal'
    }

    return 'elevated_non_medical_observation'
  }

  createProtectedUserContext(userProfile) {
    if (!this.isProtectedUser(userProfile)) {
      return {
        protected: false,
        observationPriority: 'normal',
        notificationPriority: 'normal'
      }
    }

    return {
      protected: true,
      observationPriority: 'elevated_non_medical_observation',
      notificationPriority: 'high',
      medicalDiagnosis: false,
      note: 'Protected user handling increases observation and notification priority only.'
    }
  }
}

export default new ProtectedUserService()
