import Logger from "../utils/logger.js";
import EventEmitter from '../utils/event_emitter.js';

import { VintedItem } from "../entities/VintedItem.js";

import {
  getAllMonitoredVintedChannels, getAllMonitoredVintedChannelsBrandMap,
  Preference, SettingsRepository
} from '../database/index.js';

import { filterItemsByUrl } from "../services/url_service.js";
import { sendToChannel } from "../services/discord_service.js";
import CatalogService from "../services/catalog_service.js";

import ConfigurationManager from "./config_manager.js";


Logger.info('Fetching monitored channels');
let allMonitoringChannels = getAllMonitoredVintedChannels();
let allMonitoringChannelsBrandMap = getAllMonitoredVintedChannelsBrandMap();

// Print the number of monitored channels
Logger.info(`Monitoring ${allMonitoringChannels.length} Vinted channels`);

EventEmitter.on('refresh-monitored-channels', () => {
  allMonitoringChannels = getAllMonitoredVintedChannels();
  allMonitoringChannelsBrandMap = getAllMonitoredVintedChannelsBrandMap();
  Logger.debug('Updated vinted channels');
});

const monitorChannels = () => {
  const handleItem = async (rawItem) => {
    Logger.debug('Handling item');
    const item = new VintedItem(rawItem);

    if (item.getNumericStars() === 0 && ConfigurationManager.getAlgorithmSetting.filterZeroStarsProfiles) return;

    const rawItemBrandId = item.brandId ? item.brandId.toString() : null;
    Logger.debug(`[${item.brandId}] ${item.brand}`);

    if (allMonitoringChannelsBrandMap.has(rawItemBrandId)) {
      const brandChannels = allMonitoringChannelsBrandMap.get(rawItemBrandId);
      for (const brandChannel of brandChannels) {
        try {
          const user = brandChannel.user;
          const matchingItems = filterItemsByUrl(
            [item],
            brandChannel.url,
            brandChannel.bannedKeywords,
            brandChannel.preferences[Preference.Countries] || []
          );

          if (matchingItems.length > 0) sendToChannel(item, user, brandChannel);
        } catch (error) {
          Logger.error('Error sending to channel');
          Logger.error(error);
        }
      }
    }
  };

  (async () => {
    await CatalogService.findHighestIDUntilSuccessful(cookie);

    while (!SettingsRepository.current.paused) {
      try {
        await CatalogService.fetchUntilCurrentAutomatic(cookie, handleItem);
      } catch (error) {
        Logger.error(error);
      }
    }
  })();
};

Logger.info('Starting monitoring channels');

monitorChannels();