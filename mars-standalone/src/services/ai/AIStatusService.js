/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * AIStatusService
 *
 * Purpose:
 * Provides visible AI routing status for the MARS UI.
 *
 * Version:
 * v0.9.2
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

class AIStatusService {
    constructor() {
        this.status = {
            activeProvider: "LOCAL_DEVICE",
            activeCapability: "status",
            localDevice: true,
            homeServer: false,
            cloudAI: false,
            mode: "local-first"
        };
    }

    getStatus() {
        return this.status;
    }

    updateStatus(update = {}) {
        this.status = {
            ...this.status,
            ...update
        };

        return this.status;
    }
}

export default new AIStatusService();