import {
  User, VintedChannel,
  UserRepository, VintedChannelRepository,
  REPOS,
  SchemaCollection
} from "./index.js";
import EventEmitter from "../utils/event_emitter.js";
import ConfigurationManager from "../managers/config_manager.js";

const userDefaultConfig = ConfigurationManager.getUserConfig;
const discordAdminIds = ConfigurationManager.getDiscordConfig.adminRoleIds;
export const eventEmitter = new EventEmitter();

/**
 * @param {import('discord.js').RepliableInteraction} interaction 
 * @param {string} messageContent 
 */
export function sendErrorEmbed(interaction, messageContent) {
  return interaction.reply({
    content: messageContent,
    ephemeral: true
  });
}

// CRUD Operations for User

/**
 * Create a new user.
 * @param {{
 *  discordId: string,
 *  preferences?: object,
 *  channels?: Array<string>,
 *  lastUpdated?: Date
 * }} userData - The user data.
 * @returns {Promise<User>} - The created user.
 */
export function createUser({ discordId, preferences = {}, channels = [], lastUpdated = new Date() }) {
  const user = UserRepository.addOne(new User({
    discordId,
    preferences,
    channels,
    lastUpdated,
    maxChannels: userDefaultConfig.defaultMaxPrivateChannels,
  }));
  UserRepository.save();
  eventEmitter.emit('updated');

  return user;
}

export async function isUserAdmin(interaction) {
  return interaction.member.roles.cache.some(role => discordAdminIds.includes(role.id));
}

export async function isUserOwnerOfChannel(interaction, userChannels, channelId, userId = null) {
  const user = await getUserById(userId);
  const isUserAdmin = await isUserAdmin(interaction);
  const isChannelOwner = userChannels.includes(channelId) || user?.channels.includes(channelId);

  return isUserAdmin || isChannelOwner;
}

/**
 * Get a user by their ID.
 * @param {string} id - The user ID.
 * @returns {Promise<User>} - The user.
 */
export async function getUserById(id) {
  return UserRepository.findById(id)?.populate({
    property: 'channels',
    repo: VintedChannelRepository
  });
}

/**
 * Get a user by their Discord ID.
 * @param {string} discordId - The Discord ID.
 * @returns {Promise<User>} - The user.
 */
export async function getOrCreateUserByDiscordId(discordId) {
  return UserRepository.findOne({ discordId })?.populate({
    property: 'channels',
    repo: VintedChannelRepository
  }) ?? createUser({ discordId });
}

/**
 * Update a user.
 * @param {string} id - The user ID.
 * @param {Object} updateData - The update data.
 * @returns {Promise<User>} - The updated user.
 */
export async function updateUser(id, { preferences, channels, lastUpdated, timeMonitored }) {
  const update = { preferences, channels, lastUpdated, timeMonitored };
  const result = UserRepository.findByIdAndUpdate(id, update, { new: true });
  eventEmitter.emit('updated');
  return result;
}

/**
 * Set the maximum number of channels a user can have.
 * @param {string} discordId - The Discord ID.
 * @param {number} maxChannels - The maximum number of channels.
 * @returns {Promise<User>} - The updated user.
 */
export async function setUserMaxChannels(discordId, maxChannels) {
  const user = await getOrCreateUserByDiscordId(discordId);
  if (!user) throw new Error('User not found');

  user.maxChannels = maxChannels;
  const result = await user.save();
  eventEmitter.emit('updated');
  return result;
}

/**
 * Delete a user.
 * @param {string} id - The user ID.
 * @returns {Promise<User>} - The deleted user.
 */
export async function deleteUser(id) {
  return UserRepository.findByIdAndDelete(id);
}

/**
 * Check if a user exists by their Discord ID.
 * @param {string} discordId - The Discord ID.
 * @returns {Promise<boolean>} - True if the user exists, false otherwise.
 */
export async function checkUserExists(discordId) {
  return UserRepository.exists({ discordId });
}

