import {
  User, VintedChannel,
  UserRepository, VintedChannelRepository,
  REPOS,
  SchemaCollection
} from "./database/index.js";
import EventEmitter from "./utils/event_emitter.js";

import ConfigurationManager from "./utils/config_manager.js";

const userDefaultConfig = ConfigurationManager.getUserConfig;
const discordAdminId = ConfigurationManager.getDiscordConfig.role_admin_id;

const eventEmitter = new EventEmitter();

/**
 * 
 * @param {import('discord.js').RepliableInteraction} interaction 
 * @param {string} messageContent 
 */
function sendErrorEmbed(interaction, messageContent) {
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
async function createUser({ discordId, preferences = {}, channels = [], lastUpdated = new Date() }) {
  const user = UserRepository.addOne({ discordId, preferences, channels, lastUpdated, maxChannels: userDefaultConfig.max_private_channels_default });
  UserRepository.save();
  eventEmitter.emit('updated');

  return user;
}

async function isUserAdmin(interaction) {
  return await interaction.member.roles.cache.some(role => role.id === discordAdminId);
}

async function isUserOwnerOfChannel(interaction, user_channels, channel_id, user_id = null) {

  // get role admin id
  if (await isUserAdmin(interaction)) {
    return true;
  }

  if (user_channels.includes(channel_id)) {
    return true;
  }

  if (user_id) {
    const user = await getUserById(user_id);
    if (user.channels.includes(channel_id)) {
      return true;
    }
  }

  return null;
}

/**
 * Get a user by their ID.
 * @param {string} id - The user ID.
 * @returns {Promise<User>} - The user.
 */
async function getUserById(id) {
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
async function getUserByDiscordId(discordId) {
  let user = UserRepository.findOne({ discordId })?.populate({
    property: 'channels',
    repo: VintedChannelRepository
  });

  if (!user) {
    await crud.createUser({ discordId });
    user = UserRepository.findOne({ discordId })?.populate({
      property: 'channels',
      repo: VintedChannelRepository
    });
  }

  return user;
}

/**
 * Update a user.
 * @param {string} id - The user ID.
 * @param {Object} updateData - The update data.
 * @returns {Promise<User>} - The updated user.
 */
async function updateUser(id, { discordId, preferences, channels, lastUpdated, timeMonitored }) {
  const update = { discordId, preferences, channels, lastUpdated, timeMonitored };
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
async function setUserMaxChannels(discordId, maxChannels) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    throw new Error('User not found');
  }
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
async function deleteUser(id) {
  return UserRepository.findByIdAndDelete(id);
}

/**
 * Check if a user exists by their Discord ID.
 * @param {string} discordId - The Discord ID.
 * @returns {Promise<boolean>} - True if the user exists, false otherwise.
 */
async function checkUserExists(discordId) {
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
async function setPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entity = repo.findOne(query);

  if (entity && 'preferences' in entity) {
    entity.preferences.set(key, value);
    entity.markModified('preferences');
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
async function addToPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entity = repo.findOne(query);

  if (entity && 'preferences' in entity) {
    const preference = entity.preferences.get(key);
    if (preference) {
      if (!preference.includes(value)) {
        preference.push(value);
        entity.preferences.set(key, preference);
      }
    } else {
      entity.preferences.set(key, [value]);
    }

    entity.markModified('preferences');
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
async function removeFromPreferenceKey(repo, idKey, idValue, key, value) {
  const query = { [idKey]: idValue };
  const entity = repo.findOne(query);

  if (entity && 'preferences' in entity) {
    const preference = entity.preferences.get(key);
    if (preference) {
      const index = preference.indexOf(value);
      if (index > -1) {
        preference.splice(index, 1);
        entity.preferences.set(key, preference);
        entity.markModified('preferences');
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
 * @returns 
 */
async function setUserPreference(discordId, key, value) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    await sendErrorEmbed(interaction, t(l, 'user-not-found'));
    return;
  }

  return await setPreferenceKey(UserRepository, 'discordId', discordId, key, value);
}

async function addUserPreference(discordId, key, value) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    await sendErrorEmbed(interaction, t(l, 'user-not-found'));
    return;
  }

  return await addToPreferenceKey(UserRepository, 'discordId', discordId, key, value);
}

async function removeUserPreference(discordId, key, value) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    await sendErrorEmbed(interaction, t(l, 'user-not-found'));
    return;
  }

  return await removeFromPreferenceKey(UserRepository, 'discordId', discordId, key, value);
}

// Wrapper functions for VintedChannel preferences

async function setVintedChannelPreference(channelId, key, value) {
  return await setPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

async function addVintedChannelPreference(channelId, key, value) {
  return await addToPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

async function removeVintedChannelPreference(channelId, key, value) {
  return await removeFromPreferenceKey(VintedChannelRepository, 'channelId', channelId, key, value);
}

async function getVintedChannelPreference(channelId, key) {
  const channel = await getVintedChannelById(channelId);
  if (channel) {
    return channel.preferences.get(key);
  }
}

async function setVintedChannelUpdatedAtNow(channelId) {
  const channel = await getVintedChannelById(channelId);
  if (channel) {
    channel.lastUpdated = new Date();
    await channel.save();
  }
}

async function setVintedChannelBannedKeywords(channelId, bannedKeywords) {
  const channel = await getVintedChannelById(channelId);
  if (channel) {
    channel.bannedKeywords = bannedKeywords;
    VintedChannelRepository.findByIdAndUpdate(channel.id, channel);
    VintedChannelRepository.save();
  }
}

async function setVintedChannelKeepMessageSent(channelId, keepMessageSent) {
  const channel = await getVintedChannelById(channelId);
  if (channel) {
    channel.keepMessageSent = keepMessageSent;
    VintedChannelRepository.findByIdAndUpdate(channel.id, channel);
    VintedChannelRepository.save();
  }
}
// CRUD Operations for VintedChannel

/**
 * Create a new Vinted channel.
 * @param {Partial<VintedChannel> & Pick<VintedChannel, 'channelId' | 'name'>} channelData - The channel data.
 * @returns {Promise<VintedChannel>} - The created channel.
 */
async function createVintedChannel({
  channelId, name,
  lastUpdated = new Date(), url = null,
  isMonitoring = true, type = 'public',
  user = null, preferences = {}
}) {
  const result = VintedChannelRepository.addOne(new VintedChannel({
    channelId, lastUpdated, name,
    url, isMonitoring, type, user,
    preferences
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
async function getVintedChannelById(id) {
  return VintedChannelRepository.findOne({ channelId: id })?.populate({
    property: 'user',
    repo: UserRepository
  });
}

/**
 * Get all Vinted channels.
 * @returns {Array<SchemaCollection<VintedChannel>>} - The list of channels.
 */
async function getAllVintedChannels() {
  return VintedChannelRepository.find()?.populate({
    property: 'user',
    repo: UserRepository
  });
}

/**
 * Get all private Vinted channels.
 * @returns {Array<SchemaCollection<VintedChannel>>} - The list of channels.
 */
async function getAllPrivateVintedChannels() {
  return VintedChannelRepository.find({ type: 'private' })?.populate({
    property: 'user',
    repo: UserRepository
  });
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
    Logger.error("Invalid URL provided: ", error.message);
    return null;
  }
}

async function getAllMonitoredVintedChannels() {
  let channels = VintedChannelRepository.find({ isMonitoring: true })?.populate({
    property: 'user',
    repo: UserRepository
  });

  for (const channel of channels) {
    channel.generated_filters = parseVintedSearchParams(channel.url);
  }

  return channels;
}

async function getAllMonitoredVintedChannelsBrandMap() {
  const channels = await getAllMonitoredVintedChannels();
  const brandMap = new Map();

  for (const channel of channels) {
    const brands = channel.generated_filters["brand_ids"];
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

async function getAllVintedChannelsByDiscordId(discordId) {
  const user = await getUserByDiscordId(discordId);
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
async function updateVintedChannel(id, { channelId, lastUpdated, name, url, isMonitoring, type, user }) {
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
async function startVintedChannelMonitoring(id, url) {
  const toUpdate = { isMonitoring: true, url };
  const channel = VintedChannelRepository.findByIdAndUpdate(id, toUpdate, { new: true });
  eventEmitter.emit('startMonitoring', channel);
  eventEmitter.emit('updated');
  return channel;
}

/**
 * Stop monitoring a Vinted channel.
 * @param {string} id - The channel ID.
 * @returns {Promise<VintedChannel>} - The updated channel.
 */
async function stopVintedChannelMonitoring(id) {
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
async function deleteVintedChannel(id) {
  const result = VintedChannelRepository.findByIdAndDelete(id);
  eventEmitter.emit('updated');
  return result;
}

async function deleteVintedChannelByChannelId(channelId) {
  const channel = VintedChannelRepository.findOne({ channelId: channelId });
  if (channel) {
    return await deleteVintedChannel(channel._id);
  }
}

/**
 * Check if a Vinted channel exists by its ID.
 * @param {string} channelId - The channel ID.
 * @returns {Promise<boolean>} - True if the channel exists, false otherwise.
 */
async function checkVintedChannelExists(channelId) {
  return VintedChannelRepository.exists({ channelId });
}

// Utility Functions

/**
 * Add a channel to a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 */
async function addChannelToUser(userId, channelId) {
  const user = UserRepository.findById(userId);
  if (user) {
    user.channels.push(channelId);
    UserRepository.findByIdAndUpdate(userId, user);
    UserRepository.save();
  }
  eventEmitter.emit('updated');
}

/**
 * Check if a channel is in a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 * @returns {Promise<boolean>} - True if the channel is in the user's list, false otherwise.
 */
async function checkChannelInUser(userId, channelId) {
  const user = UserRepository.findById(userId);
  if (user) {
    return user.channels.includes(channelId);
  }
  eventEmitter.emit('updated');
}

/**
 * Remove a channel from a user's list of channels.
 * @param {string} userId - The user ID.
 * @param {string} channelId - The channel ID.
 */
async function removeChannelFromUser(userId, channelId) {
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

async function removeChannelFromUserByIds(discordId, channelId) {
  const user = await getUserByDiscordId(discordId);
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

async function getUserFromChannel(channelId) {
  const channel = VintedChannelRepository.findOne({ channelId });
  if (channel) {
    return await getUserById(channel.user);
  }
}

// Export the CRUD operations and utility functions

const crud = {
  createUser,
  isUserAdmin,
  isUserOwnerOfChannel,
  getUserById,
  getUserByDiscordId,
  getUserFromChannel,
  updateUser,
  setUserMaxChannels,
  setVintedChannelUpdatedAtNow,
  setVintedChannelBannedKeywords,
  setVintedChannelKeepMessageSent,
  deleteUser,
  checkUserExists,
  setUserPreference,
  addUserPreference,
  removeUserPreference,
  setVintedChannelPreference,
  addVintedChannelPreference,
  removeVintedChannelPreference,
  getVintedChannelPreference,
  createVintedChannel,
  getVintedChannelById,
  getAllVintedChannels,
  getAllPrivateVintedChannels,
  getAllMonitoredVintedChannels,
  getAllMonitoredVintedChannelsBrandMap,
  getAllVintedChannelsByDiscordId,
  updateVintedChannel,
  deleteVintedChannel,
  deleteVintedChannelByChannelId,
  checkVintedChannelExists,
  addChannelToUser,
  checkChannelInUser,
  removeChannelFromUser,
  removeChannelFromUserByIds,
  startVintedChannelMonitoring,
  stopVintedChannelMonitoring,
  eventEmitter
};

export default crud;
