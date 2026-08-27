let runtimeBindings = null;

function setRuntimeBindings(bindings) {
  runtimeBindings = bindings || null;
}

function getRuntimeBindings() {
  if (!runtimeBindings) {
    const error = new Error('Los bindings de Sites no están disponibles en esta solicitud.');
    error.code = 'SITES_BINDINGS_MISSING';
    throw error;
  }

  return runtimeBindings;
}

module.exports = { getRuntimeBindings, setRuntimeBindings };
