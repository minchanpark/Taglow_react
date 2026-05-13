/**
 * 화면에 보여줄 문구들을 모아둔 값이다.
 * 홈, 리워드, 완료 화면에서 필요한 문구가 들어간다.
 */
export interface ParticipantEventDisplayContent {
  headline?: string;
  description?: string;
  rewardDescription?: string;
  finalMessage?: string;
}
