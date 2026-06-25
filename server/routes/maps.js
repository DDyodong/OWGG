const express = require('express');

const router = express.Router();
const OVERFAST_MAPS_URL = 'https://overfast-api.tekrop.fr/maps';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cachedMaps = null;
let cachedAt = 0;

function normalizeMap(map) {
  return {
    key: map.key,
    name: map.name,
    screenshot: map.screenshot,
    gamemodes: map.gamemodes || [],
    location: map.location || '',
    countryCode: map.country_code || '',
  };
}

router.get('/media', async (_req, res, next) => {
  try {
    const now = Date.now();
    if (cachedMaps && now - cachedAt < CACHE_TTL_MS) {
      res.json(cachedMaps);
      return;
    }

    const response = await fetch(OVERFAST_MAPS_URL);
    if (!response.ok) {
      throw new Error(`OverFast maps request failed: ${response.status}`);
    }

    const maps = await response.json();
    cachedMaps = Array.isArray(maps) ? maps.map(normalizeMap) : [];
    cachedAt = now;
    res.json(cachedMaps);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
