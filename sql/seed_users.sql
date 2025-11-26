-- seed_users.sql
-- Demo users for local development (XAMPP / phpMyAdmin)
--
-- Plaintext credentials (for testing only):
--   alice  : password123
--   bob    : secret456
--   admin  : adminpass
--
-- NOTE: Passwords are stored as SHA2-256 hashes in the database. Do NOT use
-- these plaintext credentials in production; they are provided for local testing.

-- Create a database for the project (change name if needed)
CREATE DATABASE IF NOT EXISTS `miniproject1_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `miniproject1_db`;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(25) NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert demo users (passwords hashed with SHA2-256)
INSERT INTO `users` (`username`, `password_hash`, `role`) VALUES
('alice', SHA2('password123', 256), 'user'),
('bob', SHA2('secret456', 256), 'user'),
('admin', SHA2('adminpass', 256), 'admin');

-- Example query to view users (shows hashed passwords):
-- SELECT `id`, `username`, `password_hash`, `role`, `created_at` FROM `users`;

-- If you want to verify a password via SQL (for testing only):
-- SELECT username FROM users WHERE username = 'alice' AND password_hash = SHA2('password123',256);

-- End of file

-- Create movies table so posters and movie metadata are stored in the DB
CREATE TABLE IF NOT EXISTS `movies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `year` INT NULL,
  `poster_path` VARCHAR(512) NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial movies (poster paths relative to project root)
INSERT INTO `movies` (`title`, `year`, `poster_path`, `description`) VALUES
('DevAstra : The Unheard Battle of Parshurama', 2023, 'The-Conjuring-Last-Rites-English.jpg', 'A chilling supernatural horror.'),
('DevAstra : Discovery of The Immortal', 2024, 'Nobody-2-English.jpg', 'High-octane action sequel.'),
('DevAstra : Unleash The Fire', 2023, 'The-Fantastic-Four-First-Steps-English.jpg', 'Sci-fi exploration at its best.'),
('DevAstra : The Dhoomaketu Effect', 2020, 'F1-The-Movie-English.jpg', 'A mystery that keeps you guessing.');

-- Query movies:
-- SELECT id, title, year, poster_path, description, created_at FROM movies ORDER BY created_at DESC;

-- End of file
