const express = require('express');
const router = express.Router();
const searchController = require('../controller/searchController');

// Search PGs (public endpoint - no auth required)
router.get('/pgs', searchController.searchPGs);
// Get search suggestions (public endpoint - no auth required)
router.get('/suggestions', searchController.getSuggestions);

module.exports = router;

