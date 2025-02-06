import { default as UserRepository } from './UserRepository.js';
import { default as GroupRepository } from './GroupRepository.js';
import { default as VintedChannelRepository } from './VintedChannelRepository.js';
import { default as SettingsRepository } from './SettingsRepository.js';

export {
  UserRepository,
  GroupRepository,
  VintedChannelRepository,

  SettingsRepository,
}

export const REPOS = {
  UserRepository,
  GroupRepository,
  VintedChannelRepository,
  SettingsRepository,
}

export default REPOS;