import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import './FinalPage.css';

export function FinalPage() {
  const { eventId = '11' } = useParams();

  return (
    <main className="finalScreen">
      <section className="finalCard" aria-labelledby="finalTitle">
        <div className="finalCheckMark" aria-hidden="true">
          <Check size={68} strokeWidth={1.7} />
        </div>
        <h1 id="finalTitle">감사합니다!</h1>
        <p>
          소중한 의견이
          <br />
          성공적으로 기록되었습니다.
        </p>
      </section>

      <Link className="finalHomeButton" to={`/e/${eventId}`}>
        처음으로 돌아가기
      </Link>
    </main>
  );
}
