import type { EarnerRegisterTranslation } from './types';

export const fr: EarnerRegisterTranslation = {
  title: 'Créer ton compte et ton profil pour les pourboires',
  subtitle:
    'Une étape : compte de connexion (e-mail et mot de passe) et profil public pour les pourboires.',
  email: 'E-mail pour la connexion',
  password: 'Mot de passe',
  passwordConfirm: 'Répéter le mot de passe',

  displayName: 'Nom affiché (visible pour les clients)',
  firstName: 'Prénom',
  lastName: 'Nom',
  phone: 'Téléphone',
  city: 'Ville',
  country: 'Code pays (p.ex. CH)',
  slug: 'Lien de profil (slug)',
  slugHelp: 'Exemple : ton-nom-bar. Doit être unique.',
  goalTitle: 'Titre de l’objectif',
  goalAmount: 'Montant de l’objectif (devise entière)',
  currency: 'Devise (p.ex. CHF)',

  languageLabel: "Langue de l’interface",
  submit: "Créer le compte et continuer sur Stripe",
  submitting: 'Création du compte et du profil…',
  successRedirect: 'Redirection vers le onboarding Stripe…',

  errorEmailRequired: "L’e-mail est obligatoire.",
  errorPasswordRequired: 'Le mot de passe est obligatoire.',
  errorPasswordTooShort:
    'Le mot de passe doit contenir au moins 8 caractères.',
  errorPasswordsDontMatch: 'Les mots de passe ne correspondent pas.',
  errorNoUserAfterSignup:
    "Impossible de récupérer l’utilisateur après l’inscription. Vérifie la configuration de confirmation d’e-mail.",
};