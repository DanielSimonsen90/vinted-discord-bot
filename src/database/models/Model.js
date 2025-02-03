import Repository from '../repositories/Repository.js'

export class Model {
  /**
 * @type {Record<string, typeof Repository | undefined>}
 */
  #relations = {};

  /**
   * @param {Array<{
   *  property: keyof this,
   *  repo: Repository
   * }>} data 
   */
  populate(...data) {
    for (const { property, repo } of data) {
      const newValue = repo.findById(this[property]);
      if (newValue) {
        this[property] = newValue;
        this.#relations[property] = repo;
      }
    }

    return this;
  }

  /**
   * 
   * @param {keyof { [key in keyof this as this[key] extends ((...args: any[]) => any) ? never : key]: this[key] }} property 
   */
  markModified(property) {
    const ExternalRepo = this.#relations[property];
    if (!ExternalRepo) throw new Error("[Schema.markModified] External schema not loaded");

    ExternalRepo.findByIdAndUpdate(this[property].id, this[property]);
  }

  toJSON() {
    const result = {};

    for (const key in this) {
      if (typeof this[key] === "function") continue;
      if (this[key] instanceof Model) result[key] = this[key].id;
      else result[key] = this[key];
    }

    return result;
    // return JSON.stringify(result);
  }
}

export default Model;