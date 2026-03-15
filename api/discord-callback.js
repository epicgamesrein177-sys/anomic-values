export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     "1482531786331525241",
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  "https://anomic-values.vercel.app/auth/discord/callback",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return res.status(500).send("Discord token exchange failed");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    const username = encodeURIComponent(user.username);
    const avatar   = user.avatar
      ? encodeURIComponent(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
      : encodeURIComponent(`https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`);

    res.redirect(`/?username=${username}&avatar=${avatar}`);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Auth failed: " + err.message);
  }
}
