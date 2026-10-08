import { SubNote } from "../../types";

export interface ThreadSubNotePair {
  userSub?: SubNote;
  assistantSub?: SubNote;
}

export function pairThreadSubNotes(subNotes: SubNote[]): ThreadSubNotePair[] {
  const pairs: ThreadSubNotePair[] = [];

  for (let index = 0; index < subNotes.length; index++) {
    const subNote = subNotes[index];

    if (!subNote.isAssistant) {
      const nextSubNote = subNotes[index + 1];
      if (nextSubNote?.isAssistant) {
        pairs.push({ userSub: subNote, assistantSub: nextSubNote });
        index++;
      } else {
        pairs.push({ userSub: subNote });
      }
      continue;
    }

    const previousPair = pairs[pairs.length - 1];
    if (previousPair?.userSub && !previousPair.assistantSub) {
      previousPair.assistantSub = subNote;
    } else {
      pairs.push({ assistantSub: subNote });
    }
  }

  return pairs;
}
