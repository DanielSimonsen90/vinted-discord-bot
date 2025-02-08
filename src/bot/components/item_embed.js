import { EmbedBuilder, ActionRowBuilder } from "discord.js";
import { createBaseEmbed, createBaseUrlButton } from "./base_embeds.js";
import Logger from "../../utils/logger.js";
import { tWithIcon } from "../../t.js";
import client from '../../client.js';
const l = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)?.preferredLocale;

function getNumberOfStars(rating) {
  rating = rating * 5;
  rating = Math.round(rating);

  const stars = '⭐️'.repeat(rating);
  return stars;
}

function getFlagEmoji(countryCode) {
  if (countryCode === 'uk') return '🇬🇧';

  return countryCode.toUpperCase().replace(/./g, char =>
    String.fromCodePoint(127397 + char.charCodeAt())
  );
}

function replaceDomainInUrl(url, domain) {
  return url.replace(/vinted\.(.*?)\//, `vinted.${domain}/`);
}

export async function createVintedItemEmbed(item, domain = "fr") {
  const embed = await createBaseEmbed(
    null,
    item.title,
    `📝 ${item.description}`,
    item.getDominantColor()
  );

  embed.setURL(replaceDomainInUrl(item.url, domain));

  const rating = item.user.feedback_reputation;
  const ratingStars = getNumberOfStars(rating);
  const ratingTextRounded = Math.round(rating * 50) / 10;
  const ratingAllText = `${item.user.feedback_count}`;

  embed.setFields([
    { name: tWithIcon(l, 'price', '💰'), value: `${item.priceNumeric} ${item.currency}`, inline: true },
    { name: tWithIcon(l, 'size', '📏'), value: item.size, inline: true },
    { name: tWithIcon(l, 'brand', '🏷️'), value: item.brand, inline: true },
    { name: tWithIcon(l, 'country', '🌍'), value: getFlagEmoji(item.user.countryCode), inline: true },
    { name: tWithIcon(l, 'user-rating', '⭐️'), value: `${ratingStars} (${ratingTextRounded}) of ${ratingAllText}`, inline: true },
    { name: tWithIcon(l, 'condition', '📦'), value: item.status, inline: true },
    { name: tWithIcon(l, 'updated', '📅'), value: item.unixUpdatedAtString, inline: true },
  ]);

  const photosEmbeds = [];
  const maxPhotos = 3;

  // Add first photo
  const firstPhoto = item.photos[0];
  if (firstPhoto) {
    if (firstPhoto.fullSizeUrl) {
      embed.setImage(`${firstPhoto.fullSizeUrl}`);
    } else {
      Logger.error(`No fullSizeUrl for photo: ${firstPhoto}`);
      return { embed, photosEmbeds };
    }
  } else {
    Logger.error(`No photo for item: ${item}`);
    return { embed, photosEmbeds };
  }

  // Add photos
  for (let i = 1; i < item.photos.length && i < maxPhotos; i++) {
    const photo = item.photos[i];

    const photoEmbed = new EmbedBuilder()
      .setImage(`${photo.fullSizeUrl}`)
      .setURL(replaceDomainInUrl(item.url, domain));

    photosEmbeds.push(photoEmbed);
  }

  return { embed, photosEmbeds };
}

export async function createVintedItemActionRow(item, domain) {
  const actionRow = new ActionRowBuilder();
  const sendMessageUrl = `https://www.vinted.${domain}/items/${item.id}/want_it/new?button_name=receiver_id=${item.id}`;
  const buyUrl = `https://www.vinted.${domain}/transaction/buy/new?source_screen=item&transaction%5Bitem_id%5D=${item.id}`;

  actionRow.addComponents(
    await createBaseUrlButton(tWithIcon(l, 'view-on-vinted', '🔗'), replaceDomainInUrl(item.url, domain)),
    await createBaseUrlButton(tWithIcon(l, 'send-message', '📨'), sendMessageUrl),
    await createBaseUrlButton(tWithIcon(l, 'buy', '💸'), buyUrl)
  );

  return actionRow;
}
