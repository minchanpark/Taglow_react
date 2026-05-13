import { ParticipantSessionStore } from '../../utils/localSessionStore';
import { FetchParticipantApiGateway } from '../service/gateway/FetchParticipantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import { GatewayParticipantController } from './GatewayParticipantController';

const apiBaseUrl = import.meta.env.VITE_TAGLOW_API_BASE_URL || 'https://vote.newdawnsoi.site';

export const participantSessionStore = new ParticipantSessionStore();

export const participantController = new GatewayParticipantController({
  gateway: new FetchParticipantApiGateway(apiBaseUrl),
  mapper: new ParticipantPayloadMapper(),
});
