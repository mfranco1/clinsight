import { PatientOrder, OrderStatus, MedicationOrder, MedicationStatus } from '../types';
import { getLocalDateString, createId } from '../utils';

export interface OrderFilters {
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
  encounterFilter?: string;
  startDate?: string;
  endDate?: string;
}

export interface MedFilters {
  searchQuery?: string;
  statusFilter?: string;
  encounterFilter?: string;
}

/**
 * Creates a baseline diagnostic PatientOrder with optional overrides.
 */
export const createDiagnosticOrder = (overrides?: Partial<PatientOrder>): PatientOrder => {
  return {
    id: createId('order'),
    name: '',
    dateOrdered: new Date().toISOString(),
    targetDate: new Date().toISOString(),
    status: OrderStatus.PENDING,
    notes: '',
    category: 'Other',
    ...overrides,
  };
};

/**
 * Creates a baseline MedicationOrder with optional overrides.
 */
export const createMedicationOrder = (overrides?: Partial<MedicationOrder>): MedicationOrder => {
  return {
    id: createId('med'),
    drug: '',
    dose: '',
    route: '',
    frequency: '',
    duration: '',
    status: MedicationStatus.ACTIVE,
    prescribedDate: new Date().toISOString(),
    prescribedBy: 'M. Franco, MD',
    notes: '',
    ...overrides,
  };
};

/**
 * Filters standard PatientOrder lists based on search, status, category (type), encounter, and target dates.
 */
export const filterOrders = (orders: PatientOrder[], filters: OrderFilters): PatientOrder[] => {
  const {
    searchQuery = '',
    statusFilter = 'ALL',
    typeFilter = 'ALL',
    encounterFilter = 'ALL',
    startDate = '',
    endDate = '',
  } = filters;
  const q = searchQuery.toLowerCase();

  return orders.filter(order => {
    const matchesSearch =
      order.name.toLowerCase().includes(q) || order.notes.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || order.category === typeFilter;
    const matchesEncounter = encounterFilter === 'ALL' || order.encounterId === encounterFilter;

    const orderDate = new Date(order.targetDate);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesEncounter &&
      matchesStartDate &&
      matchesEndDate
    );
  });
};

/**
 * Filters MedicationOrder lists based on search, status, and encounter.
 */
export const filterMedications = (medications: MedicationOrder[], filters: MedFilters): MedicationOrder[] => {
  const { searchQuery = '', statusFilter = 'ALL', encounterFilter = 'ALL' } = filters;
  const q = searchQuery.toLowerCase();

  return medications.filter(med => {
    const matchesSearch =
      med.drug.toLowerCase().includes(q) || (med.notes || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || med.status === statusFilter;
    const matchesEncounter = encounterFilter === 'ALL' || med.encounterId === encounterFilter;

    return matchesSearch && matchesStatus && matchesEncounter;
  });
};

/**
 * Groups patient orders by their local target date and returns them sorted descending.
 */
export const groupOrdersByTargetDate = (orders: PatientOrder[]): [string, PatientOrder[]][] => {
  const groups: { [key: string]: PatientOrder[] } = {};
  orders.forEach(order => {
    const dateKey = getLocalDateString(order.targetDate);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(order);
  });
  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );
};

/**
 * Dissolves singleton groups and pulls adjacent group members together.
 */
export const cleanupGroups = (allOrders: PatientOrder[]): PatientOrder[] => {
  // 1. Dissolve small groups (< 2)
  const groupCounts: { [key: string]: number } = {};
  allOrders.forEach(o => {
    if (o.groupId) {
      groupCounts[o.groupId] = (groupCounts[o.groupId] || 0) + 1;
    }
  });

  const cleaned = allOrders.map(o => {
    if (o.groupId && groupCounts[o.groupId] < 2) {
      const { groupId, ...rest } = o;
      return rest as PatientOrder;
    }
    return o;
  });

  // 2. Ensure Contiguity: Pull group members together if they've been separated
  const result: PatientOrder[] = [...cleaned];
  const processedGroups = new Set<string>();

  for (let i = 0; i < result.length; i++) {
    const gid = result[i].groupId;
    if (gid && !processedGroups.has(gid)) {
      const members = result.filter(o => o.groupId === gid);
      const firstIdx = result.findIndex(o => o.groupId === gid);

      // Remove all members of G
      const nonMembers = result.filter(o => o.groupId !== gid);

      // Clear result and re-insert at firstIdx
      result.length = 0;
      result.push(...nonMembers);
      result.splice(firstIdx, 0, ...members);

      processedGroups.add(gid);
    }
  }

  return result;
};

export interface BulkParseParams {
  inputText: string;
  defaultDate: string;
  defaultCategory: string;
  defaultStatus: OrderStatus;
}

/**
 * Parses raw input text into a list of PatientOrders.
 */
