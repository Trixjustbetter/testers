const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/manifest.json', (req, res) => {
  res.json(require('./manifest.json'));
});

async function scrape4KHDHub(title) {
  try {
    const searchQuery = encodeURIComponent(title.trim());
    const { data } = await axios.get(`https://4khdhub.one/?s=${searchQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const streams = [];

    $('.item, article, .post, .entry').each((i, el) => {
      const link = $(el).find('a').first().attr('href');
      const itemTitle = $(el).find('h2, .title, .name').text().trim();

      if (link && itemTitle) {
        streams.push({
          title: `4KHDHub - ${itemTitle}`,
          url: link,
          behaviorHints: { 
            notWebReady: true,
            headers: { "User-Agent": "Mozilla/5.0" }
          }
        });
      }
    });

    return streams.slice(0, 8); // Limit results
  } catch (error) {
    console.error("Scraping error:", error.message);
    return [];
  }
}

app.get('/stream/:type/:id', async (req, res) => {
  let title = req.params.id || "movie";
  // Clean up IMDb ID style names
  title = title.replace(/tt\d+/i, '').replace(/-/g, ' ');

  const streams = await scrape4KHDHub(title);

  res.json({ streams });
});

app.listen(PORT, () => {
  console.log(`4KHDHub Addon running → http://localhost:${PORT}`);
});