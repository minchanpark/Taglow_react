import { ParticipantSessionStore } from '../../utils/localSessionStore';
import { FetchParticipantApiGateway } from '../service/gateway/FetchParticipantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import { GatewayParticipantController } from './GatewayParticipantAPI';

/**
 * OpenAPI gateway가 사용할 기본 서버 origin이다.
 * FetchParticipantApiGateway 생성자에 전달되어 모든 endpoint 요청의 baseUrl이 된다.
 */
const apiBaseUrl = import.meta.env.VITE_TAGLOW_API_BASE_URL || 'https://vote.newdawnsoi.site';

/**
 * 익명 참여 세션 id를 query hook에 제공하는 singleton이다.
 * useTaggingDetailQuery가 태그 조회/생성 시 gateway session header의 근거로 사용한다.
 */
export const participantSessionStore = new ParticipantSessionStore();

/**
 * query hook이 호출하는 실제 domain API controller singleton이다.
 * GatewayParticipantController에 FetchParticipantApiGateway와 ParticipantPayloadMapper를 주입한다.
 */
export const participantController = new GatewayParticipantController({
  gateway: new FetchParticipantApiGateway(apiBaseUrl),
  mapper: new ParticipantPayloadMapper(),
});
