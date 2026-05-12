import { describe, expect, it, vi } from 'vitest';

import { createTagCoordinate } from '../../api/model';
import { GatewayParticipantService } from '../../api/service/GatewayParticipantService';
import type { ParticipantApiGateway } from '../../api/service/gateway/ParticipantApiGateway';
import { ParticipantPayloadMapper } from '../../api/service/mapper/ParticipantPayloadMapper';

describe('GatewayParticipantService', () => {
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
    const service = new GatewayParticipantService({
      gateway,
      mapper: new ParticipantPayloadMapper(),
    });

    await expect(
      service.createTag({
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
});
