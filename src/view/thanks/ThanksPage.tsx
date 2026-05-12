import { ChevronLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import logoUrl from '../../assets/logo/taglow-logo.svg';
import './ThanksPage.css';

export function ThanksPage() {
  const { eventId = '11' } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const canSubmit = Boolean(name.trim() && phone.replace(/[^0-9]/g, '').length >= 8 && privacyConsent);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    navigate(`/e/${eventId}/final`);
  }

  return (
    <main className="mobileFrame thanksScreen">
      <header className="thanksTopBar">
        <button className="thanksBackButton" type="button" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} strokeWidth={2.5} />
          이전
        </button>
      </header>

      <div className="thanksBrandRow">
        <img className="thanksLogo" src={logoUrl} alt="Taglow" />
        <Link className="thanksSkipLink" to={`/e/${eventId}/final`}>
          건너뛰기
        </Link>
      </div>

      <section className="thanksIntro" aria-labelledby="thanksTitle">
        <h1 id="thanksTitle">조금만 더 부탁드려요!</h1>
        <p>
          성함과 전화번호를 남겨주시면 추첨을 통해
          <br />
          <strong>빽다방 기프티콘</strong>을 드립니다.
        </p>
      </section>

      <form className="thanksForm" onSubmit={handleSubmit}>
        <label className="thanksField">
          <span>이름</span>
          <input
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="홍길동"
            type="text"
            value={name}
          />
        </label>

        <label className="thanksField">
          <span>전화번호</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010-0000-0000"
            type="tel"
            value={phone}
          />
        </label>

        <label className="thanksConsent">
          <input
            checked={privacyConsent}
            onChange={(event) => setPrivacyConsent(event.target.checked)}
            type="checkbox"
          />
          <span>개인정보 수집 및 리워드 안내에 동의합니다.</span>
        </label>

        <button className="thanksSubmitButton" disabled={!canSubmit} type="submit">
          제출하기
        </button>
      </form>
    </main>
  );
}
