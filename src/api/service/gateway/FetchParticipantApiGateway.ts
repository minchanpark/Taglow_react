import type { ParticipantApiGateway, RawPayload } from './ParticipantApiGateway';

/**
 * 서버 요청 실패를 status와 함께 controller/query 경계로 전달하는 error이다.
 * FetchParticipantApiGateway.requestJson이 생성하고 query hook의 error state로 이어진다.
 */
export class ParticipantApiError extends Error {
  /**
   * 사용자용 message와 HTTP status를 함께 보존한다.
   * requestJson의 response.ok 검사에서 사용된다.
   */
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ParticipantApiError';
  }
}

/**
 * fetch 기반 ParticipantApiGateway 구현체이다.
 * endpoint/path/header 정책을 소유하고 raw payload만 GatewayParticipantController에 반환한다.
 */
export class FetchParticipantApiGateway implements ParticipantApiGateway {
  /**
   * 서버 origin을 주입받아 모든 public API 요청의 base URL로 사용한다.
   * participantControllerProvider가 환경변수 기반 값을 전달한다.
   */
  constructor(private readonly baseUrl: string) {}

  /**
   * eventId를 backend voteId path로 사용해 display payload를 가져온다.
   * GatewayParticipantController.fetchEvent가 이 결과를 mapper.eventFromPayload로 넘긴다.
   */
  fetchEvent(eventId: string): Promise<RawPayload> {
    return this.requestJson(`/api/public/votes/${encodeURIComponent(eventId)}/display`);
  }

  /**
   * eventId의 questions endpoint에서 votePostId/questionId에 맞는 항목을 선택한다.
   * 선택된 raw payload는 mapper.votePostDetailFromPayload에서 VotePost로 변환된다.
   */
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

  /**
   * votePostId를 backend questionId path로 사용해 태그 payload를 가져온다.
   * sessionHeaders가 만든 taglow-Session-Id는 mapper의 ownership 판단과 짝을 이룬다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload> {
    return this.requestJson(`/api/public/questions/${encodeURIComponent(params.votePostId)}/tags`, {
      headers: sessionHeaders(params.sessionId),
    });
  }

  /**
   * 태그 생성 body를 JSON POST로 전송하고 생성된 raw tag payload를 반환한다.
   * mapper.createTagRequestToPayload가 만든 payload에 backend questionId를 추가한다.
   */
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

  /**
   * 공통 fetch 실행, Accept header, error 변환, JSON 파싱을 담당한다.
   * fetchEvent/fetchVotePost/fetchTags/createTag가 모두 이 메소드를 통해 서버를 호출한다.
   */
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

/**
 * 세션 id가 있을 때만 taglow-Session-Id header를 만든다.
 * fetchTags/createTag가 사용하고 session id는 participantSessionStore에서 공급된다.
 */
function sessionHeaders(sessionId: string): Record<string, string> {
  return sessionId.trim() ? { 'taglow-Session-Id': sessionId } : {};
}

/**
 * route id 문자열을 서버 body에 맞게 정수 가능 값으로 바꾼다.
 * createTag가 questionId body field를 채울 때 사용한다.
 */
function numericPathId(value: string): string | number {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : value;
}

/**
 * unknown payload를 plain record로 좁히는 gateway-local helper이다.
 * fetchVotePost가 nested question payload를 안전하게 탐색할 때 사용한다.
 */
function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
