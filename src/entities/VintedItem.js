import { validateId, validateNumber, validateString, validateUrl } from "../utils/validations.js";
import { VintedPhoto } from "./VintedPhoto.js";
import { VintedUser } from "./VintedUser.js";

export class VintedItem {
  constructor(itemData) {
    this.id = validateId(itemData.id);
    this.title = validateString(itemData.title);
    this.url = validateUrl(itemData.url);
    this.brandId = validateId(itemData.brand_id);
    this.sizeId = validateId(itemData.size_id);
    this.statusId = validateId(itemData.status_id);
    this.userId = validateId(itemData.user_id);

    if (itemData.item_attributes?.length > 0 && itemData.item_attributes[0].code === "video_game_platform") {
      this.videoGamePlatformId = validateId(itemData.item_attributes[0].ids?.[0]);
    }

    this.countryId = validateId(itemData.country_id);
    this.catalogId = validateId(itemData.catalog_id);

    this.description = validateString(itemData.description);
    this.size = validateString(itemData.size);
    this.brand = validateString(itemData.brand);
    this.composition = validateString(itemData.composition);
    this.status = validateString(itemData.status);
    this.label = validateString(itemData.label);
    this.currency = validateString(itemData.currency);
    this.priceNumeric = validateNumber(parseFloat(itemData.price_numeric));

    this.updatedAtTs = parseDate(itemData.updated_at_ts);
    this.colorId = validateId(itemData.color1_id);

    // <t:${Math.floor(Date.now() / 1000)}:R>
    this.unixUpdatedAt = Math.floor(this.updatedAtTs.getTime() / 1000);
    this.unixUpdatedAtString = `<t:${this.unixUpdatedAt}:R>`;

    // Create photo objects
    this.photos = itemData.photos ? itemData.photos.map(photo => new VintedPhoto(photo)) : [];

    // Create user object
    this.user = itemData.user ? new VintedUser(itemData.user) : null;

    this.catalogBranchTitle = validateString(itemData.catalog_branch_title);
  }

  getNumericStars() {
    return this.user ? this.user.feedback_reputation : 0;
  }

  getDominantColor() {
    return this.photos.length === 0 ? "#000000" : this.photos[0].dominantColor;
  }
}