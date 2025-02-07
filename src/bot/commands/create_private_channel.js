import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from '../components/base_embeds.js';
import * as crud from '../../crud.js';
import { createPrivateThread } from '../../services/discord_service.js';
import t from '../../t.js';
import ConfigurationManager from '../../utils/config_manager.js';

const BASE_CATEGORY_NAME = 'Private Channels';

export const data = new SlashCommandBuilder()
  .setName('create_private_channel')
  .setDescription('Create a private monitoring channel.')
  .addStringOption(option =>
    option.setName('channel_name')
      .setDescription('The name of the channel to be created.')
      .setRequired(true));

const allowUserToCreatePrivateChannels = ConfigurationManager.getPermissionConfig.allow_user_to_create_private_channels;

export async function execute(interaction) {
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
    await sendErrorEmbed(interaction, 'There was an error creating the private channel: ```' + error + '```');
  }
}

async function findOrCreateCategory(channels, baseCategoryName) {
  // Find categories that match the base name and include a number suffix if needed
  let categoryNumber = 1;
  let currentCategory;

  // TODO: Fix while true loop... 
  while (true) {
    const categoryName = categoryNumber === 1 ? baseCategoryName : `${baseCategoryName} ${categoryNumber}`;
    currentCategory = channels.cache.find(c => (
      c.type === 4 
      && c.name === categoryName
    ));

    // If the category is found but has fewer than 40 channels, use it
    if (currentCategory?.children.cache.size < 40) return currentCategory;

    // If the category doesn't exist, create it
    if (!currentCategory) {
      try {
        return channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
          reason: 'Needed a new category for private channels due to limit'
        });
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    }

    // If the category is full, increment the category number to create or search for the next one
    categoryNumber++;
  }
}
