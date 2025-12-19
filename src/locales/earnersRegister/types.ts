// src/locales/earnersRegister/types.ts

export type Lang = 'en' | 'de' | 'fr' | 'it';

export type EarnerRegisterTranslation = {
  // заголовки/описание
  title: string;
  subtitle: string;

  // поля аккаунта
  email: string;
  password: string;
  passwordConfirm: string;

  // поля профиля
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  country: string;
  slug: string;
  slugHelp: string;
  goalTitle: string;
  goalAmount: string;
  currency: string;

  // прочее
  languageLabel: string;
  submit: string;
  submitting: string;
  successRedirect: string;

  // ошибки
  errorEmailRequired: string;
  errorPasswordRequired: string;
  errorPasswordTooShort: string;
  errorPasswordsDontMatch: string;
  errorNoUserAfterSignup: string;
};
