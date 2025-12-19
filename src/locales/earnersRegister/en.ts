import type { EarnerRegisterTranslation } from './types';

export const en: EarnerRegisterTranslation = {
  title: 'Create your account and tipping profile',
  subtitle:
    'One step: account for login (email & password) and your public tipping profile.',
  email: 'Email for login',
  password: 'Password',
  passwordConfirm: 'Repeat password',

  displayName: 'Display name (shown to guests)',
  firstName: 'First name',
  lastName: 'Last name',
  phone: 'Phone',
  city: 'City',
  country: 'Country code (e.g. CH)',
  slug: 'Profile link (slug)',
  slugHelp: 'Example: your-name-bar. It must be unique.',
  goalTitle: 'Goal title',
  goalAmount: 'Goal amount (in whole currency)',
  currency: 'Currency (e.g. CHF)',

  languageLabel: 'Interface language',
  submit: 'Create account and continue in Stripe',
  submitting: 'Creating account and profile…',
  successRedirect: 'Redirecting to Stripe onboarding…',

  errorEmailRequired: 'Email is required.',
  errorPasswordRequired: 'Password is required.',
  errorPasswordTooShort: 'Password must be at least 8 characters.',
  errorPasswordsDontMatch: 'Passwords do not match.',
  errorNoUserAfterSignup:
    'Could not get user after sign up. Please check your email verification settings.',
};