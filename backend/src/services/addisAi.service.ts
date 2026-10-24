import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { config } from "../config";
import { ClinicalExplanation, LocalizedExplanation } from "../types";
import { verifyLocalizationPreservation } from "./validator.service";

// High-fidelity Ethiopian medical dictionary for Amharic & Afaan Oromoo localization
const AMHARIC_DICT: Record<string, { name: string; plain: string; what: string }> = {
  Hemoglobin: {
    name: "ሄሞግሎቢን (Hemoglobin)",
    plain: "ሄሞግሎቢን በሰውነትዎ ውስጥ ኦክስጅንን የሚያጓጉዝ ፕሮቲን ነው። መደበኛ መጠን መኖሩ በቂ ጉልበት እንዲኖርዎት ይረዳል።",
    what: "በቀይ የደም ሕዋሳት ውስጥ የሚገኝ ኦክስጅን አጓጓዥ ፕሮቲን።",
  },
  "White Blood Cells": {
    name: "ነጭ የደም ሕዋሳት (WBC)",
    plain: "ነጭ የደም ሕዋሳት ሰውነትን ከበሽታና ከኢንፌክሽን ይከላከላሉ።",
    what: "የሰውነት በሽታ የመከላከል አቅም ዋነኛ ክፍል የሆኑ ሕዋሳት።",
  },
  Platelets: {
    name: "ፕሌትሌቶች (Platelets)",
    plain: "ፕሌትሌቶች ጉዳት በሚደርስበት ወቅት ደም እንዲረጋና ከመጠን በላይ እንዳይፈስ ይረዳሉ።",
    what: "የደም መርጋትን የሚያከናውኑ ጥቃቅን የደም ቅንጣቶች።",
  },
  "Total Cholesterol": {
    name: "አጠቃላይ ኮሌስትሮል (Total Cholesterol)",
    plain: "ኮሌስትሮል በሰውነት ውስጥ ሕዋሳትን ለመገንባት የሚያገለግል የስብ ዓይነት ነው። መጠኑ ከመጠን በላይ ሲሆን የልብ ጤና ላይ ተፅዕኖ ሊያሳድር ይችላል።",
    what: "በደም ዝውውር ውስጥ የሚገኝ አጠቃላይ የስብ መጠን።",
  },
  Triglycerides: {
    name: "ትሪግሊሰራይድስ (Triglycerides)",
    plain: "ትሪግሊሰራይድስ በደም ውስጥ የሚገኝ ዋና የስብ ዓይነት ሲሆን ለአመጋገብና ለሰውነት እንቅስቃሴ ቅርብ ግንኙነት አለው።",
    what: "ከምግብ በኋላ በደም ውስጥ የሚከማች የስብ ዓይነት።",
  },
};

const OROMO_DICT: Record<string, { name: string; plain: string; what: string }> = {
  Hemoglobin: {
    name: "Hemoogilobiinii (Hemoglobin)",
    plain: "Hemoogilobiiniin qabiyyee dhiigaa kan oksijiinii gara kutaalee qaamaatti geessudha. Hangi isaa sirrii ta'uun humna ga'aa akka qabaattan taasisa.",
    what: "Seelii dhiiga diimaa keessatti pirootiinii oksijiinii baatuudha.",
  },
  "White Blood Cells": {
    name: "Seelota Dhiiga Adii (WBC)",
    plain: "Seelonni dhiiga adii qaama keenya dhibee fi vaayirasoota garaa garaa irraa ittisuuf gargaaru.",
    what: "Sirna ittisa qaamaa keessatti seelota dhibee dhowwan.",
  },
  Platelets: {
    name: "Pilaatleetota (Platelets)",
    plain: "Pilaatleetotni yeroo madaa'in dhiigni akka itituu fi akka hin dhangalaane gargaaru.",
    what: "Caccabaa seelii dhiiga ititsuu keessatti qooda olaanaa qaban.",
  },
  "Total Cholesterol": {
    name: "Qabiyyee Koloostiroolii Waliigalaa",
    plain: "Koloostirooliin gosa dhiigaa keessatti argamu yoo ta'u, baay'achuun isaa fayyaa onnee irratti dhiibbaa qabaachuu danda'a.",
    what: "Safara foon dhiiga keessa jiru waliigalaa.",
  },
};

