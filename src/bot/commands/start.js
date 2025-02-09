import { ActionRowBuilder, CommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { validateUrl, urlContainsSearchTextParameter, getDomainInUrl } from '../../services/url_service.js';
import t from "../../t.js";
import { createBaseEmbed, sendWaitingEmbed, sendErrorEmbed, sendWarningEmbed } from "../components/base_embeds.js";
import * as crud from '../../crud.js';
import { Preference, ShippableMap, UserRepository } from '../../database/index.js';

const URL_KEY = "url";
const BANNED_WORDS_KEY = "bannede_ord";

export default {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start udkiggelse efter produkter, der matcher vinteds søgrefiltre.")
    .addStringOption(builder => builder
      .setName(URL_KEY)
      .setDescription("Vinted URL med søgefiltre")
    )
    .addStringOption(builder => builder
      .setName(BANNED_WORDS_KEY)
      .setDescription("Ignorerde ord. Adskil med komma (,)")
    ),

  /**
   * @param {CommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { channelId, user: { id: discordId }, locale: l } = interaction;
    const [url, bannedWordsString] = await ensureUrl(interaction);
    const bannedKeywords = bannedWordsString ? bannedWordsString.split(',').map(word => word.trim()) : [];

    const validation = validateUrl(url);
    if (!validation) return sendErrorEmbed(interaction, t(l, validation));

    try {
      await sendWaitingEmbed(interaction, t(l, 'creating-public-channel'));

      const isUserAdmin = await crud.isUserAdmin(interaction);
      if (!isUserAdmin) return sendErrorEmbed(interaction, t(l, 'not-allowed-to-create-public-channel'));
      else if (urlContainsSearchTextParameter(url)) await sendWarningEmbed(interaction, t(l, 'url-contains-search-text'));

      // Ensure user object
      const user = await crud.getOrCreateUserByDiscordId(discordId);

      // Create the VintedChannel
      await crud.createVintedChannel({
        channelId, url,
        isMonitoring: true,
        type: 'public',
        user: user.discordId,
        bannedKeywords
      });

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'monitoring-started'),
        t(l, 'monitoring-has-been-started', { url }),
        0x00FF00
      );

      const domain = getDomainInUrl(url);
      // VintedChannelRepository, used in setVintedChannelPreference, saves any loose data in this call
      await crud.setVintedChannelPreference(channelId, Preference.Countries, [...ShippableMap[domain], domain]);
      UserRepository.save();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating public channel:', error);
      await sendErrorEmbed(interaction, t(l, 'creating-public-channel-error', { error }));
    }
  }
};

/**
 * @param {CommandInteraction} interaction
 * @returns {Promise<[url: string, bannedWords?: string]>}
 */
async function ensureUrl(interaction) {
  const l = interaction.locale;
  const urlOption = interaction.options.getString(URL_KEY);
  const bannedWordsOption = interaction.options.getString(BANNED_WORDS_KEY);
  if (urlOption) return [urlOption, bannedWordsOption];

  const modalId = 'vintedbot.start.modal';
  const urlInputId = 'vintedbot.start.url-input';
  const bannedWordsId = 'vintedbot.start.banned-words-input';

  interaction.showModal(new ModalBuilder()
    .setCustomId(modalId)
    .setTitle(t(l, 'start-modal-title'))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(urlInputId)
          .setLabel(t(l, 'start-modal-url-label'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(t(l, 'start-modal-url-placeholder')),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(bannedWordsId)
          .setLabel(t(l, 'start-modal-banned-words-label'))
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      )
    ))
  );

  const modalInteraction = await interaction.awaitModalSubmit({
    time: 60_000,
    filter: modalInteraction => (
      modalInteraction.user.id === interaction.user.id
      && modalInteraction.customId === modalId
    )
  });

  return [urlInputId, bannedWordsId].map(modalInteraction.fields.getTextInputValue);
}