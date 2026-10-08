export const CLINICAL_TEMPLATES = [
  {
    id: "adult_hp",
    label: "Adult Comprehensive H&P",
    content: `GENERAL DATA:
Name: 
Age/Sex: 
MRN: 
DOB: 
Address: 
Religion: 
Handedness: 
Location: 
Blood Type: 

CHIEF COMPLAINT: 


HISTORY OF PRESENT ILLNESS: 


REVIEW OF SYSTEMS: 
- General: 
- HEENT: 
- Cardiovascular: 
- Respiratory: 
- Gastrointestinal: 
- Genitourinary: 
- Musculoskeletal: 
- Dermatologic: 
- Neurologic: 
- Psychiatric: 

PAST MEDICAL & SURGICAL HISTORY: 


MEDICATIONS & ALLERGIES: 


FAMILY MEDICAL HISTORY: 


PERSONAL & SOCIAL HISTORY: 
- Tobacco/Alcohol/Substance Use: 
- Occupation: 
- Living Situation: 

SEXUAL & OBGYN HISTORY (If applicable): 
- Menstrual History (LMP): 
- OB Score (G P): 
- Sexual Activity/Orientation: 
- Contraception: 

PHYSICAL EXAM: 
- Vitals: BP: , HR: , RR: , T: , SpO2: 
- Anthropometrics: Ht: , Wt: , BMI: 
- General Appearance: 
- HEENT: 
- Lungs: 
- Heart: 
- Abdomen: 
- Extremities: 
- Neurologic: 
- Skin: `,
  },
  {
    id: "pediatric_hp",
    label: "Pediatric & Adolescent H&P",
    content: `GENERAL DATA:
Name: 
Age/Sex: 
MRN: 
DOB: 
Address: 
Religion: 
Informant: 
Blood Type: 

CHIEF COMPLAINT: 


HISTORY OF PRESENT ILLNESS: 


REVIEW OF SYSTEMS: 
(Include pertinent pediatric systems)


PAST MEDICAL/SURGICAL HISTORY: 


FAMILY MEDICAL HISTORY: 


PERSONAL & SOCIAL HISTORY: 


BIRTH & MATERNAL HISTORY: 
- Prenatal: 
- Natal (Mode of Delivery/Complications): 
- Postnatal: 

IMMUNIZATION HISTORY: 


NUTRITIONAL HISTORY: 
(Breastfed/Formula, Solid foods, Current diet)


DEVELOPMENTAL HISTORY: 
- Gross Motor: 
- Fine Motor: 
- Language: 
- Social/Cognitive: 

HEEADSSSS (For Adolescents): 
- Home: 
- Education/Employment: 
- Eating: 
- Activities: 
- Drugs: 
- Sexuality: 
- Suicide/Depression: 
- Safety: 
- Spirituality: 

PHYSICAL EXAM: 
- Vitals: HR: , RR: , T: , SpO2: 
- Anthropometrics: Wt: (Percentile: ), Ht: (Percentile: ), HC: 
- General: 
- HEENT: 
- Chest/Lungs: 
- Heart: 
- Abdomen: 
- Genitalia: 
- Extremities/Spine: 
- Neurologic/Reflexes: `,
  },
  {
    id: "obgyn_hp",
    label: "OBGYN Comprehensive H&P",
    content: `GENERAL DATA:
Name: 
Age/OB Score: 
MRN: 
DOB: 
Address: 
Marital Status: 
Contact number and email: 
Blood Type: 

CHIEF COMPLAINT: 


HISTORY OF PRESENT ILLNESS: 


PAST MEDICAL/SURGICAL HISTORY: 


MEDICATIONS & ALLERGIES: 


FAMILY MEDICAL HISTORY: 


PERSONAL & SOCIAL HISTORY: 
- Non-smoker (how many years, how many sticks, last use)
- Non-alcoholic drinker during this pregnancy
- Denies illicit drug use
- Religion: 
- Educational Attainment and Occupation: highest educational attainment and patient's occupation
- Current partner, married/live-in:
    - Age: 
    - How long together: 
    - Occupation: 
    - Smoker (how many years, how many sticks, last use)
- No previous contraceptive Use (mention the contraceptive, when used, and how long)
- First Coitus: Age of first sexual contact
    - Number of sexual partners and promiscuity of each partner (Example: 3x Non promiscuous sexual partners)
- No history of sexually transmitted illness

SEXUAL & OBGYN HISTORY:
Menarche, Interval, Duration, Amount, Symptoms: ___ y/o, Regular/Irregular (indicate range), _____ days, ___ pads per day, (-) dysmenorrhea 
LMP: Date of first day of last menstrual period = Current age of Gestation
PMP: Date of first day of previous menstrual period
eUTZ (or LUTZ): Date of earliest/latest ultrasound (Age of Gestation on the DAY OF UTZ) = Current age of Gestation

Immunization History: Prior immunizations

PNCU:

First Visit (Date/AOG): 
Last Visit (Date/AOG): 

OB Score: Gravida # Para # (T-P-A-L)
Insert Gravidity, Date, AOG, Mode, Place, Weight, Sex, Status, No Fetal-Maternal Complications
·  	Example: 2009, Full term, Spontaneous vaginal delivery (Hospital, 2003), AGA, Male, Live, No feto-maternal complications
·  	If CS, mention type of CS (Classical CS vs LTCS vs CSTU) and indication (for malpresentation (single footling breech), for fetal indication (multiple congenital anomalies))

PHYSICAL EXAM: 
- Vitals: BP: , HR: , RR: , T: 
- Anthropometrics: Wt: , Ht: , BMI: 
- General: 
- Breast Exam: 
- Abdominal Exam: 
- Pelvic/Speculum Exam: 
- Bimanual Exam: `,
  },
  {
    id: "quick_soap",
    label: "Quick SOAP Note",
    content: `SUBJECTIVE:
- Chief Complaint: 
- HPI: 
- Pertinent PMH: 

OBJECTIVE:
- Vitals: 
- Focused Physical Exam: 
- Recent Labs/Imaging: 

ASSESSMENT:
- Diagnosis/Problem List: 

PLAN:
- Diagnostics: 
- Therapeutics: 
- Follow-up: `,
  },
];
