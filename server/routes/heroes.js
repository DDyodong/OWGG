const express = require('express');
const db = require('../db');
const portraits = require('../hero-portraits');

const router = express.Router();

router.get('/', (_req, res, next) => {
  db.all(
    `SELECT hero_id, name, role, subrole, portrait, color
     FROM heroes
     ORDER BY CASE role WHEN 'tank' THEN 1 WHEN 'damage' THEN 2 ELSE 3 END, name`,
    (error, rows) => {
      if (error) return next(error);
      res.json(rows.map((hero) => {
        const image = hero.portrait || portraits[hero.hero_id] || null;
        return {
          ...hero,
          portrait: image,
          standing: image,
        };
      }));
    },
  );
});

module.exports = router;
