import { Locale } from "discord.js";
import LanguageService from "./utils/language.js";

function formatString(template, values) {
  return template.replace(/{(\w+)}/g, (_, placeholder) => (
    values[placeholder] !== undefined ? values[placeholder] : `{${placeholder}}`
  ));
}

/**
 * @param {string} lang 
 * @param {string} key 
 * @param {Record<string, string> | undefined} values 
 */
export function t(lang, key, values = {}) {
  try {
    const template = LanguageService.getText(lang, key);
    return formatString(template, values);
  } catch (error) {
    console.error(error);
    return `Missing translation for "${key}" in "${lang}"`;
  }
}

export default t;

/**
 * @param {string} lang 
 * @param {string} key 
 * @param {string} icon 
 * @param {Record<string, string> | undefined} values 
 */
export function tWithIcon(lang, key, icon, values = {}) {
  return `${icon} ${t(lang, key, values)}`;
}