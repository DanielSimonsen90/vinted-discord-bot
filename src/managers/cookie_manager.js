import ApiService from '../services/api_service.js';
import Logger from '../utils/logger.js';
import SettingsRepository from '../database/repositories/SettingsRepository.js';

const refreshCookie = async () => {
  let cookie;
  while (!cookie) {
    try {
      cookie = (await ApiService.fetchCookie()).cookie;

      if (cookie) {
        Logger.debug('Fetched cookie from Vinted');
        return cookie;
      }
    } catch (error) {
      Logger.debug('Error fetching cookie');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTimeout(() => {
      Logger.debug('Retrying to fetch cookie');
    }, 1000);
  }
};

Logger.info('Fetching cookie from Vinted');

var cookie = await refreshCookie();

setInterval(async () => {
  try {
    if (!SettingsRepository.current.paused) cookie = await refreshCookie();
  } catch (error) {
    Logger.debug('Error refreshing cookie');
  }
}, 60000);  // 60 seconds

export default function getCookie() {
  return cookie;
}