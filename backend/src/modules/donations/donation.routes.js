const { Router } = require('express');
const {
  createDonation,
  getDonationSummary,
  listDonations
} = require('./donation.controller');

const router = Router();

router.get('/', listDonations);
router.get('/summary', getDonationSummary);
router.post('/', createDonation);

module.exports = router;
