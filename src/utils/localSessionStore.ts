import { safeReadLocalStorage, safeRemoveLocalStorage, safeWriteLocalStorage } from './localSessionStorage';

export const participantSessionStorageKey = 'taglow.participant.sessionId.v1';

export class ParticipantSessionStore {
  private sessionId?: string;

  getOrCreateSessionId(): string {
    if (this.sessionId?.trim()) return this.sessionId;

    const stored = safeReadLocalStorage(participantSessionStorageKey);
    if (stored?.trim()) {
      this.sessionId = stored;
      return stored;
    }

    const generated = createSessionId();
    this.sessionId = generated;
    safeWriteLocalStorage(participantSessionStorageKey, generated);
    return generated;
  }

  resetSessionId(): void {
    this.sessionId = undefined;
    safeRemoveLocalStorage(participantSessionStorageKey);
  }
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

