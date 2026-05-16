import type { ParticipantApiGateway, RawPayload } from './ParticipantApiGateway';

/**
 * 서버 요청이 실패했을 때 쓰는 에러이다.
 * HTTP 상태 코드를 같이 들고 있어 디버깅에 도움이 된다.
 */
export class ParticipantApiError extends Error {
  /**
   * 에러 메시지와 HTTP 상태 코드를 저장한다.
   * requestJson에서 응답이 실패했을 때 만들어진다.
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
 * fetch로 실제 서버 API를 호출하는 클래스이다.
 * URL, header, method 같은 통신 규칙을 여기서 관리한다.
 */
export class FetchParticipantApiGateway implements ParticipantApiGateway {
  /**
   * 서버 기본 주소를 받는다.
   * 모든 요청 URL 앞에 이 주소가 붙는다.
   */
  constructor(private readonly baseUrl: string) {}

  /**
   * eventId에 해당하는 이벤트 정보를 가져온다.
   * 서버에서는 이 값이 voteId처럼 쓰인다.
   */
  fetchEvent(eventId: string): Promise<RawPayload> {
    return this.requestJson(`/api/public/votes/${encodeURIComponent(eventId)}/display`);
  }

  /**
   * 질문 하나에 달린 태그 목록을 가져온다.
   * sessionId는 header에 넣어 현재 참여자를 알려준다.
   */
  fetchTags(params: { votePostId: string; sessionId: string }): Promise<RawPayload> {
    return this.requestJson(`/api/public/questions/${encodeURIComponent(params.votePostId)}/tags`, {
      headers: sessionHeaders(params.sessionId),
    });
  }

  /**
   * 새 태그를 JSON으로 서버에 보낸다.
   * body에는 서버가 필요한 questionId도 같이 넣는다.
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
   * 서버에 저장된 태그를 수정한다.
   * PATCH body가 있으므로 JSON Content-Type을 붙인다.
   */
  updateTag(params: {
    tagId: string;
    sessionId: string;
    payload: Record<string, unknown>;
  }): Promise<RawPayload> {
    return this.requestJson(`/api/public/tags/${encodeURIComponent(params.tagId)}`, {
      body: JSON.stringify(params.payload),
      headers: {
        ...sessionHeaders(params.sessionId),
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
  }

  /**
   * 서버에 저장된 태그를 삭제한다.
   * body 없는 DELETE라 Content-Type은 붙이지 않는다.
   */
  async deleteTag(params: { tagId: string; sessionId: string }): Promise<void> {
    await this.requestJson(`/api/public/tags/${encodeURIComponent(params.tagId)}`, {
      headers: sessionHeaders(params.sessionId),
      method: 'DELETE',
    });
  }

  /**
   * 리워드 신청 개인정보를 서버에 제출한다.
   * 개인정보 응답은 클라이언트 domain 상태에 보관하지 않는다.
   */
  async submitFinalEntry(params: { payload: Record<string, unknown> }): Promise<void> {
    await this.requestJson('/api/public/event-users', {
      body: JSON.stringify(params.payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }

  /**
   * fetch 호출을 공통으로 처리한다.
   * 성공하면 JSON을 돌려주고, 실패하면 ParticipantApiError를 던진다.
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
    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text) as RawPayload;
  }
}

/**
 * sessionId가 있으면 서버에 보낼 세션 header를 만든다.
 * 태그 조회와 생성 요청에서 사용한다.
 */
function sessionHeaders(sessionId: string): Record<string, string> {
  return sessionId.trim() ? { 'taglow-Session-Id': sessionId } : {};
}

/**
 * 숫자로 보이는 id 문자열은 숫자로 바꾼다.
 * 태그 생성 body의 questionId를 만들 때 사용한다.
 */
function numericPathId(value: string): string | number {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : value;
}
