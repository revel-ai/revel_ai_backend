-- Create journeys table
CREATE TABLE IF NOT EXISTS journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_node_id VARCHAR(255) NOT NULL,
    nodes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journey_runs table
CREATE TABLE IF NOT EXISTS journey_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    patient_context JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    current_node_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journey_runs_journey_id ON journey_runs(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_runs_status ON journey_runs(status);
CREATE INDEX IF NOT EXISTS idx_journey_runs_created_at ON journey_runs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_journeys_updated_at ON journeys;
CREATE TRIGGER update_journeys_updated_at
    BEFORE UPDATE ON journeys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_runs_updated_at ON journey_runs;
CREATE TRIGGER update_journey_runs_updated_at
    BEFORE UPDATE ON journey_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();