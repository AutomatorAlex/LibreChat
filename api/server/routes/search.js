const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { isEnabled } = require('~/server/utils');
const { getConvosByCursor } = require('~/models/Conversation');

const router = express.Router();

router.use(requireJwtAuth);

router.get('/enable', async function (req, res) {
  if (!isEnabled(process.env.SEARCH)) {
    return res.send(false);
  }

  // For MongoDB search, we just need to check if search is enabled
  // No external service dependency required
  return res.send(true);
});

router.get('/', async function (req, res) {
  try {
    const { q: query, cursor } = req.query;

    if (!query || query.trim() === '') {
      return res.json({ conversations: [], nextCursor: null });
    }

    // Use existing conversation query function with search parameter
    const result = await getConvosByCursor(
      req.user.id,
      cursor,
      20, // limit
      'updatedAt', // sortBy
      'desc', // sortDirection
      undefined, // tags
      query.trim(), // search query
    );

    return res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
