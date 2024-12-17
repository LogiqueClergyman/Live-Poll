-- Add migration script here
-- Create the polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE  -- To indicate if the poll is active or closed
);

-- Create the poll_options table
CREATE TABLE poll_options (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INT DEFAULT 0  -- To count votes for each option
);

-- Create the votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poll_option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, poll_option_id)  -- Ensure each user can only vote once on each poll option
);

-- Create an index on poll_id in poll_options for performance
CREATE INDEX idx_poll_id ON poll_options(poll_id);

-- Create an index on user_id in votes for performance
CREATE INDEX idx_user_id_votes ON votes(user_id);