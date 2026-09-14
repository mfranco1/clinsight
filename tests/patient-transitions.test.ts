import { describe, expect, it } from 'vitest';
import { prependEntry, removeEntry, updateEntry, updateEntrySoap } from '../domain/patientTransitions';
import { structuredPatientCase } from './fixtures/patient-cases';

describe('patient entry transitions', () => {
  it('updates entries immutably and preserves unrelated patient data', () => {
    const entry = structuredPatientCase.entries[0];
    const updated = updateEntry(structuredPatientCase, entry.id, { ...entry, title: 'Updated' });

    expect(updated).not.toBe(structuredPatientCase);
    expect(updated.entries).not.toBe(structuredPatientCase.entries);
    expect(updated.patientInfo).toBe(structuredPatientCase.patientInfo);
    expect(updated.entries[0].title).toBe('Updated');
  });

  it('supports prepend, soap updates, and removal', () => {
    const entry = structuredPatientCase.entries[0];
    const prepended = prependEntry(structuredPatientCase, { ...entry, id: 'new-entry' });
    const withSoap = updateEntrySoap(prepended, entry.id, entry.soap!);

    expect(withSoap.entries[0].id).toBe('new-entry');
    expect(removeEntry(withSoap, entry.id).entries).toHaveLength(1);
  });
});
