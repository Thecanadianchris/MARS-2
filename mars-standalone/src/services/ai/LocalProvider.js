/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * LocalProvider
 *
 * Purpose:
 * Represents AI processing available directly on the local device.
 *
 * Current Scope:
 * Placeholder for Samsung Galaxy S22 / browser-side local AI.
 *
 * Version:
 * v0.9.1
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

class LocalProvider {
    constructor() {
        this.name = "LOCAL_DEVICE";
        this.available = true;
    }

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