function safeEthiopianContext(language: "en" | "am" | "om" | "ti"): string[] {
  const recommendations: Record<"en" | "am" | "om" | "ti", string[]> = {
    en: [
      "Tell your clinician about your usual Ethiopian diet, fasting practices, and daily routine because these may be relevant when they interpret the report.",
      "Discuss balanced familiar foods such as whole-grain injera, legumes, and vegetables with a qualified professional; do not change a prescribed diet or medicine based on this explanation.",
      "If you wish, involve a trusted family member in your medical visit while keeping your health information private.",
      "Take the original report to a qualified health facility, especially when a result is marked outside its reference interval.",
    ],
    am: [
      "የተለመደውን የኢትዮጵያ አመጋገብዎን፣ የጾም ልማድዎን እና የዕለት ተዕለት እንቅስቃሴዎን ለጤና ባለሙያዎ ይንገሩ፤ እነዚህ ሪፖርቱን ሲተረጉሙ ጠቃሚ ሊሆኑ ይችላሉ።",
      "እንደ ሙሉ እህል እንጀራ፣ ጥራጥሬ እና አትክልት ያሉ የተመጣጠኑ የተለመዱ ምግቦችን ከባለሙያ ጋር ይወያዩ፤ በዚህ ማብራሪያ ምክንያት የታዘዘ ምግብ ወይም መድኃኒት አይቀይሩ።",
      "ከፈለጉ የጤና መረጃዎን ግላዊነት በመጠበቅ የሚያምኑትን የቤተሰብ አባል በሕክምና ቀጠሮዎ ላይ ማሳተፍ ይችላሉ።",
      "በተለይ ውጤት ከመደበኛው ክልል ውጭ ከሆነ፣ ዋናውን ሪፖርት ወደ ብቃት ያለው የጤና ተቋም ይዘው ይሂዱ።",
    ],
    om: [
      "Nyaata Itoophiyaa yeroo baayʼee nyaattan, sirna soomaa fi hojii guyyaa guyyaa keessan ogeessa fayyaatti himaa; kun yeroo gabaasicha hiikan barbaachisaa taʼuu dandaʼa.",
      "Nyaata madaalawaa kan akka injeraa midhaan guutuu, midhaan dheedhii fi kuduraalee ogeessa gahumsa qabu waliin mariʼadhaa; ibsa kana qofaan nyaata ykn qoricha ajajame hin jijjiirinaa.",
      "Yoo barbaaddan, odeeffannoo fayyaa keessanii iccitii eeguun miseensa maatii amanamaa beellama yaalaa keessan irratti hirmaachisuu dandeessu.",
      "Keessumaa buʼaan tokko daangaa wabii ala yoo mallatteeffame, gabaasa jalqabaa gara dhaabbata fayyaa gahumsa qabuutti geessaa.",
    ],
    ti: [
      "ልሙድ ናይ ኢትዮጵያ ኣመጋግባኹም፣ ናይ ጾም ልምድኹምን መዓልታዊ ንጥፈታትኩምን ንበዓል ሞያ ጥዕና ንገሩ፤ እዚ ነቲ ጸብጻብ ክትርጉምዎ ከለዉ ኣገዳሲ ክኸውን ይኽእል።",
      "ከም ናይ ምሉእ እኽሊ እንጀራ፣ ጥረምረን ኣሕምልትን ዝኣመሰሉ ሚዛናዊ ልሙዳት ምግብታት ምስ ብቑዕ በዓል ሞያ ተዘራረቡ፤ ብሰንኪ እዚ መብርሂ ዝተኣዘዘ ኣመጋግባ ወይ መድሃኒት ኣይትቐይሩ።",
      "እንተደሊኹም፣ ምስጢር ሓበሬታ ጥዕናኹም ብምሕላው እሙን ኣባል ስድራቤት ኣብ ቆጸራ ሕክምናኹም ከሰንየኩም ይኽእል።",
      "ብፍላይ ሓደ ውጽኢት ካብ ወሰን መወከሲ ወጻኢ እንተኾይኑ፣ ነቲ መበቆላዊ ጸብጻብ ናብ ብቑዕ ትካል ጥዕና ውሰዱ።",
    ],
  };
  return recommendations[language];
}

