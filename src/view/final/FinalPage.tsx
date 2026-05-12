import { Link, useParams } from 'react-router-dom';

export function FinalPage() {
  const { eventId = '1' } = useParams();

  return (
    <main className="mobileFrame pageStack completionPage">
      <header className="pageHeader">
        <p className="eyebrow">Taglow</p>
        <h1>참여가 완료되었습니다</h1>
        <p className="mutedText">소중한 의견이 이미지 위에 남겨졌습니다.</p>
      </header>

      <Link className="primaryButton" to={`/e/${eventId}`}>
        처음으로 돌아가기
      </Link>
    </main>
  );
}
