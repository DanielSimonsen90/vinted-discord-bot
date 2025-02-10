
export function validateId(value) {
  return (typeof value === 'number' && value > 0) ? value : 0;
}

export function validateNumber(value) {
  return (typeof value === 'number') ? value : 0;
}

export function validateString(value) {
  return (typeof value === 'string') ? value : "N/A";
}

export function validateBoolean(value) {
  return (typeof value === 'boolean') ? value : false;
}

export function validateUrl(value) {
  try {
    new URL(value);
    return value;
  } catch (error) {
    return "N/A";
  }
}

export function parseDate(value) {
  const parsedDate = new Date(value);
  return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
}