export default function handler(req, res) {
  res.redirect(
    'https://discord.com/oauth2/authorize?client_id=1482531786331525241&response_type=code&redirect_uri=https%3A%2F%2Fanomic-values.vercel.app%2Fauth%2Fdiscord%2Fcallback&scope=identify'
  );
}
