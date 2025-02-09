import { executeWithDetailedHandling, NotFoundError } from "../utils/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../managers/config_manager.js";

const extension = ConfigurationManager.getAlgorithmSetting.vintedApiDomainExtension;

/**
 * Fetch all catalog categories from Vinted
 * @param {Object} params - Parameters for fetching catalog categories
 * @param {string} params.cookie - Cookie for authentication.
 * @returns {Promise<Object>} - Promise resolving to the fetched catalog categories
 */
export async function fetchCatalogInitializer({ cookie }) {
  return await executeWithDetailedHandling(async () => {
    const url = `https://www.vinted.${extension}/api/v2/catalog/initializers`;

    const response = await RequestBuilder.get(url)
      .setNextProxy()
      .setCookie(cookie)
      .send();

    if (!response.success) throw new NotFoundError("Error fetching catalog items.");
    return { data: response.data.dtos };
  });
}