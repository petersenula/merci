import type { EarnerRegisterTranslation } from './types';

export const it: EarnerRegisterTranslation = {
  title: 'Crea il tuo account e il profilo per le mance',
  subtitle:
    'Un solo passo: account di accesso (email e password) e profilo pubblico per le mance.',
  email: 'Email per l’accesso',
  password: 'Password',
  passwordConfirm: 'Ripeti la password',

  displayName: 'Nome visualizzato (visibile agli ospiti)',
  firstName: 'Nome',
  lastName: 'Cognome',
  phone: 'Telefono',
  city: 'Città',
  country: 'Codice paese (es. CH)',
  slug: 'Link profilo (slug)',
  slugHelp: 'Esempio: tuo-nome-bar. Deve essere univoco.',
  goalTitle: "Titolo dell'obiettivo",
  goalAmount: "Importo dell'obiettivo (valuta intera)",
  currency: 'Valuta (es. CHF)',

  languageLabel: "Lingua dell'interfaccia",
  submit: 'Crea account e continua su Stripe',
  submitting: 'Creazione di account e profilo…',
  successRedirect: 'Reindirizzamento al onboarding Stripe…',

  errorEmailRequired: "L'email è obbligatoria.",
  errorPasswordRequired: 'La password è obbligatoria.',
  errorPasswordTooShort:
    'La password deve avere almeno 8 caratteri.',
  errorPasswordsDontMatch: 'Le password non coincidono.',
  errorNoUserAfterSignup:
    "Impossibile ottenere l’utente dopo la registrazione. Controlla le impostazioni di conferma email.",
};