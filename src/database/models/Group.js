import Model from "./Model.js";

/*const groupSchema = new Schema({
    name: { type: String, unique: true, required: true },
    users: [{ type: Types.ObjectId, ref: 'User' }],
});*/
export class Group extends Model {
  /**
   * @param {string} name
   * @param {string[]} users
   */
  constructor({ name, users }) {
    super();

    this.name = name;
    this.users = users;
  }
}

export default Group;