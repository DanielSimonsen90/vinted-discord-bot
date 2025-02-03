import Group from "../models/Group.js";
import Repository from "./Repository.js";

/**
 * @extends Repository<import('../models/Group.js').Group>
 */
class GroupRepository extends Repository {

}

export const instance = new GroupRepository("groups", Group);
export default instance;