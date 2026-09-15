import { useCallback, useState, type SetStateAction } from 'react';
import { MedicalChartResponse } from '../types';

export interface PatientStore {
  patients: MedicalChartResponse[];
  setPatients: (next: SetStateAction<MedicalChartResponse[]>) => void;
  addPatient: (patient: MedicalChartResponse) => void;
  addPatients: (patients: MedicalChartResponse[]) => void;
  updatePatient: (patientId: string, update: (patient: MedicalChartResponse) => MedicalChartResponse) => void;
  removePatient: (patientId: string) => void;
}

export const usePatientStore = (
  initialPatients: () => MedicalChartResponse[]
): PatientStore => {
  const [patients, setPatients] = useState<MedicalChartResponse[]>(initialPatients);

  const addPatient = useCallback((patient: MedicalChartResponse) => {
    setPatients((current) => [patient, ...current]);
  }, []);

  const addPatients = useCallback((nextPatients: MedicalChartResponse[]) => {
    setPatients((current) => [...nextPatients, ...current]);
  }, []);

  const updatePatient = useCallback((patientId: string, update: (patient: MedicalChartResponse) => MedicalChartResponse) => {
    setPatients((current) => current.map((patient) => patient.id === patientId ? update(patient) : patient));
  }, []);

  const removePatient = useCallback((patientId: string) => {
    setPatients((current) => current.filter((patient) => patient.id !== patientId));
  }, []);

  return { patients, setPatients, addPatient, addPatients, updatePatient, removePatient };
};