export const parseBulkOrdersText = (params: BulkParseParams): PatientOrder[] => {
  const { inputText, defaultDate, defaultCategory, defaultStatus } = params;
  if (!inputText.trim()) return [];

  const lines = inputText.split('\n');
  const rawOrders: PatientOrder[] = [];
  let currentCategory = defaultCategory;
  let currentGroupId: string | null = null;

  const markerPattern = /[\u2000-\u3300\ud83c\ud83d\ud83e\ud83f\u2700-\u27bf\[\]•]/;
  const splitPattern = /([\u2000-\u3300\ud83c\ud83d\ud83e\ud83f\u2700-\u27bf\[\]•]+)/g;

  lines.forEach(line => {
    const isIndented = line.startsWith('\t') || line.startsWith('>') || line.startsWith('  ');
    const trimmed = line.trim().replace(/^>\s*/, '');
    if (!trimmed) {
      currentGroupId = null;
      return;
    }
    if (
      !isIndented &&
      !markerPattern.test(trimmed) &&
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      !trimmed.includes(':') &&
      !trimmed.includes('-')
    ) {
      const normalized = trimmed.charAt(0) + trimmed.slice(1).toLowerCase();
      if (normalized.startsWith('Lab')) currentCategory = 'Lab';
      else if (normalized.startsWith('Imag')) currentCategory = 'Imaging';
      else if (normalized.startsWith('Med')) currentCategory = 'Medication';
      else if (normalized.startsWith('Proc')) currentCategory = 'Procedure';
      else if (normalized.startsWith('Paper')) currentCategory = 'Papers';
      else if (normalized.startsWith('Blood')) currentCategory = 'Blood';
      else currentCategory = normalized;
      currentGroupId = null;
      return;
    }
    let segments: string[] = [];
    if (markerPattern.test(trimmed)) {
      const parts = trimmed.split(splitPattern);
      const firstPart = parts[0].trim();
      let startIndex = 0;
      if (
        !isIndented &&
        firstPart &&
        firstPart === firstPart.toUpperCase() &&
        firstPart.length > 2
      ) {
        const normalized = firstPart.charAt(0) + firstPart.slice(1).toLowerCase();
        if (normalized.startsWith('Lab')) currentCategory = 'Lab';
        else if (normalized.startsWith('Imag')) currentCategory = 'Imaging';
        else if (normalized.startsWith('Med')) currentCategory = 'Medication';
        else if (normalized.startsWith('Proc')) currentCategory = 'Procedure';
        else if (normalized.startsWith('Paper')) currentCategory = 'Papers';
        else if (normalized.startsWith('Blood')) currentCategory = 'Blood';
        else currentCategory = normalized;
        startIndex = 1;
      }
      let currentSegment = '';
      for (let i = startIndex; i < parts.length; i++) {
        const part = parts[i];
        if (markerPattern.test(part)) {
          if (currentSegment.trim()) segments.push(currentSegment.trim());
          currentSegment = '';
        } else {
          currentSegment += part;
        }
      }
      if (currentSegment.trim()) segments.push(currentSegment.trim());
    } else {
      segments = [trimmed];
    }
    if (isIndented) {
      if (!currentGroupId) {
        currentGroupId = createId('group');
      }
    } else {
      currentGroupId = null;
    }
    segments.forEach(segment => {
      let name = segment
        .replace(/^[\s\u2000-\u3300\ud83c\ud83d\ud83e\ud83f\u2700-\u27bf\[\]\-\*•]+\s*/, '')
        .trim();
      if (!name) return;
      let targetDate = defaultDate;
      let targetTime = '00:00';
      const dateRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})/;
      const timeRegex = /(\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?)/;
      const timeMatch = name.match(timeRegex);
      if (timeMatch) {
        const rawTime = timeMatch[0];
        try {
          let [hStr, mStr] = rawTime.split(':');
          let h = parseInt(hStr);
          const m = parseInt(mStr.replace(/[^0-9]/g, ''));
          const isPM = rawTime.toLowerCase().includes('pm');
          const isAM = rawTime.toLowerCase().includes('am');
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;
          targetTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        } catch (e) {}
        name = name.replace(timeRegex, '').trim();
      }
      const dateMatch = name.match(dateRegex);
      if (dateMatch) {
        const dateStr = dateMatch[0];
        name = name.replace(dateRegex, '').trim();
        try {
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            const m = parts[0];
            const d = parts[1];
            const y = parts[2];
            const year = y ? (y.length === 2 ? `20${y}` : y) : new Date().getFullYear();
            targetDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else {
            targetDate = dateStr;
          }
        } catch (e) {
          targetDate = defaultDate;
        }
      }
      name = name.replace(/[-\s,/@]+$/, '').trim();
      rawOrders.push({
        id: createId('order'),
        name,
        dateOrdered: new Date().toISOString(),
        targetDate: new Date(`${targetDate}T${targetTime}:00`).toISOString(),
        status: defaultStatus,
        notes: '',
        category: currentCategory as any,
        groupId: currentGroupId || undefined,
      });
    });
  });
  const groupCounts: { [key: string]: number } = {};
  rawOrders.forEach(o => {
    if (o.groupId) groupCounts[o.groupId] = (groupCounts[o.groupId] || 0) + 1;
  });
  return rawOrders.map(o => {
    if (o.groupId && groupCounts[o.groupId] === 1) return { ...o, groupId: undefined };
    return o;
  });
};
