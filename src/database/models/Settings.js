import Model from "./Model.js";

export class Settings extends Model {
  /**
   * @param {{
   *  pauseHourStart: number,
   *  pauseHourEnd: number,
   *  paused: boolean
   * }} data 
   */
  constructor(data) {
    super();

    this.pauseHourStart = data.pauseHourStart;
    this.pauseHourEnd = data.pauseHourEnd;
    this.paused = data.paused;
  }
}

export default Settings;