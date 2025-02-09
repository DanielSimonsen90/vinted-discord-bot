import { SlashCommandBuilder } from "discord.js";

import PrivateChannelCreate from './privateChannel__create.js';
import PrivateChannelDelete from './privateChannel__delete.js';
import PrivateChannelDeleteAll from './privateChannel__deleteAll.js'

export default {
  data: new SlashCommandBuilder()
    .setName("private_channel")
    .setDescription("Modify private channels")
    .addSubcommand(PrivateChannelCreate.data)
    .addSubcommand(PrivateChannelDelete.data)
    .addSubcommand(PrivateChannelDeleteAll.data)
}