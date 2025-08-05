-- Create databases for different environments
CREATE DATABASE transcendence_dev;
CREATE DATABASE transcendence_test;
CREATE DATABASE transcendence_staging;

-- Create application user
CREATE USER transcendence_user WITH ENCRYPTED PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE transcendence_dev TO transcendence_user;
GRANT ALL PRIVILEGES ON DATABASE transcendence_test TO transcendence_user;
GRANT ALL PRIVILEGES ON DATABASE transcendence_staging TO transcendence_user;
