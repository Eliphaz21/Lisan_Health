"""
Addis AI Ethiopian Localization Provider.
Localizes English clinical reasoning explanations into Amharic (am),
Afaan Oromoo (om), and verified English (en).

Guarantees 100% deterministic preservation of:
- Observed numerical values
- Measurement units
- Reference intervals
- Clinical observation flags
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import httpx

from backend.app.core.config import settings
from backend.app.schemas.ai import (
    EnglishClinicalExplanation,
    LocalizedReportExplanation,
    LocalizedAnalyteExplanation,
)
from backend.app.schemas.report import ObservationFlag

logger = logging.getLogger(__name__)


class LocalizationInvariantError(ValueError):
    """Raised when localization violates numerical or unit preservation invariants."""
    pass


def verify_localization_invariants(
    source: EnglishClinicalExplanation,
    localized: LocalizedReportExplanation
) -> bool:
    """
    Strict safety assertion: Verifies that localization did not alter or drop
    any numerical values, units, reference intervals, or clinical flags.
    """
    if source.report_id != localized.report_id:
        raise LocalizationInvariantError(
            f"Report ID mismatch: source '{source.report_id}' vs localized '{localized.report_id}'"
        )

    if len(source.analyte_explanations) != len(localized.analyte_explanations):
        raise LocalizationInvariantError(
            f"Analyte count mismatch: source has {len(source.analyte_explanations)}, "
            f"localized has {len(localized.analyte_explanations)}"
        )

    for src_analyte, loc_analyte in zip(source.analyte_explanations, localized.analyte_explanations):
        if src_analyte.observed_value != loc_analyte.observed_value:
            raise LocalizationInvariantError(
                f"Numerical value mutated in {src_analyte.test_name}: "
                f"source={src_analyte.observed_value} vs localized={loc_analyte.observed_value}"
            )
        if src_analyte.unit != loc_analyte.unit:
            raise LocalizationInvariantError(
                f"Unit mutated in {src_analyte.test_name}: "
                f"source='{src_analyte.unit}' vs localized='{loc_analyte.unit}'"
            )
        if src_analyte.reference_interval_text != loc_analyte.reference_interval_text:
            raise LocalizationInvariantError(
                f"Reference interval mutated in {src_analyte.test_name}: "
                f"source='{src_analyte.reference_interval_text}' vs localized='{loc_analyte.reference_interval_text}'"
            )
        if src_analyte.flag != loc_analyte.flag:
            raise LocalizationInvariantError(
                f"Flag mutated in {src_analyte.test_name}: "
                f"source={src_analyte.flag} vs localized={loc_analyte.flag}"
            )

    return True


class AddisAIProvider(ABC):
    """Abstract interface for Ethiopian localization."""

    @abstractmethod
    async def localize(
        self,
        explanation: EnglishClinicalExplanation,
        target_language: str
    ) -> LocalizedReportExplanation:
        """Localizes an English clinical explanation into the specified language."""
        pass


class MockAddisAIProvider(AddisAIProvider):
    """
    Deterministic, high-quality offline localization provider for Ethiopian languages.
    Supports Amharic ('am'), Afaan Oromoo ('om'), and English ('en').
    Zero paid API tokens required, guaranteed reproducible behavior in test environments.
    """

    AMHARIC_PANELS = {
        "Complete Blood Count": "የተሟላ የደም ምርመራ (CBC)",
        "Lipid Panel": "የስብ እና ኮሌስትሮል ምርመራ (Lipid Panel)",
        "Comprehensive Metabolic Panel": "የተሟላ የሰውነት ሜታቦሊዝም ምርመራ (CMP)",
    }

    OROMO_PANELS = {
        "Complete Blood Count": "Qorannoo Dhiigaa Guutuu (CBC)",
        "Lipid Panel": "Qorannoo Cooma Dhiigaa (Lipid Panel)",
        "Comprehensive Metabolic Panel": "Qorannoo Meetaaboolizimii Dhiigaa (CMP)",
    }

    AMHARIC_ANALYTES = {
        "Hemoglobin": {
            "name": "ሂሞግሎቢን (Hemoglobin)",
            "measure": "ሂሞግሎቢን በደማችን ውስጥ ኦክስጅንን ከሳንባ ወደተለያዩ የሰውነት ክፍሎች የሚያጓጉዝ ወሳኝ ፕሮቲን ነው።",
            "low": "የሂሞግሎቢን መጠን ከመደበኛው ክልል በታች ነው፤ ይህም የደም ማነስ (anemia) ወይም የብረት እጥረት ሊያመለክት ይችላል።",
            "high": "የሂሞግሎቢን መጠን ከመደበኛው ክልል በላይ ነው። ይህም ተጨማሪ የህክምና ክትትል ሊያስፈልገው ይችላል።",
            "normal": "የሂሞግሎቢን መጠን በተለመደው ጤናማ መደበኛ ክልል ውስጥ ይገኛል።",
        },
        "Hematocrit": {
            "name": "ሄማቶክሪት (Hematocrit)",
            "measure": "ሄማቶክሪት በደማችን ውስጥ የቀይ የደም ሴሎችን መጠን በመቶኛ ያሳያል።",
            "low": "የሄማቶክሪት መጠን ዝቅ ያለ ሲሆን ይህም የቀይ የደም ሴሎች ቁጥር ማነስን ይጠቁማል።",
            "high": "የሄማቶክሪት መጠን ከፍ ያለ ሲሆን ይህም የውሃ ማነስ ወይም የቀይ የደም ሴሎች መብዛትን ሊያመለክት ይችላል።",
            "normal": "የሄማቶክሪት መጠን በመደበኛ ጤናማ ክልል ውስጥ ይገኛል።",
        },
        "White Blood Cells": {
            "name": "ነጭ የደም ሴሎች (WBC)",
            "measure": "ነጭ የደም ሴሎች ሰውነታችን ኢንፌክሽኖችን እና በሽታዎችን እንዲከላከል የሚረዱ የበሽታ መከላከያ ህዋሳት ናቸው።",
            "low": "የነጭ የደም ሴሎች ቁጥር ከመደበኛው በታች ነው፤ ይህም የበሽታ መከላከል አቅም መቀነሱን ሊያሳይ ይችላል።",
            "high": "የነጭ የደም ሴሎች ቁጥር ከመደበኛው በላይ ነው፤ ይህም ሰውነት ኢንፌክሽንን ወይም እብጠትን እየተከላከለ መሆኑን ሊጠቁም ይችላል።",
            "normal": "የነጭ የደም ሴሎች ቁጥር በተለመደው ጤናማ ክልል ውስጥ ይገኛል።",
        },
        "Platelets": {
            "name": "ፕሌትሌቶች (Platelets)",
            "measure": "ፕሌትሌቶች ደም በሚፈስበት ጊዜ ደም እንዲረጋ እና የደም መፍሰስ እንዲቆም የሚረዱ የደም ህዋሳት ናቸው።",
            "low": "የፕሌትሌት ቁጥር ከመደበኛው በታች ነው፤ ይህም በቀላሉ የመቁሰል ወይም የደም መፍሰስ ስጋትን ሊፈጥር ይችላል።",
            "high": "የፕሌትሌት ቁጥር ከመደበኛው በላይ ነው።",
            "normal": "የፕሌትሌት ቁጥር በመደበኛ ጤናማ ክልል ውስጥ ይገኛል።",
        },
        "Total Cholesterol": {
            "name": "አጠቃላይ ኮሌስትሮል (Total Cholesterol)",
            "measure": "አጠቃላይ ኮሌስትሮል በደማችን ውስጥ ያለውን ጠቅላላ የስብ መጠን ይለካል።",
            "low": "አጠቃላይ ኮሌስትሮል ከመደበኛው ክልል በታች ይገኛል።",
            "high": "አጠቃላይ ኮሌስትሮል ከመደበኛው ክልል በላይ ነው፤ ይህም የደም ቧንቧ ጤናን ሊጎዳ ይችላል።",
            "normal": "አጠቃላይ ኮሌስትሮል በመደበኛ ጤናማ ክልል ውስጥ ይገኛል።",
        },
        "LDL Cholesterol": {
            "name": "ኤልዲኤል (መጥፎ) ኮሌስትሮል (LDL)",
            "measure": "ኤልዲኤል በደም ቧንቧዎች ግድግዳ ላይ ሊጠራቀም የሚችል ስብ በመሆኑ 'መጥፎ ኮሌስትሮል' በመባል ይታወቃል።",
            "low": "የኤልዲኤል ኮሌስትሮል መጠን ዝቅተኛ ነው።",
            "high": "የኤልዲኤል ኮሌስትሮል መጠን ከፍ ያለ ነው፤ ይህም ለልብና የደም ቧንቧ ጤና የአመጋገብና የአኗኗር ማስተካከያ ሊያስፈልገው ይችላል።",
            "normal": "የኤልዲኤል ኮሌስትሮል መጠን በመደበኛ ተስማሚ ክልል ውስጥ ይገኛል።",
        },
        "HDL Cholesterol": {
            "name": "ኤችዲኤል (ጥሩ) ኮሌስትሮል (HDL)",
            "measure": "ኤችዲኤል ትርፍ ስብን ከደም ቧንቧዎች በማስወገድ ወደ ጉበት የሚያጓጉዝ በመሆኑ 'ጥሩ ኮሌስትሮል' በመባል ይታወቃል።",
            "low": "የኤችዲኤል መጠን ከመደበኛው በታች ነው፤ ከፍተኛ የኤችዲኤል መጠን ለልብ ጤና ተመራጭ ነው።",
            "high": "የኤችዲኤል መጠን በጣም ጥሩ በሆነ ጤናማ ክልል ውስጥ ይገኛል።",
            "normal": "የኤችዲኤል መጠን በመደበኛ ጤናማ ክልል ውስጥ ይገኛል።",
        },
        "Triglycerides": {
            "name": "ትራይግሊሰራይድስ (Triglycerides)",
            "measure": "ትራይግሊሰራይድስ ሰውነታችን ተጨማሪ ኃይል ለማከማቸት የሚጠቀምበት የስብ አይነት ነው።",
            "low": "የትራይግሊሰራይድስ መጠን ዝቅተኛ ነው።",
            "high": "የትራይግሊሰራይድስ መጠን ከመደበኛው በላይ ነው፤ ይህም የአመጋገብ ክትትል ሊያስፈልገው እንደሚችል ይጠቁማል።",
            "normal": "የትራይግሊሰራይድስ መጠን በመደበኛ ጤናማ ክልል ውስጥ ይገኛል።",
        },
    }

    OROMO_ANALYTES = {
        "Hemoglobin": {
            "name": "Heemogloobiinii (Hemoglobin)",
            "measure": "Heemogloobiiniin pirootiinii dhiiga keessatti ooksijiinii somba irraa gara qaamaatti daddabarsudha.",
            "low": "Sadarkaan heemogloobiinii idilee gadi jira; kun hanqina dhiigaa (anemia) agarsiisuu danda'a.",
            "high": "Sadarkaan heemogloobiinii idilee ol jira; kun hordoffii dabalataa barbaada.",
            "normal": "Sadarkaan heemogloobiinii sadarkaa fayyaaleessa idilee keessatti argama.",
        },
        "Hematocrit": {
            "name": "Hemaatokiriit (Hematocrit)",
            "measure": "Hemaatokiriitiin hamma seelota dhiiga diimaa dhiiga keessa jiran dhibbeentaadhaan agarsiisa.",
            "low": "Hamma hemaatokiriitii idilee gadi waan ta'eef seelonni dhiiga diimaa hir'achuu danda'u.",
            "high": "Hamma hemaatokiriitii idilee ol jira.",
            "normal": "Hamma hemaatokiriitii sadarkaa idilee keessatti argama.",
        },
        "White Blood Cells": {
            "name": "Seelii Dhiiga Adii (WBC)",
            "measure": "Seelonni dhiiga adii qaamni keenya dhibee fi jarmoota akka ittisu kan gargaaranidha.",
            "low": "Baay'inni seelota dhiiga adii idilee gadi jira; kun dandeettii dhibee ittisuu xiqqeessuu danda'a.",
            "high": "Baay'inni seelota dhiiga adii idilee ol jira; kun qaamni infekshinii ittisaa akka jiru agarsiisa.",
            "normal": "Baay'inni seelota dhiiga adii sadarkaa idilee keessatti argama.",
        },
        "Platelets": {
            "name": "Pilaatileetii (Platelets)",
            "measure": "Pilaatileetiin seelota yeroo dhiigni dhangala'u akka dhiigni itituuf gargaaranidha.",
            "low": "Baay'inni pilaatileetii idilee gadi jira; kun balaa dhiigsuu dabaluu danda'a.",
            "high": "Baay'inni pilaatileetii idilee ol jira.",
            "normal": "Baay'inni pilaatileetii sadarkaa idilee keessatti argama.",
        },
        "Total Cholesterol": {
            "name": "Koleestaroolii Waliigalaa (Total Cholesterol)",
            "measure": "Koleestarooliin waliigalaa hamma coomaa dhiiga keessa jiru safara.",
            "low": "Koleestarooliin waliigalaa idilee gadi jira.",
            "high": "Koleestarooliin waliigalaa idilee ol jira; kun dhiibbaa ujummoo dhiigaa irratti qabaachuu danda'a.",
            "normal": "Koleestarooliin waliigalaa sadarkaa idilee keessatti argama.",
        },
        "LDL Cholesterol": {
            "name": "Koleestaroolii Badaa (LDL)",
            "measure": "LDL koleestaroolii 'badaa' jedhama; ujummoo dhiigaa keessatti kuufamuu danda'a.",
            "low": "Sadarkaan LDL gadi aanaadha.",
            "high": "Sadarkaan LDL idilee ol jira; fayyaa onneetif sirreeffama nyaataa fi jireenyaa barbaada.",
            "normal": "Sadarkaan LDL sadarkaa idilee keessatti argama.",
        },
        "HDL Cholesterol": {
            "name": "Koleestaroolii Gaarii (HDL)",
            "measure": "HDL koleestaroolii 'gaarii' jedhama; cooma gara tiruutti deebisuun eegumsa taasisa.",
            "low": "Sadarkaan HDL idilee gadi jira; sadarkaa ol'aanaan onneef barbaachisaadha.",
            "high": "Sadarkaan HDL sadarkaa gaarii keessatti argama.",
            "normal": "Sadarkaan HDL sadarkaa idilee keessatti argama.",
        },
        "Triglycerides": {
            "name": "Tiraayigilisiraayidii (Triglycerides)",
            "measure": "Tiraayigilisiraayidiin akaakuu cooma dhiigaa yoo ta'u, qaamni humna kuusuuf itti fayyadama.",
            "low": "Sadarkaan tiraayigilisiraayidii gadi aanaadha.",
            "high": "Sadarkaan tiraayigilisiraayidii idilee ol jira; sirreeffama nyaataa barbaada.",
            "normal": "Sadarkaan tiraayigilisiraayidii sadarkaa idilee keessatti argama.",
        },
    }

    async def localize(
        self,
        explanation: EnglishClinicalExplanation,
        target_language: str
    ) -> LocalizedReportExplanation:
        """Deterministically localizes report into target language."""
        lang = target_language.lower().strip()

        if lang == "en":
            # Pass-through in English
            localized_analytes = [
                LocalizedAnalyteExplanation(
                    test_name=a.test_name,
                    code=a.code,
                    observed_value=a.observed_value,
                    unit=a.unit,
                    reference_interval_text=a.reference_interval_text,
                    flag=a.flag,
                    what_it_measures=a.what_it_measures,
                    clinical_interpretation=a.clinical_interpretation,
                    uncertainty_note=a.uncertainty_note,
                )
                for a in explanation.analyte_explanations
            ]
            result = LocalizedReportExplanation(
                report_id=explanation.report_id,
                language="en",
                panel_name=explanation.panel_name,
                overall_summary=explanation.overall_summary,
                analyte_explanations=localized_analytes,
                non_diagnostic_statement=explanation.non_diagnostic_statement,
                suggested_doctor_questions=explanation.suggested_doctor_questions,
                disclaimer=explanation.disclaimer,
            )
            verify_localization_invariants(explanation, result)
            return result

        elif lang == "am":
            panel = self.AMHARIC_PANELS.get(explanation.panel_name, explanation.panel_name)
            localized_analytes = []

            for a in explanation.analyte_explanations:
                item_dict = self.AMHARIC_ANALYTES.get(a.test_name)
                if item_dict:
                    loc_name = item_dict["name"]
                    loc_measure = item_dict["measure"]
                    if a.flag == ObservationFlag.LOW:
                        loc_interp = item_dict["low"]
                    elif a.flag == ObservationFlag.HIGH:
                        loc_interp = item_dict["high"]
                    else:
                        loc_interp = item_dict["normal"]
                else:
                    loc_name = a.test_name
                    loc_measure = f"{a.test_name} በሰውነት ውስጥ ያለውን ሁኔታ ለመረዳት የሚረዳ የላቦራቶሪ ምርመራ ነው።"
                    loc_interp = (
                        f"የውጤት መጠን: {a.observed_value} {a.unit or ''} (መደበኛ ክልል: {a.reference_interval_text or 'አልተጠቀሰም'})።"
                    )

                localized_analytes.append(
                    LocalizedAnalyteExplanation(
                        test_name=loc_name,
                        code=a.code,
                        observed_value=a.observed_value,
                        unit=a.unit,
                        reference_interval_text=a.reference_interval_text,
                        flag=a.flag,
                        what_it_measures=loc_measure,
                        clinical_interpretation=loc_interp,
                        uncertainty_note=a.uncertainty_note,
                    )
                )

            # Overall summary translation
            has_low = any(a.flag == ObservationFlag.LOW for a in explanation.analyte_explanations)
            has_high = any(a.flag == ObservationFlag.HIGH for a in explanation.analyte_explanations)
            if "Blood" in explanation.panel_name or "CBC" in explanation.panel_name:
                summary = (
                    "ይህ የተሟላ የደም ምርመራ የሂሞግሎቢን ወይም የሄማቶክሪት መጠን ከመደበኛው ክልል ዝቅ ያለ መሆኑን ያሳያል። "
                    "ይህ ሁኔታ የቀይ የደም ሴሎችን ማነስ (ደም ማነስ) ሊያመለክት ስለሚችል ከሀኪምዎ ጋር በዝርዝር እንዲወያዩ ይመከራል።"
                    if has_low else
                    "ይህ የተሟላ የደም ምርመራ አብዛኛዎቹ የደም ህዋሳት በመደበኛ ጤናማ ክልል ውስጥ እንደሚገኙ ያሳያል።"
                )
            elif "Lipid" in explanation.panel_name:
                summary = (
                    "ይህ የስብ ምርመራ የኮሌስትሮል ወይም ትራይግሊሰራይድስ መጠን ከመደበኛው ክልል ከፍ ማለቱን ያሳያል። "
                    "የልብ እና የደም ቧንቧ ጤናን ለመጠበቅ ከአመጋገብ እና የአካል ብቃት እንቅስቃሴ ማስተካከያ ጋር በተመለከተ ሐኪምዎን ያማክሩ።"
                    if has_high else
                    "ይህ የስብ ምርመራ የኮሌስትሮል መጠኖች በመደበኛ ጤናማ ክልል ውስጥ መሆናቸውን ያሳያል።"
                )
            else:
                summary = (
                    f"ይህ የ{panel} ውጤት የላቦራቶሪ ግኝቶችን ያሳያል። ዝርዝር የህክምና ትርጉሙን ከሀኪምዎ ጋር ይወያዩ።"
                )

            questions = [
                "ዝቅ ያለ ወይም ከፍ ያለ የላቦራቶሪ ውጤቴ ዋነኛ መንስኤው ምን ሊሆን ይችላል?",
                "ተጨማሪ የደም ምርመራ ወይም የአመጋገብ ለውጥ ያስፈልገኛል?",
                "ይህንን ውጤት በድጋሚ ለመመርመር መቼ መምጣት አለብኝ?",
            ]

            result = LocalizedReportExplanation(
                report_id=explanation.report_id,
                language="am",
                panel_name=panel,
                overall_summary=summary,
                analyte_explanations=localized_analytes,
                non_diagnostic_statement="ይህ መረጃ የላቦራቶሪ ውጤቶችን በቀላሉ ለመረዳት የተዘጋጀ ትምህርታዊ ማብራሪያ እንጂ የህክምና ምርመራ ወይም መድኃኒት ማዘዣ አይደለም።",
                suggested_doctor_questions=questions,
                disclaimer="ይህ ማብራሪያ ለትምህርታዊ ዓላማ ብቻ የቀረበ ነው። የህክምና ውሳኔዎችን ለመወሰን ሁልጊዜ ፈቃድ ካለው የጤና ባለሙያ ጋር ይወያዩ።",
            )
            verify_localization_invariants(explanation, result)
            return result

        elif lang == "om":
            panel = self.OROMO_PANELS.get(explanation.panel_name, explanation.panel_name)
            localized_analytes = []

            for a in explanation.analyte_explanations:
                item_dict = self.OROMO_ANALYTES.get(a.test_name)
                if item_dict:
                    loc_name = item_dict["name"]
                    loc_measure = item_dict["measure"]
                    if a.flag == ObservationFlag.LOW:
                        loc_interp = item_dict["low"]
                    elif a.flag == ObservationFlag.HIGH:
                        loc_interp = item_dict["high"]
                    else:
                        loc_interp = item_dict["normal"]
                else:
                    loc_name = a.test_name
                    loc_measure = f"{a.test_name} haala qaamaa hubachuuf qorannoo laabraatoorii gargaarudha."
                    loc_interp = (
                        f"Bu'aa: {a.observed_value} {a.unit or ''} (Idilee: {a.reference_interval_text or 'hin ibsamne'})"
                    )

                localized_analytes.append(
                    LocalizedAnalyteExplanation(
                        test_name=loc_name,
                        code=a.code,
                        observed_value=a.observed_value,
                        unit=a.unit,
                        reference_interval_text=a.reference_interval_text,
                        flag=a.flag,
                        what_it_measures=loc_measure,
                        clinical_interpretation=loc_interp,
                        uncertainty_note=a.uncertainty_note,
                    )
                )

            has_low = any(a.flag == ObservationFlag.LOW for a in explanation.analyte_explanations)
            has_high = any(a.flag == ObservationFlag.HIGH for a in explanation.analyte_explanations)
            if "Blood" in explanation.panel_name or "CBC" in explanation.panel_name:
                summary = (
                    "Qorannoon dhiigaa kun heemogloobiiniin sadarkaa idilee gadi akka ta'e agarsiisa; "
                    "kun hanqina dhiigaa (anemia) agarsiisuu danda'a. Ogeessa fayyaa mariisisaa."
                    if has_low else
                    "Qorannoon dhiigaa kun seelonni dhiigaa hedduun sadarkaa idilee keessatti akka argaman agarsiisa."
                )
            elif "Lipid" in explanation.panel_name:
                summary = (
                    "Qorannoon cooma dhiigaa kun koleestarooliin ykn tiraayigilisiraayidiin sadarkaa idilee ol akka jiru agarsiisa. "
                    "Fayyaa onneetiif jijjiirama nyaataa fi jireenyaa irratti ogeessa fayyaa mariisisaa."
                    if has_high else
                    "Qorannoon kun hammi cooma dhiigaa sadarkaa idilee keessatti akka jiru agarsiisa."
                )
            else:
                summary = (
                    f"Bu'aan qorannoo {panel} kun kan laabraatoorii agarsiisa. Ibsa dabalataaf ogeessa fayyaa gaafadhaa."
                )

            questions = [
                "Sababni bu'aan qorannoo koo idilee ol/gadi ta'eef maali?",
                "Qorannoon dabalataa ykn sirreeffamni nyaataa na barbaachisaa?",
                "Bu'aa kana hordofuuf yoom deebi'ee qoratamuu qaba?",
            ]

            result = LocalizedReportExplanation(
                report_id=explanation.report_id,
                language="om",
                panel_name=panel,
                overall_summary=summary,
                analyte_explanations=localized_analytes,
                non_diagnostic_statement="Ibsi kun hubannoo fayyaatiif qophaa'e malee murtii fayyaa ykn ajaja qorichaa miti.",
                suggested_doctor_questions=questions,
                disclaimer="Ibsi kun barumsaaf kan dhihaatedha. Murtoo fayyaa gochuuf yeroo hunda ogeessa fayyaa mariisisaa.",
            )
            verify_localization_invariants(explanation, result)
            return result

        else:
            raise ValueError(f"Unsupported localization language: '{target_language}'. Supported: 'en', 'am', 'om'")


class RESTAddisAIProvider(AddisAIProvider):
    """
    Production REST adapter for Addis AI translation/localization service.
    Connects to the Addis AI endpoint, with deterministic verification and mock fallback.
    """

    def __init__(self):
        self.base_url = settings.ADDIS_AI_BASE_URL.rstrip("/")
        self.api_key = settings.ADDIS_AI_API_KEY
        self.timeout = float(settings.ADDIS_AI_TIMEOUT_SECONDS)
        self.fallback_provider = MockAddisAIProvider()

    async def localize(
        self,
        explanation: EnglishClinicalExplanation,
        target_language: str
    ) -> LocalizedReportExplanation:
        """Invokes Addis AI REST API with schema validation and fallback."""
        if not self.api_key:
            logger.info("ADDIS_AI_API_KEY not configured; using deterministic mock provider.")
            return await self.fallback_provider.localize(explanation, target_language)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        system_prompt = (
            f"You are the Addis AI localization engine for LisanHealth. "
            f"Localize the clinical explanation into target language code '{target_language}'. "
            f"CRITICAL SAFETY RULE: You MUST strictly preserve all numerical observed_value floats, "
            f"measurement units, reference intervals, and observation flags identically. "
            f"Do NOT translate or alter numerical numbers or units. "
            f"Return ONLY valid JSON matching the LocalizedReportExplanation schema."
        )

        payload = {
            "model": settings.ADDIS_AI_TEXT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": explanation.model_dump_json()},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                localized = LocalizedReportExplanation.model_validate_json(content)
                verify_localization_invariants(explanation, localized)
                return localized
        except Exception as exc:
            logger.warning(
                "Addis AI API request failed (%s); falling back to deterministic localizer.",
                str(exc)
            )
            return await self.fallback_provider.localize(explanation, target_language)


def get_addis_ai_provider() -> AddisAIProvider:
    """Factory returns REST provider if configured, otherwise deterministic mock provider."""
    if settings.ADDIS_AI_API_KEY and settings.ENVIRONMENT == "production":
        return RESTAddisAIProvider()
    return MockAddisAIProvider()
