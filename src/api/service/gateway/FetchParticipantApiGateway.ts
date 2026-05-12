import type { ParticipantApiGateway, RawPayload } from './ParticipantApiGateway';

export class ParticipantApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ParticipantApiError';
  }
}

export class FetchParticipantApiGateway implements ParticipantApiGateway {
  constructor(private readonly baseUrl: string) {}

  fetchEvent(eventId: string): Promise<RawPayload> {
    return this.requestJson(`/api/public/votes/${encodeURIComponent(eventId)}/display`);
  }

  async fetchVotePost(params: { eventId: string; votePostId: string }): Promise<RawPayload> {
    const payload = await this.requestJson(`/api/public/votes/${encodeURIComponent(params.eventId)}/questions`);
    const questions = Array.isArray(payload) ? payload : payload.questions;
    if (!Array.isArray(questions)) return payload;

    const selected = questions.find((item) => {
      const record = toRecord(item);
      const question = toRecord(record?.question) ?? record;
      return String(question?.id ?? question?.questionId ?? question?.question_id ?? '') === params.votePostId;
    });

    if (!selected) {
      throw new ParticipantApiError('질문을 찾을 수 없습니다.', 404);
    }

    return toRecord(selected) ?? {};
  }

  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload> {
    return this.requestJson(`/api/public/questions/${encodeURIComponent(params.votePostId)}/tags`, {
      headers: sessionHeaders(params.sessionId),
    });
  }

  createTag(params: {
    votePostId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload> {
    return this.requestJson(`/api/public/questions/${encodeURIComponent(params.votePostId)}/tags`, {
      body: JSON.stringify({
        ...params.payload,
        questionId: numericPathId(params.votePostId),
      }),
      headers: {
        ...sessionHeaders(params.sessionId),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }

  private async requestJson(path: string, options: RequestInit = {}): Promise<RawPayload> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ParticipantApiError('서버 요청에 실패했습니다.', response.status);
    }

    if (response.status === 204) return {};
    return (await response.json()) as RawPayload;
  }
}

function sessionHeaders(sessionId: string): Record<string, string> {
  return sessionId.trim() ? { 'taglow-Session-Id': sessionId } : {};
}

function numericPathId(value: string): string | number {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : value;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
