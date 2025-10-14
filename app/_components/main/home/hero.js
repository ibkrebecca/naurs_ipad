"use client";

import React from "react";
import useEmblaDotButton, {
  EmblaDotButton,
} from "@/app/_components/embla_dot_btn";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import logo from "@/public/logos/logo.png";
import Image from "next/image";
import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import capitalize from "@/app/_utils/capitalize";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/app/_components/backend/config";

const options = { loop: true };

const Hero = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [slides, setSlides] = useState([]);
  const [slide, setSlide] = useState(0);
  const [emblaRef, embla] = useEmblaCarousel(options, [Autoplay()]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "classes"), orderBy("createdOn", "desc")),
      (snap) => {
        setIsLoading(false);
        setSlides(snap.docs.map((doc) => doc.data()));
      }
    );

    return () => unsubscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!embla) return;

    const onUpdate = () => {
      setSlide(embla.selectedScrollSnap());
    };

    onUpdate();
    embla.on("select", onUpdate);
    embla.on("reInit", onUpdate);

    return () => {
      embla.off("select", onUpdate);
      embla.off("reInit", onUpdate);
    };
  }, [embla]);

  const onNav = useCallback((embla) => {
    const ap = embla?.plugins()?.autoplay;
    if (!ap) return;
    const rs = ap.options.stopOnInteraction === false ? ap.reset : ap.stop;
    rs();
  }, []);

  const { index, snaps, onDotButton } = useEmblaDotButton(embla, onNav);
  const onGetSlide = (s) => slides[s];

  return (
    <section className="embla">
      {!isLoading && slides !== null && slides.length > 0 && (
        <>
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container">
              {slides.map((s, i) => (
                <div className="embla__slide" key={i}>
                  {s.video && (
                    <video
                      src={s.video}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="embla__slide__video z-999"
                    />
                  )}

                  <img
                    src={s.image}
                    alt={s.name}
                    className="embla__slide__image"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="hero_header">
            <div className="hero_nav">
              <div className="embla__dots">
                {snaps.map((_, i) => (
                  <EmblaDotButton
                    key={i}
                    onClick={() => onDotButton(i)}
                    className={"embla__dot".concat(
                      i === index ? " embla__dot--selected" : ""
                    )}
                  />
                ))}
              </div>

              <Image src={logo} width={60} priority alt="logo" />
            </div>

            <div className="hero_title">
              <h1>{capitalize(onGetSlide(slide).name)}</h1>
              <p>
                Starting from{" "}
                {onGetSlide(slide).category.id === "adult" && (
                  <>
                    {onGetSlide(slide).subcategory.id === "gravity" && "80 "}
                    {onGetSlide(slide).subcategory.id === "sky" && "125 "}
                    AED
                  </>
                )}
                {onGetSlide(slide).category.id === "kids" && (
                  <>
                    {onGetSlide(slide).subcategory.id === "fine_art" && "425 "}
                    {onGetSlide(slide).subcategory.id === "fitness" && "360 "}
                    AED
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="hero_footer">
            <Link
              href={`/menu#${onGetSlide(slide).subcategory.id}`}
              className="d-flex flex-column align-items-center text-white text-center text-decoration-none"
            >
              <div>
                <div />
              </div>

              <p>
                Open <b>{onGetSlide(slide).subcategory.name.toUpperCase()}</b>{" "}
                menu
              </p>
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;
