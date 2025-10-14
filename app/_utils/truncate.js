export const truncate = (string, len) => {
  if (typeof string !== "string" || typeof len !== "number") {
    throw new Error(
      "Invalid input. Please provide a valid string and a valid length."
    );
  }

  if (string.length <= len) return string;
  else return string.substring(0, len) + " ...";
};