// #region Helper functions for handling preferences
/**
 * @param {typeof REPOS[keyof typeof REPOS]} repo 
 * @param {string} idKey 
 * @param {string} idValue 
 * @param {string} key 
 * @param {string} value 
 */
export async function setPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entities = repo.find(query);

  if (entities?.length && entities.some(entity => 'preferences' in entity)) {
    entities.forEach(entity => {
      entity.preferences[key] = value;
      repo.findByIdAndUpdate(entity.id, entity);
    });
    repo.save();
  }

  eventEmitter.emit('updated');
  return entities;
}

/**
 * @param {typeof REPOS[keyof typeof REPOS]} repo 
 * @param {string} idKey 
 * @param {string} idValue 
 * @param {string} key 
 * @param {any} value 
 */
export async function addToPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entity = repo.findOne(query);

  if (entity && 'preferences' in entity) {
    const preference = entity.preferences[key];
    if (preference?.includes(value)) {
      preference.push(value);
      // entity.preferences.set(key, preference);
      entity.preferences[key] = preference;
    } else {
      // entity.preferences.set(key, [preference]);
      entity.preferences[key] = [preference];
    }

    repo.findByIdAndUpdate(entity.id, entity);
    repo.save();
  }

  eventEmitter.emit('updated');
  return entity;
}

/**
 * @param {typeof REPOS[keyof typeof REPOS]} repo 
 * @param {string} idKey 
 * @param {string} idValue 
 * @param {string} key 
 * @param {any} value 
 */
export async function removeFromPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entity = repo.findOne(query);

  if (entity && 'preferences' in entity) {
    const preference = entity.preferences[key];
    if (preference) {
      const index = preference.indexOf(value);
      if (index > -1) {
        preference.splice(index, 1);
        entity.preferences[key] = preference;
        repo.findByIdAndUpdate(entity.id, entity);
        repo.save();
      }
    }
  }

  eventEmitter.emit('updated');
  return entity;
}
// #endregion

// #region User preference functions
/**
 * @param {string} discordId 
 * @param {string} key 
 * @param {any} value 
 */
export async function setUserPreference(discordId, key, value) {
  const user = await getOrCreateUserByDiscordId(discordId);

  return user
    ? setPreferenceKey(UserRepository, 'discordId', discordId, key, value)
    : sendErrorEmbed(interaction, t(l, 'user-not-found'));
}

export async function addUserPreference(discordId, key, value) {
  const user = await getOrCreateUserByDiscordId(discordId);

  return user
    ? addToPreferenceKey(UserRepository, 'discordId', discordId, key, value)
    : sendErrorEmbed(interaction, t(l, 'user-not-found'));
}

export async function removeUserPreference(discordId, key, value) {
  const user = await getOrCreateUserByDiscordId(discordId);

  return user
    ? removeFromPreferenceKey(UserRepository, 'discordId', discordId, key, value)
    : sendErrorEmbed(interaction, t(l, 'user-not-found'));
}

// Wrapper functions for VintedChannel preferences

