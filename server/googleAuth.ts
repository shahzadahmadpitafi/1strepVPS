import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export async function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing) — skipping");
    app.get("/api/auth/google/login", (_req, res) =>
      res.status(503).json({ error: "Google login is not configured on this server" })
    );
    return;
  }

  // Set GOOGLE_OAUTH_CALLBACK_DOMAIN to your VPS domain, e.g. "yourdomain.com"
  const productionDomain = process.env.GOOGLE_OAUTH_CALLBACK_DOMAIN;
  const domain = productionDomain || 'localhost:5000';
  // Always use HTTPS for Replit deployments, HTTP only for local development
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const callbackURL = `${protocol}://${domain}/api/auth/google/callback`;
  
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
        passReqToCallback: true,
        state: true, // Enable CSRF protection
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Extract user data from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
          const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Create or update user from Google login
          const user = await storage.upsertSocialUser({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
            provider: 'google',
          });

          // Return user for session
          done(null, { dbUserId: user.id, googleProfile: profile });
        } catch (error) {
          done(error);
        }
      }
    )
  );

  // Google OAuth login route
  app.get(
    "/api/auth/google/login",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account", // Always show account picker
    })
  );

  // Google OAuth callback route with better error handling
  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Google OAuth error:", err);
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication Error</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Authentication Failed</h2>
                <p>Error: ${err.message || 'Unknown error occurred'}</p>
                <p style="color: #666; font-size: 14px;">Please check that Google OAuth is properly configured.</p>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Close Window</button>
              </body>
            </html>
          `);
        }
        
        if (!user) {
          console.error("Google OAuth: No user returned", info);
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication Failed</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Authentication Failed</h2>
                <p>Could not authenticate with Google. Please try again.</p>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Close Window</button>
              </body>
            </html>
          `);
        }
        
        // Log in the user
        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            console.error("Session login error:", loginErr);
            return res.send(`
              <!DOCTYPE html>
              <html>
                <head><title>Session Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #dc2626;">Session Error</h2>
                  <p>Could not create session. Please try again.</p>
                  <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Close Window</button>
                </body>
              </html>
            `);
          }
          
          // Successful authentication
          console.log("Google OAuth success for user:", user.dbUserId);
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication Successful</title>
              </head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <script>
                  // Send message to parent window
                  if (window.opener) {
                    window.opener.postMessage({ type: 'oauth-success' }, '*');
                    window.close();
                  } else {
                    // If not in popup, redirect to home
                    window.location.href = '/';
                  }
                </script>
                <h2 style="color: #16a34a;">Authentication Successful!</h2>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
        });
      })(req, res, next);
    }
  );
  
  // Log the configured callback URL on startup
  console.log(`🔐 Google OAuth configured with callback: ${callbackURL}`);
}