function localizationSystemPrompt(targetLanguage: "am" | "om" | "ti"): string {
  const languageName = targetLanguage === "am" ? "Amharic" : targetLanguage === "om" ? "Afaan Oromoo" : "Tigrinya";
  return `You are the Ethiopian medical-localization stage of LisanHealth. Return only valid JSON written in ${languageName}.
Preserve every analyte name, numeric value, unit, reference interval, and status exactly as supplied. Never add or infer a test result.
Explain findings for education only. Do not diagnose, prescribe, recommend treatment, change medication, or recommend herbs, supplements, traditional remedies, or spiritual practices as healthcare.
Include a detailed_explanation, a localized_explanation for every analyte, 2-3 questions for a clinician, a disclaimer, and 3-4 culturally aware Ethiopian wellness considerations.
Cultural considerations may discuss familiar foods, fasting practices, family support, privacy, access to qualified care, and taking the original report to a clinician. They must be optional, respectful of religious and regional diversity, non-prescriptive, and must not tell the user to change prescribed medicines or diets.
Use this JSON shape: {"summary":"", "detailed_explanation":"", "analytes":[{"name":"", "localized_explanation":""}], "suggested_questions_for_doctor":[], "cultural_wellness_recommendations":[], "disclaimer":""}.`;
}

export class AddisAiService {
  get apiKey(): string {
    return config.addisAi.apiKey;
  }
  get baseUrl(): string {
    return config.addisAi.baseUrl;
  }

  /**
   * Localizes clinical explanation to Amharic (am) or Afaan Oromoo (om).
   * Attempts live Addis AI REST API first; falls back gracefully to medical dictionary.
   */
  async localize(
    explanation: ClinicalExplanation,
    targetLanguage: "en" | "am" | "om" | "ti",
    options: { allowLiveProvider?: boolean } = {}
  ): Promise<LocalizedExplanation> {
    if (targetLanguage === "en") {
      return {
        language: "en",
        test_category: explanation.test_category,
        summary: explanation.summary,
        detailed_explanation: explanation.summary,
        overall_status: explanation.overall_status,
        analytes: explanation.analytes,
        suggested_questions_for_doctor: explanation.suggested_questions_for_doctor,
        cultural_wellness_recommendations: safeEthiopianContext("en"),
        disclaimer: explanation.disclaimer,
      };
    }
    if (this.apiKey && options.allowLiveProvider !== false) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/v1/chat_generate`,
          {
            prompt: `Localize this validated clinical explanation according to the system rules:\n${JSON.stringify(explanation)}`,
            target_language: targetLanguage,
            system: localizationSystemPrompt(targetLanguage),
            generation_config: { temperature: 0.1 },
          },
          {
            headers: {
              "x-api-key": this.apiKey,
              "Content-Type": "application/json",
            },
            timeout: config.addisAi.timeoutMs,
          }
        );

        const content = response.data?.response_text || response.data?.choices?.[0]?.message?.content;
        if (content) {
          let clean = content.trim();
          if (clean.startsWith("```")) {
            clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          }

