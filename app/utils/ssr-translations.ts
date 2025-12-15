/**
 * SSR-safe translation fallbacks
 * Hungarian translations for server-side rendering
 */

export const ssrTranslationsHu: Record<string, string> = {
  // Navigation
  "nav.login": "Bejelentkezés",
  "nav.register": "Regisztráció",
  "nav.logout": "Kijelentkezés",
  "nav.map": "Terem Térkép",
  "nav.reservations": "Foglalásaim",
  "nav.profile": "Profil",
  "nav.myReservations": "Foglalásaim",
  "nav.settings": "Beállítások",
  "nav.admin": "Admin Panel",
  "nav.roomManagement": "Teremkezelés",

  // Login
  "login.title": "Bejelentkezés",
  "login.email": "E-mail cím",
  "login.password": "Jelszó",
  "login.submit": "Bejelentkezés",
  "login.noAccount": "Nincs még fiókod?",
  "login.registerLink": "Regisztráció itt",
  "login.welcomeText": "Jelentkezz be a fiókodba, hogy hozzáférj az összes funkcióhoz és kezdd el használni a rendszert.",
  "login.subtitle": "Lépj be a fiókodba",
  "login.feature.map": "Interaktív térkép",
  "login.feature.mapDesc": "Böngéssz a termek között vizuális térképen",
  "login.feature.quick": "Gyors foglalás",
  "login.feature.quickDesc": "Foglalj termet pár kattintással",
  "login.feature.notify": "Értesítések",
  "login.feature.notifyDesc": "Értesülj a foglalásaidról valós időben",

  // Register
  "register.title": "Regisztráció",
  "register.firstName": "Keresztnév",
  "register.lastName": "Vezetéknév",
  "register.email": "E-mail cím",
  "register.password": "Jelszó",
  "register.confirmPassword": "Jelszó megerősítése",
  "register.submit": "Regisztráció",
  "register.hasAccount": "Van már fiókod?",
  "register.loginLink": "Bejelentkezés itt",

  // Auth
  "auth.checkYourEmail": "Ellenőrizd az Emailedet",
  "auth.verificationEmailSent": "Elküldtünk egy megerősítő linket az email címedre.",
  "auth.clickVerificationLink": "Kérjük, kattints az emailben található linkre a fiókod aktiválásához.",
  "auth.linkExpiresIn24Hours": "A megerősítő link 24 órán belül lejár.",
  "auth.didntReceiveEmail": "Nem kaptad meg az emailt?",
  "auth.resendEmail": "Megerősítő Email Újraküldése",
  "auth.backToLogin": "Vissza a Bejelentkezéshez",
  "auth.emailVerified": "Email Megerősítve!",
  "auth.emailVerifiedMessage": "Az email címed sikeresen megerősítésre került. Most már bejelentkezhetsz a fiókodba.",
  "auth.continueToLogin": "Tovább a Bejelentkezéshez",
  "auth.showPassword": "Jelszó megjelenítése",
  "auth.hidePassword": "Jelszó elrejtése",
  "auth.passwordRequirements": "Legalább 8 karakter nagybetűvel, kisbetűvel, számmal és speciális karakterrel",
  "auth.forgotPassword": "Elfelejtetted a jelszavad?",
  "auth.passwordResetSuccess": "Jelszó visszaállítás sikeres! Most már bejelentkezhetsz az új jelszavaddal.",
  "auth.termsNotice": "A regisztrációval elfogadod a",
  "auth.terms": "Felhasználási Feltételeket",
  "auth.acceptableUse": "Elfogadható Használat Irányelveit",
  "auth.privacyPolicy": "Adatvédelmi Irányelveket",

  // Errors
  "errors.invalidFormData": "Érvénytelen űrlap adatok",
  "errors.passwordsDoNotMatch": "A jelszavak nem egyeznek",
  "errors.passwordTooShort": "A jelszónak legalább 8 karakter hosszúnak kell lennie",
  "errors.passwordNeedsUppercase": "A jelszónak tartalmaznia kell legalább egy nagybetűt",
  "errors.passwordNeedsLowercase": "A jelszónak tartalmaznia kell legalább egy kisbetűt",
  "errors.passwordNeedsNumber": "A jelszónak tartalmaznia kell legalább egy számot",
  "errors.passwordNeedsSpecialChar": "A jelszónak tartalmaznia kell legalább egy speciális karaktert (!@#$%^&* stb.)",
  "errors.emailAlreadyExists": "Ez az email cím már létezik",
  "errors.invalidEmailOrPassword": "Érvénytelen email vagy jelszó",
  "errors.verifyEmailFirst": "Kérjük, először erősítsd meg az email címed a bejelentkezés előtt. Ellenőrizd a bejövő leveleid között a megerősítő linket.",
  "errors.accountLocked": "A fiók zárolva van túl sok sikertelen bejelentkezési kísérlet miatt. Ellenőrizd az emailedet a feloldási utasításokért.",
  "errors.invalidEmail": "Érvénytelen email cím",
  "errors.emailAlreadyVerified": "Az email cím már megerősítésre került. Most már bejelentkezhetsz.",
  "errors.tooManyVerificationEmails": "Túl sok megerősítő emailt küldtél. Kérjük, várj egy órát, mielőtt újat kérsz.",
  "errors.allFieldsRequired": "Minden mező kitöltése kötelező",
  "errors.passwordWeak": "A jelszó túl gyenge",

  // Common
  "common.cancel": "Mégse",
  "common.confirm": "Megerősítés",
  "common.save": "Mentés",
  "common.saving": "Mentés...",
  "common.delete": "Törlés",
  "common.add": "Hozzáadás",
  "common.remove": "Eltávolítás",
  "common.and": "és",
  "common.back": "Vissza",
  "common.ok": "Rendben",
  "common.success": "Sikeres",
  "common.sending": "Küldés...",
};

/**
 * Get translation with fallback
 */
export function getSSRTranslation(key: string, lang: 'hu' | 'en' = 'hu'): string {
  if (lang === 'hu') {
    return ssrTranslationsHu[key] || key;
  }
  // For English, return the key itself (will be handled by i18next)
  return key;
}
