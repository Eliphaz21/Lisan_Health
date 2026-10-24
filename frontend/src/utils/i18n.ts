import type { SupportedLanguage, ObservationFlag } from '../types/report';

export interface Translations {
  appName: string;
  appNativeName: string;
  tagline: string;
  heroTitle: string;
  heroTagline: string;
  apiOnline: string;
  apiConnecting: string;
  uploadTitle: string;
  uploadBrowse: string;
  uploadSubtitle: string;
  sampleSectionTitle: string;
  sampleCbc: string;
  sampleLipid: string;
  sampleMalformed: string;
  resultsTitle: string;
  measurementsExtracted: string;
  tableHeaderTest: string;
  tableHeaderValue: string;
  tableHeaderUnit: string;
  tableHeaderRefRange: string;
  tableHeaderStatus: string;
  flagLabels: Record<ObservationFlag, string>;
  warningsTitle: string;
  doctorQuestionsTitle: string;
  doctorQuestions: string[];
  disclaimerTitle: string;
  disclaimerBody: string;
  audioTitle: string;
  audioSubtitleReady: string;
  audioSubtitlePlaying: string;
  audioSpeed: string;
  audioPlay: string;
  audioPause: string;
  reviewRequiredNotice: string;
  clearResults: string;
  selectedFile: string;
  analyzing: string;
  changeFile: string;
  detailedExplanationTitle: string;
  culturalWellnessTitle: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: "LisanHealth",
    appNativeName: "Your Health Report, in Your Language",
    tagline: "Your Health Report, in Your Language",
    heroTitle: "Your Health Report, in Your Language",
    heroTagline: "Understand medical laboratory tests, reference ranges, and flags with clear explanations and native audio narration.",
    apiOnline: "API Online",
    apiConnecting: "Connecting API...",
    uploadTitle: "Drop laboratory report here, or",
    uploadBrowse: "browse files",
    uploadSubtitle: "Supports PDF and scanned images (PNG, JPEG up to 10MB)",
    sampleSectionTitle: "TEST INSTANTLY WITH SYNTHETIC CLINICAL SAMPLES",
    sampleCbc: "Complete Blood Count (Anemia)",
    sampleLipid: "Lipid Profile (Cholesterol)",
    sampleMalformed: "Unclear Scan (Uncertainty)",
    resultsTitle: "Laboratory Analysis Results",
    measurementsExtracted: "Analyte measurements extracted",
    tableHeaderTest: "Test / Analyte",
    tableHeaderValue: "Observed Value",
    tableHeaderUnit: "Unit",
    tableHeaderRefRange: "Reference Interval",
    tableHeaderStatus: "Status",
    flagLabels: {
      NORMAL: "Normal",
      LOW: "Low",
      HIGH: "High",
      CRITICAL_LOW: "Critical Low",
      CRITICAL_HIGH: "Critical High",
      UNCERTAIN: "Uncertain",
    },
    warningsTitle: "Extraction Notice:",
    doctorQuestionsTitle: "Suggested Questions for Your Healthcare Provider",
    doctorQuestions: [
      "What do these specific findings signify in the context of my symptoms and medical history?",
      "For values outside the standard interval, is follow-up retesting or additional evaluation recommended?",
      "Are there specific lifestyle or dietary considerations to monitor before my next consultation?",
    ],
    disclaimerTitle: "Educational Medical Explainer Notice:",
    disclaimerBody: "LisanHealth is an educational tool designed to improve health literacy and patient communication. It does not provide medical diagnoses, treatment instructions, or prescribe medications. Always consult a qualified medical professional for clinical guidance.",
    audioTitle: "English Audio Explanation",
    audioSubtitleReady: "Addis AI Speech Synthesis • Ready to play",
    audioSubtitlePlaying: "Addis AI Speech Synthesis • Playing audio narration",
    audioSpeed: "Speed",
    audioPlay: "Play Audio",
    audioPause: "Pause Audio",
    reviewRequiredNotice: "Requires clinician verification",
    clearResults: "Clear Dashboard",
    selectedFile: "Uploaded Report",
    analyzing: "Analyzing Report with Dual-AI...",
    changeFile: "Upload Another File",
    detailedExplanationTitle: "In-Depth Clinical Analysis",
    culturalWellnessTitle: "Ethiopian Cultural Nutrition & Wellness Considerations",
  },
  am: {
    appName: "ልሳን ጤና (LisanHealth)",
    appNativeName: "የጤና ሪፖርትዎ፣ በቋንቋዎ",
    tagline: "የጤና ሪፖርትዎ፣ በቋንቋዎ",
    heroTitle: "የጤና ሪፖርትዎ፣ በቋንቋዎ",
    heroTagline: "የላብራቶሪ ምርመራ ውጤቶችን፣ የመደበኛ ክልል ወሰኖችን እና የጤና ጠቋሚዎችን በአማርኛ ማብራሪያና በተፈጥሯዊ የድምጽ ንባብ በቀላሉ ይረዱ።",
    apiOnline: "ሲስተም ዝግጁ ነው",
    apiConnecting: "ከሲስተሙ ጋር በመገናኘት ላይ...",
    uploadTitle: "የላብራቶሪ ሪፖርትዎን እዚህ ያስቀምጡ፣ ወይም",
    uploadBrowse: "ፋይል ይምረጡ",
    uploadSubtitle: "ፒዲኤፍ (PDF) እና ፎቶዎችን (PNG, JPEG እስከ 10MB) ይቀበላል",
    sampleSectionTitle: "በናሙና ምርመራዎች ወዲያውኑ ይሞክሩ",
    sampleCbc: "የደም ሴሎች ምርመራ (CBC - የደም ማነስ)",
    sampleLipid: "የኮሌስትሮል እና ስብ ምርመራ (Lipid)",
    sampleMalformed: "ግልጽ ያልሆነ የላብራቶሪ ሰነድ",
    resultsTitle: "የላብራቶሪ ምርመራ ውጤቶች",
    measurementsExtracted: "የተተነተኑ የላብራቶሪ ውጤቶች",
    tableHeaderTest: "የምርመራ ዓይነት",
    tableHeaderValue: "የተገኘ ውጤት",
    tableHeaderUnit: "መለኪያ አሃድ",
    tableHeaderRefRange: "መደበኛ ክልል",
    tableHeaderStatus: "ደረጃ",
    flagLabels: {
      NORMAL: "መደበኛ",
      LOW: "ዝቅተኛ",
      HIGH: "ከፍተኛ",
      CRITICAL_LOW: "በጣም ዝቅተኛ",
      CRITICAL_HIGH: "በጣም ከፍተኛ",
      UNCERTAIN: "ያልተረጋገጠ",
    },
    warningsTitle: "የማጣሪያ ማሳሰቢያ፡",
    doctorQuestionsTitle: "ለሐኪምዎ ሊያቀርቧቸው የሚገቡ ጠቃሚ ጥያቄዎች",
    doctorQuestions: [
      "ይህ የተገኘው የላብራቶሪ ውጤት አሁን ከሚሰማኝ ምልክቶች አንጻር ምን ያመለክታል?",
      "ከመደበኛ ክልል ውጪ ለሆኑ ውጤቶች ተጨማሪ ምርመራ ወይም ክትትል ያስፈልገኛል?",
      "የአኗኗር ዘይቤ ወይም የአመጋገብ ለውጥ ማድረግ ይኖርብኛል?",
    ],
    disclaimerTitle: "የትምህርታዊ የጤና ማብራሪያ ማሳሰቢያ፡",
    disclaimerBody: "ልሳን ጤና የህክምና ሪፖርቶችን በቀላሉ ለመረዳት የተዘጋጀ የትምህርት አጋዥ እንጂ ህክምና ወይም የበሽታ መመርመሪያ አይደለም። መድኃኒት አያዝዝም ወይም አይቀይርም። ማንኛውንም የህክምና ውሳኔ ከመወሰንዎ በፊት ሁልጊዜ ከባለሙያ ሐኪም ጋር ይማከሩ።",
    audioTitle: "የአማርኛ የድምጽ ማብራሪያ",
    audioSubtitleReady: "አዲስ ኤአይ (Addis AI) ድምጽ • ለማዳመጥ ዝግጁ ነው",
    audioSubtitlePlaying: "አዲስ ኤአይ (Addis AI) ድምጽ • በማብራራት ላይ ነው",
    audioSpeed: "ፍጥነት",
    audioPlay: "ድምጽ አጫውት",
    audioPause: "አቁም",
    reviewRequiredNotice: "የሐኪም ማረጋገጫ ያስፈልገዋል",
    clearResults: "ውጤቱን አጽዳ",
    selectedFile: "የተሰቀለው ሪፖርት",
    analyzing: "በDual-AI በመተንተን ላይ...",
    changeFile: "ሌላ ፋይል ምረጥ",
    detailedExplanationTitle: "የተብራራ የላብራቶሪ ውጤቶች ማብራሪያ",
    culturalWellnessTitle: "ባህላዊ የአመጋገብ እና የጤንነት ምክሮች",
  },
  om: {
    appName: "LisanHealth (Fayyaa Lisan)",
    appNativeName: "Gabaasa Fayyaa Keessanii, Afaan Keessaniin",
    tagline: "Gabaasa Fayyaa Keessanii, Afaan Keessaniin",
    heroTitle: "Gabaasa Fayyaa Keessanii, Afaan Keessaniin",
    heroTagline: "Qorannoo laaboraatoorii, safartuuwwan fayyaa fi ibsa gabaasa keessanii Afaan Oromootiin dubbisa sagaleetiin salphaatti hubadhaa.",
    apiOnline: "Siisteemiin Hojjataa Jira",
    apiConnecting: "Siisteema waliin walqunnamaa jira...",
    uploadTitle: "Gabaasa laaboraatoorii as kaa'aa, yookiin",
    uploadBrowse: "faayilii filadhaa",
    uploadSubtitle: "Faayiloota PDF fi fakkii (PNG, JPEG hanga 10MB) ni fudhata",
    sampleSectionTitle: "SAKATTA'AA FAKKEENYAATIIN BATTALUMATTI ILAALAA",
    sampleCbc: "Qorannoo Dhiigaa Guutuu (CBC - Hanqina Dhiigaa)",
    sampleLipid: "Qorannoo Hamma Furdataa fi Dhiigaa (Lipid)",
    sampleMalformed: "Gabaasa Hin Qulqulloofne",
    resultsTitle: "Bu'aa Qorannoo Laaboraatoorii",
    measurementsExtracted: "Safartuuwwan qorannoo argaman",
    tableHeaderTest: "Gosa Qorannoo",
    tableHeaderValue: "Bu'aa Argame",
    tableHeaderUnit: "Safartuu",
    tableHeaderRefRange: "Daangaa Idilee",
    tableHeaderStatus: "Sadarkaa",
    flagLabels: {
      NORMAL: "Idilee",
      LOW: "Gadi-aanaa",
      HIGH: "Ol-aanaa",
      CRITICAL_LOW: "Baay'ee Gadi",
      CRITICAL_HIGH: "Baay'ee Ol",
      UNCERTAIN: "Mirkaneessa Barbaada",
    },
    warningsTitle: "Hubachiisa Qorannoo:",
    doctorQuestionsTitle: "Gaaffilee Ogeessa Fayyaa Keessan Gaafachuu Qabdan",
    doctorQuestions: [
      "Bu'aan qorannoo kun mallattoolee fayyaa koo waliin yoo ilaalamu maal agarsiisa?",
      "Safartuuwwan daangaa idilee ala ta'aniif qorannoo dabalataa nan barbaachisaa?",
      "Haala jireenyaa yookiin soorataa koo irratti jijjiirama gochuun qabaa?",
    ],
    disclaimerTitle: "Hubachiisa Ibsa Fayyaa:",
    disclaimerBody: "LisanHealth odeeffannoo fi hubannoo gabaasa laaboraatoorii dabaluuf kan qophaa'eedha malee yaala fayyaa yookiin qoricha ajajuu miti. Murtoo fayyaa kamiyyuu dura yeroo hunda ogeessa fayyaa keessan mariisisaa.",
    audioTitle: "Ibsa Sagalee Afaan Oromoo",
    audioSubtitleReady: "Sagalee Addis AI • Dhaggeeffachuuf qophiidha",
    audioSubtitlePlaying: "Sagalee Addis AI • Sagaleen dubbisaa jira",
    audioSpeed: "Saffisa",
    audioPlay: "Sagalee Taphaasi",
    audioPause: "Dhaabi",
    reviewRequiredNotice: "Mirkaneessa ogeessaa barbaada",
    clearResults: "Bu'aa Haqi",
    selectedFile: "Gabaasa Olkaawame",
    analyzing: "Dual-AI'n xiinxalamaa jira...",
    changeFile: "Faayilii Jijjiiri",
    detailedExplanationTitle: "Ibsa Bal'aa Bu'aa Qorannoo",
    culturalWellnessTitle: "Hubannoo Soorata Aadaa fi Fayyummaa",
  },
  ti: {
    ...({} as Translations),
    appName: 'ልሳን ጤና (LisanHealth)',
    appNativeName: 'ጸብጻብ ጥዕናኻ ብቋንቋኻ', tagline: 'ጸብጻብ ጥዕናኻ ብቋንቋኻ',
    heroTitle: 'ጸብጻብ ጥዕናኻ ብቋንቋኻ', heroTagline: 'ውጽኢት ምርመራ ላቦራቶሪ ብቐሊሉ ተረዳእ።',
    apiOnline: 'ሲስተም ይሰርሕ ኣሎ', apiConnecting: 'ሲስተም ይጽንበር ኣሎ...',
    uploadTitle: 'ጸብጻብ ላቦራቶሪ ኣብዚ ኣእቱ፣ ወይ', uploadBrowse: 'ፋይል ምረጽ', uploadSubtitle: 'PDF፣ PNG ወይ JPEG ክሳብ 10MB',
    sampleSectionTitle: 'ሰነዳት ምርመራ ብቕጽበት ፈትን', sampleCbc: 'ምሉእ ምርመራ ደም', sampleLipid: 'ምርመራ ኮሌስትሮል', sampleMalformed: 'ዘይንጹር ጸብጻብ',
    resultsTitle: 'ውጽኢት ምርመራ ላቦራቶሪ', measurementsExtracted: 'ዝተረኽቡ መለክዒታት', tableHeaderTest: 'ዓይነት ምርመራ', tableHeaderValue: 'ዝተመዘነ ዋጋ', tableHeaderUnit: 'መለክዒ', tableHeaderRefRange: 'መደበኛ ደረጃ', tableHeaderStatus: 'ኩነታት',
    flagLabels: { NORMAL: 'መደበኛ', LOW: 'ትሑት', HIGH: 'ልዑል', CRITICAL_LOW: 'ብጣዕሚ ትሑት', CRITICAL_HIGH: 'ብጣዕሚ ልዑል', UNCERTAIN: 'ምርግጋጽ የድሊ' },
    warningsTitle: 'ሓበሬታ ምርመራ:', doctorQuestionsTitle: 'ንሓኪምካ ክትሓቶም ዝግባእ ሕቶታት',
    doctorQuestions: ['እዚ ውጽኢት ምስ ኩነታተይ እንታይ ትርጉም ኣለዎ?', 'ተወሳኺ ምርመራ የድልየኒዶ?', 'እዚ ውጽኢት መዓስ ክደግሞ ይግባእ?'],
    disclaimerTitle: 'ናይ ትምህርቲ ሓበሬታ:', disclaimerBody: 'LisanHealth ናይ ትምህርቲ መሳርሒ እዩ። ሕክምናዊ ምርመራ ወይ መድሃኒት ኣይህብን። ምስ በዓል ሞያ ጥዕና ተዘራረብ።',
    audioTitle: 'ትግርኛ ድምጺ መብርሂ', audioSubtitleReady: 'Addis AI ድምጺ • ንምጽዋት ድሉው', audioSubtitlePlaying: 'Addis AI ድምጺ • ይጻወት ኣሎ', audioSpeed: 'ፍጥነት', audioPlay: 'ድምጺ ኣጻውት', audioPause: 'ደው ኣብል', reviewRequiredNotice: 'ምርግጋጽ ሓኪም የድሊ', clearResults: 'ውጽኢት ኣጽርይ', selectedFile: 'ዝተመርጸ ሰነድ', analyzing: 'ብDual-AI ይተንተን ኣሎ...', changeFile: 'ካልእ ፋይል ምረጽ', detailedExplanationTitle: 'ዝርዝር መብርሂ', culturalWellnessTitle: 'ሓፈሻዊ ሓበሬታ ጥዕና',
  },
};
