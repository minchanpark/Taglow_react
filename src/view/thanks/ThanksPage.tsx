import { Link, useParams } from 'react-router-dom';

export function ThanksPage() {
  const { eventId = '1' } = useParams();

  return (
    <main className="mobileFrame pageStack">
      <header className="pageHeader">
        <p className="eyebrow">Taglow</p>
        <h1>참여해주셔서 감사합니다</h1>
        <p className="mutedText">리워드 연락처 입력은 선택 사항입니다. 태그 참여는 이미 완료할 수 있습니다.</p>
      </header>

      <form className="formStack">
        <label>
          이름
          <input autoComplete="name" placeholder="이름" type="text" />
        </label>
        <label>
          연락처
          <input autoComplete="tel" inputMode="tel" placeholder="010-0000-0000" type="tel" />
        </label>
        <label className="checkboxRow">
          <input type="checkbox" />
          개인정보 수집에 동의합니다.
        </label>
      </form>

      <div className="actionRow">
        <Link className="secondaryButton" to={`/e/${eventId}/final`}>
          건너뛰기
        </Link>
        <Link className="primaryButton" to={`/e/${eventId}/final`}>
          제출
        </Link>
      </div>
    </main>
  );
}