export async function setVintedChannelPreference(channelId, key, value) {
  return setPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

export async function addVintedChannelPreference(channelId, key, value) {
  return addToPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

export async function removeVintedChannelPreference(channelId, key, value) {
  return removeFromPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

export async function getVintedChannelPreference(channelId, key) {
  const channel = await getVintedChannelById(channelId);
  return channel?.preferences[key];
}

export async function setVintedChannelUpdatedAtNow(channelId) {
  VintedChannelRepository.findByIdAndUpdate(channelId, { lastUpdated: new Date() });
  VintedChannelRepository.save();
}

export async function setVintedChannelBannedKeywords(channelId, bannedKeywords) {
  VintedChannelRepository.findByIdAndUpdate(channelId, { bannedKeywords });
  VintedChannelRepository.save();
}

export async function setVintedChannelKeepMessageSent(channelId, keepMessageSent) {
  VintedChannelRepository.findByIdAndUpdate(channelId, { keepMessageSent });
  VintedChannelRepository.save();
}
// CRUD Operations for VintedChannel

/**
 * Create a new Vinted channel.
 * @param {Partial<VintedChannel> & Pick<VintedChannel, 'channelId' | 'name'>} channelData - The channel data.
 * @returns {Promise<VintedChannel>} - The created channel.
 */
export function createVintedChannel({
  channelId, name,
  lastUpdated = new Date(), url = null,
  isMonitoring = true, type = 'public',
  user = null, preferences = new Map(),
  bannedKeywords = [],
}) {
  const result = VintedChannelRepository.addOne(new VintedChannel({
    channelId, lastUpdated, name,
    url, isMonitoring, type, user,
    preferences, bannedKeywords
  }));
  VintedChannelRepository.save();
  eventEmitter.emit('updated');
  return result;
}

/**
 * Get a Vinted channel by its ID.
 * @param {string} id - The channel ID.
 * @returns {Promise<VintedChannel>} - The channel.
 */
export async function getVintedChannelById(id) {
  return VintedChannelRepository.findOne({ id })?.populate({
    property: 'user',
    repo: UserRepository
  });
}

/**
 * Get all Vinted channels.
 * @returns {Array<SchemaCollection<VintedChannel>>} - The list of channels.
 */
export async function getAllVintedChannels() {
  return VintedChannelRepository.find()?.populate({
    property: 'user',
    repo: UserRepository
  });
}

/**
 * Get all private Vinted channels.
 * @returns {Array<SchemaCollection<VintedChannel>>} - The list of channels.
 */
export function getAllPrivateVintedChannels() {
  return VintedChannelRepository.find({ type: 'private' })?.populate({
    property: 'user',
    repo: UserRepository
  }) ?? [];
}

function parseVintedSearchParams(url) {
  try {
    const searchParams = {};
    const params = new URL(url).searchParams;
    const paramsKeys = ['search_text', 'order', 'catalog[]', 'brand_ids[]', 'size_ids[]', 'price_from', 'price_to', 'status_ids[]', 'material_ids[]', 'color_ids[]'];
    for (const key of paramsKeys) {
      const isMultiple = key.endsWith('[]');
      if (isMultiple) {
        searchParams[key.replace('[]', '')] = params.getAll(key) || null;
      } else {
        searchParams[key] = params.get(key) || null;
      }
    }
    return searchParams;
  } catch (error) {
    console.error("Invalid URL provided: ", error.message);
    return {};
  }
}

export async function getAllMonitoredVintedChannels() {
  return VintedChannelRepository.find({ isMonitoring: true })?.populate({
    property: 'user',
    repo: UserRepository
  }).map(channel => {
    channel.generated_filters = parseVintedSearchParams(channel.url);
    return channel;
  });
}

export async function getAllMonitoredVintedChannelsBrandMap() {
  const channels = await getAllMonitoredVintedChannels();
  const brandMap = new Map();

  for (const channel of channels) {
    const brands = channel.generated_filters["brand_ids"] ?? [];
    for (const brand of brands) {
      if (!brandMap.has(brand)) {
        brandMap.set(brand, [channel]);
      } else {
        brandMap.get(brand).push(channel);
      }
    }
  }

  return brandMap;
}

export async function getAllVintedChannelsByDiscordId(discordId) {
  const user = await getOrCreateUserByDiscordId(discordId);
  return VintedChannelRepository.find({ user: user.discordId })?.populate({
    property: 'user',
    repo: UserRepository
  });
}

/**
 * Update a Vinted channel.
 * @param {string} id - The channel ID.
 * @param {Partial<VintedChannel>} updateData - The update data.
 * @returns {Promise<VintedChannel>} - The updated channel.
 */
export async function updateVintedChannel(id, { channelId, lastUpdated, name, url, isMonitoring, type, user }) {
  const update = { channelId, lastUpdated, name, url, isMonitoring, type, user };
  const result = VintedChannelRepository.findByIdAndUpdate(id, update, { new: true });
  eventEmitter.emit('updated');
  return result;
}

/**
 * Start monitoring a Vinted channel.
 * @param {string} id - The channel ID.
 * @param {string} url - The channel URL.
 * @returns {Promise<VintedChannel>} - The updated channel.
 */
export async function startVintedChannelMonitoring(id, url) {
  const channel = VintedChannelRepository.findByIdAndUpdate(id, { isMonitoring: true, url }, { new: true });
  eventEmitter.emit('startMonitoring', channel); // TODO: use this lol
  eventEmitter.emit('updated');
  VintedChannelRepository.save();
  return channel;
}

/**
 * Stop monitoring a Vinted channel.
 * @param {string} id - The channel ID.
 * @returns {Promise<VintedChannel>} - The updated channel.
 */
export async function stopVintedChannelMonitoring(id) {
  const channel = VintedChannelRepository.findByIdAndUpdate(id, { isMonitoring: false }, { new: true });
  eventEmitter.emit('stopMonitoring', channel);
  eventEmitter.emit('updated');
  return channel;
}

/**
 * Delete a Vinted channel.
 * @param {string} id - The channel ID.
 * @returns {Promise<VintedChannel>} - The deleted channel.
 */
export async function deleteVintedChannel(id) {
  const result = VintedChannelRepository.findByIdAndDelete(id);
  eventEmitter.emit('updated');
  return result;
}

export async function deleteVintedChannelByChannelId(channelId) {
  const channel = VintedChannelRepository.findOne({ channelId: channelId });
  return channel ? deleteVintedChannel(channel.id) : undefined;
}

/**
 * Check if a Vinted channel exists by its ID.
 * @param {string} channelId - The channel ID.
 * @returns {Promise<boolean>} - True if the channel exists, false otherwise.
 */
export async function checkVintedChannelExists(channelId) {
  return VintedChannelRepository.exists({ channelId });
}

// Utility Functions

/**
 * Add a channel to a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 */
export async function addChannelToUser(userId, channelId) {
  const user = UserRepository.findById(userId);
  if (!user) return console.warn(`Unable to add channel ${channelId} to user ${userId}, as user is not saved in repo`);

  user.channels.push(channelId);
  UserRepository.findByIdAndUpdate(userId, user);
  UserRepository.save();
  eventEmitter.emit('updated');
}

/**
 * Check if a channel is in a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 * @returns {Promise<boolean>} - True if the channel is in the user's list, false otherwise.
 */
export async function checkChannelInUser(userId, channelId) {
  const user = UserRepository.findById(userId);
  if (user) return user.channels.includes(channelId);
  eventEmitter.emit('updated'); // ?? what are we updating
}

/**
 * Remove a channel from a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 */
export async function removeChannelFromUser(userId, channelId) {
  const user = UserRepository.findById(userId);
  if (user) {
    user.channels = user.channels.filter(c =>
      typeof c === 'string' ? c !== channelId
        : typeof c === 'object' && 'id' in c ? c.id !== channelId
          : true
    );

    UserRepository.findByIdAndUpdate(user.id, user);
    UserRepository.save();
  }
  eventEmitter.emit('updated');
}

export async function removeChannelFromUserByIds(discordId, channelId) {
  const user = await getOrCreateUserByDiscordId(discordId);
  if (user) {
    user.channels = user.channels.filter(c =>
      typeof c === 'string' ? c !== channelId
        : typeof c === 'object' && 'id' in c ? c.id !== channelId
          : true
    );

    UserRepository.findByIdAndUpdate(user.id, user);
    UserRepository.save();
  }
  eventEmitter.emit('updated');
}

export async function getUserFromChannel(channelId) {
  const channel = VintedChannelRepository.findOne({ channelId });
  return channel ? getUserById(channel.user) : undefined;
}