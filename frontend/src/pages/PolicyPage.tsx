import React from 'react';
import { Link } from 'react-router-dom';

type PolicyKind = 'privacy' | 'terms' | 'medical' | 'deletion';

const content: Record<PolicyKind, { title: string; paragraphs: string[] }> = {
  privacy: { title: 'Privacy Policy', paragraphs: [
    'LisanHealth is an educational laboratory-report explainer. Upload only information necessary for explanation and remove names, addresses, record numbers, and other identifiers whenever possible.',
    'Reports may be processed by configured AI providers to perform extraction, reasoning, localization, and speech synthesis. Do not upload information unless you consent to this processing.',
    'Authenticated users may request deletion of saved report history. Production operators must configure retention, backups, and deletion procedures before launch.',
  ] },
  terms: { title: 'Terms of Use', paragraphs: [
    'You use LisanHealth at your own risk and must not treat its output as a diagnosis, prescription, emergency service, or replacement for a qualified clinician.',
    'You are responsible for obtaining permission before uploading another person’s report and for protecting your account credentials.',
    'Commercial launch requires completion of privacy, clinical, security, and regulatory review appropriate to the deployment jurisdiction.',
  ] },
  medical: { title: 'Medical Safety Notice', paragraphs: [
    'LisanHealth explains laboratory terminology and reported reference-range flags for education only. An out-of-range result does not establish a diagnosis.',
    'Never delay urgent medical care because of this application. Discuss results, symptoms, and follow-up questions with a qualified healthcare professional.',
    'The application does not prescribe medication, recommend treatment changes, or provide individualized herbal or traditional-remedy advice.',
  ] },
  deletion: { title: 'Data Deletion Request', paragraphs: [
    'To request deletion of saved report history, sign in and use the delete action in History, or contact the deployment operator with the account email.',
    'Deletion must be implemented across the primary database, backups, generated audio, logs, and configured AI-provider retention according to the production retention policy.',
    'This page is an application workflow notice and is not legal advice. Operators must publish a jurisdiction-appropriate data-protection process before launch.',
  ] },
};

export const PolicyPage: React.FC<{ kind: PolicyKind }> = ({ kind }) => {
  const policy = content[kind];
  return <main className="container policy-page"><p><Link to="/">← Back to LisanHealth</Link></p><h1>{policy.title}</h1>{policy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</main>;
};
