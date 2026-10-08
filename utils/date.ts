export const calculateAge = (
  dobString: string | undefined | null,
): number | undefined => {
  if (
    !dobString ||
    dobString.toLowerCase() === "not recorded" ||
    dobString.toLowerCase() === "unknown"
  )
    return undefined;
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return undefined;
  }
};

export const getTodayDate = (): string => {
  try {
    return new Date().toLocaleDateString("en-CA");
  } catch (e) {
    const date = new Date();
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
};

/**
 * Returns current time in 24-hour style HH:MM in the user's local timezone (en-GB).
 */
export const getCurrentTime24 = (): string => {
  try {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    const date = new Date();
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
};

/**
 * Returns an object with the current local date and 24-hour time parts.
 */
export const getLocalDateTimeParts = (): { date: string; time: string } => {
  return {
    date: getTodayDate(),
    time: getCurrentTime24(),
  };
};

/**
 * Normalizes any string/Date input into a YYYY-MM-DD string in user's local timezone.
 */
export const normalizeDateInput = (
  val: string | Date | null | undefined,
): string => {
  if (!val) return "";
  const date = typeof val === "string" ? new Date(val) : val;
  if (isNaN(date.getTime())) {
    if (typeof val === "string") {
      return val.split("T")[0].split(" ")[0];
    }
    return "";
  }
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getLocalDateString = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString.split("T")[0];
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
 */
export const getTodayLocalDateString = (): string => {
  return getTodayDate();
};
