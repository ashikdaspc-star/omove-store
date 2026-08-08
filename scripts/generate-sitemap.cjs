const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.omovestore.shop';
const TODAY = new Date().toISOString().split('T')[0];

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/digital-products', priority: '0.9', changefreq: 'daily' },
  { url: '/store', priority: '0.9', changefreq: 'daily' },
  { url: '/services', priority: '0.9', changefreq: 'weekly' },
  { url: '/remote-support', priority: '0.8', changefreq: 'weekly' },
  { url: '/downloads', priority: '0.7', changefreq: 'weekly' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/refund-policy', priority: '0.5', changefreq: 'monthly' },
  { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
  { url: '/terms', priority: '0.5', changefreq: 'monthly' },
  { url: '/delivery-policy', priority: '0.5', changefreq: 'monthly' },
  { url: '/cookie-policy', priority: '0.5', changefreq: 'monthly' }
];

function generateSitemap() {
  const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  const blogsPath = path.join(process.cwd(), 'src', 'data', 'blogs.json');

  let products = [];
  let blogs = [];

  try {
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading products.json for sitemap:', e);
  }

  try {
    if (fs.existsSync(blogsPath)) {
      blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading blogs.json for sitemap:', e);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static Pages
  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}${page.url}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Published Products Pages
  if (Array.isArray(products)) {
    products.forEach((prod) => {
      if (prod.slug || prod.id) {
        const productSlug = prod.slug || prod.id;
        xml += `  <url>\n`;
        xml += `    <loc>${DOMAIN}/store?product=${encodeURIComponent(productSlug)}</loc>\n`;
        xml += `    <lastmod>${TODAY}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
  }

  // 3. Published Blog Articles
  if (Array.isArray(blogs)) {
    blogs.forEach((blog) => {
      if (blog.slug || blog.id) {
        const blogSlug = blog.slug || blog.id;
        xml += `  <url>\n`;
        xml += `    <loc>${DOMAIN}/blog?article=${encodeURIComponent(blogSlug)}</loc>\n`;
        xml += `    <lastmod>${TODAY}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    });
  }

  xml += `</urlset>\n`;

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✓ Generated valid sitemap.xml at ${outputPath}`);
}

generateSitemap();
