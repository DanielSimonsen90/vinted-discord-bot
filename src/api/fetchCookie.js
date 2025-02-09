import { executeWithDetailedHandling } from "../utils/execute_helper.js";
import Logger from "../utils/logger.js";
import ConfigurationManager from "../managers/config_manager.js";
import RequestBuilder from "../utils/request_builder.js";

const extension = ConfigurationManager.getAlgorithmSetting.vintedApiDomainExtension;

/**
 * Fetches the session cookie from the headers of the response to a GET request to the given URL.
 * @param {string} url
 * @returns {Promise<{cookie: string}>}
 * @throws {DetailedExecutionResultError}
 */
export async function fetchCookie() {
  return await executeWithDetailedHandling(async () => {
    const url = `https://www.vinted.${extension}`;
    const response = await RequestBuilder.get(url).setNextProxy().send();

    if (response?.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];
      const vintedCookie = cookies.find(cookie => cookie.startsWith('access_token_web'));
      if (vintedCookie) {
        const [cookie] = vintedCookie.split(';');
        Logger.debug(`Fetched cookie: ${cookie}`);

        return { cookie };
      }

      throw new Error("Session cookie not found in the headers.");
    }

    throw new Error("No cookies found in the headers.");
  });

}