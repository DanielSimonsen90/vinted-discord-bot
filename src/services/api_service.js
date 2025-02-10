import { executeWithDetailedHandling, NotFoundError, ForbiddenError, RateLimitError } from "../utils/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../managers/config_manager.js";

const extension = ConfigurationManager.getAlgorithmSetting.vintedApiDomainExtension;

class ApiService {
  /**
   * @template TResponse
   * @typedef {(response: import("axios").AxiosResponse) => TResponse} ApiServiceRequestOnSuccess<TResponse>
   */

  /**
   * @template TResponse
   * @typedef {object} ApiServiceRequestOptions<TResponse>
   * @property {string} [cookie] The cookie for authentication
   * @property {string} [errorMessage] "Error fetching ${errorMessage}."
   * @property {((error: any) => void)} [onError] The function to call on error. This is responsible for handling the error.
   * @property {ApiServiceRequestOnSuccess<TResponse>} onSuccess The function to call on success. This is responsible for returning the data from the response.
   * @property {(response: import("axios").AxiosResponse) => Error} [onUnsuccess] The function to call on unsuccessful response. The error returned is thrown instead of the default error.
   */

  /**
   * @private
   * @template TResponse
   * @param {string} url The url to request
   * @param {ApiServiceRequestOnSuccess<TResponse> | ApiServiceRequestOptions<TResponse>} optionsOrOnSuccess The options for the request
   * @returns {Promise<TResponse>}
   */
  static reqeust(url, optionsOrOnSuccess) {
    const options = typeof optionsOrOnSuccess === "function"
      ? { onSuccess: optionsOrOnSuccess }
      : optionsOrOnSuccess;

    const { onSuccess, cookie, errorMessage, onError, onUnsuccess } = options;

    return executeWithDetailedHandling(async () => {
      const request = RequestBuilder
        .get(url)
        .setNextProxy();

      if (cookie) request.setCookie(cookie);

      const response = await request.send().catch(onError);
      if (!response.success) throw onUnsuccess 
        ? onUnsuccess(response) 
        : new NotFoundError(errorMessage 
          ? `Error fetching ${errorMessage}.` 
          : `Error fetching ${url}.`);

      return onSuccess(response);
    });
  }

  static origin = `https://www.vinted.${extension}`;
  static originApi = `${ApiService.origin}/api/v2`;

  /**
   * Fetch all catalog categories from Vinted
   * @param {string} cookie - Cookie for authentication.
   * @returns {Promise<Object>} - Promise resolving to the fetched catalog categories
   */
  fetchCatalogInitializer(cookie) {
    return ApiService.reqeust(`${ApiService.originApi}/catalog/initializers`, {
      cookie,
      errorMessage: "catalog items",
      onSuccess: response => ({ data: response.data.dtos })
    });
  }

  /**
   * Fetch catalog items from Vinted.
   * @param {Object} params - Parameters for fetching catalog items.
   * @param {string} params.cookie - Cookie for authentication.
   * @param {number} [params.per_page=96] - Number of items per page.
   * @param {string} [params.order='newest_first'] - Order of items.
   * @returns {Promise<Object>} - Promise resolving to the fetched catalog items.
   */
  fetchCatalogItems({ cookie, per_page = 96, order = 'newest_first' }) {
    return ApiService.reqeust(`${ApiService.originApi}/catalog/items?per_page=${per_page}&order=${order}`, {
      cookie,
      errorMessage: "catalog items",
      onSuccess: response => ({ items: response.data.items })
    });
  }

  /**
   * Fetches the session cookie from the headers of the response to a GET request to the given URL.
   * @param {string} url
   * @returns {Promise<{cookie: string}>}
   * @throws {DetailedExecutionResultError}
   */
  fetchCookie() {
    return ApiService.reqeust(ApiService.origin, {
      errorMessage: "cookie",
      onSuccess: response => {
        if (!response?.headers['set-cookie']) throw new Error("No cookies found in the headers.");

        const cookies = response.headers['set-cookie'];
        const vintedCookie = cookies.find(cookie => cookie.startsWith('access_token_web'));
        if (!vintedCookie) throw new Error("Session cookie not found in the headers.");

        const [cookie] = vintedCookie.split(';');
        return { cookie };
      }
    });
  }

  /**
   * Fetch a specific item by ID from Vinted.
   * @param {Object} params - Parameters for fetching an item.
   * @param {string} params.cookie - Cookie for authentication.
   * @param {number} params.item_id - ID of the item to fetch.
   * @returns {Promise<Object>} - Promise resolving to the fetched item.
   */
  fetchItem({ cookie, item_id }) {
    return ApiService.reqeust(`${ApiService.originApi}/items/${item_id}`, {
      cookie,
      errorMessage: "item",
      onSuccess: response => ({ item: response.data.item }),
      onUnsuccess: response => { 
        switch (response.code) {
          case 404: throw new NotFoundError("Item not found.");
          case 403: throw new ForbiddenError("Access forbidden.");
          case 429: throw new RateLimitError("Rate limit exceeded.");
          default: throw new Error(`Error fetching item. Code: ${code}`);
        }
      }
    });
  }
} 

const instance = new ApiService();
export default instance;