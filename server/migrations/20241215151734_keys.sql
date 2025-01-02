-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
);

-- Create the passkeys table, with a foreign key reference to users
CREATE TABLE passkeys (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_data BYTEA NOT NULL
    );

-- Optionally, create an index on the user_id in passkeys
CREATE INDEX idx_user_id ON passkeys(user_id);