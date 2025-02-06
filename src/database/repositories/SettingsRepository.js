import Settings from "../models/Settings.js";
import Repository from "./Repository.js";

/**
 * @extends Repository<import('../models/Settings.js').Settings>
 */
class SettingsRepository extends Repository {
  /**
   * @typedef {{ 
   *  [Key in keyof Settings as Settings[Key] extends ((...args: any[]) => any) 
   *    ? never 
   *    : Key extends '_id' 
   *      ? never 
   *      : Key
   *  ]?: Settings[Key] 
   * }} SettingsUpdate
   */

  get current() {
    return this.__cache[0] ?? {};
  }
  set current(value) {  
    this.__cache[0] = value;
  }

  /**
   * @param {SettingsUpdate} settings 
   */
  override(settings) {
    this.current = { ...this.current, ...settings };
    return this;
  }
}

export const instance = new SettingsRepository("settingss", Settings);
export default instance;