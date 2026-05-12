import { Link, useParams } from 'react-router-dom';

export function TaggingDetailPage() {
  const { eventId = '1', votePostId = '31' } = useParams();

  return (
    <main className="mobileFrame detailPage">
      <header className="detailTopBar">
        <Link className="textButton" to={`/e/${eventId}`}>
          이전
        </Link>
        <div>
          <p className="eyebrow">Post {votePostId}</p>
          <h1>이미지 태깅</h1>
        </div>
        <Link className="textButton" to={`/e/${eventId}/thanks`}>
          완료
        </Link>
      </header>

      <section className="imageStage" aria-label="태깅 이미지">
        <div className="imageFallback">
          <p>이미지 영역</p>
          <span>다음 단계에서 DOM img, overlay, drag/drop을 연결합니다.</span>
        </div>
      </section>

      <form className="bottomInputBar">
        <label className="srOnly" htmlFor="tagText">
          태그 입력
        </label>
        <input id="tagText" maxLength={100} placeholder="짧은 태그를 입력하세요" type="text" />
        <button type="button">등록</button>
      </form>
    </main>
  );
}
