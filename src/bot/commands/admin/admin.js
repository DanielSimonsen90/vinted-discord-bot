import { SlashCommandBuilder } from "discord.js";

import AdminDropData from './admin__dropData.js';
import AdminPause from './admin__pause.js';
import AdminSetMaxChannels from './admin__setMaxChannels.js';

export default {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Change core functionality - Bot administrator only.")
    .addSubcommand(AdminDropData.data)
    .addSubcommand(AdminPause.data)
    .addSubcommand(AdminSetMaxChannels.data)
}