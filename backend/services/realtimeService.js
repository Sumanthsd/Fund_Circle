let dataRevision = Date.now();

export function getDataRevision() {
  return dataRevision;
}

export function bumpDataRevision() {
  const now = Date.now();
  dataRevision = now > dataRevision ? now : dataRevision + 1;
  return dataRevision;
}

