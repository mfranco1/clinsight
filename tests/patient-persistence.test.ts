import { describe, expect, it } from 'vitest';
import { loadPersistedPatients, migratePersistedPatients } from '../services/patientPersistence';
import { legacyPatientCase, structuredPatientCase } from './fixtures/patient-cases';

describe('patient persistence boundary', () => {
  it('hydrates legacy records and assigns encounter IDs', () => {
    const [patient] = migratePersistedPatients([legacyPatientCase]);
    expect(patient.encounters).toHaveLength(1);
    expect(patient.entries[0].encounterId).toBe(patient.encounters?.[0].id);
  });

  it('preserves structured records and rejects malformed payloads', () => {
    expect(loadPersistedPatients(JSON.stringify([structuredPatientCase]))).toHaveLength(1);
    expect(loadPersistedPatients(JSON.stringify({ patients: [] }))).toEqual([]);
    expect(loadPersistedPatients('not-json')).toEqual([]);
  });
});
