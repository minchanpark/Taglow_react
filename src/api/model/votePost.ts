/**
 * 사용자가 태그를 남길 질문 정보이다.
 * 홈 카드와 상세 화면에서 같이 사용한다.
 */
export interface Question {
  id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageRatio?: number;
  thumbnailUrl?: string;
  altText?: string;
  visualKey: string;
  tagCount: number;
  sortOrder: number;
}

export type VotePost = Question;

/**
 * 상세 화면에 이미지를 보여줄 수 있는지 확인한다.
 * imageUrl과 imageRatio가 둘 다 있어야 true이다.
 */
export function hasImageDetail(question: Question): boolean {
  return Boolean(question.imageUrl?.trim() && question.imageRatio && question.imageRatio > 0);
}
