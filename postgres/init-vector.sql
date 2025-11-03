-- PostgreSQL initialization script for Mastra Memory with pgvector support
-- This script sets up the necessary extensions and tables for Mastra memory functionality

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema for Mastra memory if it doesn't exist
CREATE SCHEMA IF NOT EXISTS mastra;

-- Set search path to include mastra schema
SET search_path TO mastra, public;

-- Create threads table for conversation threads
CREATE TABLE IF NOT EXISTS mastra.threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id VARCHAR(255) NOT NULL,
    title TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for storing conversation messages
CREATE TABLE IF NOT EXISTS mastra.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES mastra.threads(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vectors table for storing embeddings
CREATE TABLE IF NOT EXISTS mastra.vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES mastra.messages(id) ON DELETE CASCADE,
    embedding vector(1536), -- 支持降维后的维度 (从2560降至1536)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create working_memory table for storing working memory data
CREATE TABLE IF NOT EXISTS mastra.working_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id VARCHAR(255) NOT NULL,
    thread_id UUID REFERENCES mastra.threads(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_resource_id ON mastra.threads(resource_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON mastra.threads(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON mastra.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON mastra.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON mastra.messages(role);

CREATE INDEX IF NOT EXISTS idx_vectors_message_id ON mastra.vectors(message_id);
-- Create HNSW index for vector similarity search (optimal for OpenAI embeddings)
CREATE INDEX IF NOT EXISTS idx_vectors_embedding_hnsw ON mastra.vectors 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_working_memory_resource_id ON mastra.working_memory(resource_id);
CREATE INDEX IF NOT EXISTS idx_working_memory_thread_id ON mastra.working_memory(thread_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION mastra.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_threads_updated_at 
    BEFORE UPDATE ON mastra.threads 
    FOR EACH ROW EXECUTE FUNCTION mastra.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON mastra.messages 
    FOR EACH ROW EXECUTE FUNCTION mastra.update_updated_at_column();

CREATE TRIGGER update_working_memory_updated_at 
    BEFORE UPDATE ON mastra.working_memory 
    FOR EACH ROW EXECUTE FUNCTION mastra.update_updated_at_column();

-- Grant necessary permissions to the app user
GRANT USAGE ON SCHEMA mastra TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mastra TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mastra TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA mastra TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA mastra GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA mastra GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA mastra GRANT ALL ON FUNCTIONS TO app_user;

-- Insert a test record to verify setup
INSERT INTO mastra.threads (resource_id, title, metadata) 
VALUES ('test-user', 'Test Thread', '{"source": "init-script"}')
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Mastra Memory PostgreSQL initialization completed successfully';
    RAISE NOTICE 'Created schema: mastra';
    RAISE NOTICE 'Created tables: threads, messages, vectors, working_memory';
    RAISE NOTICE 'Created indexes including HNSW vector index';
    RAISE NOTICE 'Granted permissions to app_user';
END $$;