/**
 * 이벤트 화면과 완료 화면에서 표시할 문구 묶음이다.
 * ParticipantEvent.displayContent에 포함되어 View가 서버 DTO alias를 몰라도 되게 한다.
 */
export interface ParticipantEventDisplayContent {
  headline?: string;
  description?: string;
  rewardDescription?: string;
  finalMessage?: string;
}
