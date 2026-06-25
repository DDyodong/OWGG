const express = require('express');
const db = require('../db');
const portraits = require('../hero-portraits');

const router = express.Router();
const allowedSorts = new Set(['winrate', 'pickrate', 'banrate', 'name']);
const recommendationRoles = ['tank', 'damage', 'support'];

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

function withArt(hero) {
  const image = hero.portrait || portraits[hero.hero_id] || null;
  return {
    ...hero,
    portrait: image,
    standing: image,
  };
}

function recommendationScore(hero, trends) {
  const points = trends
    .filter((row) => row.hero_id === hero.hero_id)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const latest = points.at(-1);
  const previous = points.at(-2);
  const trend = latest && previous
    ? ((Number(latest.winrate) - Number(previous.winrate)) * 0.7)
      + ((Number(latest.pickrate) - Number(previous.pickrate)) * 0.3)
    : 0;
  const pickrate = Number(hero.pickrate || 0);
  const winrate = Number(hero.winrate || 0);
  const cappedBanrate = Math.min(Number(hero.banrate || 0), 35);
  const banLift = Math.sqrt(cappedBanrate / 100) * 0.45;
  const adjustedPickrate = pickrate * (1 + banLift);
  const highBanFriction = Math.max(Number(hero.banrate || 0) - 30, 0) * 0.08;
  const lowWinPenalty = Math.max(49 - winrate, 0) * 0.65;
  const score = (adjustedPickrate * 0.42)
    + (winrate * 0.45)
    + (cappedBanrate * 0.04)
    + (Math.max(trend, 0) * 0.13)
    - highBanFriction
    - lowWinPenalty;

  return {
    score: Number(score.toFixed(2)),
    adjustedPickrate: Number(adjustedPickrate.toFixed(2)),
    trend: Number(trend.toFixed(2)),
  };
}

