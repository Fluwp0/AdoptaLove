const donationService = require('./donation.service');

function sendKnownError(error, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  return next(error);
}

async function createDonation(req, res, next) {
  try {
    const donation = await donationService.createDonation(req.body);

    return res.status(201).json({
      status: 'ok',
      data: donation
    });
  } catch (error) {
    return sendKnownError(error, res, next);
  }
}

async function listDonations(_req, res, next) {
  try {
    const donations = await donationService.getDonations();

    return res.json({
      status: 'ok',
      total: donations.length,
      data: donations
    });
  } catch (error) {
    return next(error);
  }
}

async function getDonationSummary(_req, res, next) {
  try {
    const summary = await donationService.getDonationSummary();

    return res.json({
      status: 'ok',
      data: summary
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDonation,
  getDonationSummary,
  listDonations
};
