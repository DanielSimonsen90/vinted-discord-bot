import Logger from "./src/utils/logger.js";
import "./src/bot/client.js";

import ProxyManager from "./src/managers/proxy_manager.js";

try {
  await ProxyManager.init();
  Logger.info(`Successfully initialized ${ProxyManager.proxies.length} proxies.`);
} catch (error) {
  Logger.error(`Failed to initialize proxies: ${error.message}`);
  Logger.info('Continuing without proxies...');
}

Logger.info('Initializing CatalogService...');
import CatalogService from "./src/services/catalog_service.js";
CatalogService.initializeConcurrency();
await CatalogService.getCatalogRoots();
Logger.info('CatalogService initialized.');