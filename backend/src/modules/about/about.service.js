const aboutModel = require('./about.model');

async function getStats() {
  return aboutModel.getAboutStats();
}

module.exports = {
  getStats
};
