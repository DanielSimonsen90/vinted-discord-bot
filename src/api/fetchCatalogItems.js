import { executeWithDetailedHandling, NotFoundError } from "../utils/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../managers/config_manager.js";

const extension = ConfigurationManager.getAlgorithmSetting.vintedApiDomainExtension;

/**
 * Fetch catalog items from Vinted.
 * @param {Object} params - Parameters for fetching catalog items.
 * @param {string} params.cookie - Cookie for authentication.
 * @param {number} [params.per_page=96] - Number of items per page.
 * @param {string} [params.order='newest_first'] - Order of items.
 * @returns {Promise<Object>} - Promise resolving to the fetched catalog items.
 */
export async function fetchCatalogItems({ cookie, per_page = 96, order = 'newest_first' }) {
  return await executeWithDetailedHandling(async () => {
    const url = `https://www.vinted.${extension}/api/v2/catalog/items?per_page=${per_page}&order=${order}`;

    const response = await RequestBuilder.get(url)
      .setNextProxy()
      .setCookie(cookie)
      .send();

    if (!response.success) {
      throw new NotFoundError("Error fetching catalog items.");
    }

    return { items: response.data.items };
  });
}
