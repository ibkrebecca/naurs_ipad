const domain = process.env.DOMAIN;

const sitemap = () => [
  {
    url: `${domain}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "yearly",
    priority: 1,
  },
];

export default sitemap;
