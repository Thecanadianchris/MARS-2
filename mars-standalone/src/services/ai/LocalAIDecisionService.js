/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * LocalAIDecisionService
 *
 * Purpose:
 * Routes AI requests using the Local AI First principle.
 *
 * Priority:
 * 1. Local Device AI
 * 2. Home AI Server
 * 3. Cloud AI only when allowed
 *
 * Version:
 * v0.9.1
 *
 * Date Code:
 * 270626
 * ==========================================================
 */

import LocalProvider from "./LocalProvider";
import HomeProvider from "./HomeProvider";
import CloudProvider from "./CloudProvider";

class LocalAIDecisionService {
    async process(request = {}) {
        const normalisedRequest = {
            capability: request.capability || "general",
            allowCloud: request.allowCloud === true,
            payload: request.payload || null
        };

        if (LocalProvider.canHandle(normalisedRequest)) {
            return LocalProvider.process(normalisedRequest);
        }

        if (HomeProvider.canHandle(normalisedRequest)) {
            return HomeProvider.process(normalisedRequest);
        }

        if (CloudProvider.canHandle(normalisedRequest)) {
            return CloudProvider.process(normalisedRequest);
        }

        return {
            provider: "NONE",
            status: "unsupported",
            capability: normalisedRequest.capability,
            response: "No local or approved AI provider can handle this request."
        };
    }
}

export default new LocalAIDecisionService();