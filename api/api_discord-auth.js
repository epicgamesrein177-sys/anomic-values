export default function handler(req, res) {
  const DISCORD_CLIENT_ID = "1482531786331525241";
  const REDIRECT_URI = `https://${req.headers.host}/auth/discord/callback`;

  const params = new URLSearchParams({
    client_id:     DISCORD_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "identify",
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}
