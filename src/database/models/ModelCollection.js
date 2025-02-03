/**
 * @template T
 * @extends Array<T>
 */
export class ModelCollection extends Array {
  /**
   * @type {Record<string, typeof Schema | undefined>}
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
      for (const entry of this) {
        const newValue = repo.findById(entry[property]);

        if (newValue) {
          entry[property] = newValue;
          this.#relations[property] = repo;
        }
      }
    }

    return this;
  }
}

export default ModelCollection;