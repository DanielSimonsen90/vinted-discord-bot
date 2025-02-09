import { SlashCommandSubcommandBuilder } from "discord.js";

import { REPOS } from '../../../database/repositories/index.js';
import Repository from '../../../database/repositories/Repository.js';
import { isUserAdmin } from "../../../database/crud.js";
import LanguageService from "../../../services/language_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("drop_data")
    .setDescription('Delete all information stored in the database.'),

  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);

    const isAdmin = isUserAdmin(interaction);
    if (!isAdmin) return interaction.reply(t('drop-data_not-allowed'));

    for (const key in REPOS) {
      /** @type {Repository} */
      const repo = REPOS[key];
      repo.drop();
    }

    return interaction.reply(t('drop-data_success'));
  }
}