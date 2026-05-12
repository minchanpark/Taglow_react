import { useParams } from 'react-router-dom';

import { useItemListController } from '../../api/controller/useItemListController';
import logoUrl from '../../assets/logo/taglow-logo.svg';
import { HomeQuestionCard } from './components/HomeQuestionCard';
import './ParticipantHomePage.css';

export function ParticipantHomePage() {
  const { eventId = '11' } = useParams();
  const { emptyItemsMessage, errorMessage, event, hrefForVotePost, isLoading, retry, retryActionLabel, votePosts } =
    useItemListController(eventId);

  return (
    <main className="mobileFrame homeScreen">
      <header className="homeHeader">
        <img className="homeLogo" src={logoUrl} alt="Taglow" />
        <h1 className="homeVoteTitle">{event?.voteTitle ?? 'Taglow'}</h1>
      </header>

      <section className="homeQuestionList" aria-label="질문 목록">
        {isLoading && <p className="homeStateMessage">질문을 불러오는 중입니다.</p>}
        {errorMessage && (
          <div className="homeStateMessage" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void retry()}>
              {retryActionLabel}
            </button>
          </div>
        )}
        {emptyItemsMessage && <p className="homeStateMessage">{emptyItemsMessage}</p>}
        {votePosts.map((votePost) => (
          <HomeQuestionCard href={hrefForVotePost(votePost.id)} key={votePost.id} votePost={votePost} />
        ))}
      </section>
    </main>
  );
}
