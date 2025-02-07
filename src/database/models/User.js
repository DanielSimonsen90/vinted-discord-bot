import ConfigurationManager from '../../utils/config_manager.js';
import Model from './Model.js';

// const userSchema = new Schema({
//     discordId: { type: String, unique: true, required: true },
//     channels: [{ type: Types.ObjectId, ref: 'VintedChannel' }],
//     lastUpdated: { type: Date, default: Date.now },
//     maxChannels: { type: Number, default: ConfigurationManager.getUserConfig.max_private_channels_default },
//     preferences: { type: Map, default: {} },
// });

export class User extends Model {
  /**
   * @param {string} discordId
   * @param {string[]} channels
   * @param {Date} lastUpdated
   * @param {number} maxChannels
   * @param {Record<string, any>} preferences
   */
  constructor({
    discordId, lastUpdated,
    channels = [], 
    maxChannels = ConfigurationManager.getUserConfig.defaultMaxPrivateChannels, 
    preferences = {}
  }) {
    super();
    this.discordId = discordId;
    this.id = discordId;
    this.channels = channels;
    this.lastUpdated = lastUpdated;
    this.maxChannels = maxChannels;
    this.preferences = preferences;
  }
}

export default User;