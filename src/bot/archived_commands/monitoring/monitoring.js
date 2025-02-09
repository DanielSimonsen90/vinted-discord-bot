import { SlashCommandBuilder } from "discord.js";

import MonitoringStart from './monitoring__start.js';
import MonitoringStop from './monitoring__stop.js';

export default {
  data: new SlashCommandBuilder()
    .setName("monitoring")
    .setDescription("Start or stop a monitoring process.")
    .addSubcommand(MonitoringStart.data)
    .addSubcommand(MonitoringStop.data)
}