-- Add email verification and password reset support
-- This migration adds columns to track email verification status
-- and stores verification/reset tokens in the database

-- Email tokens table for persistent token storage
CREATE TABLE IF NOT EXISTS email_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('verification', 'password-reset')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP NULL,
  
  -- Indexes for quick lookup
  INDEX idx_token (token),
  INDEX idx_email_type (email, type),
  INDEX idx_expires_at (expires_at)
);

-- Add email verification columns to users if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL;

-- Index for finding unverified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
