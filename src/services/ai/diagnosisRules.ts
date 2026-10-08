export const DIAGNOSIS_RULES = `
STANDARD SHORTHAND: t/c = to consider; r/o = rule out; vs = versus; cons = considerations (numbered list); s/p = status post; in / not in = current symptom state (e.g., "not in uremia", "not in acute exacerbation", "not in acute decompensation").

MASTER SYNTAX:
[Primary Status/Prefix] [DIAGNOSIS/SYNDROME], [Severity/Stage/Grade], [Chronicity], [Modifiers/Location], from [Etiology List], with secondary [Complications],[Symptom State]
    - s/p [Intervention] ([Date], [Institution])

ETIOLOGY FORMATTING:
- Definitive: ...from [Etiology] secondary to [Root Cause]
- Uncertain/Multiple: ...from cons 1) [Most likely] 2) [Alternative] 3) r/o [Worst-case] vs [Other]
- Nested: ...from 1) [Etiology A] from a) [Sub-cause] b) [Sub-cause] 2) r/o [Differential]

DISEASE-SPECIFIC SUB-TEMPLATES:
- ONCOLOGY: [Organ] [Histology], Stage [Roman Numeral] ([TNM]), [Biomarkers]. Modifiers: [Tumor Size],[Mets Location]. Sub-bullets: s/p treatments, dates, response rates.
- INFECTION:[Pathogen] [Syndrome], [Severity/Score], likely from [Source], [Complications/r/o].
- ORGAN FAILURE/CHRONIC (CKD, HF, Cirrhosis): [Disease] Stage [Class] from[Etiology], with secondary [Metabolic/Structural Complications], [Symptom State]. (Include LVEF, GFR, etc.)
- NEUROLOGIC/VASCULAR: [Event], [Chronicity], [Location], [Volume/Size], likely [Etiology], [Scores: NIHSS/ICHS], ictus[Date].
- METABOLIC/ELECTROLYTES (Group under "Multiple Electrolyte Imbalance" or MEI): [Electrolyte], [Severity], [Chronicity], [Symptom Status], [Volume Status], from [Etiology]
- HEMATOLOGIC: [Abnormality] ([Cell lines]) from 1) [Cause A] 2) [Cause B]

PROBLEM LIST HIERARCHY (Descending Acuity):
- ACUTE LIFE-THREATENING (e.g., Shock, Respiratory Failure, Encephalopathy)
- PRIMARY ACTIVE/INFECTIONS/ACUTE INJURY (e.g., AKI, Bacteremia, Jaundice)
- ONCOLOGIC/HEMATOLOGIC (Stage, markers, s/p lines)
- CHRONIC DISEASES (e.g., CKD, HFrEF, HIV, T2DM/Metabolic Syndrome)
- METABOLIC & ELECTROLYTES (MEI bulleted list)
- HEMATOLOGIC (Anemia, Thrombocytosis)
- RISK STRATIFICATION SCORES (e.g., VTE, Refeeding, ECOG, Wells, Padua)
- PAST MED/SURG HISTORY & SCREENINGS

ADDITIONAL RULES:
1. Format as a numbered list ordered strictly by clinical urgency and severity (Most Responsible Diagnosis first). No paragraph explanations.
2. Granular etiologies required. Never just "AKI". Use "AKI [Stage] [Type] from [Etiology] r/o [Diff]".
3. Nest procedures (s/p) directly under the treated disease using dashed indents, with dates/locations.
4. Group symptom clusters (e.g., group DM, HTN, Dyslipidemia under "Metabolic syndrome") if they match the official diagnostic criteria.
5. Declare symptomatic states explicitly (e.g., "not in retention", "not in cholangitis").
6. Embed risk/functional scores in parentheses next to the condition (e.g., HScore, Padua, ECOG, etc.).
7. Do not use explanatory phrases like "manifested by", "evidenced by", or "due to the presence of". All clinical justification and reasoning MUST be reserved for the Rationale section.
8. Specify laterality (Left/Right/Bilateral) and timing (Acute, Chronic, Subacute, or "Ictus [Date]") when possible given the data.
9. Include validated staging (e.g., NYHA, GOLD, KDIGO, GINA, etc.) and control status (e.g., "controlled," "in acute exacerbation") for chronic diseases.
10. Incorporate all relevant objective scores (e.g., HScore, MELD-Na, CHA2DS2-VASc, SIC, TG18, SLEDAI, etc.) in parentheses immediately next to the diagnosis to provide a "snapshot" of risk and prognosis.
`;
