export type UILanguage = 'en' | 'nl';

interface Translations {
  [key: string]: { en: string; nl: string };
}

const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', nl: 'Home' },
  'nav.learn': { en: 'Learn', nl: 'Leren' },
  'nav.library': { en: 'Library', nl: 'Bibliotheek' },
  'nav.tutor': { en: 'Tutor', nl: 'Tutor' },
  'nav.stats': { en: 'Stats', nl: 'Statistieken' },
  'nav.settings': { en: 'Settings', nl: 'Instellingen' },

  // Home
  'home.title': { en: 'Today', nl: 'Vandaag' },
  'home.reviewsDue': { en: 'Reviews due', nl: 'Herhalingen te doen' },
  'home.newItems': { en: 'New words', nl: 'Nieuwe woorden' },
  'home.startSession': { en: 'Start session', nl: 'Start sessie' },
  'home.streak': { en: 'Day streak', nl: 'Dagen reeks' },
  'home.mastered': { en: 'Mastered', nl: 'Beheerst' },
  'home.noReviews': { en: 'No reviews due. Great job!', nl: 'Geen herhalingen te doen. Goed gedaan!' },
  'home.welcome': { en: 'Welcome to Learn Arabic', nl: 'Welkom bij Learn Arabic' },
  'home.welcomeDesc': {
    en: 'Learn 5,000+ common Arabic words with spaced repetition and AI-powered enrichment.',
    nl: 'Leer 5.000+ veelvoorkomende Arabische woorden met spaced repetition en AI-verrijking.',
  },

  // Learn session
  'learn.newWord': { en: 'New word', nl: 'Nieuw woord' },
  'learn.review': { en: 'Review', nl: 'Herhaling' },
  'learn.howWell': { en: 'How well did you know this?', nl: 'Hoe goed kende je dit?' },
  'learn.again': { en: 'Again', nl: 'Opnieuw' },
  'learn.hard': { en: 'Hard', nl: 'Moeilijk' },
  'learn.good': { en: 'Good', nl: 'Goed' },
  'learn.easy': { en: 'Easy', nl: 'Makkelijk' },
  'learn.correct': { en: 'Correct!', nl: 'Correct!' },
  'learn.incorrect': { en: 'Not quite right', nl: 'Niet helemaal goed' },
  'learn.showAnswer': { en: 'Show answer', nl: 'Toon antwoord' },
  'learn.next': { en: 'Next', nl: 'Volgende' },
  'learn.done': { en: 'Session complete!', nl: 'Sessie voltooid!' },
  'learn.doneDesc': { en: 'Great work! Come back later for more reviews.', nl: 'Goed gedaan! Kom later terug voor meer herhalingen.' },
  'learn.typeArabic': { en: 'Type in Arabic...', nl: 'Typ in het Arabisch...' },
  'learn.selectMeaning': { en: 'Select the meaning', nl: 'Selecteer de betekenis' },
  'learn.listenSelect': { en: 'Listen and select', nl: 'Luister en selecteer' },
  'learn.fillBlank': { en: 'Fill in the blank', nl: 'Vul het ontbrekende woord in' },
  'learn.submit': { en: 'Submit', nl: 'Verzend' },
  'learn.hint': { en: 'Hint', nl: 'Hint' },
  'learn.skip': { en: 'Skip', nl: 'Overslaan' },
  'learn.progress': { en: 'Progress', nl: 'Voortgang' },
  'learn.remaining': { en: 'remaining', nl: 'resterend' },
  'learn.quickDrill': { en: 'Quick Drill (60s)', nl: 'Snelle oefening (60s)' },
  'learn.timeUp': { en: "Time's up!", nl: 'Tijd is om!' },
  'learn.score': { en: 'Score', nl: 'Score' },

  // Library
  'library.title': { en: 'Word Library', nl: 'Woordenbibliotheek' },
  'library.search': { en: 'Search words...', nl: 'Zoek woorden...' },
  'library.all': { en: 'All', nl: 'Alle' },
  'library.new': { en: 'New', nl: 'Nieuw' },
  'library.learning': { en: 'Learning', nl: 'Leren' },
  'library.due': { en: 'Due', nl: 'Te doen' },
  'library.mastered': { en: 'Mastered', nl: 'Beheerst' },
  'library.generateAll': { en: 'Generate all missing AI data', nl: 'Genereer alle ontbrekende AI-data' },
  'library.generating': { en: 'Generating...', nl: 'Genereren...' },
  'library.regenerate': { en: 'Regenerate', nl: 'Opnieuw genereren' },
  'library.resetProgress': { en: 'Reset progress', nl: 'Reset voortgang' },
  'library.detail': { en: 'Word details', nl: 'Woorddetails' },
  'library.synonyms': { en: 'Synonyms', nl: 'Synoniemen' },
  'library.example': { en: 'Example', nl: 'Voorbeeld' },
  'library.notes': { en: 'Notes', nl: 'Opmerkingen' },
  'library.pos': { en: 'Part of speech', nl: 'Woordsoort' },
  'library.noAI': { en: 'AI data not generated yet', nl: 'AI-data nog niet gegenereerd' },

  // Tutor
  'tutor.title': { en: 'AI Tutor', nl: 'AI Tutor' },
  'tutor.placeholder': { en: 'Type your message...', nl: 'Typ je bericht...' },
  'tutor.send': { en: 'Send', nl: 'Verstuur' },
  'tutor.intro': {
    en: "Hi! I'm your Arabic tutor. I'll help you practice using the words you've learned. Let's start!",
    nl: "Hoi! Ik ben je Arabische tutor. Ik help je oefenen met de woorden die je hebt geleerd. Laten we beginnen!",
  },
  'tutor.needKey': { en: 'Add your OpenAI API key in Settings to use the tutor.', nl: 'Voeg je OpenAI API-key toe bij Instellingen om de tutor te gebruiken.' },
  'tutor.newSession': { en: 'New chat', nl: 'Nieuw gesprek' },

  // Stats
  'stats.title': { en: 'Statistics', nl: 'Statistieken' },
  'stats.today': { en: 'Today', nl: 'Vandaag' },
  'stats.reviews': { en: 'Reviews', nl: 'Herhalingen' },
  'stats.newLearned': { en: 'New learned', nl: 'Nieuw geleerd' },
  'stats.accuracy': { en: 'Accuracy', nl: 'Nauwkeurigheid' },
  'stats.time': { en: 'Time spent', nl: 'Tijd besteed' },
  'stats.weakItems': { en: 'Weak items', nl: 'Zwakke woorden' },
  'stats.distribution': { en: 'Mastery distribution', nl: 'Beheersing verdeling' },
  'stats.minutes': { en: 'min', nl: 'min' },

  // Settings
  'settings.title': { en: 'Settings', nl: 'Instellingen' },
  'settings.language': { en: 'Interface language', nl: 'Interfacetaal' },
  'settings.dailyNew': { en: 'Daily new words', nl: 'Dagelijks nieuwe woorden' },
  'settings.dailyReview': { en: 'Daily review target', nl: 'Dagelijks herhalingsdoel' },
  'settings.vowelized': { en: 'Show vowelized Arabic', nl: 'Toon Arabisch met klinkers' },
  'settings.keyboard': { en: 'Arabic keyboard mode', nl: 'Arabisch toetsenbord modus' },
  'settings.keyboardOff': { en: 'Off', nl: 'Uit' },
  'settings.keyboardOnscreen': { en: 'On-screen keyboard', nl: 'Schermtoetsenbord' },
  'settings.keyboardTranslit': { en: 'Transliteration helper', nl: 'Transliteratie helper' },
  'settings.apiKey': { en: 'OpenAI API key', nl: 'OpenAI API-sleutel' },
  'settings.apiKeyPlaceholder': { en: 'sk-...', nl: 'sk-...' },
  'settings.apiKeySaved': { en: 'API key saved', nl: 'API-sleutel opgeslagen' },
  'settings.model': { en: 'AI model', nl: 'AI-model' },
  'settings.ttsVoice': { en: 'TTS voice', nl: 'TTS-stem' },
  'settings.resetData': { en: 'Reset all data', nl: 'Alle data resetten' },
  'settings.resetConfirm': { en: 'This will delete all your progress. Are you sure?', nl: 'Dit verwijdert al je voortgang. Weet je het zeker?' },
  'settings.exportData': { en: 'Export data', nl: 'Exporteer data' },
  'settings.importData': { en: 'Import data', nl: 'Importeer data' },
  'settings.privacy': {
    en: 'Privacy: All data is stored locally on your device. The only external calls are to OpenAI when generating AI content or audio.',
    nl: 'Privacy: Alle data wordt lokaal op je apparaat opgeslagen. De enige externe verzoeken zijn naar OpenAI voor het genereren van AI-inhoud of audio.',
  },
  'settings.save': { en: 'Save', nl: 'Opslaan' },
  'settings.saved': { en: 'Settings saved!', nl: 'Instellingen opgeslagen!' },

  // Onboarding
  'onboarding.title': { en: 'Learn Arabic', nl: 'Leer Arabisch' },
  'onboarding.subtitle': {
    en: 'Master 5,000+ common Arabic words with spaced repetition.',
    nl: 'Beheers 5.000+ veelvoorkomende Arabische woorden met spaced repetition.',
  },
  'onboarding.local': {
    en: 'Everything is stored locally. No account needed.',
    nl: 'Alles wordt lokaal opgeslagen. Geen account nodig.',
  },
  'onboarding.aiFeatures': {
    en: 'Add an OpenAI API key for AI-powered translations, examples, and audio.',
    nl: 'Voeg een OpenAI API-sleutel toe voor AI-vertalingen, voorbeelden en audio.',
  },
  'onboarding.startWithoutAI': { en: 'Start without AI', nl: 'Start zonder AI' },
  'onboarding.addKey': { en: 'Add OpenAI key', nl: 'OpenAI-sleutel toevoegen' },

  // Common
  'common.loading': { en: 'Loading...', nl: 'Laden...' },
  'common.error': { en: 'Something went wrong', nl: 'Er ging iets mis' },
  'common.retry': { en: 'Retry', nl: 'Opnieuw proberen' },
  'common.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'common.confirm': { en: 'Confirm', nl: 'Bevestigen' },
  'common.close': { en: 'Close', nl: 'Sluiten' },
  'common.back': { en: 'Back', nl: 'Terug' },
  'common.meaning': { en: 'Meaning', nl: 'Betekenis' },
  'common.arabic': { en: 'Arabic', nl: 'Arabisch' },
  'common.english': { en: 'English', nl: 'Engels' },
  'common.dutch': { en: 'Dutch', nl: 'Nederlands' },
  'common.of': { en: 'of', nl: 'van' },
};

export function t(key: string, lang: UILanguage): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

export function getTranslation(word: { english: string; dutch: string }, lang: UILanguage): string {
  return lang === 'nl' && word.dutch ? word.dutch : word.english;
}
