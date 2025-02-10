import Model from "./Model.js";

// const vintedChannelSchema = new Schema({
//     channelId: { type: String, unique: true, required: true },
//     lastUpdated: { type: Date, default: Date.now },
//     keepMessageSent: { type: Boolean, default: false },
//     name: { type: String, required: false },
//     url: { type: String, default: null },
//     bannedKeywords: { type: [String], default: [] },
//     isMonitoring: { type: Boolean, default: true },
//     type: { type: String, default: 'public' },
//     user: { type: Types.ObjectId, ref: 'User', default: null },
//     preferences: { type: Map, default: {} },
// });

export class VintedChannel extends Model {
  /**
   * @typedef {Object} VintedChannelData
   * @property {string} channelId
   * @property {Date} lastUpdated
   * @property {boolean} keepMessageSent
   * @property {string} name
   * @property {string} url
   * @property {string[]} bannedKeywords
   * @property {boolean} isMonitoring
   * @property {string} type
   * @property {string} user
   * @property {Record<string, Array<any>>} preferences
   */

  /**
   * @param {VintedChannelData} data
   */
  constructor({
    channelId, lastUpdated, keepMessageSent, 
    name, url, bannedKeywords, isMonitoring, 
    type, user, preferences
  }) {
    super();

    this.channelId = channelId;
    this.id = channelId;
    this.lastUpdated = lastUpdated;
    this.keepMessageSent = keepMessageSent;
    this.name = name;
    this.url = url;
    this.bannedKeywords = bannedKeywords;
    this.isMonitoring = isMonitoring;
    this.type = type;
    this.user = user;
    this.preferences = preferences;
  }
}

export default VintedChannel