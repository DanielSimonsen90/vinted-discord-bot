import schedule from 'node-schedule';
import SettingsRepository from '../database/repositories/SettingsRepository.js';
import Logger from './logger.js';

const DEFAULT_PAUSE_START_HOUR = 0;
const DEFAULT_PAUSE_END_HOUR = 6;

class PauseManager {
  constructor() {
    const { pauseHourStart, pauseHourEnd } = SettingsRepository.current;
    this.schedule('pauseHourStart', pauseHourStart ?? DEFAULT_PAUSE_START_HOUR, true);
    this.schedule('pauseHourEnd', pauseHourEnd ?? DEFAULT_PAUSE_END_HOUR, false);

    if (pauseHourStart === undefined || pauseHourEnd === undefined) SettingsRepository.save();
  }

  /**
   * @param {'pauseHourStart' | 'pauseHourEnd'} property 
   * @param {number} hour 
   * @param {boolean} preferredPauseState  
   */
  schedule(property, hour, preferredPauseState) {
    if (hour === undefined) return;

    /** @type {import('node-schedule').Job} */
    const current = this[property];
    current?.cancel();

    this[property] = schedule.scheduleJob(`0 0 ${hour} * * *`, () => {
      SettingsRepository.override({ paused: preferredPauseState }).save();
      Logger.info(`Scheduled pause: ${preferredPauseState ? 'paused' : 'resumed'}`);
    });
    return this;
  }
}

const instance = new PauseManager();
export default instance;