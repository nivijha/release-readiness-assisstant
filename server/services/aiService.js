// AI release analysis service using Gemini/OpenRouter

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
    const aiResponse = await callGeminiApi(prompt);

    if (!aiResponse || !aiResponse.text) {
      return {
        success: false,
        message: "AI returned an empty response",
      };
    }

    // Try to parse JSON from the response
    let parsedJson;
    try {
      parsedJson = JSON.parse(aiResponse.text);
    } catch (parseError) {
      // Attempt safe extraction of JSON from the response
      parsedJson = safeExtractJson(aiResponse.text);
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
    console.error("AI analysis error:", error.message);
    return {
      success: false,
      message: "AI analysis could not be completed.",
    };
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

Please analyze this release and provide:
1. Impact analysis of each change (classify as Low/Medium/High with reasoning)
2. Any missing information that would be useful for release readiness
3. Any claims that are not supported by the QA evidence
4. Risks and their severity
5. An internal technical summary
6. A non-technical stakeholder summary

Follow the output JSON schema exactly. Be thorough but concise.

Output JSON ONLY. Do not include any text before or after the JSON object.`;
}

/**
 * Calls the Gemini Flash API.
 */
function callGeminiApi(prompt) {
  return new Promise((resolve, reject) => {
    const https = require("https");

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
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        if (res.statusCode !== 200) {
          // API key invalid or quota exceeded
          console.error(
            `Gemini API error: status ${res.statusCode}, body: ${data}`
          );
          reject(new Error(`Gemini API returned status ${res.statusCode}`));
          return;
        }
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse Gemini API response"));
        }
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