import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Init Firebase Admin (once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();
const db        = getFirestore();

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  const DISCORD_CLIENT_ID     = "1482531786331525241";
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI          = `https://${req.headers.host}/auth/discord/callback`;

  try {
    // 1. Exchange code for Discord access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  REDIRECT_URI,
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

    const uid         = `discord_${discordUser.id}`;
    const displayName = discordUser.username;
    const photoURL    = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`;

    // 3. Create or update Firebase user
    try {
      await adminAuth.updateUser(uid, { displayName, photoURL });
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        await adminAuth.createUser({ uid, displayName, photoURL });
      } else throw e;
    }

    // 4. Save profile to Firestore
    await db.collection("users").doc(uid).set({
      uid, displayName, photoURL,
      discordId:  discordUser.id,
      discordTag: discordUser.username,
      updatedAt:  new Date(),
    }, { merge: true });

    // 5. Create custom Firebase token and redirect back to site
    const firebaseToken = await adminAuth.createCustomToken(uid);
    res.redirect(`/?firebaseToken=${firebaseToken}`);

  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Authentication failed: " + err.message);
  }
}
