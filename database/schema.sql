CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  legal_name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200) NULL,
  ruc VARCHAR(20) NULL,
  dv VARCHAR(2) NULL,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_companies_tenant_status (tenant_id,status),
  CONSTRAINT fk_companies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('administrator','accountant','operator') NOT NULL DEFAULT 'operator',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  auth_version INT UNSIGNED NOT NULL DEFAULT 1,
  failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  last_login_at DATETIME NULL,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_encrypted TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_memberships (
  company_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('administrator','accountant','operator') NOT NULL DEFAULT 'operator',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id,user_id),
  KEY idx_memberships_user_status (user_id,status),
  CONSTRAINT fk_membership_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_company_created (company_id,created_at),
  CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_sequences (
  company_id BIGINT UNSIGNED NOT NULL,
  branch_code VARCHAR(4) NOT NULL,
  billing_point CHAR(3) NOT NULL,
  document_type CHAR(2) NOT NULL,
  next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id,branch_code,billing_point,document_type),
  CONSTRAINT fk_invoice_sequence_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT chk_invoice_next_number CHECK (next_number BETWEEN 1 AND 10000000000)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(30) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  customer_type ENUM('01','02','03','04') NOT NULL,
  contributor_type ENUM('1','2') NULL,
  ruc VARCHAR(20) NULL,
  dv VARCHAR(2) NULL,
  legal_name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200) NULL,
  email VARCHAR(254) NULL,
  secondary_email VARCHAR(254) NULL,
  phone VARCHAR(16) NULL,
  secondary_phone VARCHAR(16) NULL,
  address VARCHAR(100) NULL,
  location_code VARCHAR(8) NULL,
  province VARCHAR(50) NULL,
  district VARCHAR(50) NULL,
  township VARCHAR(50) NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'PA',
  country_other VARCHAR(50) NULL,
  foreign_id_type ENUM('01','02','99') NULL,
  foreign_id_number VARCHAR(50) NULL,
  foreign_country VARCHAR(50) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_company_code (company_id,code),
  KEY idx_clients_name (company_id,legal_name),
  KEY idx_clients_fiscal (ruc,dv),
  KEY idx_clients_status (status),
  CONSTRAINT fk_clients_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_clients_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_clients_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS client_custom_field_definitions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(50) NOT NULL,
  label VARCHAR(80) NOT NULL,
  field_type ENUM('text','number','date','boolean') NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_field_company_key (company_id,field_key),
  CONSTRAINT fk_client_field_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_field_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS client_custom_field_values (
  client_id BIGINT UNSIGNED NOT NULL,
  field_definition_id BIGINT UNSIGNED NOT NULL,
  field_value VARCHAR(2000) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id,field_definition_id),
  CONSTRAINT fk_client_value_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_value_definition FOREIGN KEY (field_definition_id) REFERENCES client_custom_field_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  zoho_item_id VARCHAR(30) NULL,
  sku VARCHAR(50) NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500) NULL,
  item_type ENUM('product','service') NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  available_in_pos BOOLEAN NOT NULL DEFAULT FALSE,
  unit VARCHAR(20) NOT NULL DEFAULT 'und',
  sale_price DECIMAL(13,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  tax_code ENUM('00','01','02','03') NOT NULL DEFAULT '00',
  tax_name VARCHAR(50) NULL,
  cpbs_code VARCHAR(20) NULL,
  profit DECIMAL(13,2) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_articles_company_zoho (company_id,zoho_item_id),
  UNIQUE KEY uq_articles_company_sku (company_id,sku),
  KEY idx_articles_name (company_id,name),
  KEY idx_articles_type_status (item_type,status),
  CONSTRAINT fk_articles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_articles_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_articles_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_custom_field_definitions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(50) NOT NULL,
  label VARCHAR(80) NOT NULL,
  field_type ENUM('text','number','date','boolean') NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_article_field_company_key (company_id,field_key),
  CONSTRAINT fk_article_field_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_field_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_custom_field_values (
  article_id BIGINT UNSIGNED NOT NULL,
  field_definition_id BIGINT UNSIGNED NOT NULL,
  field_value VARCHAR(2000) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id,field_definition_id),
  CONSTRAINT fk_article_value_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_value_definition FOREIGN KEY (field_definition_id) REFERENCES article_custom_field_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS electronic_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  branch_code VARCHAR(4) NOT NULL,
  billing_point CHAR(3) NOT NULL,
  document_type CHAR(2) NOT NULL,
  fiscal_number CHAR(10) NOT NULL,
  customer_name VARCHAR(200) NULL,
  customer_email VARCHAR(254) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal DECIMAL(13,2) NOT NULL,
  tax_total DECIMAL(13,2) NOT NULL,
  total DECIMAL(13,2) NOT NULL,
  status ENUM('reserved','authorized','rejected','uncertain') NOT NULL DEFAULT 'reserved',
  provider_code VARCHAR(30) NULL,
  provider_message VARCHAR(1000) NULL,
  cufe VARCHAR(100) NULL,
  qr_url TEXT NULL,
  authorization_protocol VARCHAR(100) NULL,
  request_payload JSON NOT NULL,
  response_payload JSON NULL,
  issued_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoice_company_fiscal_number (company_id,branch_code,billing_point,document_type,fiscal_number),
  KEY idx_invoice_status_created (company_id,status,created_at),
  CONSTRAINT fk_invoice_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoice_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS config_operational (
  company_id BIGINT UNSIGNED NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value VARCHAR(1000) NOT NULL,
  value_type ENUM('string','integer','boolean','url') NOT NULL DEFAULT 'string',
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id,config_key),
  CONSTRAINT fk_config_operational_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_config_operational_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS config_secrets (
  company_id BIGINT UNSIGNED NOT NULL,
  secret_key VARCHAR(100) NOT NULL,
  encrypted_value TEXT NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id,secret_key),
  CONSTRAINT fk_config_secret_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_config_secret_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