async function recentPatches(limit = 3) {
  const rows = await all(
    `SELECT DISTINCT patch
     FROM hero_stats
     ORDER BY patch DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((row) => row.patch);
}

router.get('/filters', async (_req, res, next) => {
  try {
    const [tiers, maps, patches, heroes] = await Promise.all([
      all(`SELECT DISTINCT tier value FROM hero_stats
           ORDER BY CASE tier WHEN 'Bronze' THEN 1 WHEN 'Silver' THEN 2 WHEN 'Gold' THEN 3
             WHEN 'Platinum' THEN 4 WHEN 'Diamond' THEN 5 WHEN 'Master' THEN 6 ELSE 7 END`),
      all(`SELECT DISTINCT map_name value FROM hero_stats
           ORDER BY CASE WHEN map_name = 'all-maps' THEN 0 ELSE 1 END, map_name`),
      all('SELECT DISTINCT patch value FROM hero_stats ORDER BY patch DESC'),
      all(`SELECT hero_id value, name label, role, subrole FROM heroes
           ORDER BY CASE role WHEN 'tank' THEN 1 WHEN 'damage' THEN 2 ELSE 3 END, name`),
    ]);
    res.json({ tiers, maps, patches, heroes });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const patch = req.query.patch || (await all('SELECT MAX(patch) value FROM hero_stats'))[0].value;
    const tier = req.query.tier || 'all';
    const mapName = req.query.map || 'all-maps';
    const heroId = req.query.hero || 'all';
    const role = req.query.role || 'all';
    const sort = allowedSorts.has(req.query.sort) ? req.query.sort : 'winrate';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const conditions = ['s.patch = ?', 's.map_name = ?'];
    const params = [patch, mapName];
    if (tier !== 'all') {
      conditions.push('s.tier = ?');
      params.push(tier);
    }
    if (heroId !== 'all') {
      conditions.push('h.hero_id = ?');
      params.push(heroId);
    }
    if (role !== 'all') {
      conditions.push('h.role = ?');
      params.push(role);
    }

    const sortSql = sort === 'name' ? 'h.name' : sort;
    const rows = await all(
      `SELECT h.hero_id, h.name, h.role, h.subrole, h.portrait, h.color,
              ROUND(AVG(s.pickrate), 2) pickrate,
              ROUND(AVG(s.winrate), 2) winrate,
              ROUND(AVG(s.banrate), 2) banrate,
              COUNT(*) sample_count
       FROM hero_stats s
       JOIN heroes h ON h.hero_id = s.hero_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY h.hero_id
       ORDER BY ${sortSql} ${order}, h.name ASC`,
      params,
    );

    const trendConditions = ['s.map_name = ?'];
    const trendParams = [mapName];
    if (tier !== 'all') {
      trendConditions.push('s.tier = ?');
      trendParams.push(tier);
    }
    if (heroId !== 'all') {
      trendConditions.push('h.hero_id = ?');
      trendParams.push(heroId);
    }
    if (role !== 'all') {
      trendConditions.push('h.role = ?');
      trendParams.push(role);
    }

    const trends = await all(
      `SELECT s.patch date, h.hero_id, h.name,
              ROUND(AVG(s.pickrate), 2) pickrate,
              ROUND(AVG(s.winrate), 2) winrate,
              ROUND(AVG(s.banrate), 2) banrate
       FROM hero_stats s
       JOIN heroes h ON h.hero_id = s.hero_id
       WHERE ${trendConditions.join(' AND ')}
       GROUP BY s.patch, h.hero_id
       ORDER BY s.patch ASC, h.name ASC`,
      trendParams,
    );

    const recommendationPatches = await recentPatches(3);
    const recommendationConditions = [`s.map_name = 'all-maps'`];
    const recommendationParams = [];
    if (recommendationPatches.length) {
      recommendationConditions.push(`s.patch IN (${recommendationPatches.map(() => '?').join(', ')})`);
      recommendationParams.push(...recommendationPatches);
    }
    if (tier !== 'all') {
      recommendationConditions.push('s.tier = ?');
      recommendationParams.push(tier);
    }

    const recommendationRows = await all(
      `SELECT h.hero_id, h.name, h.role, h.subrole, h.portrait, h.color,
              ROUND(AVG(s.pickrate), 2) pickrate,
              ROUND(AVG(s.winrate), 2) winrate,
              ROUND(AVG(s.banrate), 2) banrate,
              COUNT(*) sample_count
       FROM hero_stats s
       JOIN heroes h ON h.hero_id = s.hero_id
       WHERE ${recommendationConditions.join(' AND ')}
       GROUP BY h.hero_id`,
      recommendationParams,
    );

    const recommendationTrends = await all(
      `SELECT s.patch date, h.hero_id, h.name,
              ROUND(AVG(s.pickrate), 2) pickrate,
              ROUND(AVG(s.winrate), 2) winrate,
              ROUND(AVG(s.banrate), 2) banrate
       FROM hero_stats s
       JOIN heroes h ON h.hero_id = s.hero_id
       WHERE ${recommendationConditions.join(' AND ')}
       GROUP BY s.patch, h.hero_id
       ORDER BY s.patch ASC, h.name ASC`,
      recommendationParams,
    );

    const enrichedRows = rows.map(withArt);
    const scoredRecommendations = recommendationRows.map(withArt)
      .map((hero) => ({
        ...hero,
        recommendation: recommendationScore(hero, recommendationTrends),
      }))
      .sort((a, b) => b.recommendation.score - a.recommendation.score);
    const recommendations = scoredRecommendations.slice(0, 3);
    const roleRecommendations = recommendationRoles.map((roleName) => ({
      role: roleName,
      heroes: scoredRecommendations
        .filter((hero) => hero.role === roleName)
        .slice(0, 3),
    }));

    res.json({
      meta: {
        patch,
        tier,
        map: mapName,
        hero: heroId,
        role,
        count: rows.length,
        recommendationPatches,
        recommendationMap: 'all-maps',
      },
      data: enrichedRows,
      trends,
      recommendations,
      roleRecommendations,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
