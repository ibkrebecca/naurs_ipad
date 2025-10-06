const domain = process.env.DOMAIN;
const allowCraw = { disallow: "/" };

const robots = () => {
  return {
    rules: {
      userAgent: "*",
      ...allowCraw,
    },
    sitemap: `${domain}sitemap.xml`,
  };
};

export default robots;
