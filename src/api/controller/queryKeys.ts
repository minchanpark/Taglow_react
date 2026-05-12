export const participantQueryKeys = {
  event: (eventId: string) => ['participant-event', eventId] as const,
  votePost: (eventId: string, votePostId: string) => ['participant-vote-post', eventId, votePostId] as const,
  tags: (votePostId: string, sessionId: string) => ['participant-tags', votePostId, sessionId] as const,
};
