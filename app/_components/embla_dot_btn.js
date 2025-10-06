import React, { useCallback, useEffect, useState } from "react";

const useEmblaDotButton = (embla, onButtonClick) => {
  const [index, setIndex] = useState(0);
  const [snaps, setSnaps] = useState([]);

  const onDotButton = useCallback(
    (i) => {
      if (!embla) return;
      embla.scrollTo(i);
      if (onButtonClick) onButtonClick(embla);
    },

    [embla, onButtonClick]
  );

  const onInit = useCallback((e) => {
    setSnaps(e.scrollSnapList());
  }, []);

  const onSelect = useCallback((e) => {
    setIndex(e.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!embla) return;

    onInit(embla);
    onSelect(embla);

    embla.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [embla, onInit, onSelect]);

  return {
    index,
    snaps,
    onDotButton,
  };
};

export default useEmblaDotButton;

export const EmblaDotButton = (props) => {
  const { children, ...restProps } = props;

  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  );
};
