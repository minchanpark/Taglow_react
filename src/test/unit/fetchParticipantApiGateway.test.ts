import { afterEach, describe, expect, it, vi } from 'vitest';

import { FetchParticipantApiGateway } from '../../api/service/gateway/FetchParticipantApiGateway';

describe('FetchParticipantApiGateway', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not add Content-Type to bodyless GET requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ voteId: 11 }));
    const gateway = new FetchParticipantApiGateway('https://vote.newdawnsoi.site');

    await gateway.fetchEvent('11');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://vote.newdawnsoi.site/api/public/votes/11/display',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('adds session and JSON headers when creating a tag', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1 }));
    const gateway = new FetchParticipantApiGateway('https://vote.newdawnsoi.site');

    await gateway.createTag({
      payload: {
        data: 'hello',
        duration: 0,
        locationX: 0.2,
        locationY: 0.8,
        type: 'TEXT',
      },
      sessionId: 'session-1',
      votePostId: '31',
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit).toMatchObject({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'taglow-Session-Id': 'session-1',
      },
      method: 'POST',
    });
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      data: 'hello',
      duration: 0,
      locationX: 0.2,
      locationY: 0.8,
      questionId: 31,
      type: 'TEXT',
    });
  });
});

function jsonResponse(payload: unknown): Response {
  return {
    json: () => Promise.resolve(payload),
    ok: true,
    status: 200,
  } as Response;
}
