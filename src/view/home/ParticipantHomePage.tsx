import { Link, useParams } from 'react-router-dom';

export function ParticipantHomePage() {
  const { eventId = '1' } = useParams();

  return (
    <main className="mobileFrame pageStack">
      <header className="pageHeader">
        <p className="eyebrow">Taglow</p>
        <h1>참여할 항목을 선택해주세요</h1>
        <p className="mutedText">이벤트 {eventId}의 이미지 태깅 화면으로 이동할 준비가 되었습니다.</p>
      </header>

      <section className="listStack" aria-label="태깅 항목">
        <Link className="itemCard" to={`/e/${eventId}/posts/31`}>
          <span className="itemCardTitle">샘플 질문 이미지</span>
          <span className="itemCardText">API 연동 전까지 라우팅과 앱 shell을 확인하기 위한 기본 항목입니다.</span>
        </Link>
      </section>
    </main>
  );
}
