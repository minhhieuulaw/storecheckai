"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "fr" | "de" | "es" | "pt" | "it";

export const LOCALES: Record<Locale, { label: string; flag: string; nativeName: string }> = {
  en: { label: "English",    flag: "🇺🇸", nativeName: "English"    },
  fr: { label: "French",     flag: "🇫🇷", nativeName: "Français"   },
  de: { label: "German",     flag: "🇩🇪", nativeName: "Deutsch"    },
  es: { label: "Spanish",    flag: "🇪🇸", nativeName: "Español"    },
  pt: { label: "Portuguese", flag: "🇧🇷", nativeName: "Português"  },
  it: { label: "Italian",    flag: "🇮🇹", nativeName: "Italiano"   },
};

export interface Translations {
  nav: {
    howItWorks: string; sampleReport: string; pricing: string; faq: string;
    signIn: string; register: string; logout: string; dashboard: string;
  };
  auth: {
    login: {
      subtitle: string; emailLabel: string; passwordLabel: string;
      submit: string; submitting: string; noAccount: string;
      createAccount: string; loginFailed: string; networkError: string;
      forgotPassword: string;
    };
    register: {
      subtitle: string; nameLabel: string; emailLabel: string;
      passwordLabel: string; submit: string; submitting: string;
      hasAccount: string; signIn: string;
    };
    forgotPassword: {
      subtitle: string; emailLabel: string;
      submit: string; submitting: string;
      sentTitle: string; sentDesc: string;
      backToLogin: string; networkError: string;
    };
    resetPassword: {
      subtitle: string; newPasswordLabel: string; confirmLabel: string;
      submit: string; submitting: string;
      mismatch: string; tooShort: string; invalidToken: string;
      failed: string; networkError: string; requestNew: string;
      successTitle: string; successDesc: string;
    };
  };
  hero: {
    badge: string; title: string; titleAccent: string; subtitle: string;
    cta: string; placeholder: string; trustNote: string; worksWithLabel: string;
  };
  howItWorks: {
    badge: string; heading: string; headingAccent: string;
    steps: Array<{ title: string; desc: string }>;
  };
  benefits: {
    badge: string; checkItems: string[]; peaceOfMind: string;
    cards: Array<{ title: string; desc: string }>;
  };
  pricing: {
    badge: string; heading: string; headingAccent: string; subtitle: string;
    mostPopular: string; perCheck: string; perMonth: string;
    processing: string; secureNote: string;
    plans: Array<{ name: string; desc: string; cta: string }>;
    features: {
      basicTrust: string; verdictBadge: string; reviewSummary: string;
      keyProsCons: string; priceComparison: string; returnRisk: string;
      redFlagBreakdown: string; facebookCheck: string; reportHistory: string;
      checksMonthly10: string; checksMonthly50: string; fullTrustBreakdown: string;
      priceComparisonFull: string; suspiciousReviews: string; reportHistorySaved: string;
    };
  };
  faq: {
    badge: string; heading: string;
    items: Array<{ q: string; a: string }>;
  };
  modal: {
    heading: string; subheading: string; successTitle: string; successSub: string;
  };
  analyzing: {
    heading: string; timeNote: string; steps: string[];
  };
  footer: {
    tagline: string; rights: string; privacy: string; terms: string; contact: string;
  };
  sampleReport: {
    badge: string; heading: string; headingAccent: string; subtitle: string;
    analyzedLabel: string; trustLabel: string; expandHint: string;
    prosLabel: string; consLabel: string; redFlagsLabel: string;
    finalTakeLabel: string; finalTakeAdvice: string;
    buckets: { pass: string; warn: string; fail: string };
    verdict: string; verdictDesc: string; finalTakeDesc: string;
    passing: string[]; warnings: string[]; failures: string[];
    pros: string[]; cons: string[]; redFlags: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    howItWorks: "How it works", sampleReport: "Sample report", pricing: "Pricing", faq: "FAQ",
    signIn: "Sign in", register: "Register", logout: "Logout", dashboard: "Dashboard",
  },
  auth: {
    login: {
      subtitle: "Sign in to access your dashboard", emailLabel: "Email", passwordLabel: "Password",
      submit: "Sign in", submitting: "Signing in…", noAccount: "Don't have an account?",
      createAccount: "Create account", loginFailed: "Login failed.", networkError: "Network error. Please try again.",
      forgotPassword: "Forgot password?",
    },
    register: {
      subtitle: "Create your free account", nameLabel: "Full name", emailLabel: "Email",
      passwordLabel: "Password", submit: "Create account", submitting: "Creating account…",
      hasAccount: "Already have an account?", signIn: "Sign in",
    },
    forgotPassword: {
      subtitle: "We'll send you a reset link",
      emailLabel: "Email address",
      submit: "Send reset link", submitting: "Sending…",
      sentTitle: "Check your inbox",
      sentDesc: "If an account exists for that email, we've sent a password reset link. It expires in 1 hour.",
      backToLogin: "Back to sign in",
      networkError: "Network error. Please try again.",
    },
    resetPassword: {
      subtitle: "Choose a new password",
      newPasswordLabel: "New password", confirmLabel: "Confirm password",
      submit: "Reset password", submitting: "Resetting…",
      mismatch: "Passwords don't match.",
      tooShort: "Password must be at least 8 characters.",
      invalidToken: "Invalid or expired reset link.",
      failed: "Failed to reset password. Please try again.",
      networkError: "Network error. Please try again.",
      requestNew: "Request a new reset link",
      successTitle: "Password updated!",
      successDesc: "Your password has been changed. Redirecting to sign in…",
    },
  },
  hero: {
    badge: "AI Pre-Purchase Safety Check", title: "Is it safe to buy", titleAccent: "from this store?",
    subtitle: "Paste any product or store link. Get an AI safety report in 30 seconds — trust score, review analysis, return risk, and a clear verdict.",
    cta: "Analyze this store", placeholder: "https://store.com/product/...",
    trustNote: "Sign up free · 1 check included · Results in <30s", worksWithLabel: "Works with",
  },
  howItWorks: {
    badge: "How it works", heading: "Three steps.", headingAccent: "Under 30 seconds.",
    steps: [
      { title: "Paste your link", desc: "Drop in any product URL or store domain. Shopify, Amazon, or any public e-commerce page." },
      { title: "AI analyzes everything", desc: "We scan store signals, scrape reviews, check return policy, and detect suspicious patterns." },
      { title: "Get your report", desc: "A full trust breakdown — score, return risk, review confidence, red flags, and a final verdict." },
    ],
  },
  benefits: {
    badge: "Why StorecheckAI",
    checkItems: ["HTTPS check", "Domain age", "Policy pages", "Social links"],
    peaceOfMind: "peace of mind",
    cards: [
      { title: "Avoid Scammy Stores", desc: "We check HTTPS, domain age, contact info, policy pages, and social links — so you know if the store is legit before you spend a single cent." },
      { title: "Read Reviews Faster", desc: "AI summarizes hundreds of reviews into pros, cons, and complaint themes. Skip the fake 5-star noise." },
      { title: "Know the Return Risk", desc: "We decode return policies — refund traps, hidden fees, vague wording — and give you a plain-English risk rating." },
      { title: "One verdict. No guesswork.", desc: "Buy · Buy with caution · Skip — a final AI verdict based on every signal we collect. Because you don't buy summaries, you buy" },
    ],
  },
  pricing: {
    badge: "Pricing", heading: "Simple, transparent", headingAccent: "pricing.",
    subtitle: "Pay per check or save more with a monthly plan. No hidden fees.",
    mostPopular: "Most popular", perCheck: "per check", perMonth: "per month",
    processing: "Processing…",
    secureNote: "Secure checkout via Stripe · Cancel anytime · Checks never expire within the billing period",
    plans: [
      { name: "Starter", desc: "Pay only when you need it. No subscription, no commitment.", cta: "Buy a check" },
      { name: "Personal", desc: "10 checks included. Full advanced reports every time.", cta: "Start Personal — $19.99/mo" },
      { name: "Pro", desc: "50 checks included. Best value for power users & teams.", cta: "Start Pro — $39.99/mo" },
    ],
    features: {
      basicTrust: "Basic trust score", verdictBadge: "Verdict badge (BUY / CAUTION / SKIP)",
      reviewSummary: "Review summary", keyProsCons: "Key pros & cons",
      priceComparison: "Price comparison", returnRisk: "Return risk analysis",
      redFlagBreakdown: "Red flag breakdown", facebookCheck: "Facebook page check",
      reportHistory: "Report history", checksMonthly10: "10 checks / month included",
      checksMonthly50: "50 checks / month included", fullTrustBreakdown: "Full trust score breakdown",
      priceComparisonFull: "Price comparison (Amazon & AliExpress)",
      suspiciousReviews: "Suspicious review detection", reportHistorySaved: "Report history (saved)",
    },
  },
  faq: {
    badge: "FAQ", heading: "Common questions",
    items: [
      { q: "What types of stores can I analyze?", a: "StorecheckAI works with virtually any publicly accessible e-commerce URL — Shopify stores, Amazon listings, Etsy, Walmart, Temu, and general DTC brands. Just paste the product or store URL and we'll handle the rest." },
      { q: "What does a full report include?", a: "A complete report includes: a trust score (0–100), a BUY / CAUTION / SKIP verdict with explanation, return risk rating, review confidence level, pros & cons, red flags, suspicious signals, price comparison against Amazon and AliExpress/Temu, and Trustpilot review snippets where available." },
      { q: "What's the difference between Starter, Personal, and Pro?", a: "Starter is pay-per-use at $2.99/check — no subscription. Personal ($19.99/mo) includes 10 full checks per month, with $1.25 per extra check. Pro ($39.99/mo) includes 50 checks per month at $1.00 per extra check. Personal and Pro unlock full reports, saved report history, and all advanced features." },
      { q: "Are my reports saved after the check?", a: "Starter checks are run anonymously — nothing is saved. Personal and Pro subscribers can access their full report history from the dashboard at any time." },
      { q: "How accurate is the AI trust score?", a: "We analyze 20+ signals: domain age, HTTPS, contact details, return & privacy policy quality, social presence, Trustpilot ratings, review patterns, and manipulation tactics. No tool is perfect, but we surface the red flags that matter most before you spend money." },
      { q: "Will my report be in my language?", a: "Yes. When you select a language, all AI-generated text in your report — verdict, return summary, pros, cons, red flags, and review analysis — is returned in that language." },
    ],
  },
  modal: {
    heading: "Create your account", subheading: "1 free check included · No credit card required",
    successTitle: "Account created!", successSub: "Signing you in…",
  },
  analyzing: {
    heading: "Analyzing store…", timeNote: "This usually takes 20–40 seconds",
    steps: ["Fetching store page", "Checking security signals", "Scanning policy pages", "Verifying contact info", "Running AI analysis", "Generating your report"],
  },
  footer: {
    tagline: "Helping shoppers buy with confidence.", rights: "All rights reserved.",
    privacy: "Privacy", terms: "Terms", contact: "Contact",
  },
  sampleReport: {
    badge: "Sample Report", heading: "What you", headingAccent: "actually get",
    subtitle: "Not just a number — a full breakdown.",
    analyzedLabel: "Analyzed", trustLabel: "Trust", expandHint: "Tap each card to expand",
    prosLabel: "Pros", consLabel: "Cons", redFlagsLabel: "Red Flags",
    finalTakeLabel: "Should you buy it?",
    finalTakeAdvice: "Consider buying from a more established retailer.",
    buckets: { pass: "Looking Good", warn: "Worth Reviewing", fail: "Concerns" },
    verdict: "Buy with Caution",
    verdictDesc: "Store has basic trust signals but shows unusual review patterns and a short domain history. Proceed carefully.",
    finalTakeDesc: "Product has decent real-use feedback, but the store is new with weak trust signals.",
    passing: ["HTTPS / SSL enabled", "Contact email found", "Refund policy page exists", "Active social media presence"],
    warnings: ["No physical address listed", "Domain registered 8 months ago", "Limited product reviews"],
    failures: ["Unusual review engagement patterns", "Return shipping paid by customer"],
    pros: ["Good battery life (6–8h)", "Comfortable fit", "Clear call quality", "Competitive price"],
    cons: ["Weak bass response", "Plastic case feels cheap", "Pairing issues on Android", "No noise cancellation"],
    redFlags: ["Repeated generic praise", "Multiple reviews same day", "Vague return wording", "New domain (< 1 year)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const fr: Translations = {
  nav: {
    howItWorks: "Comment ça marche", sampleReport: "Exemple de rapport", pricing: "Tarifs", faq: "FAQ",
    signIn: "Se connecter", register: "S'inscrire", logout: "Déconnexion", dashboard: "Tableau de bord",
  },
  auth: {
    login: {
      subtitle: "Connectez-vous pour accéder à votre tableau de bord", emailLabel: "Adresse e-mail", passwordLabel: "Mot de passe",
      submit: "Se connecter", submitting: "Connexion en cours…", noAccount: "Vous n'avez pas encore de compte ?",
      createAccount: "Créer un compte", loginFailed: "Échec de la connexion.", networkError: "Erreur réseau. Veuillez réessayer.",
      forgotPassword: "Mot de passe oublié ?",
    },
    register: {
      subtitle: "Créez votre compte gratuit", nameLabel: "Nom complet", emailLabel: "Adresse e-mail",
      passwordLabel: "Mot de passe", submit: "Créer un compte", submitting: "Création du compte…",
      hasAccount: "Vous avez déjà un compte ?", signIn: "Se connecter",
    },
    forgotPassword: {
      subtitle: "Nous vous enverrons un lien de réinitialisation",
      emailLabel: "Adresse e-mail",
      submit: "Envoyer le lien", submitting: "Envoi en cours…",
      sentTitle: "Vérifiez votre boîte de réception",
      sentDesc: "Si un compte existe pour cet e-mail, nous avons envoyé un lien de réinitialisation. Il expire dans 1 heure.",
      backToLogin: "Retour à la connexion",
      networkError: "Erreur réseau. Veuillez réessayer.",
    },
    resetPassword: {
      subtitle: "Choisissez un nouveau mot de passe",
      newPasswordLabel: "Nouveau mot de passe", confirmLabel: "Confirmer le mot de passe",
      submit: "Réinitialiser le mot de passe", submitting: "Réinitialisation…",
      mismatch: "Les mots de passe ne correspondent pas.",
      tooShort: "Le mot de passe doit contenir au moins 8 caractères.",
      invalidToken: "Lien de réinitialisation invalide ou expiré.",
      failed: "Échec de la réinitialisation. Veuillez réessayer.",
      networkError: "Erreur réseau. Veuillez réessayer.",
      requestNew: "Demander un nouveau lien",
      successTitle: "Mot de passe mis à jour !",
      successDesc: "Votre mot de passe a été modifié. Redirection vers la connexion…",
    },
  },
  hero: {
    badge: "Vérification d'achat avant commande par IA", title: "Ce site est-il", titleAccent: "fiable pour acheter ?",
    subtitle: "Collez n'importe quel lien de boutique ou de produit. Obtenez un rapport de sécurité IA en 30 secondes — score de confiance, analyse des avis, risque de retour et verdict clair.",
    cta: "Analyser cette boutique", placeholder: "https://boutique.com/produit/...",
    trustNote: "Inscription gratuite · 1 vérification incluse · Résultats en moins de 30 s", worksWithLabel: "Fonctionne avec",
  },
  howItWorks: {
    badge: "Comment ça marche", heading: "Trois étapes.", headingAccent: "En moins de 30 secondes.",
    steps: [
      { title: "Collez votre lien", desc: "Entrez n'importe quelle URL de produit ou domaine de boutique. Shopify, Amazon ou toute page e-commerce publique." },
      { title: "L'IA analyse tout", desc: "Nous scannons les signaux, récupérons les avis, vérifions la politique de retour et détectons les schémas suspects." },
      { title: "Recevez votre rapport", desc: "Un bilan de confiance complet — score, risque de retour, fiabilité des avis, signaux d'alerte et verdict final." },
    ],
  },
  benefits: {
    badge: "Pourquoi StorecheckAI",
    checkItems: ["Vérification HTTPS", "Âge du domaine", "Pages de politique", "Liens sociaux"],
    peaceOfMind: "la tranquillité d'esprit",
    cards: [
      { title: "Évitez les boutiques frauduleuses", desc: "Nous vérifions le HTTPS, l'âge du domaine, les coordonnées, les pages de politique et les liens sociaux — pour savoir si la boutique est légitime avant de dépenser le moindre centime." },
      { title: "Lisez les avis plus vite", desc: "L'IA résume des centaines d'avis en avantages, inconvénients et thèmes de plaintes. Ignorez le bruit des faux 5 étoiles." },
      { title: "Connaissez le risque de retour", desc: "Nous décryptons les politiques de retour — pièges de remboursement, frais cachés, formulations vagues — et vous donnons une note de risque claire." },
      { title: "Un verdict. Aucune incertitude.", desc: "Acheter · Acheter avec précaution · Éviter — un verdict IA basé sur tous les signaux collectés. Parce que vous n'achetez pas des résumés, vous achetez" },
    ],
  },
  pricing: {
    badge: "Tarifs", heading: "Simple et transparent,", headingAccent: "sans surprises.",
    subtitle: "Payez à l'utilisation ou économisez plus avec un abonnement mensuel. Aucuns frais cachés.",
    mostPopular: "Le plus populaire", perCheck: "par analyse", perMonth: "par mois",
    processing: "Traitement en cours…",
    secureNote: "Paiement sécurisé via Stripe · Annulation à tout moment · Les analyses n'expirent pas dans la période de facturation",
    plans: [
      { name: "Starter", desc: "Payez uniquement quand vous en avez besoin. Sans abonnement, sans engagement.", cta: "Acheter une analyse" },
      { name: "Personnel", desc: "10 analyses incluses. Rapports complets à chaque fois.", cta: "Démarrer Personnel — 19,99 $/mois" },
      { name: "Pro", desc: "50 analyses incluses. Meilleur rapport qualité-prix pour utilisateurs intensifs.", cta: "Démarrer Pro — 39,99 $/mois" },
    ],
    features: {
      basicTrust: "Score de confiance de base", verdictBadge: "Badge de verdict (ACHETER / PRUDENCE / ÉVITER)",
      reviewSummary: "Résumé des avis", keyProsCons: "Principaux avantages et inconvénients",
      priceComparison: "Comparaison de prix", returnRisk: "Analyse du risque de retour",
      redFlagBreakdown: "Analyse des signaux d'alerte", facebookCheck: "Vérification de la page Facebook",
      reportHistory: "Historique des rapports", checksMonthly10: "10 analyses / mois incluses",
      checksMonthly50: "50 analyses / mois incluses", fullTrustBreakdown: "Analyse complète du score de confiance",
      priceComparisonFull: "Comparaison de prix (Amazon et AliExpress)",
      suspiciousReviews: "Détection d'avis suspects", reportHistorySaved: "Historique des rapports (sauvegardé)",
    },
  },
  faq: {
    badge: "FAQ", heading: "Questions fréquentes",
    items: [
      { q: "Quels types de boutiques puis-je analyser ?", a: "StorecheckAI fonctionne avec pratiquement n'importe quelle URL de commerce en ligne accessible publiquement — boutiques Shopify, Amazon, Etsy, Walmart, Temu et marques DTC. Collez simplement l'URL du produit ou de la boutique et nous nous occupons du reste." },
      { q: "Que contient un rapport complet ?", a: "Un rapport complet inclut : un score de confiance (0–100), un verdict ACHETER / PRUDENCE / ÉVITER avec explication, une évaluation du risque de retour, le niveau de fiabilité des avis, avantages et inconvénients, signaux d'alerte, comparaison de prix avec Amazon et AliExpress/Temu, et des extraits Trustpilot si disponibles." },
      { q: "Quelle est la différence entre Starter, Personnel et Pro ?", a: "Starter est à 2,99 $/analyse sans abonnement. Personnel (19,99 $/mois) inclut 10 analyses complètes par mois, avec 1,25 $ par analyse supplémentaire. Pro (39,99 $/mois) inclut 50 analyses par mois à 1,00 $ l'unité supplémentaire. Personnel et Pro débloquent les rapports complets, l'historique des rapports et toutes les fonctionnalités avancées." },
      { q: "Mes rapports sont-ils sauvegardés après la vérification ?", a: "Les analyses Starter sont anonymes — rien n'est sauvegardé. Les abonnés Personnel et Pro peuvent accéder à tout leur historique de rapports depuis le tableau de bord à tout moment." },
      { q: "Quelle est la précision du score de confiance IA ?", a: "Nous analysons plus de 20 signaux : âge du domaine, HTTPS, coordonnées, qualité des politiques de retour et confidentialité, présence sociale, notes Trustpilot, schémas d'avis et tactiques de manipulation. Aucun outil n'est parfait, mais nous mettons en évidence les signaux d'alerte essentiels." },
      { q: "Mon rapport sera-t-il dans ma langue ?", a: "Oui. Lorsque vous sélectionnez une langue, tout le texte généré par l'IA dans votre rapport — verdict, résumé de retour, avantages, inconvénients, signaux d'alerte et analyse des avis — est retourné dans cette langue." },
    ],
  },
  modal: {
    heading: "Créez votre compte", subheading: "1 vérification gratuite incluse · Aucune carte de crédit requise",
    successTitle: "Compte créé !", successSub: "Connexion en cours…",
  },
  analyzing: {
    heading: "Analyse en cours…", timeNote: "Cela prend généralement 20 à 40 secondes",
    steps: ["Récupération de la page", "Vérification des signaux de sécurité", "Scan des pages de politique", "Vérification des coordonnées", "Analyse IA en cours", "Génération du rapport"],
  },
  footer: {
    tagline: "Aidons les acheteurs à acheter en toute confiance.", rights: "Tous droits réservés.",
    privacy: "Confidentialité", terms: "Conditions", contact: "Contact",
  },
  sampleReport: {
    badge: "Rapport exemple", heading: "Ce que vous", headingAccent: "obtenez vraiment",
    subtitle: "Pas seulement un chiffre — un bilan complet.",
    analyzedLabel: "Analysé", trustLabel: "Confiance", expandHint: "Appuyez pour développer",
    prosLabel: "Avantages", consLabel: "Inconvénients", redFlagsLabel: "Signaux d'alerte",
    finalTakeLabel: "Devriez-vous acheter ?",
    finalTakeAdvice: "Envisagez d'acheter auprès d'un revendeur plus établi.",
    buckets: { pass: "Satisfaisant", warn: "À vérifier", fail: "Problèmes" },
    verdict: "Achat avec prudence",
    verdictDesc: "La boutique présente des signaux de confiance basiques mais montre des schémas d'avis inhabituels et un historique de domaine court. Procédez avec prudence.",
    finalTakeDesc: "Le produit a des retours d'utilisation corrects, mais la boutique est nouvelle avec des signaux de confiance faibles.",
    passing: ["HTTPS / SSL activé", "E-mail de contact trouvé", "Page de remboursement existante", "Présence active sur les réseaux sociaux"],
    warnings: ["Aucune adresse physique indiquée", "Domaine enregistré il y a 8 mois", "Avis produits limités"],
    failures: ["Schémas d'avis inhabituels détectés", "Frais de retour à la charge du client"],
    pros: ["Bonne autonomie (6–8h)", "Confort d'utilisation", "Qualité d'appel claire", "Prix compétitif"],
    cons: ["Basses faibles", "Boîtier en plastique de mauvaise qualité", "Problèmes de jumelage sur Android", "Pas de suppression du bruit"],
    redFlags: ["Éloges génériques répétés", "Plusieurs avis le même jour", "Formulation de retour vague", "Nouveau domaine (< 1 an)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const de: Translations = {
  nav: {
    howItWorks: "So funktioniert es", sampleReport: "Beispielbericht", pricing: "Preise", faq: "Häufige Fragen",
    signIn: "Anmelden", register: "Registrieren", logout: "Abmelden", dashboard: "Dashboard",
  },
  auth: {
    login: {
      subtitle: "Melden Sie sich an, um auf Ihr Dashboard zuzugreifen", emailLabel: "E-Mail-Adresse", passwordLabel: "Passwort",
      submit: "Anmelden", submitting: "Anmeldung läuft…", noAccount: "Noch kein Konto?",
      createAccount: "Konto erstellen", loginFailed: "Anmeldung fehlgeschlagen.", networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
      forgotPassword: "Passwort vergessen?",
    },
    register: {
      subtitle: "Erstellen Sie Ihr kostenloses Konto", nameLabel: "Vollständiger Name", emailLabel: "E-Mail-Adresse",
      passwordLabel: "Passwort", submit: "Konto erstellen", submitting: "Konto wird erstellt…",
      hasAccount: "Haben Sie bereits ein Konto?", signIn: "Anmelden",
    },
    forgotPassword: {
      subtitle: "Wir senden Ihnen einen Reset-Link",
      emailLabel: "E-Mail-Adresse",
      submit: "Reset-Link senden", submitting: "Wird gesendet…",
      sentTitle: "Prüfen Sie Ihren Posteingang",
      sentDesc: "Falls ein Konto für diese E-Mail existiert, haben wir einen Passwort-Reset-Link gesendet. Er läuft in 1 Stunde ab.",
      backToLogin: "Zurück zur Anmeldung",
      networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
    },
    resetPassword: {
      subtitle: "Wählen Sie ein neues Passwort",
      newPasswordLabel: "Neues Passwort", confirmLabel: "Passwort bestätigen",
      submit: "Passwort zurücksetzen", submitting: "Wird zurückgesetzt…",
      mismatch: "Passwörter stimmen nicht überein.",
      tooShort: "Das Passwort muss mindestens 8 Zeichen haben.",
      invalidToken: "Ungültiger oder abgelaufener Reset-Link.",
      failed: "Zurücksetzen fehlgeschlagen. Bitte versuchen Sie es erneut.",
      networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
      requestNew: "Neuen Reset-Link anfordern",
      successTitle: "Passwort aktualisiert!",
      successDesc: "Ihr Passwort wurde geändert. Weiterleitung zur Anmeldung…",
    },
  },
  hero: {
    badge: "KI-Sicherheitscheck vor dem Kauf", title: "Ist es sicher,", titleAccent: "in diesem Shop zu kaufen?",
    subtitle: "Fügen Sie einen Shop- oder Produktlink ein. Erhalten Sie in 30 Sekunden einen KI-Sicherheitsbericht — Vertrauensscore, Rezensionsanalyse, Rückgaberisiko und ein klares Urteil.",
    cta: "Diesen Shop analysieren", placeholder: "https://shop.com/produkt/...",
    trustNote: "Kostenlose Registrierung · 1 Check inklusive · Ergebnisse in <30s", worksWithLabel: "Funktioniert mit",
  },
  howItWorks: {
    badge: "So funktioniert es", heading: "Drei Schritte.", headingAccent: "In unter 30 Sekunden.",
    steps: [
      { title: "Link einfügen", desc: "Fügen Sie eine Produkt-URL oder Shop-Domain ein. Shopify, Amazon oder jede öffentliche E-Commerce-Seite." },
      { title: "KI analysiert alles", desc: "Wir scannen Shop-Signale, lesen Bewertungen, prüfen die Rückgaberichtlinie und erkennen verdächtige Muster." },
      { title: "Bericht erhalten", desc: "Vollständige Vertrauensanalyse — Score, Rückgaberisiko, Bewertungsvertrauen, Warnsignale und finales Urteil." },
    ],
  },
  benefits: {
    badge: "Warum StorecheckAI",
    checkItems: ["HTTPS-Prüfung", "Domain-Alter", "Richtlinienseiten", "Social-Links"],
    peaceOfMind: "Sicherheit",
    cards: [
      { title: "Betrügerische Shops meiden", desc: "Wir prüfen HTTPS, Domain-Alter, Kontaktdaten, Richtlinienseiten und Social-Links — damit Sie wissen, ob der Shop seriös ist, bevor Sie einen Cent ausgeben." },
      { title: "Bewertungen schneller lesen", desc: "KI fasst Hunderte von Bewertungen zu Vor- und Nachteilen sowie Beschwerdemuster zusammen. Schluss mit den gefälschten 5-Sterne-Bewertungen." },
      { title: "Rückgaberisiko kennen", desc: "Wir entschlüsseln Rückgaberichtlinien — Erstattungsfallen, versteckte Gebühren, unklare Formulierungen — und geben Ihnen eine verständliche Risikobewertung." },
      { title: "Ein Urteil. Kein Rätselraten.", desc: "Kaufen · Mit Vorsicht kaufen · Überspringen — ein finales KI-Urteil. Denn Sie kaufen keine Zusammenfassungen, Sie kaufen" },
    ],
  },
  pricing: {
    badge: "Preise", heading: "Einfach und transparent,", headingAccent: "ohne versteckte Kosten.",
    subtitle: "Bezahlen Sie pro Check oder sparen Sie mehr mit einem Monatsplan. Keine versteckten Gebühren.",
    mostPopular: "Am beliebtesten", perCheck: "pro Check", perMonth: "pro Monat",
    processing: "Verarbeitung…",
    secureNote: "Sicherer Checkout via Stripe · Jederzeit kündbar · Checks verfallen nicht innerhalb des Abrechnungszeitraums",
    plans: [
      { name: "Starter", desc: "Zahlen Sie nur, wenn Sie es brauchen. Kein Abonnement, keine Verpflichtung.", cta: "Check kaufen" },
      { name: "Persönlich", desc: "10 Checks inklusive. Vollständige erweiterte Berichte jedes Mal.", cta: "Persönlich starten — 19,99 $/Monat" },
      { name: "Pro", desc: "50 Checks inklusive. Bestes Preis-Leistungs-Verhältnis für Power-User & Teams.", cta: "Pro starten — 39,99 $/Monat" },
    ],
    features: {
      basicTrust: "Einfacher Vertrauensscore", verdictBadge: "Urteil-Badge (KAUFEN / VORSICHT / ÜBERSPRINGEN)",
      reviewSummary: "Bewertungszusammenfassung", keyProsCons: "Wichtigste Vor- und Nachteile",
      priceComparison: "Preisvergleich", returnRisk: "Rückgaberisikoanalyse",
      redFlagBreakdown: "Warnsignalanalyse", facebookCheck: "Facebook-Seiten-Check",
      reportHistory: "Berichtsverlauf", checksMonthly10: "10 Checks / Monat inklusive",
      checksMonthly50: "50 Checks / Monat inklusive", fullTrustBreakdown: "Vollständige Vertrauensscore-Analyse",
      priceComparisonFull: "Preisvergleich (Amazon & AliExpress)",
      suspiciousReviews: "Erkennung verdächtiger Bewertungen", reportHistorySaved: "Berichtsverlauf (gespeichert)",
    },
  },
  faq: {
    badge: "Häufige Fragen", heading: "Häufig gestellte Fragen",
    items: [
      { q: "Welche Arten von Shops kann ich analysieren?", a: "StorecheckAI funktioniert mit nahezu jeder öffentlich zugänglichen E-Commerce-URL — Shopify-Shops, Amazon-Angeboten, Etsy, Walmart, Temu und allgemeinen DTC-Marken. Fügen Sie einfach die Produkt- oder Shop-URL ein und wir kümmern uns um den Rest." },
      { q: "Was enthält ein vollständiger Bericht?", a: "Ein vollständiger Bericht enthält: einen Vertrauensscore (0–100), ein KAUFEN / VORSICHT / ÜBERSPRINGEN-Urteil mit Erklärung, Rückgaberisikobewertung, Bewertungsvertrauensniveau, Vor- und Nachteile, Warnsignale, Preisvergleich mit Amazon und AliExpress/Temu sowie Trustpilot-Bewertungsauszüge." },
      { q: "Was ist der Unterschied zwischen Starter, Persönlich und Pro?", a: "Starter kostet 2,99 $ pro Check ohne Abonnement. Persönlich (19,99 $/Monat) enthält 10 vollständige Checks pro Monat, mit 1,25 $ pro Extra-Check. Pro (39,99 $/Monat) enthält 50 Checks pro Monat zu 1,00 $ pro Extra-Check. Persönlich und Pro schalten vollständige Berichte, Berichtsverlauf und alle erweiterten Funktionen frei." },
      { q: "Werden meine Berichte nach der Prüfung gespeichert?", a: "Starter-Checks sind anonym — es wird nichts gespeichert. Persönlich- und Pro-Abonnenten können ihren vollständigen Berichtsverlauf jederzeit über das Dashboard abrufen." },
      { q: "Wie genau ist der KI-Vertrauensscore?", a: "Wir analysieren über 20 Signale: Domain-Alter, HTTPS, Kontaktdaten, Qualität der Rückgabe- und Datenschutzrichtlinien, soziale Präsenz, Trustpilot-Bewertungen, Bewertungsmuster und Manipulationstaktiken. Kein Tool ist perfekt, aber wir zeigen die wichtigsten Warnsignale bevor Sie Geld ausgeben." },
      { q: "Wird mein Bericht in meiner Sprache sein?", a: "Ja. Wenn Sie eine Sprache auswählen, wird der gesamte KI-generierte Text in Ihrem Bericht — Urteil, Rückgabezusammenfassung, Vor- und Nachteile, Warnsignale und Bewertungsanalyse — in dieser Sprache zurückgegeben." },
    ],
  },
  modal: {
    heading: "Konto erstellen", subheading: "1 kostenloser Check inklusive · Keine Kreditkarte erforderlich",
    successTitle: "Konto erstellt!", successSub: "Anmeldung läuft…",
  },
  analyzing: {
    heading: "Shop wird analysiert…", timeNote: "Dies dauert in der Regel 20–40 Sekunden",
    steps: ["Shop-Seite abrufen", "Sicherheitssignale prüfen", "Richtlinienseiten scannen", "Kontaktdaten verifizieren", "KI-Analyse ausführen", "Bericht erstellen"],
  },
  footer: {
    tagline: "Wir helfen Käufern, mit Vertrauen einzukaufen.", rights: "Alle Rechte vorbehalten.",
    privacy: "Datenschutz", terms: "AGB", contact: "Kontakt",
  },
  sampleReport: {
    badge: "Beispielbericht", heading: "Was Sie", headingAccent: "wirklich bekommen",
    subtitle: "Nicht nur eine Zahl — eine vollständige Analyse.",
    analyzedLabel: "Analysiert", trustLabel: "Vertrauen", expandHint: "Tippen zum Erweitern",
    prosLabel: "Vorteile", consLabel: "Nachteile", redFlagsLabel: "Warnsignale",
    finalTakeLabel: "Sollten Sie kaufen?",
    finalTakeAdvice: "Erwägen Sie den Kauf bei einem etablierteren Händler.",
    buckets: { pass: "Sieht gut aus", warn: "Prüfenswert", fail: "Bedenken" },
    verdict: "Mit Vorsicht kaufen",
    verdictDesc: "Der Shop zeigt grundlegende Vertrauenssignale, weist jedoch ungewöhnliche Bewertungsmuster und eine kurze Domainhistorie auf. Bitte vorsichtig vorgehen.",
    finalTakeDesc: "Das Produkt hat akzeptables Nutzerfeedback, aber der Shop ist neu und weist schwache Vertrauenssignale auf.",
    passing: ["HTTPS / SSL aktiviert", "Kontakt-E-Mail gefunden", "Rückgabeseite vorhanden", "Aktive Social-Media-Präsenz"],
    warnings: ["Keine physische Adresse angegeben", "Domain vor 8 Monaten registriert", "Begrenzte Produktbewertungen"],
    failures: ["Ungewöhnliche Bewertungsmuster erkannt", "Rücksendekosten trägt der Kunde"],
    pros: ["Gute Akkulaufzeit (6–8h)", "Tragekomfort", "Klare Gesprächsqualität", "Wettbewerbsfähiger Preis"],
    cons: ["Schwache Bassleistung", "Kunststoffgehäuse wirkt billig", "Verbindungsprobleme auf Android", "Keine Geräuschunterdrückung"],
    redFlags: ["Wiederholte allgemeine Lobeshymnen", "Mehrere Bewertungen am selben Tag", "Unklare Rückgabeformulierung", "Neue Domain (< 1 Jahr)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const es: Translations = {
  nav: {
    howItWorks: "Cómo funciona", sampleReport: "Informe de ejemplo", pricing: "Precios", faq: "Preguntas frecuentes",
    signIn: "Iniciar sesión", register: "Registrarse", logout: "Cerrar sesión", dashboard: "Panel de control",
  },
  auth: {
    login: {
      subtitle: "Inicia sesión para acceder a tu panel de control", emailLabel: "Correo electrónico", passwordLabel: "Contraseña",
      submit: "Iniciar sesión", submitting: "Iniciando sesión…", noAccount: "¿Todavía no tienes cuenta?",
      createAccount: "Crear una cuenta", loginFailed: "Error al iniciar sesión.", networkError: "Error de red. Por favor, inténtalo de nuevo.",
      forgotPassword: "¿Olvidaste tu contraseña?",
    },
    register: {
      subtitle: "Crea tu cuenta gratuita", nameLabel: "Nombre completo", emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña", submit: "Crear cuenta", submitting: "Creando cuenta…",
      hasAccount: "¿Ya tienes una cuenta?", signIn: "Iniciar sesión",
    },
    forgotPassword: {
      subtitle: "Te enviaremos un enlace de restablecimiento",
      emailLabel: "Correo electrónico",
      submit: "Enviar enlace", submitting: "Enviando…",
      sentTitle: "Revisa tu bandeja de entrada",
      sentDesc: "Si existe una cuenta para ese correo, hemos enviado un enlace de restablecimiento. Expira en 1 hora.",
      backToLogin: "Volver a iniciar sesión",
      networkError: "Error de red. Por favor, inténtalo de nuevo.",
    },
    resetPassword: {
      subtitle: "Elige una nueva contraseña",
      newPasswordLabel: "Nueva contraseña", confirmLabel: "Confirmar contraseña",
      submit: "Restablecer contraseña", submitting: "Restableciendo…",
      mismatch: "Las contraseñas no coinciden.",
      tooShort: "La contraseña debe tener al menos 8 caracteres.",
      invalidToken: "Enlace de restablecimiento inválido o expirado.",
      failed: "No se pudo restablecer. Por favor, inténtalo de nuevo.",
      networkError: "Error de red. Por favor, inténtalo de nuevo.",
      requestNew: "Solicitar un nuevo enlace",
      successTitle: "¡Contraseña actualizada!",
      successDesc: "Tu contraseña ha sido cambiada. Redirigiendo al inicio de sesión…",
    },
  },
  hero: {
    badge: "Verificación de seguridad antes de comprar con IA", title: "¿Es seguro comprar", titleAccent: "en esta tienda?",
    subtitle: "Pega cualquier enlace de tienda o producto. Obtén un informe de seguridad IA en 30 segundos — puntuación de confianza, análisis de reseñas, riesgo de devolución y un veredicto claro.",
    cta: "Analizar esta tienda", placeholder: "https://tienda.com/producto/...",
    trustNote: "Registro gratuito · 1 verificación incluida · Resultados en <30s", worksWithLabel: "Compatible con",
  },
  howItWorks: {
    badge: "Cómo funciona", heading: "Tres pasos.", headingAccent: "En menos de 30 segundos.",
    steps: [
      { title: "Pega tu enlace", desc: "Introduce cualquier URL de producto o dominio de tienda. Shopify, Amazon o cualquier página de comercio electrónico pública." },
      { title: "La IA analiza todo", desc: "Escaneamos señales de la tienda, analizamos reseñas, verificamos la política de devoluciones y detectamos patrones sospechosos." },
      { title: "Obtén tu informe", desc: "Un análisis completo de confianza — puntuación, riesgo de devolución, fiabilidad de las reseñas, señales de alerta y veredicto final." },
    ],
  },
  benefits: {
    badge: "Por qué StorecheckAI",
    checkItems: ["Verificación HTTPS", "Antigüedad del dominio", "Páginas de políticas", "Redes sociales"],
    peaceOfMind: "tranquilidad",
    cards: [
      { title: "Evita tiendas fraudulentas", desc: "Verificamos HTTPS, antigüedad del dominio, datos de contacto, páginas de políticas y redes sociales — para que sepas si la tienda es legítima antes de gastar un solo céntimo." },
      { title: "Lee las reseñas más rápido", desc: "La IA resume cientos de reseñas en pros, contras y temas de quejas. Olvídate del ruido de las falsas 5 estrellas." },
      { title: "Conoce el riesgo de devolución", desc: "Decodificamos las políticas de devolución — trampas de reembolso, cargos ocultos, redacción vaga — y te damos una calificación de riesgo clara." },
      { title: "Un veredicto. Sin adivinar.", desc: "Comprar · Comprar con precaución · Evitar — un veredicto final de IA. Porque no compras resúmenes, compras" },
    ],
  },
  pricing: {
    badge: "Precios", heading: "Simple y transparente,", headingAccent: "sin costes ocultos.",
    subtitle: "Paga por verificación o ahorra más con un plan mensual. Sin tarifas ocultas.",
    mostPopular: "Más popular", perCheck: "por verificación", perMonth: "por mes",
    processing: "Procesando…",
    secureNote: "Pago seguro a través de Stripe · Cancela en cualquier momento · Las verificaciones no caducan durante el período de facturación",
    plans: [
      { name: "Starter", desc: "Paga solo cuando lo necesites. Sin suscripción, sin compromiso.", cta: "Comprar una verificación" },
      { name: "Personal", desc: "10 verificaciones incluidas. Informes completos avanzados en todo momento.", cta: "Empezar Personal — $19,99/mes" },
      { name: "Pro", desc: "50 verificaciones incluidas. Mejor valor para usuarios avanzados y equipos.", cta: "Empezar Pro — $39,99/mes" },
    ],
    features: {
      basicTrust: "Puntuación de confianza básica", verdictBadge: "Distintivo de veredicto (COMPRAR / PRECAUCIÓN / EVITAR)",
      reviewSummary: "Resumen de reseñas", keyProsCons: "Pros y contras principales",
      priceComparison: "Comparación de precios", returnRisk: "Análisis de riesgo de devolución",
      redFlagBreakdown: "Análisis de señales de alerta", facebookCheck: "Verificación de página de Facebook",
      reportHistory: "Historial de informes", checksMonthly10: "10 verificaciones / mes incluidas",
      checksMonthly50: "50 verificaciones / mes incluidas", fullTrustBreakdown: "Análisis completo de puntuación de confianza",
      priceComparisonFull: "Comparación de precios (Amazon y AliExpress)",
      suspiciousReviews: "Detección de reseñas sospechosas", reportHistorySaved: "Historial de informes (guardado)",
    },
  },
  faq: {
    badge: "Preguntas frecuentes", heading: "Preguntas comunes",
    items: [
      { q: "¿Qué tipos de tiendas puedo analizar?", a: "StorecheckAI funciona con prácticamente cualquier URL de comercio electrónico accesible públicamente — tiendas Shopify, listados de Amazon, Etsy, Walmart, Temu y marcas DTC. Solo pega la URL del producto o la tienda y nos encargamos del resto." },
      { q: "¿Qué incluye un informe completo?", a: "Un informe completo incluye: puntuación de confianza (0–100), veredicto COMPRAR / PRECAUCIÓN / EVITAR con explicación, calificación de riesgo de devolución, nivel de confianza de reseñas, pros y contras, señales de alerta, comparación de precios frente a Amazon y AliExpress/Temu, y extractos de Trustpilot cuando estén disponibles." },
      { q: "¿Cuál es la diferencia entre Starter, Personal y Pro?", a: "Starter es de pago por uso a $2,99/verificación sin suscripción. Personal ($19,99/mes) incluye 10 verificaciones completas al mes, con $1,25 por verificación extra. Pro ($39,99/mes) incluye 50 verificaciones al mes a $1,00 por verificación extra. Personal y Pro desbloquean informes completos, historial de informes y todas las funciones avanzadas." },
      { q: "¿Se guardan mis informes después de la verificación?", a: "Las verificaciones Starter son anónimas — no se guarda nada. Los suscriptores Personal y Pro pueden acceder a su historial completo de informes desde el panel de control en cualquier momento." },
      { q: "¿Qué tan precisa es la puntuación de confianza IA?", a: "Analizamos más de 20 señales: antigüedad del dominio, HTTPS, datos de contacto, calidad de las políticas de devolución y privacidad, presencia social, puntuaciones de Trustpilot, patrones de reseñas y tácticas de manipulación. Ninguna herramienta es perfecta, pero destacamos las señales de alerta más importantes antes de que gastes dinero." },
      { q: "¿Mi informe estará en mi idioma?", a: "Sí. Cuando seleccionas un idioma, todo el texto generado por IA en tu informe — veredicto, resumen de devolución, pros, contras, señales de alerta y análisis de reseñas — se devuelve en ese idioma." },
    ],
  },
  modal: {
    heading: "Crea tu cuenta", subheading: "1 verificación gratuita incluida · No se requiere tarjeta de crédito",
    successTitle: "¡Cuenta creada!", successSub: "Iniciando sesión…",
  },
  analyzing: {
    heading: "Analizando tienda…", timeNote: "Esto suele tardar entre 20 y 40 segundos",
    steps: ["Obteniendo la página", "Verificando señales de seguridad", "Escaneando páginas de políticas", "Verificando información de contacto", "Ejecutando análisis de IA", "Generando tu informe"],
  },
  footer: {
    tagline: "Ayudamos a los compradores a comprar con confianza.", rights: "Todos los derechos reservados.",
    privacy: "Privacidad", terms: "Términos", contact: "Contacto",
  },
  sampleReport: {
    badge: "Informe de ejemplo", heading: "Lo que", headingAccent: "realmente obtienes",
    subtitle: "No solo un número — un análisis completo.",
    analyzedLabel: "Analizado", trustLabel: "Confianza", expandHint: "Toca para expandir",
    prosLabel: "Ventajas", consLabel: "Desventajas", redFlagsLabel: "Señales de alerta",
    finalTakeLabel: "¿Deberías comprar?",
    finalTakeAdvice: "Considera comprar en un minorista más establecido.",
    buckets: { pass: "Se ve bien", warn: "Vale revisar", fail: "Preocupaciones" },
    verdict: "Comprar con precaución",
    verdictDesc: "La tienda tiene señales básicas de confianza pero muestra patrones de reseñas inusuales y un historial de dominio corto. Procede con cuidado.",
    finalTakeDesc: "El producto tiene comentarios de uso real decentes, pero la tienda es nueva con señales de confianza débiles.",
    passing: ["HTTPS / SSL habilitado", "Correo de contacto encontrado", "Página de reembolso existente", "Presencia activa en redes sociales"],
    warnings: ["Sin dirección física indicada", "Dominio registrado hace 8 meses", "Reseñas de productos limitadas"],
    failures: ["Patrones de reseñas inusuales detectados", "Gastos de devolución a cargo del cliente"],
    pros: ["Buena duración de batería (6–8h)", "Comodidad de uso", "Calidad de llamada clara", "Precio competitivo"],
    cons: ["Respuesta de graves débil", "Carcasa de plástico barata", "Problemas de emparejamiento en Android", "Sin cancelación de ruido"],
    redFlags: ["Elogios genéricos repetidos", "Múltiples reseñas el mismo día", "Redacción de devolución vaga", "Dominio nuevo (< 1 año)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const pt: Translations = {
  nav: {
    howItWorks: "Como funciona", sampleReport: "Relatório de exemplo", pricing: "Planos e preços", faq: "Perguntas frequentes",
    signIn: "Entrar", register: "Criar conta", logout: "Sair", dashboard: "Painel",
  },
  auth: {
    login: {
      subtitle: "Entre para acessar seu painel de controle", emailLabel: "E-mail", passwordLabel: "Senha",
      submit: "Entrar", submitting: "Entrando…", noAccount: "Ainda não tem uma conta?",
      createAccount: "Criar conta", loginFailed: "Falha no login.", networkError: "Erro de rede. Por favor, tente novamente.",
      forgotPassword: "Esqueceu a senha?",
    },
    register: {
      subtitle: "Crie sua conta gratuita", nameLabel: "Nome completo", emailLabel: "E-mail",
      passwordLabel: "Senha", submit: "Criar conta", submitting: "Criando conta…",
      hasAccount: "Já tem uma conta?", signIn: "Entrar",
    },
    forgotPassword: {
      subtitle: "Enviaremos um link de redefinição",
      emailLabel: "Endereço de e-mail",
      submit: "Enviar link", submitting: "Enviando…",
      sentTitle: "Verifique sua caixa de entrada",
      sentDesc: "Se houver uma conta para esse e-mail, enviamos um link de redefinição. Ele expira em 1 hora.",
      backToLogin: "Voltar para entrar",
      networkError: "Erro de rede. Por favor, tente novamente.",
    },
    resetPassword: {
      subtitle: "Escolha uma nova senha",
      newPasswordLabel: "Nova senha", confirmLabel: "Confirmar senha",
      submit: "Redefinir senha", submitting: "Redefinindo…",
      mismatch: "As senhas não coincidem.",
      tooShort: "A senha deve ter pelo menos 8 caracteres.",
      invalidToken: "Link de redefinição inválido ou expirado.",
      failed: "Falha ao redefinir. Por favor, tente novamente.",
      networkError: "Erro de rede. Por favor, tente novamente.",
      requestNew: "Solicitar novo link",
      successTitle: "Senha atualizada!",
      successDesc: "Sua senha foi alterada. Redirecionando para entrar…",
    },
  },
  hero: {
    badge: "Verificação de segurança pré-compra com IA", title: "Esta loja é", titleAccent: "segura para comprar?",
    subtitle: "Cole qualquer link de loja ou produto. Receba um relatório de segurança IA em 30 segundos — pontuação de confiança, análise de avaliações, risco de devolução e um veredicto claro.",
    cta: "Analisar esta loja", placeholder: "https://loja.com/produto/...",
    trustNote: "Cadastro gratuito · 1 verificação incluída · Resultados em <30s", worksWithLabel: "Funciona com",
  },
  howItWorks: {
    badge: "Como funciona", heading: "Três etapas.", headingAccent: "Em menos de 30 segundos.",
    steps: [
      { title: "Cole seu link", desc: "Insira qualquer URL de produto ou domínio de loja. Shopify, Amazon ou qualquer página de e-commerce pública." },
      { title: "A IA analisa tudo", desc: "Escaneamos sinais da loja, coletamos avaliações, verificamos a política de devolução e detectamos padrões suspeitos." },
      { title: "Receba seu relatório", desc: "Análise completa de confiança — pontuação, risco de devolução, confiabilidade das avaliações, sinais de alerta e veredicto final." },
    ],
  },
  benefits: {
    badge: "Por que StorecheckAI",
    checkItems: ["Verificação HTTPS", "Idade do domínio", "Páginas de políticas", "Links de redes sociais"],
    peaceOfMind: "tranquilidade",
    cards: [
      { title: "Evite lojas fraudulentas", desc: "Verificamos HTTPS, idade do domínio, informações de contato, páginas de políticas e links de redes sociais — para saber se a loja é legítima antes de gastar um centavo." },
      { title: "Leia avaliações mais rápido", desc: "A IA resume centenas de avaliações em prós, contras e temas de reclamações. Ignore o ruído das falsas avaliações de 5 estrelas." },
      { title: "Conheça o risco de devolução", desc: "Decodificamos políticas de devolução — armadilhas de reembolso, taxas ocultas, linguagem vaga — e fornecemos uma classificação de risco clara." },
      { title: "Um veredicto. Sem adivinhações.", desc: "Comprar · Comprar com cautela · Evitar — um veredicto final de IA. Porque você não compra resumos, você compra" },
    ],
  },
  pricing: {
    badge: "Planos e preços", heading: "Simples e transparente,", headingAccent: "sem taxas ocultas.",
    subtitle: "Pague por verificação ou economize mais com um plano mensal. Sem taxas ocultas.",
    mostPopular: "Mais popular", perCheck: "por verificação", perMonth: "por mês",
    processing: "Processando…",
    secureNote: "Checkout seguro via Stripe · Cancele a qualquer momento · Verificações não expiram no período de cobrança",
    plans: [
      { name: "Starter", desc: "Pague apenas quando precisar. Sem assinatura, sem compromisso.", cta: "Comprar uma verificação" },
      { name: "Personal", desc: "10 verificações incluídas. Relatórios completos avançados toda vez.", cta: "Começar Personal — $19,99/mês" },
      { name: "Pro", desc: "50 verificações incluídas. Melhor custo-benefício para usuários avançados e equipes.", cta: "Começar Pro — $39,99/mês" },
    ],
    features: {
      basicTrust: "Pontuação de confiança básica", verdictBadge: "Distintivo de veredicto (COMPRAR / CAUTELA / EVITAR)",
      reviewSummary: "Resumo de avaliações", keyProsCons: "Principais prós e contras",
      priceComparison: "Comparação de preços", returnRisk: "Análise de risco de devolução",
      redFlagBreakdown: "Análise de sinais de alerta", facebookCheck: "Verificação de página do Facebook",
      reportHistory: "Histórico de relatórios", checksMonthly10: "10 verificações / mês incluídas",
      checksMonthly50: "50 verificações / mês incluídas", fullTrustBreakdown: "Análise completa da pontuação de confiança",
      priceComparisonFull: "Comparação de preços (Amazon e AliExpress)",
      suspiciousReviews: "Detecção de avaliações suspeitas", reportHistorySaved: "Histórico de relatórios (salvo)",
    },
  },
  faq: {
    badge: "Perguntas frequentes", heading: "Perguntas comuns",
    items: [
      { q: "Que tipos de lojas posso analisar?", a: "O StorecheckAI funciona com praticamente qualquer URL de e-commerce acessível publicamente — lojas Shopify, listagens da Amazon, Etsy, Walmart, Temu e marcas DTC. Basta colar a URL do produto ou da loja e nós cuidamos do resto." },
      { q: "O que está incluído em um relatório completo?", a: "Um relatório completo inclui: pontuação de confiança (0–100), veredicto COMPRAR / CAUTELA / EVITAR com explicação, avaliação de risco de devolução, nível de confiança das avaliações, prós e contras, sinais de alerta, comparação de preços com Amazon e AliExpress/Temu, e trechos do Trustpilot quando disponíveis." },
      { q: "Qual é a diferença entre Starter, Personal e Pro?", a: "Starter é pague por uso a $2,99/verificação sem assinatura. Personal ($19,99/mês) inclui 10 verificações completas por mês, com $1,25 por verificação extra. Pro ($39,99/mês) inclui 50 verificações por mês a $1,00 por verificação extra. Personal e Pro desbloqueiam relatórios completos, histórico de relatórios e todos os recursos avançados." },
      { q: "Meus relatórios são salvos após a verificação?", a: "As verificações Starter são anônimas — nada é salvo. Assinantes Personal e Pro podem acessar todo o histórico de relatórios no painel a qualquer momento." },
      { q: "Qual é a precisão da pontuação de confiança IA?", a: "Analisamos mais de 20 sinais: idade do domínio, HTTPS, dados de contato, qualidade das políticas de devolução e privacidade, presença social, avaliações do Trustpilot, padrões de avaliações e táticas de manipulação. Nenhuma ferramenta é perfeita, mas destacamos os principais sinais de alerta antes de você gastar dinheiro." },
      { q: "Meu relatório estará no meu idioma?", a: "Sim. Quando você seleciona um idioma, todo o texto gerado por IA no seu relatório — veredicto, resumo de devolução, prós, contras, sinais de alerta e análise de avaliações — é retornado nesse idioma." },
    ],
  },
  modal: {
    heading: "Crie sua conta", subheading: "1 verificação gratuita incluída · Sem necessidade de cartão de crédito",
    successTitle: "Conta criada!", successSub: "Fazendo login…",
  },
  analyzing: {
    heading: "Analisando loja…", timeNote: "Isso geralmente leva de 20 a 40 segundos",
    steps: ["Obtendo a página da loja", "Verificando sinais de segurança", "Escaneando páginas de políticas", "Verificando informações de contato", "Executando análise de IA", "Gerando seu relatório"],
  },
  footer: {
    tagline: "Ajudamos compradores a comprar com confiança.", rights: "Todos os direitos reservados.",
    privacy: "Privacidade", terms: "Termos", contact: "Contato",
  },
  sampleReport: {
    badge: "Relatório de exemplo", heading: "O que você", headingAccent: "realmente obtém",
    subtitle: "Não é só um número — é uma análise completa.",
    analyzedLabel: "Analisado", trustLabel: "Confiança", expandHint: "Toque para expandir",
    prosLabel: "Pontos positivos", consLabel: "Pontos negativos", redFlagsLabel: "Sinais de alerta",
    finalTakeLabel: "Deve comprar?",
    finalTakeAdvice: "Considere comprar de um varejista mais estabelecido.",
    buckets: { pass: "Parece bom", warn: "Vale verificar", fail: "Preocupações" },
    verdict: "Comprar com cautela",
    verdictDesc: "A loja tem sinais básicos de confiança, mas mostra padrões incomuns de avaliações e um histórico de domínio curto. Prossiga com cuidado.",
    finalTakeDesc: "O produto tem feedback de uso real decente, mas a loja é nova com sinais de confiança fracos.",
    passing: ["HTTPS / SSL ativado", "E-mail de contato encontrado", "Página de reembolso existente", "Presença ativa nas redes sociais"],
    warnings: ["Nenhum endereço físico indicado", "Domínio registrado há 8 meses", "Avaliações de produto limitadas"],
    failures: ["Padrões incomuns de avaliações detectados", "Custo de devolução pago pelo cliente"],
    pros: ["Boa duração de bateria (6–8h)", "Conforto de uso", "Qualidade de chamada clara", "Preço competitivo"],
    cons: ["Resposta de graves fraca", "Carcaça de plástico de baixa qualidade", "Problemas de emparelhamento no Android", "Sem cancelamento de ruído"],
    redFlags: ["Elogios genéricos repetidos", "Múltiplas avaliações no mesmo dia", "Redação de devolução vaga", "Domínio novo (< 1 ano)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const it: Translations = {
  nav: {
    howItWorks: "Come funziona", sampleReport: "Report di esempio", pricing: "Prezzi", faq: "Domande frequenti",
    signIn: "Accedi", register: "Registrati", logout: "Esci", dashboard: "Dashboard",
  },
  auth: {
    login: {
      subtitle: "Accedi per visualizzare la tua dashboard", emailLabel: "Indirizzo e-mail", passwordLabel: "Password",
      submit: "Accedi", submitting: "Accesso in corso…", noAccount: "Non hai ancora un account?",
      createAccount: "Crea un account", loginFailed: "Accesso non riuscito.", networkError: "Errore di rete. Riprova più tardi.",
      forgotPassword: "Password dimenticata?",
    },
    register: {
      subtitle: "Crea il tuo account gratuito", nameLabel: "Nome completo", emailLabel: "Indirizzo e-mail",
      passwordLabel: "Password", submit: "Crea account", submitting: "Creazione account…",
      hasAccount: "Hai già un account?", signIn: "Accedi",
    },
    forgotPassword: {
      subtitle: "Ti invieremo un link di reimpostazione",
      emailLabel: "Indirizzo e-mail",
      submit: "Invia link", submitting: "Invio in corso…",
      sentTitle: "Controlla la tua casella di posta",
      sentDesc: "Se esiste un account per quella e-mail, abbiamo inviato un link di reimpostazione. Scade tra 1 ora.",
      backToLogin: "Torna ad accedere",
      networkError: "Errore di rete. Riprova più tardi.",
    },
    resetPassword: {
      subtitle: "Scegli una nuova password",
      newPasswordLabel: "Nuova password", confirmLabel: "Conferma password",
      submit: "Reimposta password", submitting: "Reimpostazione…",
      mismatch: "Le password non corrispondono.",
      tooShort: "La password deve avere almeno 8 caratteri.",
      invalidToken: "Link di reimpostazione non valido o scaduto.",
      failed: "Reimpostazione fallita. Riprova più tardi.",
      networkError: "Errore di rete. Riprova più tardi.",
      requestNew: "Richiedi un nuovo link",
      successTitle: "Password aggiornata!",
      successDesc: "La tua password è stata modificata. Reindirizzamento all'accesso…",
    },
  },
  hero: {
    badge: "Controllo di sicurezza pre-acquisto con IA", title: "Questo negozio è", titleAccent: "sicuro per acquistare?",
    subtitle: "Incolla qualsiasi link di negozio o prodotto. Ricevi un report di sicurezza IA in 30 secondi — punteggio di fiducia, analisi delle recensioni, rischio di reso e un verdetto chiaro.",
    cta: "Analizza questo negozio", placeholder: "https://negozio.com/prodotto/...",
    trustNote: "Iscrizione gratuita · 1 verifica inclusa · Risultati in <30s", worksWithLabel: "Compatibile con",
  },
  howItWorks: {
    badge: "Come funziona", heading: "Tre passaggi.", headingAccent: "In meno di 30 secondi.",
    steps: [
      { title: "Incolla il link", desc: "Inserisci qualsiasi URL di prodotto o dominio di negozio. Shopify, Amazon o qualsiasi pagina di e-commerce pubblica." },
      { title: "L'IA analizza tutto", desc: "Scansioniamo i segnali, raccogliamo recensioni, verifichiamo la politica di reso e rileviamo schemi sospetti." },
      { title: "Ricevi il report", desc: "Analisi completa della fiducia — punteggio, rischio di reso, affidabilità delle recensioni, segnali d'allarme e verdetto finale." },
    ],
  },
  benefits: {
    badge: "Perché StorecheckAI",
    checkItems: ["Verifica HTTPS", "Età del dominio", "Pagine delle policy", "Link social"],
    peaceOfMind: "tranquillità",
    cards: [
      { title: "Evita i negozi truffaldini", desc: "Controlliamo HTTPS, età del dominio, informazioni di contatto, pagine delle policy e link social — così sai se il negozio è legittimo prima di spendere un centesimo." },
      { title: "Leggi le recensioni più veloce", desc: "L'IA riassume centinaia di recensioni in pro, contro e temi di reclamo. Ignora il rumore delle false 5 stelle." },
      { title: "Conosci il rischio di reso", desc: "Decodifichiamo le politiche di reso — trappole di rimborso, commissioni nascoste, formulazioni vaghe — e ti forniamo una valutazione del rischio chiara." },
      { title: "Un verdetto. Nessuna incertezza.", desc: "Acquistare · Acquistare con cautela · Evitare — un verdetto finale dell'IA. Perché non acquisti riassunti, acquisti" },
    ],
  },
  pricing: {
    badge: "Prezzi", heading: "Semplice e trasparente,", headingAccent: "senza costi nascosti.",
    subtitle: "Paga per verifica o risparmia di più con un piano mensile. Nessuna commissione nascosta.",
    mostPopular: "Più popolare", perCheck: "per verifica", perMonth: "al mese",
    processing: "Elaborazione…",
    secureNote: "Checkout sicuro tramite Stripe · Annulla in qualsiasi momento · Le verifiche non scadono nel periodo di fatturazione",
    plans: [
      { name: "Starter", desc: "Paga solo quando ne hai bisogno. Nessun abbonamento, nessun impegno.", cta: "Acquista una verifica" },
      { name: "Personal", desc: "10 verifiche incluse. Report avanzati completi ogni volta.", cta: "Inizia Personal — $19,99/mese" },
      { name: "Pro", desc: "50 verifiche incluse. Il miglior rapporto qualità-prezzo per utenti avanzati e team.", cta: "Inizia Pro — $39,99/mese" },
    ],
    features: {
      basicTrust: "Punteggio di fiducia di base", verdictBadge: "Badge verdetto (ACQUISTARE / ATTENZIONE / EVITARE)",
      reviewSummary: "Riepilogo delle recensioni", keyProsCons: "Pro e contro principali",
      priceComparison: "Confronto prezzi", returnRisk: "Analisi del rischio di reso",
      redFlagBreakdown: "Analisi dei segnali d'allarme", facebookCheck: "Verifica della pagina Facebook",
      reportHistory: "Cronologia dei report", checksMonthly10: "10 verifiche / mese incluse",
      checksMonthly50: "50 verifiche / mese incluse", fullTrustBreakdown: "Analisi completa del punteggio di fiducia",
      priceComparisonFull: "Confronto prezzi (Amazon e AliExpress)",
      suspiciousReviews: "Rilevamento di recensioni sospette", reportHistorySaved: "Cronologia dei report (salvata)",
    },
  },
  faq: {
    badge: "Domande frequenti", heading: "Domande comuni",
    items: [
      { q: "Quali tipi di negozi posso analizzare?", a: "StorecheckAI funziona con praticamente qualsiasi URL di e-commerce accessibile pubblicamente — negozi Shopify, inserzioni Amazon, Etsy, Walmart, Temu e brand DTC. Incolla semplicemente l'URL del prodotto o del negozio e noi ci occupiamo del resto." },
      { q: "Cosa include un report completo?", a: "Un report completo include: punteggio di fiducia (0–100), verdetto ACQUISTARE / ATTENZIONE / EVITARE con spiegazione, valutazione del rischio di reso, livello di affidabilità delle recensioni, pro e contro, segnali d'allarme, confronto prezzi con Amazon e AliExpress/Temu, ed estratti Trustpilot dove disponibili." },
      { q: "Qual è la differenza tra Starter, Personal e Pro?", a: "Starter è a pagamento per utilizzo a $2,99/verifica senza abbonamento. Personal ($19,99/mese) include 10 verifiche complete al mese, con $1,25 per verifica extra. Pro ($39,99/mese) include 50 verifiche al mese a $1,00 per verifica extra. Personal e Pro sbloccano report completi, cronologia dei report e tutte le funzioni avanzate." },
      { q: "I miei report vengono salvati dopo la verifica?", a: "Le verifiche Starter sono anonime — nulla viene salvato. Gli abbonati Personal e Pro possono accedere all'intera cronologia dei report dalla dashboard in qualsiasi momento." },
      { q: "Quanto è accurato il punteggio di fiducia IA?", a: "Analizziamo oltre 20 segnali: età del dominio, HTTPS, dati di contatto, qualità delle politiche di reso e privacy, presenza social, valutazioni Trustpilot, pattern di recensioni e tattiche di manipolazione. Nessuno strumento è perfetto, ma evidenziamo i segnali d'allarme più importanti prima che tu spenda soldi." },
      { q: "Il mio report sarà nella mia lingua?", a: "Sì. Quando selezioni una lingua, tutto il testo generato dall'IA nel tuo report — verdetto, riepilogo reso, pro, contro, segnali d'allarme e analisi delle recensioni — viene restituito in quella lingua." },
    ],
  },
  modal: {
    heading: "Crea il tuo account", subheading: "1 verifica gratuita inclusa · Nessuna carta di credito richiesta",
    successTitle: "Account creato!", successSub: "Accesso in corso…",
  },
  analyzing: {
    heading: "Analisi negozio…", timeNote: "Di solito ci vogliono 20–40 secondi",
    steps: ["Recupero della pagina", "Verifica dei segnali di sicurezza", "Scansione delle pagine delle policy", "Verifica delle informazioni di contatto", "Esecuzione dell'analisi IA", "Generazione del report"],
  },
  footer: {
    tagline: "Aiutiamo gli acquirenti a fare acquisti con fiducia.", rights: "Tutti i diritti riservati.",
    privacy: "Privacy", terms: "Termini", contact: "Contatto",
  },
  sampleReport: {
    badge: "Report di esempio", heading: "Cosa", headingAccent: "ottieni davvero",
    subtitle: "Non solo un numero — un'analisi completa.",
    analyzedLabel: "Analizzato", trustLabel: "Fiducia", expandHint: "Tocca per espandere",
    prosLabel: "Vantaggi", consLabel: "Svantaggi", redFlagsLabel: "Segnali d'allarme",
    finalTakeLabel: "Dovresti acquistare?",
    finalTakeAdvice: "Considera di acquistare da un rivenditore più consolidato.",
    buckets: { pass: "Sembra ok", warn: "Vale esaminare", fail: "Dubbi" },
    verdict: "Acquistare con cautela",
    verdictDesc: "Il negozio mostra segnali di fiducia di base ma evidenzia pattern di recensioni insoliti e una breve storia del dominio. Procedere con attenzione.",
    finalTakeDesc: "Il prodotto ha un feedback d'uso reale discreto, ma il negozio è nuovo con segnali di fiducia deboli.",
    passing: ["HTTPS / SSL attivo", "E-mail di contatto trovata", "Pagina di rimborso presente", "Presenza attiva sui social media"],
    warnings: ["Nessun indirizzo fisico indicato", "Dominio registrato 8 mesi fa", "Recensioni prodotto limitate"],
    failures: ["Rilevati pattern di recensioni insoliti", "Spese di reso a carico del cliente"],
    pros: ["Buona durata della batteria (6–8h)", "Comfort d'uso", "Qualità delle chiamate chiara", "Prezzo competitivo"],
    cons: ["Risposta bassi debole", "Custodia in plastica economica", "Problemi di associazione su Android", "Senza cancellazione del rumore"],
    redFlags: ["Elogi generici ripetuti", "Più recensioni lo stesso giorno", "Formulazione di reso vaga", "Dominio nuovo (< 1 anno)"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TRANSLATIONS: Record<Locale, Translations> = { en, fr, de, es, pt, it };

interface I18nContextType { locale: Locale; setLocale: (l: Locale) => void; t: Translations; }

const I18nContext = createContext<I18nContextType>({ locale: "en", setLocale: () => {}, t: en });

const STORAGE_KEY = "storecheckai_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) ?? "en") as Locale;
    if (ALL_TRANSLATIONS[saved]) setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: ALL_TRANSLATIONS[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
