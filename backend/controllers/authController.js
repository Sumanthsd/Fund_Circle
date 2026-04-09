export async function getCurrentUser(req, res) {
  res.json(req.user);
}
