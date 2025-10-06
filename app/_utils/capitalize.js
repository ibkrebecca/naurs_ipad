const capitalize = (string) => {
  return string.replace(/(^|\s)(\p{Ll})/gu, (match, preceding, letter) => preceding + letter.toUpperCase());
};

export default capitalize;
