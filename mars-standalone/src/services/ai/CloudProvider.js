/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * CloudProvider
 *
 * Purpose:
 * Represents external AI services such as Gemini or OpenAI.
 *
 * Current Scope:
 * Placeholder only. No online AI call is made yet.
 *
 * Version:
 * v0.9.1
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

class CloudProvider {
    constructor() {
        this.name = "CLOUD_AI";
        this.available = true;
    }

    canHandle(request) {
        if (!this.available || !request) {
            return false;
        }

        return request.allowCloud === true;
    }

    async process(request) {
        return {
            provider: this.name,
            status: "success",
            capability: request?.capability || "general",
            response: "Processed by cloud AI placeholder."
        };
    }
}

export default new CloudProvider();