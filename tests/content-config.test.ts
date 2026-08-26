import { describe, expect, it } from 'vitest';
import { CLINICAL_TEMPLATES } from '../config/clinicalTemplates';
import { DIAGNOSIS_RULES } from '../services/ai/diagnosisRules';
import { SCHEMA_DESCRIPTIONS } from '../services/ai/schemaDescriptions';
import {
  CLINICAL_TEMPLATES as FACADE_TEMPLATES,
  DIAGNOSIS_RULES as FACADE_DIAGNOSIS_RULES,
  SCHEMA_DESCRIPTIONS as FACADE_SCHEMA_DESCRIPTIONS,
} from '../constants';

describe('content configuration', () => {
  it('preserves constants compatibility exports', () => {
    expect(FACADE_TEMPLATES).toEqual(CLINICAL_TEMPLATES);
    expect(FACADE_DIAGNOSIS_RULES).toBe(DIAGNOSIS_RULES);
    expect(FACADE_SCHEMA_DESCRIPTIONS).toEqual(SCHEMA_DESCRIPTIONS);
  });
});
