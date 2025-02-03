import User from "../models/User.js";
import Repository from "./Repository.js";

/**
 * @extends Repository<import('../models/User.js').User>
 */
class UserRepository extends Repository {

}

const instance = new UserRepository("users", User);
export default instance;