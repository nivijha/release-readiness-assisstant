// AI release analysis service using Gemini/OpenRouter

import https from "node:https";

// Use Gemini if GEMINI_API_KEY is configured, otherwise return clear error
function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return apiKey;
}

/**
 * Analyzes a release package using the Gemini AI model.
 * Builds a strict prompt, requests JSON-only output, and validates the response.
 *
 * @param {Object} releaseData - The release package data
 * @param {string} releaseData.version - Release version
 * @param {string} releaseData.title - Release title
 * @param {string} releaseData.releaseDate - Release date
 * @param {string} releaseData.completedFeatures - Completed features
 * @param {string} releaseData.bugFixes - Bug fixes
 * @param {string} releaseData.changedBehaviour - Changed behaviour
 * @param {string} releaseData.qaSummary - QA summary (primary QA evidence)
 * @param {string} releaseData.knownLimitations - Known limitations
 * @param {string} releaseData.migrationNotes - Migration/configuration notes
 * @param {string} releaseData.affectedUserGroups - Affected user groups
 *
 * @returns {Promise<Object>} Analysis result with success flag
 *   - If successful: { success: true, analysis: <structured analysis> }
 *   - If API key missing: { success: false, message: "GEMINI_API_KEY not configured" }
 *   - If AI fails: { success: false, message: "AI analysis could not be completed." }
 *
 * Important:
 * - All AI calls happen server-side only
 * - API key is never sent to the frontend
 * - Invalid JSON from AI is handled safely
 * - Unsupported claims are explicitly identified
 */
export async function analyzeRelease(releaseData) {
  // Check if API key is configured
  const GEMINI_API_KEY = getGeminiApiKey();
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      message: "GEMINI_API_KEY not configured - AI analysis unavailable",
    };
  }

  try {
    // Build the strict prompt for the AI
    const prompt = buildPrompt(releaseData);

    // Call Gemini API using https
    const aiResponse = await callGeminiApi(prompt, GEMINI_API_KEY);
    const responseText = aiResponse?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!responseText) {
      return {
        success: false,
        message: "AI returned an empty response",
      };
    }

    // Try to parse JSON from the response
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseError) {
      // Attempt safe extraction of JSON from the response
      parsedJson = safeExtractJson(responseText);
    }

    if (!parsedJson || typeof parsedJson !== "object") {
      return {
        success: false,
        message: "AI did not return valid JSON",
      };
    }

    // Validate and structure the response
    const validated = validateAnalysisStructure(parsedJson);

    return {
      success: true,
      analysis: validated,
    };
  } catch (error) {
    if (!error.upstreamStatus) {
      console.error("AI analysis error:", error.message);
    }
    throw error;
  }
}

/**
 * Builds a strict prompt for the AI with the release data.
 */
function buildPrompt(data) {
  return `Analyze this release package and produce structured insights.

Release Information:
- Version: ${data.version}
- Title: ${data.title}
- Release Date: ${data.releaseDate}

Completed Features:
${data.completedFeatures}

Bug Fixes:
${data.bugFixes}

Changed Behaviour:
${data.changedBehaviour}

QA Summary:
${data.qaSummary}

Known Limitations:
${data.knownLimitations}

Migration / Configuration Notes:
${data.migrationNotes}

Affected User Groups:
${data.affectedUserGroups}

Safety and evidence rules:
- Use only facts stated in the release package. Never invent facts or outcomes.
- Never invent or imply QA evidence; use only the QA Summary as QA evidence.
- Identify claims that are unsupported by the supplied QA evidence.
- Report missing or insufficient evidence as insufficient evidence.
- Preserve all known limitations in the analysis and summaries.
- Do not approve or reject the release, and do not claim it is production-ready.

Please analyze this release and provide:
1. Impact analysis of each change (classify as Low/Medium/High with reasoning)
2. Any missing information that would be useful for release readiness
3. Any claims that are not supported by the QA evidence
4. Risks and their severity
5. An internal technical summary
6. A non-technical stakeholder summary

Return exactly this JSON structure. Use string arrays for evidence:
{
  "impactAnalysis": [
    {
      "item": "string",
      "source": "string",
      "impact": "Low | Medium | High",
      "affectedUsers": "string",
      "reason": "string",
      "evidence": ["string"]
    }
  ],
  "missingInformation": [{ "item": "string", "reason": "string" }],
  "unsupportedClaims": [
    { "claim": "string", "reason": "string", "qaEvidence": "string" }
  ],
  "risks": [
    {
      "risk": "string",
      "severity": "Low | Medium | High",
      "source": "string",
      "reason": "string"
    }
  ],
  "internalSummary": { "text": "string", "evidence": ["string"] },
  "stakeholderSummary": { "text": "string", "evidence": ["string"] }
}

Output JSON ONLY. Do not include any text before or after the JSON object.`;
}

