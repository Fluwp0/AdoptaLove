const petModel = require('./pet.model');

async function getAvailablePets() {
  return petModel.findAvailablePets();
}

async function getPetById(id) {
  const petId = Number(id);

  if (!Number.isInteger(petId) || petId <= 0) {
    return null;
  }

  return petModel.findPetById(petId);
}

module.exports = { getAvailablePets, getPetById };
