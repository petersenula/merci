import type { EarnerRegisterTranslation } from './types';

export const de: EarnerRegisterTranslation = {
  title: 'Konto und Trinkgeld-Profil erstellen',
  subtitle:
    'Ein Schritt: Login-Konto (E-Mail & Passwort) und dein öffentliches Trinkgeld-Profil.',
  email: 'E-Mail für den Login',
  password: 'Passwort',
  passwordConfirm: 'Passwort wiederholen',

  displayName: 'Anzeigename (für Gäste sichtbar)',
  firstName: 'Vorname',
  lastName: 'Nachname',
  phone: 'Telefon',
  city: 'Stadt',
  country: 'Ländercode (z.B. CH)',
  slug: 'Profil-Link (Slug)',
  slugHelp: 'Beispiel: dein-name-bar. Muss eindeutig sein.',
  goalTitle: 'Zielbeschreibung',
  goalAmount: 'Zielbetrag (in ganzer Währung)',
  currency: 'Währung (z.B. CHF)',

  languageLabel: 'Sprache der Oberfläche',
  submit: 'Konto erstellen und in Stripe fortfahren',
  submitting: 'Konto und Profil werden erstellt…',
  successRedirect: 'Weiterleitung zum Stripe-Onboarding…',

  errorEmailRequired: 'E-Mail ist erforderlich.',
  errorPasswordRequired: 'Passwort ist erforderlich.',
  errorPasswordTooShort: 'Passwort muss mindestens 8 Zeichen haben.',
  errorPasswordsDontMatch: 'Passwörter stimmen nicht überein.',
  errorNoUserAfterSignup:
    'Benutzer nach der Registrierung nicht gefunden. Bitte E-Mail-Bestätigungseinstellungen prüfen.',
};