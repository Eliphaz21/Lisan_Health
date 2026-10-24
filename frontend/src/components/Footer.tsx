import React from 'react';
import type { SupportedLanguage } from '../types/report';

type FooterCopy = {
  copyright: string;
  education: string;
};

const footerCopy: Record<SupportedLanguage, FooterCopy> = {
  en: {
    copyright: '© 2026 Yeabsera Andnet · LisanHealth',
    education: 'Educational information only—not a diagnosis or substitute for professional medical care.',
  },
  am: {
    copyright: '© 2026 Yeabsera Andnet · LisanHealth',
    education: 'ይህ መረጃ ለትምህርት ብቻ ነው፤ የሕክምና ምርመራ ወይም የባለሙያ ሕክምና ምክር ምትክ አይደለም።',
  },
  om: {
    copyright: '© 2026 Yeabsera Andnet · LisanHealth',
    education: 'Odeeffannoo barnootaa qofa—marii ogeessa fayyaa ykn qorannoo fayyaa bakka hin bu’u.',
  },
  ti: {
    copyright: '© 2026 Yeabsera Andnet · LisanHealth',
    education: 'እዚ ሓበሬታ ንትምህርቲ ጥራይ እዩ—ናይ ሕክምና ምርመራ ወይ ምኽሪ ባለሞያ ኣይትካእን።',
  },
};

export const Footer: React.FC<{ language: SupportedLanguage }> = ({ language }) => {
  const copy = footerCopy[language];
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="site-footer__primary">
          <p className="site-footer__copyright">{copy.copyright}</p>
          <p className="site-footer__education">{copy.education}</p>
        </div>
      </div>
    </footer>
  );
};
