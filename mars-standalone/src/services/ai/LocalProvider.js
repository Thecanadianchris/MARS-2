/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * LocalProvider
 *
 * Purpose:
 * Tier 1 of the MARS AI escalation chain: on-device AI on the
 * robot itself (Samsung Galaxy S22).
 *
 * Current Scope:
 * Honest stub. The on-device LLM arrives with the Android robot
 * application phase (v0.20.x). Until then this tier truthfully
 * reports itself unavailable for reasoning, so the escalation
 * chain (Local → Home → Cloud) starts at the Home tier.
 *
 * The legacy capability-routing interface (canHandle/process,
 * used by LocalAIDecisionService since v0.9.1) is preserved
 * unchanged.
 *
 * Version:
 * v0.14.4 (reasoning tier added; legacy interface from v0.9.1)
 * Date Code:
 * 110726
 * ==========================================================
 */

class LocalProvider {
    constructor() {
        this.name = "LOCAL_DEVICE";
        this.available = true;
    }

    // ---- v0.14.4 reasoning tier (honest stub) ----

    reasoningAvailable() {
        return false;
    }

    getReasoningStatus() {
        return {
            tier: this.name,
            label: "Local Device (S22)",
            available: false,
            detail: "On-device LLM is planned for the Android robot application (v0.20.x). Honest stub until then — escalation starts at the Home tier."
        };
    }

    async reason() {
        return {
            provider: this.name,
            status: "unavailable",
            response: null,
            detail: "No on-device model yet (arrives with the Android build, v0.20.x)."
        };
    }

    // ---- legacy v0.9.1 capability routing (unchanged) ----

    canHandle(request) {
        if (!request) {
            return false;
        }

        const capability = request.capability || "general";

        const supportedCapabilities = [
            "status",
            "basic_conversation",
            "face_detection",
            "wake_word",
            "ocr"
        ];

        return supportedCapabilities.includes(capability);
    }

    async process(request) {
        return {
            provider: this.name,
            status: "success",
            capability: request?.capability || "general",
            response: "Processed by local device placeholder."
        };
    }
}

export default new LocalProvider();
