import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { VotePost } from '../../../api/model';

interface HomeQuestionCardProps {
  href: string;
  votePost: VotePost;
}

export function HomeQuestionCard({ href, votePost }: HomeQuestionCardProps) {
  return (
    <Link className="homeQuestionCard" to={href}>
      <span className="homeQuestionBody">
        <span className="homeQuestionTitle">{votePost.title}</span>
        <span className="homeQuestionDescription">{votePost.description}</span>
      </span>
      <span className="homeQuestionArrow" aria-hidden="true">
        <ChevronRight size={24} strokeWidth={2.5} />
      </span>
    </Link>
  );
}
