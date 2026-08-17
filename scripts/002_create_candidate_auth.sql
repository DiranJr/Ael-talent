-- ============================================================================
-- A&L Talent — Migration 002: Tabela de Autenticação Dedicada do Candidato
-- Data: 2026-08-17
-- Finalidade: Isolar credenciais e controle de autenticação/bloqueio da tabela extra_field
-- ============================================================================

CREATE TABLE IF NOT EXISTS `candidate_auth` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `candidate_id` INT(11) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `failed_attempts` INT(11) NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL DEFAULT NULL,
  `last_login` DATETIME NULL DEFAULT NULL,
  `password_changed_at` DATETIME NULL DEFAULT NULL,
  `reset_token_hash` VARCHAR(64) NULL DEFAULT NULL,
  `reset_token_expires_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_candidate_auth_candidate_id` (`candidate_id`),
  KEY `idx_candidate_auth_reset_token_hash` (`reset_token_hash`),
  CONSTRAINT `fk_candidate_auth_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidate` (`candidate_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
