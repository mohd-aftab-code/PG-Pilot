-- Add referral_code column to pgs table
ALTER TABLE pgs 
ADD COLUMN referral_code VARCHAR(20) UNIQUE NULL AFTER pg_uid;

-- Add referral_code column to referrals table to track which code was used
ALTER TABLE referrals 
ADD COLUMN referral_code VARCHAR(20) NULL AFTER referred_pg;

-- Create index for faster lookups
CREATE INDEX idx_referral_code ON pgs(referral_code);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- Generate referral codes for existing PGs
UPDATE pgs 
SET referral_code = CONCAT('REF', LPAD(id, 6, '0'))
WHERE referral_code IS NULL;

