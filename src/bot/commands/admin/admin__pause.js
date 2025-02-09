import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import LanguageService from "../../../services/language_service.js";

import { SettingsRepository } from '../../../database/index.js';
import PauseManager from '../../../managers/pause_manager.js';

const PAUSE_REQUEST_VALUE = 'pause';
const RESUME_REQUEST_VALUE = 'resume';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("pause")
    .setDescription('Pause vintedbot from requesting from the vinted website.')
    .addStringOption(option => option
      .setName('state')
      .setDescription('Pause or unpause the bot.')
      .addChoices(
        { name: 'Pause', value: PAUSE_REQUEST_VALUE },
        { name: 'Resume', value: RESUME_REQUEST_VALUE }
      )
    )
    .addNumberOption(option => option
      .setName('start')
      .setDescription('The start hour of the pause.')
      .setMinValue(0).setMaxValue(23)
    )
    .addNumberOption(option => option
      .setName('end')
      .setDescription('The end hour of the pause.')
      .setMinValue(0).setMaxValue(23)
    ),

  /**
   * @param {CommandInteraction} interaction 
   */
  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);
    const pauseState = interaction.options.getString('state');
    const pauseRequest = pauseState === PAUSE_REQUEST_VALUE;
    const resumeRequest = pauseState === RESUME_REQUEST_VALUE;

    const start = interaction.options.getNumber('start');
    const end = interaction.options.getNumber('end');

    if (pauseRequest || resumeRequest) SettingsRepository.override({ paused: pauseRequest });
    if (start !== null) {
      PauseManager.schedule('pauseHourStart', start, true);
      SettingsRepository.override({ pauseHourStart: start });
    }
    if (end !== null) {
      PauseManager.schedule('pauseHourEnd', end, false);
      SettingsRepository.override({ pauseHourEnd: end });
    }

    if (start !== null || end !== null) SettingsRepository.save();

    const settings = SettingsRepository.current;
    const response = [
      `**${t('pause')}**`,
      `${t('pause-state')}: ${pauseRequest ? t('pause-paused') : t('pause-resumed')}`,
      `${t('pause-start')}: ${settings.pauseHourStart}`,
      `${t('pause-end')}: ${settings.pauseHourEnd}`
    ];

    await interaction.reply({
      content: response.join('\n'),
      flags: 'Ephemeral'
    });
  }
}