import VintedChannel from "../models/VintedChannel.js";
import Repository from "./Repository.js";

/**
 * @extends Repository<import('../models/VintedChannel.js').VintedChannel>
 */
class VintedChannelRepository extends Repository {

}

export const instance = new VintedChannelRepository("vinted-channels", VintedChannel);
export default instance;