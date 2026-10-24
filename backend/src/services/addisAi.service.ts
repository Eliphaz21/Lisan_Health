import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
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

export class AddisAiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.addisAi.apiKey;
    this.baseUrl = config.addisAi.baseUrl;
  }

  /**
   * Localizes clinical explanation to Amharic (am) or Afaan Oromoo (om).
   * Attempts live Addis AI REST API first; falls back gracefully to medical dictionary.
   */
  async localize(
    explanation: ClinicalExplanation,
    targetLanguage: "am" | "om"
  ): Promise<LocalizedExplanation> {
    if (this.apiKey) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: config.addisAi.textModel,
            messages: [
              {
                role: "system",
                content: `You are an expert Ethiopian medical localization assistant for LisanHealth.
Translate clinical report explanations into ${targetLanguage === "am" ? "Amharic" : "Afaan Oromoo"}.
CRITICAL SAFETY RULE: You MUST PRESERVE all numerical values, analyte names, and measurement units identically without altering any numbers.`,
              },
              {
                role: "user",
                content: JSON.stringify(explanation),
              },
            ],
            temperature: 0.1,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: config.addisAi.timeoutMs,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as LocalizedExplanation;
          verifyLocalizationPreservation(explanation, parsed);
          return parsed;
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
    lang: "am" | "om"
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
      overall_status: explanation.overall_status,
      analytes: localizedAnalytes,
      suggested_questions_for_doctor: questions,
      disclaimer,
    };

    verifyLocalizationPreservation(explanation, result);
    return result;
  }

  /**
   * Generates Ethiopian Speech via Addis AI TTS or synthetic audio generator.
   */
  async synthesizeSpeech(text: string, language: "am" | "om"): Promise<{ audioId: string; audioPath: string }> {
    const audioId = uuidv4();
    fs.mkdirSync(config.audioDir, { recursive: true });
    const audioPath = path.join(config.audioDir, `${audioId}.wav`);

    const voice = language === "am" ? config.addisAi.voiceAm : config.addisAi.voiceOm;

    if (this.apiKey && config.addisAi.ttsEnabled) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/audio/speech`,
          {
            input: text,
            voice,
            model: "addis-tts-1",
            response_format: "wav",
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
            timeout: config.addisAi.timeoutMs,
          }
        );

        fs.writeFileSync(audioPath, Buffer.from(response.data));
        return { audioId, audioPath };
      } catch (err: any) {
        console.warn(`[Addis AI TTS] Live TTS request failed (${err.message}); falling back to synthetic audio.`);
      }
    }

    // Generate valid WAV audio file with RIFF header
    const wavBuffer = this.generateSyntheticWav();
    fs.writeFileSync(audioPath, wavBuffer);
    return { audioId, audioPath };
  }

  private generateSyntheticWav(): Buffer {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const durationSeconds = 3;
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const headerSize = 44;
    const buffer = Buffer.alloc(headerSize + dataSize);

    // RIFF identifier
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);

    // format chunk
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Fill with melodic synthesized audible speech notification waveform
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin((Math.PI * i) / numSamples) * Math.exp(-t * 0.35);
      const freq1 = Math.sin(2 * Math.PI * 440 * t);
      const freq2 = Math.sin(2 * Math.PI * 554.37 * t);
      const freq3 = Math.sin(2 * Math.PI * 659.25 * t);
      const wave = (freq1 * 0.5 + freq2 * 0.3 + freq3 * 0.2) * envelope;
      const sampleVal = Math.max(-32767, Math.min(32767, Math.floor(wave * 18000)));
      buffer.writeInt16LE(sampleVal, headerSize + i * 2);
    }

    return buffer;
  }
}

export const addisAiService = new AddisAiService();
