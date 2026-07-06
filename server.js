const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/manifest.json', (req, res) => {
  res.json(require('./manifest.json'));
});

async function scrape4KHDHub(title, year = '') {
  try {
    const searchQuery = encodeURIComponent(`${title} ${year}`.trim());
    const { data } = await axios.get(`https://4khdhub.one/?s=${searchQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const streams = [];

    // Find movie/TV links on search page
    $('.item, article, .post').each((i, el) => {
      const link = $(el).find('a').attr('href');
      const itemTitle = $(el).find('h2, .title').text().trim();

      if (link && itemTitle.toLowerCase().includes(title.toLowerCase())) {
        streams.push({
          title: `🎥 4KHDHub - ${itemTitle}`,
          url: link,           // We'll resolve real stream later
          behaviorHints: { notWebReady: true }
        });
      }
    });

    return streams;
  } catch (error) {
    console.error("Scraping error:", error.message);
    return [];
  }
}

// Stream Handler
app.get('/stream/:type/:id', async (req, res) => {
  const { type, id } = req.params; // id like tt1234567 or title

  // Extract title from id (simple fallback)
  let title = id.replace(/tt\d+/, '').replace(/-/g, ' ') || "movie";

  const streams = await scrape4KHDHub(title);

  res.json({
    streams: streams.length > 0 ? streams : []
  });
});

app.listen(PORT, () => {
  console.log(`4KHDHub Addon running on http://localhost:${PORT}`);
});