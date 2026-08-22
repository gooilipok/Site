import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LegalDocumentViewer } from '../components/LegalDocumentViewer';

export const AgreementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docParam = searchParams.get('doc') || 'terms';
  const validatedDoc: 'terms' | 'privacy' | 'consent' = 
    docParam === 'privacy' ? 'privacy' : 
    docParam === 'consent' ? 'consent' : 'terms';

  return <LegalDocumentViewer docType={validatedDoc} />;
};

