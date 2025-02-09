import { SlashCommandBuilder } from "discord.js";

import PrivateChannelLink from './publicChannel__link.js';
import PublicChannelUnlink from './publicChannel__unlink.js';

export default {
  data: new SlashCommandBuilder()
    .setName("public_channel")
    .setDescription("Modify public channels")
    .addSubcommand(PrivateChannelLink.data)
    .addSubcommand(PublicChannelUnlink.data)
};