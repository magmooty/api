export const serializeDate = (date?: Date) => {
  if (date) {
    return date.toISOString();
  } else {
    return new Date().toISOString();
  }
};
