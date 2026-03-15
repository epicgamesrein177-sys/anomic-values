
export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing code");
  }

  const DISCORD_CLIENT_ID = "1482531786331525241";
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = `https://${req.headers.host}/auth/discord/callback`;

  try {
    // 1. Exchange code for Discord access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return res.status(500).send("Discord token exchange failed");
    }

    // 2. Get Discord user profile
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();

    // 3. Redirect back to the client with user info as query parameters
    const displayName = encodeURIComponent(discordUser.username);
    const avatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`;
    const encodedAvatar = encodeURIComponent(avatar);

    res.redirect(`/?username=${displayName}&avatar=${encodedAvatar}`);

  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Authentication failed: " + err.message);
  }
}
