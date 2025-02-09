import { URL } from 'url';
import Fuse from 'fuse.js'; // Import Fuse.js

import Logger from '../utils/logger.js';
import { isSubcategory } from '../database/index.js';
import ConfigurationManager from '../managers/config_manager.js';

const blacklisted_countries_codes = ConfigurationManager.getAlgorithmSetting.blacklistedCountryCodes;

function parseVintedSearchParams(url) {
  try {
    const searchParams = {};
    const params = new URL(url).searchParams;
    const paramsKeys = [
      'search_text', 'order', 'catalog[]',
      'brand_ids[]', 'video_game_platform_ids[]',
      'size_ids[]', 'price_from', 'price_to',
      'status_ids[]', 'material_ids[]', 'color_ids[]'
    ];

    for (const key of paramsKeys) {
      const isMultiple = key.endsWith('[]');
      if (isMultiple) searchParams[key.replace('[]', '')] = params.getAll(key) || null;
      else searchParams[key] = params.get(key) || null;
    }

    return searchParams;
  } catch (error) {
    Logger.error("Invalid URL provided: ", error.message);
    return null;
  }
}

/**
 * Checks if a Vinted item matches the given search parameters and country codes, using fuzzy search.
 * @param {Object} item - The Vinted item to check.
 * @param {Object} searchParams - The search parameters to match against the item.
 * @param {Array} [countries_codes=[]] - The country codes to check against the item's user country code.
 * @return {boolean} Returns true if the item matches all the search parameters and country codes, false otherwise.
 */
function matchVintedItemToSearchParams(item, searchParams, bannedKeywords, countries_codes = []) {

  // Check blacklisted countries
  const isBlacklistedCountry = blacklisted_countries_codes.includes(item.user.countryCode);
  const isRegisteredCountry = countries_codes.length && countries_codes.includes(item.user.countryCode);
  if (isBlacklistedCountry || !isRegisteredCountry) {
    if (isBlacklistedCountry) console.debug('Blacklisted country, ' + item.user.countryCode);
    else console.debug('Outisde of countries_codes scope, ' + item.user.countryCode);
    return false;
  }

  const lowerCaseItem = {
    title: item.title.toLowerCase(),
    description: item.description.toLowerCase(),
    brand: item.brand.toLowerCase()
  };


  const titleOrDescriptionContainsBannedKeywords = bannedKeywords
    .some(keyword => (
      lowerCaseItem.title.includes(keyword.toLowerCase())
      || lowerCaseItem.description.includes(keyword.toLowerCase())
    ));

  if (titleOrDescriptionContainsBannedKeywords) return false;

  // Fuzzy search options
  const fuseOptions = {
    includeScore: true,
    threshold: 0.4,  // Adjust this value for fuzzy tolerance (lower is stricter, higher is more lenient)
    keys: ['title', 'description', 'brand']
  };

  // sanitize the search text
  if (searchParams.search_text && searchParams.search_text.length > 0 && searchParams.search_text !== " ") {
    const searchText = searchParams.search_text.toLowerCase();
    const fuse = new Fuse([lowerCaseItem], fuseOptions);
    const result = fuse.search(searchText);

    // If no result or score is too low, return false
    if (!result.length || result[0].score > 0.4) { // You can adjust the score threshold based on your needs
      return false;
    }
  }

  // Check catalog IDs

  const checkOne = searchParams.catalog.length && !searchParams.catalog.some(catalogId => isSubcategory(catalogId, item.catalogId));
  const checkTwo = searchParams.price_from && item.priceNumeric < searchParams.price_from;
  const checkThree = searchParams.price_to && item.priceNumeric > searchParams.price_to;
  if (checkOne || checkTwo || checkThree) return false;

  // Check other parameters
  const searchParamsMap = new Map([
    ['brand_ids', 'brandId'],
    ['video_game_platform_ids', 'videoGamePlatformId'],
    ['size_ids', 'sizeId'],
    ['status_ids', 'statusId'],
    ['material_ids', 'material'],
    ['color_ids', 'colorId'],
  ].map(([key, value]) => [key, item[value]]));

  for (const [key, value] of searchParamsMap) {
    if (searchParams[key] === undefined || searchParams[key] === null) continue;
    if (Array.isArray(searchParams[key])) {
      if (searchParams[key].length > 0 && !searchParams[key].includes(value.toString())) return false;
    } else {
      if (searchParams[key] !== value.toString()) return false;
    }
  }

  // If all criteria are met, return true
  return true;
}

export function filterItemsByUrl(items, url, bannedKeywords, countries_codes = []) {
  const searchParams = parseVintedSearchParams(url);
  if (!searchParams) return [];

  return items.filter(item => matchVintedItemToSearchParams(item, searchParams, bannedKeywords, countries_codes));
}

// the base URL for monitoring Vinted products
const VALID_BASE_URL = "catalog";

// validate that the URL is a Vinted catalog URL with at least one query parameter
export function validateUrl(url) {
  if (!url) return "invalid-url";

  try {
    // check if the route is the valid base URL
    // https://www.vinted.fr/catalog?...
    // split and find the catalog route
    // split the / and find the last element and compare it to the VALID_BASE_URL
    let route = new URL(url).pathname.split('/').pop();
    if (route !== VALID_BASE_URL) return "invalid-url-with-example";

    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    // check if the URL has at least one query parameter
    if (searchParams.toString().length === 0) return "must-have-query-params";

    // cehck if there is at least a brand_ids[] or video_game_platform_ids[] query parameter
    if (!searchParams.has('brand_ids[]') && !searchParams.has('video_game_platform_ids[]')) return "must-have-brand-query-param";

    return true;
  } catch (error) {
    return "invalid-url";
  }
}

export function urlContainsSearchTextParameter(url) {
  return new URL(url).searchParams.has('search_text');
}

// get .fr or other domain from the URL
export function getDomainInUrl(url) {
  const urlObj = new URL(url);
  let domain = urlObj.hostname.split('.').pop();

  // handle .co.uk and other domains get only uk
  if (domain === 'co') domain = urlObj.hostname.split('.').slice(-2)[0];

  return domain;
}