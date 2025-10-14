export const selectFormStyle = {
  control: (base) => ({
    ...base,
    borderRadius: 42,
    minHeight: 42,
    border: "0.5px solid #d0d5dd",
    background: "#ffffff",
    "&:focus, &:hover": {
      outline: 0,
      border: "0.5px solid #000000",
      background: "#f3f7fd",
      boxShadow: "0px 0px 0px 3px #e8f0fd, 0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
    },
  }),
};

export const selectFormTheme = (theme) => ({
  ...theme,
  borderRadius: 16,
  colors: {
    ...theme.colors,
    primary25: "#00000020",
    primary: "black",
  },
});
