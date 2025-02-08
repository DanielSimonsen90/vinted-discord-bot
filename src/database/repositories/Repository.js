import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

import { ModelCollection } from '../models/ModelCollection.js';
import Model from '../models/Model.js';

const DB_DIR = path.join(process.cwd(), "data");

/**
 * @template TRepoItem
 */
export class Repository {
  // #region Find

  /**
   * @param {Partial<TRepoItem>} filter 
   * @returns {ModelCollection<TRepoItem>}
   */
  find(filter) {
    const result = this.__cache.filter(() => filter ? this.findOne(filter) : true);
    return new ModelCollection(...result);
  }

  /**
   * @param {Partial<TRepoItem>} query 
   */
  findOne(query) {
    return this.__cache.find(entry => {
      for (const key in query) {
        if (entry[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * @param {string} id
   */
  findById(id) {
    return this.findOne({ id });
  }

  /**
   * @param {string} id 
   * @param {TRepoItem} update 
   */
  findByIdAndUpdate(id, update, options = {}) {
    const forceAdd = 'new' in options && Boolean(options.new);
    let index = this.__cache.findIndex(entry => entry.id === id);
    if (index === -1 && !forceAdd) return null;
    else if (index === -1 && forceAdd) return this.__cache[this.__cache.push(update) - 1];
    
    for (const key in update) this.__cache[index][key] = update[key];
    return this.__cache[index];
  }

  /**
   * @param {string} id 
   */
  findByIdAndDelete(id) {
    const index = this.__cache.findIndex(entry => entry.id === id);
    if (index === -1) return null;

    const entry = this.__cache[index];
    this.__cache = this.__cache.filter((_, i) => i !== index);
    return entry;
  }

  // #endregion

  /**
   * @param {Partial<TRepoItem>} query 
   * @returns {boolean}
   */
  exists(query) {
    const entry = this.findOne(query);
    return !!entry;
  }

  /**
   * @param {Partial<TRepoItem>} query 
   */
  deleteOne(query) {
    const item = this.findOne(query);
    if (item) this.__cache.splice(this.__cache.indexOf(item), 1);
    return this;
  }

  /**
   * @param {TRepoItem} repoItem 
   */
  addOne(repoItem) {
    if (!(repoItem instanceof Model)) throw new Error("Invalid RepositoryItem");
    if (!repoItem.id) repoItem.id = randomUUID();
    
    this.__cache.push(repoItem);
    return repoItem;
  }

  /**
   * @param {string} fileName 
   * @param {TRepoItem} RepoItem
   */
  constructor(fileName, RepoItem) {
    this.fileName = fileName;
    this.__cache = this.load(fileName, RepoItem);
    // this.__repoItem = RepoItem;
  }

  // #region File DB
  /**
   * @type {string}
   */
  fileName = undefined;
  /**
   * @type {Array<TRepoItem>}
   */
  __cache = [];

  /**
  * @param {string} fileName 
  * @param {TRepoItem} RepoItem
  * @returns {Array<TRepoItem>}
  */
  load(fileName, RepoItem) {
    if (!fileName.includes('.')) fileName += '.json';
    
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
    if (!fs.existsSync(path.join(DB_DIR, fileName))
      || !fs.statSync(path.join(DB_DIR, fileName)).isFile()
    ) {
      fs.writeFileSync(path.join(DB_DIR, fileName), "[]");
    }

    const collection = JSON.parse(fs.readFileSync(path.join(DB_DIR, fileName), 'utf8'));
    // return collection.map(entry => {
    //   const item = new RepoItem(entry);
    //   item.id = entry.id;
    //   return item;
    // });
    return collection.map(entry => Object.assign(new RepoItem(entry), entry));
  }
  save() {
    fs.writeFileSync(path.join(DB_DIR, this.fileName + ".json"), JSON.stringify(this.__cache, null, 2));
    return this;
  }

  drop() {
    this.__cache = [];
    this.save();
    return this;
  }
  // #endregion
}

export default Repository;