/**
 * Calls the Gemini Flash API.
 */
function callGeminiApi(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const requestData = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let result;
        try {
          result = JSON.parse(data);
        } catch (e) {
          result = null;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          const responseDetail =
            typeof data === "string" ? data.trim().slice(0, 500) : "";
          const upstreamMessage =
            result?.error?.message ||
            result?.message ||
            responseDetail ||
            "No error message returned";
          const message = `Gemini API error: ${res.statusCode} ${upstreamMessage}`;
          console.error(message);

          const error = new Error(message);
          error.upstreamStatus = res.statusCode;
          error.statusCode =
            res.statusCode === 429 || res.statusCode === 503 ? 503 : 502;
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Failed to parse Gemini API response"));
          return;
        }

        resolve(result);
      });
    });

    req.on("error", (e) => {
      console.error("Gemini API request error:", e.message);
      reject(e);
    });

    req.write(JSON.stringify(requestData));
    req.end();
  });
}

/**
 * Validates that the AI response has the required structure.
 */
function validateAnalysisStructure(result) {
  const requiredKeys = [
    "impactAnalysis",
    "missingInformation",
    "unsupportedClaims",
    "risks",
    "internalSummary",
    "stakeholderSummary",
  ];

  for (const key of requiredKeys) {
    if (!(key in result)) {
      throw new Error(`Missing required AI output field: ${key}`);
    }
  }

  // Validate impactAnalysis array
  if (!Array.isArray(result.impactAnalysis)) {
    throw new Error("impactAnalysis must be an array");
  }

  // Validate missingInformation array
  if (!Array.isArray(result.missingInformation)) {
    throw new Error("missingInformation must be an array");
  }

  // Validate unsupportedClaims array
  if (!Array.isArray(result.unsupportedClaims)) {
    throw new Error("unsupportedClaims must be an array");
  }

  // Validate risks array
  if (!Array.isArray(result.risks)) {
    throw new Error("risks must be an array");
  }

  // Validate internalSummary
  if (
    !result.internalSummary ||
    typeof result.internalSummary.text !== "string"
  ) {
    throw new Error("internalSummary.text must be a string");
  }

  // Validate stakeholderSummary
  if (
    !result.stakeholderSummary ||
    typeof result.stakeholderSummary.text !== "string"
  ) {
    throw new Error("stakeholderSummary.text must be a string");
  }

  // Validate impactAnalysis items
  for (const item of result.impactAnalysis) {
    const requiredItemKeys = [
      "item",
      "source",
      "impact",
      "affectedUsers",
      "reason",
      "evidence",
    ];
    for (const key of requiredItemKeys) {
      if (!(key in item)) {
        throw new Error(`impactAnalysis item missing required field: ${key}`);
      }
    }
    if (
      item.impact !== "Low" &&
      item.impact !== "Medium" &&
      item.impact !== "High"
    ) {
      throw new Error(`impactAnalysis item has invalid impact: ${item.impact}`);
    }
  }

  // Validate missingInformation items
  for (const item of result.missingInformation) {
    if (!item.item || !item.reason) {
      throw new Error("missingInformation items must have item and reason");
    }
  }

  // Validate unsupportedClaims items
  for (const item of result.unsupportedClaims) {
    if (
      !item.claim ||
      !item.reason ||
      !item.qaEvidence
    ) {
      throw new Error(
        "unsupportedClaims items must have claim, reason, and qaEvidence"
      );
    }
  }

  // Validate risks items
  for (const item of result.risks) {
    const requiredRiskKeys = ["risk", "severity", "source", "reason"];
    for (const key of requiredRiskKeys) {
      if (!(key in item)) {
        throw new Error(`risk item missing required field: ${key}`);
      }
    }
    if (
      item.severity !== "Low" &&
      item.severity !== "Medium" &&
      item.severity !== "High"
    ) {
      throw new Error(`risk item has invalid severity: ${item.severity}`);
    }
  }

  return result;
}

/**
 * Attempts to safely extract JSON from a response that may have
 * text before/after the JSON object.
 */
function safeExtractJson(responseText) {
  const startIdx = responseText.indexOf("{");
  const endIdx = responseText.lastIndexOf("}");

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const jsonStr = responseText.substring(startIdx, endIdx + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

export default { analyzeRelease };