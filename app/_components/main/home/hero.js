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

const options = { loop: true };
const slides = [
  {
    image: "/images/1.png",
    video: "/videos/1.mp4",
    title: "Power Yoga",
    price: "125",
    category: "adult",
    subcategory: "gravity",
  },
  {
    image: "/images/2.png",
    video: null,
    title: "Piano, Guitar, Drums & Violin",
    price: "425",
    category: "kids",
    subcategory: "fine_art",
  },
  {
    image: "/images/3.png",
    video: null,
    title: "Aerial Yoga",
    price: "125",
    category: "adult",
    subcategory: "sky",
  },
  {
    image: "/images/4.png",
    video: null,
    title: "Hatha Yoga",
    price: "125",
    category: "adult",
    subcategory: "gravity",
  },
  {
    image: "/images/5.png",
    video: null,
    title: "Let’s Nacho (Bollywood Dance)",
    price: "125",
    category: "adult",
    subcategory: "gravity",
  },
];

const Hero = () => {
  const [slide, setSlide] = useState(0);
  const [emblaRef, embla] = useEmblaCarousel(options, [Autoplay()]);

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
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((s, i) => (
            <div className="embla__slide" key={i}>
              {s.video !== null && (
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
                alt={s.title}
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
          <h1>{onGetSlide(slide).title}</h1>
          <p>Starting from {onGetSlide(slide).price} AED</p>
        </div>
      </div>

      <div className="hero_footer">
        <Link
          href={`/menu#${onGetSlide(slide).subcategory}`}
          className="d-flex flex-column align-items-center text-white text-center text-decoration-none"
        >
          <div>
            <div />
          </div>

          <p>
            Open <b>FITNESS</b> menu
          </p>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
