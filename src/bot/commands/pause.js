import { SlashCommandBuilder } from 'discord.js';
import t from '../../t.js';

import { SettingsRepository } from '../../database/index.js';
import PauseManager from '../../utils/pause_manager.js';

const PAUSE_REQUEST_VALUE = 'pause';
const RESUME_REQUEST_VALUE = 'resume';

export const data = new SlashCommandBuilder()
  .setName('pause')
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
  );

export async function execute(interaction) {
  const pauseState = interaction.options.getString('state');
  const pauseRequest = pauseState === PAUSE_REQUEST_VALUE;
  const resumeRequest = pauseState === RESUME_REQUEST_VALUE;

  const start = interaction.options.getNumber('start');
  const end = interaction.options.getNumber('end');

  if (pauseRequest || resumeRequest) SettingsRepository.override({ paused: pauseRequest });
  if (start !== undefined) {
    PauseManager.schedule('pauseHourStart', start, true);
    SettingsRepository.override({ pauseHourStart: start });
  }
  if (end !== undefined) {
    PauseManager.schedule('pauseHourEnd', end, false);
    SettingsRepository.override({ pauseHourEnd: end });
  }

  if (start !== undefined || end !== undefined) SettingsRepository.save();
  
  const l = interaction.locale;
  const settings = SettingsRepository.current;
  const response = [
    `**${t(l, 'pause')}**`,
    `${t(l, 'pause-state')}: ${pauseRequest ? t(l, 'pause-paused') : t(l, 'pause-resumed')}`,
    `${t(l, 'pause-start')}: ${settings.pauseHourStart}`,
    `${t(l, 'pause-end')}: ${settings.pauseHourEnd}`
  ];

  await interaction.reply({
    content: response.join('\n'),
    ephemeral: true
  });
}
