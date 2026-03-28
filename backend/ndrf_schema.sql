-- NDRF Ground Control Station — Database Schema
-- Import once: phpMyAdmin → Import → select this file → Go
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS drone
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE drone;

-- ── 1. Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)     NOT NULL UNIQUE,
  email         VARCHAR(120)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  role          VARCHAR(32)     NOT NULL DEFAULT 'responder',  -- admin | operator | responder
  name          VARCHAR(100),
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  last_login    DATETIME,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_username (username),
  KEY idx_email    (email)
) ENGINE=InnoDB;

-- ── 2. Drones ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drones (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  drone_id    VARCHAR(50)     NOT NULL UNIQUE,   -- e.g. DRONE-001
  name        VARCHAR(100)    NOT NULL,
  model       VARCHAR(100),
  status      VARCHAR(32)     NOT NULL DEFAULT 'Idle',  -- Idle | Flying | Landing | Charging
  battery     TINYINT UNSIGNED DEFAULT 100,
  lat         DOUBLE          DEFAULT 0,
  lon         DOUBLE          DEFAULT 0,
  altitude    FLOAT           DEFAULT 0,
  speed       FLOAT           DEFAULT 0,
  heading     FLOAT           DEFAULT 0,
  `signal`    TINYINT UNSIGNED DEFAULT 0,
  last_seen   DATETIME,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drone_id (drone_id),
  KEY idx_status   (status)
) ENGINE=InnoDB;

-- ── 3. Relief Requests ────────────────────────────────────────
-- Column names match exactly what server.py inserts/selects
-- and what the ground station frontend reads (req.note, req.state,
-- req.people_affected, req.disaster_type, req.cart, req.created_at)
CREATE TABLE IF NOT EXISTS requests (
  id                 INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  ref_id             VARCHAR(50)     UNIQUE,
  resource           VARCHAR(64)     NOT NULL,              -- Food | Medical | Shelter | Water
  note               TEXT,                                  -- situation description
  lat                DOUBLE          NOT NULL,
  lon                DOUBLE          NOT NULL,
  urgency            VARCHAR(32)     NOT NULL DEFAULT 'Urgent',   -- Critical | High | Urgent
  status             VARCHAR(32)     NOT NULL DEFAULT 'Pending',  -- Pending | Assigned | In Transit | Delivered | UserConfirmed
  disaster_type      VARCHAR(128),
  people_affected    INT UNSIGNED    DEFAULT 1,
  state              VARCHAR(64),
  cart               JSON,                                  -- {"Rice": 2, "Water": 5}
  assigned_drone_id  INT UNSIGNED,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status    (status),
  KEY idx_urgency   (urgency),
  KEY idx_created   (created_at),
  KEY idx_location  (lat, lon),
  FOREIGN KEY (assigned_drone_id) REFERENCES drones(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── 4. Telemetry ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  drone_id    INT UNSIGNED    NOT NULL,
  battery     TINYINT UNSIGNED DEFAULT 100,
  lat         DOUBLE          DEFAULT 0,
  lon         DOUBLE          DEFAULT 0,
  altitude    FLOAT           DEFAULT 0,
  speed       FLOAT           DEFAULT 0,
  heading     FLOAT           DEFAULT 0,
  `signal`    TINYINT UNSIGNED DEFAULT 0,
  recorded_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drone_time (drone_id, recorded_at),
  FOREIGN KEY (drone_id) REFERENCES drones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 5. Drone Commands Log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS drone_commands (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  drone_id    INT UNSIGNED    NOT NULL,
  command     VARCHAR(100)    NOT NULL,   -- TAKEOFF | LAND | RTH | GOTO
  parameters  JSON,
  status      VARCHAR(32)     NOT NULL DEFAULT 'Pending',  -- Pending | Sent | Executed | Failed
  issued_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME,
  PRIMARY KEY (id),
  KEY idx_drone_status (drone_id, status),
  FOREIGN KEY (drone_id) REFERENCES drones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Seed Data ─────────────────────────────────────────────────

-- Admin user  (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role, name) VALUES
('admin', 'admin@ndrf.gov',
 '$2b$12$NkXb36e8H6hJwpQDpBt0A.xYn6tKyEOmPX2XO.xdRe3Hv7GqNvxvW',
 'admin', 'Admin User');

-- Operator user  (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role, name) VALUES
('operator', 'operator@ndrf.gov',
 '$2b$12$NkXb36e8H6hJwpQDpBt0A.xYn6tKyEOmPX2XO.xdRe3Hv7GqNvxvW',
 'operator', 'Ground Operator');

-- Three drones
INSERT IGNORE INTO drones (drone_id, name, model, status, battery, lat, lon) VALUES
('DRONE-001', 'Alpha',   'DJI Matrice 300', 'Idle', 95,  28.6139, 77.2090),
('DRONE-002', 'Bravo',   'DJI Matrice 300', 'Idle', 88,  28.6140, 77.2091),
('DRONE-003', 'Charlie', 'DJI Phantom 4',   'Idle', 100, 28.6141, 77.2092);
