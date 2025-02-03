import { default as UserRepository } from './UserRepository.js';
import { default as GroupRepository } from './GroupRepository.js';
import { default as VintedChannelRepository } from './VintedChannelRepository.js';

export {
  UserRepository,
  GroupRepository,
  VintedChannelRepository
}

export const REPOS = {
  UserRepository,
  GroupRepository,
  VintedChannelRepository,
}

export default REPOS;