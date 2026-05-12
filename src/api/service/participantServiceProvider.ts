import { ParticipantSessionStore } from '../../utils/localSessionStore';
import { FetchParticipantApiGateway } from './gateway/FetchParticipantApiGateway';
import { GatewayParticipantService } from './GatewayParticipantService';
import { ParticipantPayloadMapper } from './mapper/ParticipantPayloadMapper';

const apiBaseUrl = import.meta.env.VITE_TAGLOW_API_BASE_URL || 'https://vote.newdawnsoi.site';

export const participantSessionStore = new ParticipantSessionStore();

export const participantService = new GatewayParticipantService({
  gateway: new FetchParticipantApiGateway(apiBaseUrl),
  mapper: new ParticipantPayloadMapper(),
});
