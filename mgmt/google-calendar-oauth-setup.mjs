#!/usr/bin/env node

/**
 * Google Calendar OAuth Setup Script
 * 
 * This script helps you generate a refresh token for Google Calendar API access.
 * 
 * Prerequisites:
 * 1. You already have Google OAuth credentials (Client ID and Client Secret)
 * 2. The redirect URI must be authorized in your Google Cloud Console
 * 
 * Usage:
 *   node google-calendar-oauth-setup.mjs
 */

import { google } from 'googleapis';
import http from 'http';
import { parse } from 'url';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

// Load credentials from environment or prompt
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '32614029755-bh0b4bg1vd7a1unlu5ma7rvn38efqnr5.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

// Scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

console.log('🔐 Google Calendar OAuth Setup');
console.log('================================\n');
console.log('Client ID:', CLIENT_ID);
console.log('Redirect URI:', REDIRECT_URI);
console.log('\n');

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Required for refresh token
  scope: SCOPES,
  prompt: 'consent' // Force consent screen to get refresh token
});

console.log('📋 Steps to complete setup:');
console.log('1. A browser window will open');
console.log('2. Sign in with your Google account');
console.log('3. Grant calendar access permissions');
console.log('4. You will be redirected (server will capture the code)');
console.log('5. Your refresh token will be saved\n');

// Create a temporary HTTP server to receive the OAuth callback
const server = http.createServer(async (req, res) => {
  const queryObject = parse(req.url, true).query;
  
  if (queryObject.code) {
    // Exchange authorization code for tokens
    try {
      const { tokens } = await oauth2Client.getToken(queryObject.code);
      oauth2Client.setCredentials(tokens);
      
      console.log('\n✅ SUCCESS! OAuth tokens received\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 Add this to your backend/.env file:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (tokens.refresh_token) {
        console.log('🎉 Refresh token obtained successfully!');
        console.log('This token will not expire and can be used indefinitely.\n');
      } else {
        console.log('⚠️  No refresh token received.');
        console.log('This might happen if you already authorized this app before.');
        console.log('Try revoking access at: https://myaccount.google.com/permissions');
        console.log('Then run this script again.\n');
      }
      
      // Send success response to browser
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Calendar OAuth Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { color: #6b7280; line-height: 1.6; }
            code {
              background: #f3f4f6;
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Authorization Successful!</h1>
            <p>You can close this window and return to your terminal.</p>
            <p>Check the terminal for your <code>GOOGLE_CALENDAR_REFRESH_TOKEN</code></p>
          </div>
        </body>
        </html>
      `);
      
      // Close server after successful auth
      setTimeout(() => {
        server.close();
        console.log('✨ OAuth server closed. You can now use the refresh token!\n');
        process.exit(0);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error.message);
      
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body>
          <h1>❌ Authentication Error</h1>
          <p>Check the terminal for error details.</p>
        </body>
        </html>
      `);
      
      setTimeout(() => {
        server.close();
        process.exit(1);
      }, 1000);
    }
  } else {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('No authorization code found in callback');
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, async () => {
  console.log(`🌐 OAuth callback server started on http://localhost:${PORT}`);
  console.log('📱 Opening browser for authentication...\n');
  
  try {
    await open(authUrl);
    console.log('✓ Browser opened. Please complete the authorization.\n');
  } catch (error) {
    console.log('⚠️  Could not automatically open browser.');
    console.log('Please manually open this URL:\n');
    console.log(authUrl);
    console.log('\n');
  }
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('Please close any other applications using this port and try again.');
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted. Closing server...');
  server.close();
  process.exit(0);
});

