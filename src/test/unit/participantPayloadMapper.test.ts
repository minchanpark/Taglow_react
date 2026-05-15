import { describe, expect, it } from 'vitest';

import { createTagCoordinate, isParticipantEventEnded } from '../../api/model';
import { ParticipantPayloadMapper } from '../../api/service/mapper/ParticipantPayloadMapper';

describe('ParticipantPayloadMapper', () => {
  const mapper = new ParticipantPayloadMapper();

  it('maps live display payload aliases to domain event and vote posts', () => {
    const event = mapper.eventFromPayload({
      voteId: 11,
      voteName: 'Test',
      status: 'PROGRESS',
      questions: [
        {
          question: {
            id: 31,
            title: 'Asia',
            detail: 'Pick a country',
            imageUrl: 'https://example.com/image.jpg',
            imageRatio: 7353,
          },
          tags: [{ id: 1 }, { id: 2 }],
        },
      ],
    });

    expect(event.id).toBe('11');
    expect(event.voteTitle).toBe('Test');
    expect(isParticipantEventEnded(event)).toBe(false);
    expect(event.votePosts[0]).toMatchObject({
      id: '31',
      description: 'Pick a country',
      imageRatio: 0.7353,
      imageUrl: 'https://example.com/image.jpg',
      tagCount: 2,
      title: 'Asia',
    });
  });

  it('detects ended participant events from normalized status text', () => {
    expect(isParticipantEventEnded({ status: 'END' })).toBe(true);
    expect(isParticipantEventEnded({ status: ' end ' })).toBe(true);
    expect(isParticipantEventEnded({ status: 'PROGRESS' })).toBe(false);
  });

  it('maps tag coordinate aliases and create request payloads', () => {
    expect(
      mapper.tagFromPayload(
        {
          id: 113,
          questionId: 31,
          type: 'TEXT',
          data: 'hello',
          locationX: 1.2,
          locationY: -0.2,
          isMine: true,
        },
        { sessionId: 'session-1', votePostId: '31' },
      ),
    ).toMatchObject({
      coordinate: createTagCoordinate(1, 0),
      id: '113',
      isMine: true,
      text: 'hello',
      type: 'text',
    });

    expect(
      mapper.createTagRequestToPayload({
        coordinate: createTagCoordinate(0.25, 0.75),
        text: 'hello',
        type: 'text',
      }),
    ).toEqual({
      data: 'hello',
      duration: 0,
      locationX: 0.25,
      locationY: 0.75,
      type: 'TEXT',
    });
  });

  it('maps tag updates and reward entries to server payloads', () => {
    expect(mapper.coordinateToPayload(createTagCoordinate(1.2, -0.2))).toEqual({
      locationX: 1,
      locationY: 0,
    });

    expect(
      mapper.finalEntryToPayload({
        name: '  Test Participant  ',
        phone: '  0000000000  ',
        privacyConsent: true,
      }),
    ).toEqual({
      name: 'Test Participant',
      phone: '0000000000',
      privacyConsent: true,
    });
  });
});
