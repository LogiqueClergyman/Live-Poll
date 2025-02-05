-- First check if database exists
SELECT 'CREATE DATABASE poll'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'poll')\gexec
