import LanguageService from "./utils/language.js";

function formatString(template, values) {
  return template.replace(/{(\w+)}/g, (_, placeholder) => (
    values[placeholder] !== undefined ? values[placeholder] : `{${placeholder}}`
  ));
}

export default function t(lang, key, values = {}) {
  try {
    const template = LanguageService.getText(lang, key);
    return formatString(template, values);
  } catch (error) {
    console.error(error);
    return `Missing translation for "${key}" in "${lang}"`;
  }
}