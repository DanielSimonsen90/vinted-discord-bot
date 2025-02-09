import { fetchCookie } from "./src/api/fetchCookie.js";
import { fetchCatalogInitializer } from "./src/api/fetchCatalogInitializers.js";
import { Preference, SettingsRepository, buildCategoryMapFromRoots } from "./src/database/index.js";

import ProxyManager from "./src/utils/proxy_manager.js";
import ConfigurationManager from "./src/utils/config_manager.js";
import Logger from "./src/utils/logger.js";

import * as crud from "./src/crud.js";
import { VintedItem } from "./src/entities/vinted_item.js";

import { filterItemsByUrl } from "./src/services/url_service.js";
import { postMessageToChannel, checkVintedChannelInactivity } from "./src/services/discord_service.js";
import CatalogService from "./src/services/catalog_service.js";

import client from "./src/client.js";
import { createVintedItemEmbed, createVintedItemActionRow } from "./src/bot/components/item_embed.js";

try {
  await ProxyManager.init();
} catch (error) {
  Logger.error(`Failed to initialize proxies: ${error.message}`);
  Logger.info('Continuing without proxies...');
}

const algorithmSettings = ConfigurationManager.getAlgorithmSetting;
CatalogService.initializeConcurrency(algorithmSettings.concurrentRequests);

const getCookie = async () => (await fetchCookie()).cookie;
const refreshCookie = async () => {
  let cookie;
  while (!cookie) {
    try {
      cookie = await getCookie();
      if (cookie) {
        // Logger.info('Fetched cookie from Vinted');
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

const discordConfig = ConfigurationManager.getDiscordConfig;
const token = discordConfig.token;

Logger.info('Fetching cookie from Vinted');

var cookie = await refreshCookie();
// client.channels.cache.get(process.env.DISCORD_THREAD_CHANNEL_ID).send("Vinted cookie fetched. Monitoring will now start...");

setInterval(async () => {
  try {
    if (!SettingsRepository.current.paused) cookie = await refreshCookie();
  } catch (error) {
    Logger.debug('Error refreshing cookie');
  }
}, 60000);  // 60 seconds

Logger.info('Fetching catalog roots from Vinted');

await (async function getCatalogRoots(cookie) {
  let roots;
  while (!roots) {
    try {
      roots = await fetchCatalogInitializer({ cookie });
      if (roots) {
        buildCategoryMapFromRoots(roots);
        Logger.info('Fetched catalog roots from Vinted');
      }
    } catch (error) {
      Logger.debug('Error fetching catalog roots');
      console.error(error);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
})(cookie);

const sendToChannel = async (item, user, vintedChannel) => {
  // get the domain from the URL between vinted. and the next /
  const domain = vintedChannel.url.match(/vinted\.(.*?)\//)[1];
  const { embed, photosEmbeds } = await createVintedItemEmbed(item, domain);
  const actionRow = await createVintedItemActionRow(item, domain);

  const doMentionUser = user && vintedChannel.preferences[Preference.Mention];
  const mentionString = doMentionUser ? `<@${user.discordId}>` : '';

  try {
    await postMessageToChannel(
      token,
      vintedChannel.channelId,
      `${mentionString} `,
      [embed, ...photosEmbeds],
      [actionRow]
    );
  }
  catch (error) {
    Logger.debug('Error posting message to channel');
    Logger.debug(error);
  }
};

Logger.info('Fetching monitored channels');

let allMonitoringChannels = await crud.getAllMonitoredVintedChannels();
let allMonitoringChannelsBrandMap = await crud.getAllMonitoredVintedChannelsBrandMap();

// Print the number of monitored channels
Logger.info(`Monitoring ${allMonitoringChannels.length} Vinted channels`);

crud.eventEmitter.on('updated', async () => {
  allMonitoringChannels = await crud.getAllMonitoredVintedChannels();
  allMonitoringChannelsBrandMap = await crud.getAllMonitoredVintedChannelsBrandMap();
  Logger.debug('Updated vinted channels');
});

const monitorChannels = () => {
  const handleItem = async (rawItem) => {
    Logger.debug('Handling item');
    const item = new VintedItem(rawItem);

    if (item.getNumericStars() === 0 && algorithmSettings.filterZeroStarsProfiles) return;

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

if (discordConfig.channelInactivityEnabled) {
  //every 30 minutes
  setInterval(() => {
    checkVintedChannelInactivity(client);
  }, 1000 * 60 * 30);
}