import { createBrowserRouter, Navigate } from 'react-router-dom';

import { TaggingDetailPage } from '../view/detail/TaggingDetailPage';
import { FinalPage } from '../view/final/FinalPage';
import { ParticipantHomePage } from '../view/home/ParticipantHomePage';
import { ThanksPage } from '../view/thanks/ThanksPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/e/11" replace />,
  },
  {
    path: '/e/:eventId',
    element: <ParticipantHomePage />,
  },
  {
    path: '/e/:eventId/posts/:votePostId',
    element: <TaggingDetailPage />,
  },
  {
    path: '/e/:eventId/thanks',
    element: <ThanksPage />,
  },
  {
    path: '/e/:eventId/final',
    element: <FinalPage />,
  },
  {
    path: '*',
    element: <Navigate to="/e/11" replace />,
  },
]);
