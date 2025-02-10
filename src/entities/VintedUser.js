import { validateId, validateString, validateNumber, validateUrl } from "../utils/validations.js";
import { VintedPhoto } from "./VintedPhoto.js";

export class VintedUser {
  constructor(userData) {
    this.id = validateId(userData.id);
    this.login = validateString(userData.login);
    this.feedback_reputation = validateNumber(userData.feedback_reputation);
    this.feedback_count = validateNumber(userData.feedback_count);
    this.countryCode = validateString(userData.country_code).toLowerCase();

    this.photo = userData.photo ? new VintedPhoto(userData.photo) : "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";

    this.url = validateUrl(userData.profile_url);
  }
}