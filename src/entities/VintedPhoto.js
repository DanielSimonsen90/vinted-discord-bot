import { validateId, validateNumber, validateString, validateUrl } from '../utils/validations.js';

export class VintedPhoto {
  constructor(photo) {
    this.id = validateId(photo.id);
    this.imageNo = validateNumber(photo.image_no);
    this.width = validateNumber(photo.width);
    this.height = validateNumber(photo.height);
    this.url = validateUrl(photo.url);
    this.dominantColor = validateString(photo.dominant_color);
    this.fullSizeUrl = validateUrl(photo.full_size_url);
  }
}

export default VintedPhoto;