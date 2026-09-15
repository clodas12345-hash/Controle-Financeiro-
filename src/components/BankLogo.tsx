import React, { useState, useEffect } from 'react';
import { CreditCard as CardIcon } from 'lucide-react';

const BANK_LOGOS: Record<string, string> = {
    'nubank': 'https://logo.clearbit.com/nubank.com.br',
  'itau': 'https://logo.clearbit.com/itau.com.br',
  'bradesco': 'https://logo.clearbit.com/bradesco.com.br',
  'santander': 'https://logo.clearbit.com/santander.com.br',
  'caixa': 'https://logo.clearbit.com/caixa.gov.br',
  'cef': 'https://logo.clearbit.com/caixa.gov.br',
  'bancodobrasil': 'https://logo.clearbit.com/bb.com.br',
  'bb': 'https://logo.clearbit.com/bb.com.br',
  'inter': 'https://logo.clearbit.com/bancointer.com.br',
  'c6': 'https://logo.clearbit.com/c6bank.com.br',
  'c6bank': 'https://logo.clearbit.com/c6bank.com.br',
  'xp': 'https://logo.clearbit.com/xpi.com.br',
  'btg': 'https://logo.clearbit.com/btgpactual.com',
  'picpay': 'https://logo.clearbit.com/picpay.com',
  'pagbank': 'https://logo.clearbit.com/pagbank.com.br',
  'visa': 'https://logo.clearbit.com/visa.com.br',
  'mastercard': 'https://logo.clearbit.com/mastercard.com.br',
  'master': 'https://logo.clearbit.com/mastercard.com.br',
  'americanexpress': 'https://logo.clearbit.com/americanexpress.com',
  'amex': 'https://logo.clearbit.com/americanexpress.com',
  'elo': 'https://logo.clearbit.com/elo.com.br',
  'hipercard': 'https://logo.clearbit.com/hipercard.com.br',
  'banrisul': 'https://logo.clearbit.com/banrisul.com.br',
};

interface BankLogoProps {
  name: string;
  customLogo?: string;
  className?: string;
}

export const BankLogo: React.FC<BankLogoProps> = ({ name, customLogo, className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [name, customLogo]);

  if (customLogo && !error) {
    return (
      <img
        src={customLogo}
        alt={name}
        onError={() => setError(true)}
        className={`${className} rounded-xl object-cover bg-slate-800 shrink-0`}
      />
    );
  }

  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  if (BANK_LOGOS[normalized] && !error) {
    return (
      <img
        src={BANK_LOGOS[normalized]}
        alt={name}
        onError={() => setError(true)}
        className={`${className} rounded-xl object-contain bg-white shrink-0 p-1`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (!name || error) {
    return (
      <div className={`${className} bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shrink-0`}>
        <CardIcon className="w-1/2 h-1/2 text-slate-400" />
      </div>
    );
  }

  // Fallback to UI avatars if no known bank domain is found
  return (
    <img 
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2D2D30&color=ffffff&rounded=false&bold=true`}
      alt={name}
      onError={() => setError(true)}
      className={`${className} rounded-xl object-cover shrink-0`}
    />
  );
};
