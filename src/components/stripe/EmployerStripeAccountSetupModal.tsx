'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/button';
import { useT } from '@/lib/translation';

type BusinessType = 'individual' | 'company';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (businessType: BusinessType) => void;
};

export default function EmployerStripeAccountSetupModal({
  open,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useT();
  const [businessType, setBusinessType] =
    useState<BusinessType>('company');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 text-gray-500 hover:text-black disabled:opacity-50"
          aria-label={t('stripe_account_setup_cancel')}
        >
          <X size={22} />
        </button>

        <h2 className="mb-3 text-center text-lg font-semibold text-slate-900">
          {t('stripe_account_setup_title')}
        </h2>

        <p className="mb-4 text-sm leading-relaxed text-slate-700">
          {t('stripe_account_setup_text')}
        </p>

        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-medium text-slate-800">
            {t('stripe_account_setup_prepare_title')}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>{t('stripe_account_setup_prepare_iban')}</li>
            <li>{t('stripe_account_setup_prepare_business')}</li>
            <li>{t('stripe_account_setup_prepare_representative')}</li>
          </ul>
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium text-slate-800">
            {t('register_business_type')}
          </p>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="radio"
              name="stripe-business-type"
              value="company"
              checked={businessType === 'company'}
              onChange={() => setBusinessType('company')}
              disabled={loading}
            />
            <span>{t('register_business_type_company')}</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="radio"
              name="stripe-business-type"
              value="individual"
              checked={businessType === 'individual'}
              onChange={() => setBusinessType('individual')}
              disabled={loading}
            />
            <span>{t('register_business_type_individual')}</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {t('stripe_account_setup_cancel')}
          </Button>

          <Button
            variant="green"
            className="flex-1"
            onClick={() => onConfirm(businessType)}
            disabled={loading}
          >
            {loading
              ? t('stripe_account_setup_starting')
              : t('stripe_account_setup_continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
