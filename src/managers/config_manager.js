import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Check if .env.local exists and load environment variables from it, overriding the default .env values
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

/**
 * Static class to manage application configurations.
 */
class ConfigurationManager {
  /**
   * Retrieves the Discord configuration section from environment variables.
   * @returns {Object} Discord configuration object.
   */
  static getDiscordConfig = {
    clientId: process.env.DISCORD_CLIENT_ID,
    token: process.env.DISCORD_TOKEN,
    adminRoleIds: process.env.DISCORD_ROLE_ADMIN_IDS.split(','),
    guildId: process.env.DISCORD_GUILD_ID,
    threadChannelId: process.env.DISCORD_THREAD_CHANNEL_ID,
    commandChannelId: process.env.DISCORD_COMMAND_CHANNEL_ID,
    channelInactivityEnabled: process.env.ENABLE_CHANNEL_INACTIVITY == 1,
    channelInactivityHours: process.env.CHANNEL_INACTIVITY_HOURS,
    channelInactivityDeleteHours: process.env.CHANNEL_INACTIVITY_DELETE_HOURS,
  };

  /**
   * Retrieves the user configuration from environment variables.
   * @returns {Object} User configuration object.
   */
  static getUserConfig = {
    defaultMaxPrivateChannels: process.env.USER_MAX_PRIVATE_CHANNELS_DEFAULT,
  };

  static getPermissionConfig = {
    allowUserToCreatePrivateChannels: process.env.ALLOW_USER_TO_CREATE_PRIVATE_CHANNELS == 1
  };

  /**
   * Retrieves the algorithm settings from environment variables.
   * @returns {Object} Algorithm settings object.
   */
  static getAlgorithmSetting = {
    vintedApiDomainExtension: process.env.VINTED_API_DOMAIN_EXTENSION,
    filterZeroStarsProfiles: process.env.ALGORITHM_FILTER_ZERO_STARS_PROFILES == 1,
    concurrentRequests: process.env.ALGORITHM_CONCURRENT_REQUESTS,
    blacklistedCountryCodes: process.env.BLACKLISTED_COUNTRIES_CODES.split(',') || []
  };

  /**
   * Retrieves the rotating proxy configuration from environment variables.
   * @returns {Array} Array of proxy configurations.
   */
  static getProxiesConfig = {
    useWebshare: process.env.USE_WEBSHARE == 1,
    webshareApiKey: process.env.WEBSHARE_API_KEY,
  };

  static getDevMode = process.env.DEV_MODE == 1
  static getBotDevMode = process.env.BOT_DEV_MODE == 1
  static getDumpLogs = process.env.DUMP_LOGS == 1
}

export default ConfigurationManager;
