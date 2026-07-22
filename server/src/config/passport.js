"use strict";

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const env = require("./env");

/**
 * Helper to construct unique username from name/email.
 * @param {string} displayName
 * @param {string} email
 * @returns {Promise<string>}
 */
async function generateUniqueUsername(displayName, email) {
  let base = (displayName || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  if (base.length < 3) base = `user${Math.floor(100 + Math.random() * 900)}`;

  let username = base;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

/**
 * Handle account linking or user creation for OAuth providers.
 * @param {string} provider - 'google' | 'github'
 * @param {string} providerId
 * @param {string} email
 * @param {string} name
 * @param {string} avatarUrl
 * @param {Function} done
 */
async function handleOAuthUser(provider, providerId, email, name, avatarUrl, done) {
  try {
    if (!email) {
      return done(new Error("OAuth account has no verified primary email. Cannot authenticate."));
    }

    const providerField = provider === "google" ? "googleId" : "githubId";

    // 1. Check if user already exists by providerId
    let user = await User.findOne({ [providerField]: providerId });
    if (user) {
      return done(null, user);
    }

    // 2. Search by email
    const emailUser = await User.findOne({ email: email.toLowerCase() });
    if (emailUser) {
      // Check if providerId is already linked to someone else (edge case)
      if (emailUser[providerField] && emailUser[providerField] !== providerId) {
        return done(new Error("Conflict: Account already linked to a different provider identity."));
      }

      // Link provider ID and auto-verify email
      emailUser[providerField] = providerId;
      emailUser.emailVerified = true;
      if (!emailUser.avatarUrl && avatarUrl) {
        emailUser.avatarUrl = avatarUrl;
      }
      await emailUser.save();
      return done(null, emailUser);
    }

    // 3. Create new user with emailVerified = true
    const username = await generateUniqueUsername(name, email);
    user = new User({
      name: name || username,
      username,
      email: email.toLowerCase(),
      [providerField]: providerId,
      emailVerified: true,
      avatarUrl: avatarUrl || "",
    });

    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}

// ---------------- Google Strategy ----------------
if (env.googleClientId && env.googleClientId !== "mock_google_client_id") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.clientUrl.includes("localhost") ? "http://localhost:5000" : ""}/api/auth/google/callback`,
        scope: ["profile", "email"],
        state: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : "";
        await handleOAuthUser("google", profile.id, email, profile.displayName, avatarUrl, done);
      }
    )
  );
}

// ---------------- GitHub Strategy ----------------
if (env.githubClientId && env.githubClientId !== "mock_github_client_id") {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.githubClientId,
        clientSecret: env.githubClientSecret,
        callbackURL: `${env.clientUrl.includes("localhost") ? "http://localhost:5000" : ""}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        // GitHub private email fallback via GET /user/emails
        if (!email && accessToken) {
          try {
            const response = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "Inkwell-App",
              },
            });
            if (response.ok) {
              const emails = await response.json();
              const primaryVerified = emails.find((e) => e.primary && e.verified);
              if (primaryVerified) {
                email = primaryVerified.email;
              }
            }
          } catch (fetchErr) {
            console.error("Failed to fetch private GitHub emails:", fetchErr);
          }
        }

        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : profile._json.avatar_url || "";
        const name = profile.displayName || profile.username;
        await handleOAuthUser("github", profile.id, email, name, avatarUrl, done);
      }
    )
  );
}

module.exports = passport;
module.exports.handleOAuthUser = handleOAuthUser;
