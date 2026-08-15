import React from 'react';
import { ErrorPage } from './ErrorPage';

export const NotFoundPage: React.FC = () => {
  return <ErrorPage code={404} />;
};
