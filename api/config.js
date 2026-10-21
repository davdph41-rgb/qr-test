module.exports = (req, res) => {
  res.status(200).json({ clientKey: process.env.MIDTRANS_CLIENT_KEY });
};
