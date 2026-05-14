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

  it('adds JSON and session headers when updating a tag', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1 }));
    const gateway = new FetchParticipantApiGateway('https://vote.newdawnsoi.site');

    await gateway.updateTag({
      payload: {
        locationX: 0.4,
        locationY: 0.6,
      },
      sessionId: 'session-1',
      tagId: '99',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://vote.newdawnsoi.site/api/public/tags/99',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'taglow-Session-Id': 'session-1',
        },
        method: 'PATCH',
      }),
    );
  });

  it('does not add Content-Type when deleting a tag', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(emptyResponse());
    const gateway = new FetchParticipantApiGateway('https://vote.newdawnsoi.site');

    await gateway.deleteTag({ sessionId: 'session-1', tagId: '99' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://vote.newdawnsoi.site/api/public/tags/99',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'taglow-Session-Id': 'session-1',
        },
        method: 'DELETE',
      }),
    );
  });

  it('submits reward entries to the real public event-users endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1 }));
    const gateway = new FetchParticipantApiGateway('https://vote.newdawnsoi.site');

    await gateway.submitFinalEntry({
      payload: {
        name: 'Test Participant',
        phone: '0000000000',
        privacyConsent: true,
      },
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(fetchMock).toHaveBeenCalledWith(
      'https://vote.newdawnsoi.site/api/public/event-users',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );
    expect(Object.keys(JSON.parse(String(requestInit?.body))).sort()).toEqual(['name', 'phone', 'privacyConsent']);
  });
});

function jsonResponse(payload: unknown): Response {
  const text = JSON.stringify(payload);
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(text),
  } as Response;
}

function emptyResponse(): Response {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
  } as Response;
}
