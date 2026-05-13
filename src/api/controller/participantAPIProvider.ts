import { ParticipantSessionStore } from '../../utils/localSessionStore';
import { FetchParticipantApiGateway } from '../service/gateway/FetchParticipantApiGateway';
import { ParticipantPayloadMapper } from '../service/mapper/ParticipantPayloadMapper';
import { GatewayParticipantAPI } from './GatewayParticipantAPI';

/**
 * 서버 주소 기본값이다.
 * 환경변수에 값이 있으면 그 주소를 먼저 사용한다.
 */
const apiBaseUrl = import.meta.env.VITE_TAGLOW_API_BASE_URL || 'https://vote.newdawnsoi.site';

/**
 * 로그인 없이 참여자를 구분하기 위한 세션 저장소이다.
 * 태그 조회와 생성 요청에서 같은 참여자인지 확인할 때 쓴다.
 */
export const participantSessionStore = new ParticipantSessionStore();

/**
 * 화면 hook이 실제로 호출하는 참여자 API 객체이다.
 * gateway는 서버 통신, mapper는 데이터 변환을 맡는다.
 */
export const participantController = new GatewayParticipantAPI({
  gateway: new FetchParticipantApiGateway(apiBaseUrl),
  mapper: new ParticipantPayloadMapper(),
});
  