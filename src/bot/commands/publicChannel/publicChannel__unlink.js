import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("unlink")
    .setDescription("Unlink a public monitoring channel"),

  execute: async (interaction) => {
    try {
      await sendWaitingEmbed(interaction, 'Deleting public channel...');

      const isUserAdmin = await crud.isUserAdmin(interaction);
      if (!isUserAdmin) return sendErrorEmbed(interaction, 'You do not have permission to delete a public channel.');

      const channelId = interaction.channel.id;

      // Find the VintedChannel by channelId
      const vintedChannel = await crud.getVintedChannelById(channelId);
      if (!vintedChannel || vintedChannel.type !== 'public') return sendErrorEmbed(interaction, 'Public channel not found.');

      // Delete the VintedChannel from the database
      await crud.deleteVintedChannel(vintedChannel.id);

      const embed = await createBaseEmbed(
        interaction,
        'Public Channel Deleted',
        `Public channel with ID ${channelId} has been deleted successfully.`,
        0xFF0000
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error deleting public channel:', error);
      await sendErrorEmbed(interaction, 'There was an error deleting the public channel.');
    }
  }
};