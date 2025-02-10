import ConfigurationManager from "../managers/config_manager.js";
import { checkVintedChannelInactivity } from "./discord_service.js";
import client from "../bot/client.js";

const CHECK_EVERY_N_MINUTES = 30;

if (ConfigurationManager.getDiscordConfig.channelInactivityEnabled) {
  setInterval(() => {
    checkVintedChannelInactivity(client);
  }, 1000 * 60 * CHECK_EVERY_N_MINUTES);
}