"use client";

import Link from "next/link";
import discount from "@/public/icons/discount.png";
import home from "@/public/icons/home.png";
import Image from "next/image";
import { useState } from "react";
import Pricing from "@/app/_components/main/pricing";
import ViewClass from "@/app/_components/main/view_class";

const allClasses = [
  {
    image: "/images/1.png",
    video: "/videos/1.mp4",
    title: "Zumba Class",
    calendar: "Mon, Wed, Fri 9:55am - 10:45am",
    category: "adult",
    subcategory: "gravity",
  },
  {
    image: "/images/2.png",
    video: "",
    title: "Let’s Nacho (Bollywood Fitness Dance)",
    calendar: "Mon 7:00pm, Wed 7:00pm, Fri 6:30 pm",
    category: "adult",
    subcategory: "gravity",
  },
  {
    image: "/images/3.png",
    video: "",
    title: "Aerial Yoga",
    calendar: null,
    category: "adult",
    subcategory: "sky",
  },
  {
    image: "/images/4.png",
    video: "",
    title: "Deep Stretch by Shantanu Tyagi",
    calendar: "Sun 6:00pm - 7:00pm, Tue 7:15pm - 8:15pm",
    category: "adult",
    subcategory: "sky",
  },
  {
    image: "/images/5.png",
    video: "",
    title: "Drums Class",
    calendar: null,
    category: "kids",
    subcategory: "fine_art",
  },
  {
    image: "/images/5.png",
    video: "",
    title: "Kinder Gymnastics (2-4 years old) by Daria",
    calendar: null,
    category: "kids",
    subcategory: "fitness",
  },
];

const Menu = () => {
  const [selected, setSelected] = useState("gravity");
  const [selectedClass, setSelectedClass] = useState(null);
  const [openPricing, setOpenPricing] = useState(false);

  const isSelected = (key) => selected === key;

  const handleScroll = (e, id) => {
    e.preventDefault();
    setSelected(id);

    const element = document.getElementById(id);
    if (element) {
      const yOffset = -200;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <>
      <main className="mvh-100">
        <nav className="menu-nav">
          <ul className="list-unstyled menu-nav-pages me-3">
            <li className={isSelected("gravity") ? "bg-black" : "transparent"}>
              <Link
                href="#"
                onClick={(e) => handleScroll(e, "gravity")}
                className={isSelected("gravity") ? "text-white" : "text-black"}
              >
                Adult Fitness
              </Link>
            </li>

            <li className={isSelected("fine_art") ? "bg-black" : "transparent"}>
              <Link
                href="#"
                onClick={(e) => handleScroll(e, "fine_art")}
                className={isSelected("fine_art") ? "text-white" : "text-black"}
              >
                Kids Fine Art
              </Link>
            </li>

            <li className={isSelected("fitness") ? "bg-black" : "transparent"}>
              <Link
                href="#"
                onClick={(e) => handleScroll(e, "fitness")}
                className={isSelected("fitness") ? "text-white" : "text-black"}
              >
                Kids Fitness
              </Link>
            </li>
          </ul>

          <div className="menu-nav-pricing-home">
            <div className="menu-nav-pricing me-4">
              <Image
                src={discount}
                width={28}
                priority
                alt="icon"
                className="me-2"
              />
              <Link href="#" onClick={() => setOpenPricing(true)}>
                Pricing
              </Link>
            </div>

            <div className="menu-nav-home">
              <Link href="/" scroll={false}>
                <Image src={home} width={28} priority alt="home" />
              </Link>
            </div>
          </div>
        </nav>

        <div className="menu-divider" />

        <section className="container-fluid">
          <div id="gravity" className="row mb-5">
            <div className="col-12 mb-3">
              <h3 className="font-32">
                Adult Fitness <span className="pink">(Gravity Classes)</span>
              </h3>
            </div>

            {allClasses
              .filter((c) => c.subcategory === "gravity")
              .map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedClass(c)}
                  className="pe-active col-sm-4"
                >
                  <div className="class-card">
                    <img className="class-card-img" src={c.image} />

                    <div className="class-card-body text-white">
                      <h3 className="text-white font-20">{c.title}</h3>
                      <p className="text-white font-16">{c.calendar}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div id="sky" className="row mb-5">
            <div className="col-12 mb-3">
              <h3 className="font-32">
                Adult Fitness <span className="pink">(Sky Classes)</span>
              </h3>
            </div>

            {allClasses
              .filter((c) => c.subcategory === "sky")
              .map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedClass(c)}
                  className="col-sm-4"
                >
                  <div className="class-card">
                    <img className="class-card-img" src={c.image} />

                    <div className="class-card-body text-white">
                      <h3 className="text-white font-20">{c.title}</h3>
                      <p className="text-white font-16">{c.calendar}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div id="fine_art" className="row mb-5">
            <div className="col-12 mb-3">
              <h3 className="font-32">Kids Fine Art Classes</h3>
            </div>

            {allClasses
              .filter((c) => c.subcategory === "fine_art")
              .map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedClass(c)}
                  className="col-sm-4"
                >
                  <div className="class-card">
                    <img className="class-card-img" src={c.image} />

                    <div className="class-card-body text-white">
                      <h3 className="text-white font-20">{c.title}</h3>
                      <p className="text-white font-16">{c.calendar}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div id="fitness" className="row mb-5">
            <div className="col-12 mb-3">
              <h3 className="font-32">Kids Fitness Classes</h3>
            </div>

            {allClasses
              .filter((c) => c.subcategory === "fitness")
              .map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedClass(c)}
                  className="col-sm-4"
                >
                  <div className="class-card">
                    <img className="class-card-img" src={c.image} />

                    <div className="class-card-body text-white">
                      <h3 className="text-white font-20">{c.title}</h3>
                      <p className="text-white font-16">{c.calendar}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>

      {openPricing && (
        <Pricing
          openPricing={openPricing}
          onHide={() => setOpenPricing(null)}
        />
      )}

      {selectedClass && (
        <ViewClass
          selectedClass={selectedClass}
          onHide={() => setSelectedClass(null)}
        />
      )}
    </>
  );
};

export default Menu;
