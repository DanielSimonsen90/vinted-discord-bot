export const Preference = {
  Countries: "countries",
  Language: "language",
  Currency: "currency",
  Mention: "mention"
};

export const ShippableMap = {
  "pl": ["se", "lt", "sk", "hu", "ro", "cz", "dk", "hr", "fi"],
  "fr": ["nl", "be", "it", "es", "pt", "lu", "at"],
  "it": ["nl", "be", "fr", "es", "pt", "lu", "at"],
  "be": ["nl", "fr", "it", "es", "pt", "lu"],
  "es": ["nl", "be", "fr", "it", "pt", "lu"],
  "nl": ["be", "fr", "it", "es", "pt", "lu"],
  "pt": ["nl", "be", "fr", "it", "es"],
  "lu": ["nl", "be", "fr", "it", "es"],
  "fi": ["se", "dk", "lt", "pl"],
  "dk": ["se", "fi", "pl"],
  "se": ["fi", "dk", "pl"],
  "at": ["fr", "it"],
  "cz": ["sk", "pl"],
  "lt": ["fi", "pl"],
  "sk": ["cz", "pl"],
  "hr": ["pl"],
  "ro": ["pl", "gr"],
  "hu": ["pl"],
  "gr": ["ro"],
  "com": ["us"],
  "de": [],
  "uk": [],
};