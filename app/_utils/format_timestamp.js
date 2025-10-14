import { Timestamp } from "firebase/firestore";

export const formatTimestamp = (timestamp) => {
  let date;

  // Check if the input is a string
  if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else return "";

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit",
    hour12: true, // Use 12-hour time format
  };
  return date.toLocaleString("en-US", options);
};
export const getJoinedYear = (timestamp) => {
  if (!(timestamp instanceof Timestamp)) {
    throw new Error("Invalid Firebase Timestamp object");
  }

  const joinDate = timestamp.toDate();
  const currentDate = new Date();

  let yearsOnApp = currentDate.getFullYear() - joinDate.getFullYear();

  const currAnniversary = new Date(
    currentDate.getFullYear(),
    joinDate.getMonth(),
    joinDate.getDate()
  );

  if (currentDate < currAnniversary) yearsOnApp -= 1;

  return yearsOnApp.toString();
};
