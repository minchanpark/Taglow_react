import { describe, expect, it, vi } from 'vitest';

import { createTagCoordinate } from '../../api/model';
import { GatewayParticipantController } from '../../api/controller/GatewayParticipantAPI';
import type { ParticipantApiGateway } from '../../api/service/gateway/ParticipantApiGateway';
import { ParticipantPayloadMapper } from '../../api/service/mapper/ParticipantPayloadMapper';

describe('GatewayParticipantController', () => {
  it('selects a question from the display payload without a questions endpoint call', async () => {
    const gateway = {
      fetchEvent: vi.fn().mockResolvedValue({
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
          },
        ],
      }),
    } as unknown as ParticipantApiGateway;
    const controller = new GatewayParticipantController({
      gateway,
      mapper: new ParticipantPayloadMapper(),
    });

    await expect(controller.fetchVotePost({ eventId: '11', votePostId: '31' })).resolves.toMatchObject({
      id: '31',
      imageRatio: 0.7353,
      title: 'Asia',
    });
    expect(gateway.fetchEvent).toHaveBeenCalledWith('11');
  });

  it('marks a newly created tag as mine for the current session', async () => {
    const gateway = {
      createTag: vi.fn().mockResolvedValue({
        id: 123,
        questionId: 31,
        type: 'TEXT',
        data: 'hello',
        locationX: 0.25,
        locationY: 0.75,
        isMine: false,
        canDelete: false,
      }),
    } as unknown as ParticipantApiGateway;
    const controller = new GatewayParticipantController({
      gateway,
      mapper: new ParticipantPayloadMapper(),
    });

    await expect(
      controller.createTag({
        request: {
          coordinate: createTagCoordinate(0.25, 0.75),
          text: 'hello',
          type: 'text',
        },
        sessionId: 'session-1',
        votePostId: '31',
      }),
    ).resolves.toMatchObject({
      canDelete: true,
      id: '123',
      isMine: true,
      text: 'hello',
    });
  });

  it('submits final reward entries through the mapper and gateway', async () => {
    const gateway = {
      submitFinalEntry: vi.fn().mockResolvedValue(undefined),
    } as unknown as ParticipantApiGateway;
    const controller = new GatewayParticipantController({
      gateway,
      mapper: new ParticipantPayloadMapper(),
    });

    await controller.submitFinalEntry({
      name: '  Test Participant  ',
      phone: '  0000000000  ',
      privacyConsent: true,
    });

    expect(gateway.submitFinalEntry).toHaveBeenCalledWith({
      payload: {
        name: 'Test Participant',
        phone: '0000000000',
        privacyConsent: true,
      },
    });
  });
});
