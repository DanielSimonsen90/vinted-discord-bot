import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import { createPrivateThread } from "../../../services/discord_service.js";
import t from '../../../t.js';
import ConfigurationManager from "../../../utils/config_manager.js";

const allowUserToCreatePrivateChannels = ConfigurationManager.getPermissionConfig.allow_user_to_create_private_channels;

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a private monitoring channel.")
    .addStringOption(option =>
      option.setName('channel_name')
        .setDescription('The name of the channel to be created.')
        .setRequired(true)),

  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      await sendWaitingEmbed(interaction, t(l, 'creating-private-channel'));

      const channelName = interaction.options.getString('channel_name');
      const isUserAdmin = crud.isUserAdmin(interaction);

      if (!allowUserToCreatePrivateChannels && !isUserAdmin) {
        return sendErrorEmbed(interaction, t(l, 'not-allowed-to-create-private-channel'));
      }

      const discordId = interaction.user.id;

      // Check if the user exists and has not exceeded the channel limit
      let user = await crud.getUserByDiscordId(discordId);

      if (user.channels.length >= user.maxChannels) {
        return sendErrorEmbed(interaction, t(l, 'channel-limit-exceeded', { limit: user.maxChannels }));
      }

      // Create the private channel
      const privateChannel = await createPrivateThread(interaction.guild, channelName, discordId);

      // Create the VintedChannel
      const channelId = privateChannel.id;
      const vintedChannel = crud.createVintedChannel({
        channelId,
        name: channelName,
        isMonitoring: false,
        type: 'private',
        user: user.id,
        preferences: user.preferences
      });

      // Associate the channel with the user
      await crud.addChannelToUser(user.id, vintedChannel.id);

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'private-channel-created'),
        t(l, 'private-channel-created-success', { channelName: `<#${channelId}>` }),
        0x00FF00
      );

      await interaction.editReply({ embeds: [embed] });

      // Send a message in the private channel
      const privateChannelObj = await interaction.guild.channels.cache.get(channelId);
      await privateChannelObj.send(t(l, 'private-channel-welcome', { user: `<@${discordId}>` }));
    } catch (error) {
      console.error('Error creating private channel:', error);
      await sendErrorEmbed(interaction, t(l, 'private-channel-created-error', { error }));
    }
  }
};