import schedule from 'node-schedule';
import SettingsRepository from '../database/repositories/SettingsRepository.js';

class PauseManager {
  constructor() {
    const { pauseHourStart, pauseHourEnd } = SettingsRepository.current;
    this.schedule('pauseHourStart', pauseHourStart, true);
    this.schedule('pauseHourEnd', pauseHourEnd, false);
  }

  /**
   * @param {'pauseHourStart' | 'pauseHourEnd'} property 
   * @param {number} hour 
   * @param {boolean} preferredPauseState  
   */
  schedule(property, hour, preferredPauseState) {
    /** @type {import('node-schedule').Job} */
    const current = this[property];
    current?.cancel();

    this[property] = schedule.scheduleJob(`0 0 ${hour} * * *`, () => SettingsRepository.override({ paused: preferredPauseState }));
  }
}

const instance = new PauseManager();
export default instance;