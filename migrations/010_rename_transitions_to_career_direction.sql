ALTER TABLE transitions RENAME TO career_direction;
ALTER TABLE career_direction RENAME COLUMN transition_id TO career_direction_id;
ALTER TABLE career_direction RENAME COLUMN transition TO summary;