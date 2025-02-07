import { SlashCommandSubcommandBuilder } from "discord.js";

import t from '../../../t.js';
import { REPOS } from '../../../database/repositories/index.js';
import Repository from '../../../database/repositories/Repository.js';
import ConfigurationManager from '../../../utils/config_manager.js';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("drop_data")
    .setDescription('Delete all information stored in the database.'),

  execute: async (interaction) => {
    const executorHasAdminRole = interaction.member.roles.cache.some(role => ConfigurationManager.getDiscordConfig.adminRoleIds.includes(role.id));
    if (!executorHasAdminRole) return interaction.reply(t(interaction.locale, 'drop-data_not-allowed'));

    for (key in REPOS) {
      /** @type {Repository} */
      const repo = REPOS[key];
      repo.drop();
    }

    return interaction.reply(t(interaction.locale, 'drop-data_success'));
  }
}