          try {
            const parsed = JSON.parse(clean);
            if (parsed && (parsed.summary || parsed.test_category)) {
              const localized: LocalizedExplanation = {
                language: targetLanguage,
                test_category: explanation.test_category,
                summary: parsed.summary || clean,
                detailed_explanation: parsed.detailed_explanation || parsed.summary || clean,
                overall_status: explanation.overall_status,
                analytes: explanation.analytes.map((a) => {
                  const matchingParsed = (parsed.analytes || []).find((pa: any) => pa.name === a.name);
                  return {
                    ...a,
                    localized_explanation: matchingParsed?.localized_explanation || a.plain_explanation,
                  };
                }),
                suggested_questions_for_doctor: parsed.suggested_questions_for_doctor || parsed.questions_for_doctor || [
                  targetLanguage === "am" ? "ይህ ምርመራ ለዕለታዊ ጤንነቴ ምን ትርጉም አለው?" : "Bu'aan kun fayyaa kiyyaaf maal jechuudha?",
                  targetLanguage === "am" ? "ተጨማሪ ምርመራ ወይም የአኗኗር ለውጥ ያስፈልገኛል?" : "Qorannoo dabalataa gochuun na barbaachisaa?",
                ],
                cultural_wellness_recommendations: safeEthiopianContext(targetLanguage),
                disclaimer: parsed.disclaimer || (targetLanguage === "am"
                  ? "ይህ ማብራሪያ ለትምህርታዊ ግንዛቤ ብቻ የቀረበ ሲሆን የሕክምና ምርመራ ወይም ማዘዣ አይተካም።"
                  : "Ibsi kun hubannoo fi barnootaaf qofa kan qophaa'e dha."),
              };
              verifyLocalizationPreservation(explanation, localized);
              return localized;
            }
          } catch {
            // Natural language text response fallback: safely wrap in LocalizedExplanation
            const localized: LocalizedExplanation = {
              language: targetLanguage,
              test_category: explanation.test_category,
              summary: clean,
              detailed_explanation: clean,
              overall_status: explanation.overall_status,
              analytes: explanation.analytes.map((a) => ({ ...a, localized_explanation: a.plain_explanation })),
              suggested_questions_for_doctor: [
                targetLanguage === "am" ? "ይህ ምርመራ ለዕለታዊ ጤንነቴ ምን ትርጉም አለው?" : "Bu'aan kun fayyaa kiyyaaf maal jechuudha?",
              ],
              cultural_wellness_recommendations: safeEthiopianContext(targetLanguage),
              disclaimer: targetLanguage === "am"
                ? "ይህ ማብራሪያ ለትምህርታዊ ግንዛቤ ብቻ የቀረበ ሲሆን የሕክምና ምርመራ ወይም ማዘዣ አይተካም።"
                : "Ibsi kun hubannoo fi barnootaaf qofa kan qophaa'e dha.",
            };
            verifyLocalizationPreservation(explanation, localized);
            return localized;
          }
        }
      } catch (err: any) {
        console.warn(`[Addis AI] Live API request failed (${err.message}); utilizing high-fidelity medical localization.`);
      }
    }

    // High-fidelity deterministic localization
    return this.fallbackLocalize(explanation, targetLanguage);
  }

  private fallbackLocalize(
    explanation: ClinicalExplanation,
    lang: "am" | "om" | "ti"
  ): LocalizedExplanation {
    const isAmharic = lang === "am";
    const dict = isAmharic ? AMHARIC_DICT : OROMO_DICT;

    const summary = isAmharic
      ? explanation.overall_status === "ATTENTION_NEEDED"
        ? `የእርስዎ የ${explanation.test_category} ውጤት ከመደበኛ ወሰን ውጭ የሆኑ ምርመራዎችን ያሳያል። እባክዎ ለተጨማሪ ማብራሪያ የጤና ባለሙያዎን ያማክሩ።`
        : `በእርስዎ የ${explanation.test_category} ሪፖርት ውስጥ የተዘረዘሩ ሁሉም ውጤቶች ጤናማ በሆነ መደበኛ ወሰን ውስጥ ይገኛሉ።`
      : explanation.overall_status === "ATTENTION_NEEDED"
      ? `Bu'aan qorannoo ${explanation.test_category} keessanii qabxiilee sarara eegamee ala ta'an agarsiisa. Ogeessa fayyaa keessan mariisisaa.`
      : `Bu'aan qorannoo ${explanation.test_category} keessanii hundi haala eegame keessa jiru.`;

    const disclaimer = isAmharic
      ? "ይህ ማብራሪያ ለትምህርታዊ ግንዛቤ ብቻ የቀረበ ሲሆን የሕክምና ምርመራ ወይም ማዘዣ አይተካም። ሁልጊዜ የሕክምና ባለሙያን ያማክሩ።"
      : "Ibsi kun hubannoo fi barnootaaf qofa kan qophaa'e dha; yaalii fayyaa ykn ajaja qorichaa bakka hin bu'u. Yeroo hunda ogeessa fayyaa mariisisaa.";

    const questions = isAmharic
      ? [
          "እነዚህ ውጤቶች ለዕለታዊ ጤንነቴ ምን ትርጉም አላቸው?",
          "ምርመራውን በድጋሚ ማድረግ ወይስ የአኗኗር ዘይቤ ማስተካከል ያስፈልገኛል?",
        ]
      : [
          "Bu'aawwan kunniin jireenya koo guyyaa guyyaaf maal jechuudha?",
          "Qorannoo dabalataa gochuun na barbaachisaa?",
        ];

    const localizedAnalytes = explanation.analytes.map((a) => {
      const entry = dict[a.name];
      return {
        ...a,
        localized_explanation: entry ? entry.plain : a.plain_explanation,
      };
    });

    const result: LocalizedExplanation = {
      language: lang,
      test_category: explanation.test_category,
      summary,
      detailed_explanation: summary,
      overall_status: explanation.overall_status,
      analytes: localizedAnalytes,
      suggested_questions_for_doctor: questions,
      cultural_wellness_recommendations: safeEthiopianContext(lang),
      disclaimer,
    };

    verifyLocalizationPreservation(explanation, result);
    return result;
  }

  /**
   * Generates authenticated Ethiopian speech via Addis AI TTS.
   */
  async synthesizeSpeech(text: string, language: "en" | "am" | "om" | "ti", ownerId: string): Promise<{ audioId: string; audioPath: string }> {
    const voice = language === "en" ? config.addisAi.voiceEn : language === "am" ? config.addisAi.voiceAm : language === "om" ? config.addisAi.voiceOm : config.addisAi.voiceTi;
    const audioId = crypto.createHash("sha256").update(`${ownerId}\0${language}\0${voice}\0${text}`).digest("hex").slice(0, 48);
    const ownerDirectory = path.join(config.audioDir, ownerId);
    fs.mkdirSync(ownerDirectory, { recursive: true });
    const audioPath = path.join(ownerDirectory, `${audioId}.mp3`);
    const temporaryPath = `${audioPath}.part`;

    if (fs.existsSync(audioPath) && this.isValidMp3(fs.readFileSync(audioPath))) {
      return { audioId, audioPath };
    }

    if (this.apiKey && config.addisAi.ttsEnabled) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/v1/voice/generations`,
          {
            text,
            voice_id: voice,
            language,
            output_format: "mp3_44100",
            client_request_id: audioId,
          },
          {
            headers: {
              "x-api-key": this.apiKey,
              "Content-Type": "application/json",
            },
            timeout: config.addisAi.timeoutMs,
          }
        );

        const remoteAudioUrl = response.data?.data?.audio_url || response.data?.audio_url || response.data?.url;
        if (remoteAudioUrl) {
          const audioResponse = await axios.get(remoteAudioUrl, {
            responseType: "arraybuffer",
            timeout: config.addisAi.timeoutMs,
            maxContentLength: 15 * 1024 * 1024,
            maxBodyLength: 15 * 1024 * 1024,
          });
          fs.writeFileSync(temporaryPath, Buffer.from(audioResponse.data));
        } else if (response.data?.data?.audio_base64 || response.data?.audio_base64) {
          fs.writeFileSync(temporaryPath, Buffer.from(response.data?.data?.audio_base64 || response.data.audio_base64, "base64"));
        } else {
          throw new Error("Addis AI returned no audio URL or audio payload.");
        }
        const audio = fs.readFileSync(temporaryPath);
        if (!this.isValidMp3(audio)) throw new Error("Addis AI returned an invalid or empty MP3 payload.");
        fs.renameSync(temporaryPath, audioPath);
        return { audioId, audioPath };
      } catch (err: any) {
        if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
        throw Object.assign(new Error(`Addis AI speech generation failed: ${err?.response?.status || err.message}`), { status: 502 });
      }
    }

    throw Object.assign(new Error("Addis AI speech is not configured or has been disabled."), { status: 503 });
  }

  private isValidMp3(audio: Buffer): boolean {
    if (audio.length < 1024 || audio.length > 15 * 1024 * 1024) return false;
    const hasId3 = audio.subarray(0, 3).toString("ascii") === "ID3";
    const hasFrameSync = audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
    return hasId3 || hasFrameSync;
  }
}

export const addisAiService = new AddisAiService();
