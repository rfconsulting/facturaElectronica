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
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
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
  KEY idx_users_role_status (role, status),
  KEY idx_users_superuser (is_superuser, status)
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

CREATE TABLE IF NOT EXISTS user_invitations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_invitation_token (token_hash),
  KEY idx_user_invitation_user (user_id,used_at,expires_at),
  CONSTRAINT fk_invitation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invitation_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invitation_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_token (token_hash),
  KEY idx_password_reset_user (user_id,used_at,expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
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

CREATE TABLE IF NOT EXISTS user_billing_assignments (
  company_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  branch_code VARCHAR(4) NOT NULL,
  billing_point CHAR(3) NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id,user_id),
  KEY idx_billing_assignment_point (company_id,branch_code,billing_point),
  CONSTRAINT fk_billing_assignment_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_billing_assignment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_billing_assignment_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
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

CREATE TABLE IF NOT EXISTS client_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  position VARCHAR(120) NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(30) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_decision_maker BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_client_contacts_client (company_id,client_id,status),
  KEY idx_client_contacts_email (company_id,email),
  CONSTRAINT fk_client_contact_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_contact_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_contact_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
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
  idempotency_key VARCHAR(128) COLLATE utf8mb4_bin NULL,
  request_hash CHAR(64) COLLATE ascii_bin NULL,
  customer_id BIGINT UNSIGNED NULL,
  source_quote_id BIGINT UNSIGNED NULL,
  opportunity_id BIGINT UNSIGNED NULL,
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
  UNIQUE KEY uq_invoice_company_idempotency (company_id,idempotency_key),
  KEY idx_invoice_status_created (company_id,status,created_at),
  CONSTRAINT fk_invoice_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoice_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(160) NOT NULL,
  company_name VARCHAR(200) NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(30) NULL,
  source VARCHAR(80) NULL,
  score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('new','attempting_contact','contacted','qualified','nurturing','discarded','converted') NOT NULL DEFAULT 'new',
  next_action_at DATETIME NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_leads_company_status (company_id,status,next_action_at),
  CONSTRAINT fk_crm_lead_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_lead_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_lead_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_lead_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  lead_id BIGINT UNSIGNED NULL,
  client_id BIGINT UNSIGNED NULL,
  contact_id BIGINT UNSIGNED NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  service_line VARCHAR(160) NULL,
  stage ENUM('diagnosis','solution_defined','quote_sent','follow_up','negotiation','payment_pending','won','lost') NOT NULL DEFAULT 'diagnosis',
  amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  probability TINYINT UNSIGNED NOT NULL DEFAULT 20,
  expected_close DATE NULL,
  next_action VARCHAR(250) NULL,
  next_action_at DATETIME NULL,
  lost_reason VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_opportunity_pipeline (company_id,stage,owner_user_id),
  CONSTRAINT fk_crm_opportunity_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_opportunity_lead FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_opportunity_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_opportunity_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_opportunity_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_opportunity_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  contact_id BIGINT UNSIGNED NULL,
  lead_id BIGINT UNSIGNED NULL,
  opportunity_id BIGINT UNSIGNED NULL,
  invoice_id BIGINT UNSIGNED NULL,
  activity_type ENUM('note','call','email','meeting','task','invoice','system') NOT NULL,
  subject VARCHAR(200) NOT NULL,
  details TEXT NULL,
  outcome VARCHAR(500) NULL,
  next_action VARCHAR(250) NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_activity_timeline (company_id,client_id,occurred_at),
  CONSTRAINT fk_crm_activity_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_activity_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_activity_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_activity_lead FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_activity_opportunity FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_activity_invoice FOREIGN KEY (invoice_id) REFERENCES electronic_invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_activity_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  lead_id BIGINT UNSIGNED NULL,
  contact_id BIGINT UNSIGNED NULL,
  opportunity_id BIGINT UNSIGNED NULL,
  assigned_to BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  due_at DATETIME NULL,
  priority ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_task_owner_due (company_id,assigned_to,status,due_at),
  CONSTRAINT fk_crm_task_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_task_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_task_lead FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_task_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_task_opportunity FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_task_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_crm_task_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_quotes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  opportunity_id BIGINT UNSIGNED NULL,
  client_id BIGINT UNSIGNED NULL,
  contact_id BIGINT UNSIGNED NULL,
  quote_number VARCHAR(30) NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  revision_of_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL DEFAULT 'Cotización comercial',
  status ENUM('draft','pending_approval','approved','sent','viewed','accepted','converted','rejected','expired','cancelled') NOT NULL DEFAULT 'draft',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  conversion_policy ENUM('direct_invoice','sales_order') NOT NULL DEFAULT 'sales_order',
  valid_until DATE NULL,
  payment_terms VARCHAR(500) NULL,
  customer_snapshot JSON NULL,
  notes VARCHAR(2000) NULL,
  subtotal DECIMAL(13,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(13,2) NOT NULL DEFAULT 0,
  total DECIMAL(13,2) NOT NULL DEFAULT 0,
  accepted_at DATETIME NULL,
  accepted_by BIGINT UNSIGNED NULL,
  converted_document_type ENUM('invoice_draft','sales_order','invoice') NULL,
  converted_document_id BIGINT UNSIGNED NULL,
  converted_at DATETIME NULL,
  conversion_key VARCHAR(128) COLLATE utf8mb4_bin NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crm_quote_number (company_id,quote_number,version),
  UNIQUE KEY uq_crm_quote_conversion (company_id,conversion_key),
  KEY idx_crm_quote_opportunity (company_id,opportunity_id,status),
  CONSTRAINT fk_crm_quote_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_quote_opportunity FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_quote_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_quote_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_quote_revision FOREIGN KEY (revision_of_id) REFERENCES crm_quotes(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_quote_acceptor FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_crm_quote_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_quote_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  quote_id BIGINT UNSIGNED NOT NULL,
  from_status ENUM('draft','pending_approval','approved','sent','viewed','accepted','converted','rejected','expired','cancelled') NULL,
  to_status ENUM('draft','pending_approval','approved','sent','viewed','accepted','converted','rejected','expired','cancelled') NOT NULL,
  reason VARCHAR(500) NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quote_history (company_id,quote_id,changed_at),
  CONSTRAINT fk_quote_history_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_history_quote FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_quote_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NULL,
  sku VARCHAR(50) NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'und',
  quantity DECIMAL(13,6) NOT NULL,
  unit_price DECIMAL(13,2) NOT NULL,
  discount_percentage DECIMAL(7,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  tax_code CHAR(2) NOT NULL DEFAULT '00',
  tax_rate DECIMAL(7,4) NOT NULL DEFAULT 0,
  subtotal DECIMAL(13,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(13,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_crm_quote_items_quote (quote_id),
  CONSTRAINT fk_crm_quote_item_quote FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_quote_item_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_quote_sequences (
  company_id BIGINT UNSIGNED NOT NULL,
  next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (company_id),
  CONSTRAINT fk_crm_quote_sequence_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  source_quote_id BIGINT UNSIGNED NOT NULL,
  order_number VARCHAR(30) NOT NULL,
  status ENUM('draft','confirmed','partially_invoiced','invoiced','cancelled') NOT NULL DEFAULT 'draft',
  client_id BIGINT UNSIGNED NOT NULL,
  contact_id BIGINT UNSIGNED NULL,
  opportunity_id BIGINT UNSIGNED NULL,
  customer_snapshot JSON NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal DECIMAL(13,2) NOT NULL,
  discount_total DECIMAL(13,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(13,2) NOT NULL,
  total DECIMAL(13,2) NOT NULL,
  expected_delivery DATE NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_order_source_quote (company_id,source_quote_id),
  UNIQUE KEY uq_sales_order_number (company_id,order_number),
  CONSTRAINT fk_sales_order_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_order_quote FOREIGN KEY (source_quote_id) REFERENCES crm_quotes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_order_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_order_opportunity FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_order_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NULL,
  sku VARCHAR(50) NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(13,6) NOT NULL,
  unit_price DECIMAL(13,2) NOT NULL,
  discount_percentage DECIMAL(7,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  tax_code CHAR(2) NOT NULL,
  tax_rate DECIMAL(7,4) NOT NULL,
  subtotal DECIMAL(13,2) NOT NULL,
  tax_amount DECIMAL(13,2) NOT NULL,
  line_total DECIMAL(13,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sales_order_items (sales_order_id),
  CONSTRAINT fk_sales_order_item_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_order_item_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_order_sequences (
  company_id BIGINT UNSIGNED NOT NULL,
  next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (company_id),
  CONSTRAINT fk_sales_order_sequence_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crm_automation_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  trigger_event ENUM('lead_created','lead_status_changed','opportunity_created','opportunity_stage_changed','invoice_authorized') NOT NULL,
  trigger_value VARCHAR(50) NULL,
  action_type ENUM('create_task') NOT NULL DEFAULT 'create_task',
  action_config JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_rule_trigger (company_id,is_active,trigger_event),
  CONSTRAINT fk_crm_rule_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_rule_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS integration_outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id BIGINT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','processing','delivered','failed') NOT NULL DEFAULT 'pending',
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  last_error VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_outbox_delivery (status,available_at,company_id),
  CONSTRAINT fk_outbox_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  opportunity_id BIGINT UNSIGNED NULL,
  quote_id BIGINT UNSIGNED NULL,
  invoice_id BIGINT UNSIGNED NOT NULL,
  original_amount DECIMAL(13,2) NOT NULL,
  paid_amount DECIMAL(13,2) NOT NULL DEFAULT 0,
  balance DECIMAL(13,2) NOT NULL,
  due_date DATE NULL,
  status ENUM('pending','partial','paid','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_receivable_invoice (company_id,invoice_id),
  KEY idx_receivable_status (company_id,status,due_date),
  CONSTRAINT fk_receivable_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_receivable_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_receivable_opportunity FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_receivable_quote FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE SET NULL,
  CONSTRAINT fk_receivable_invoice FOREIGN KEY (invoice_id) REFERENCES electronic_invoices(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS receivable_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  receivable_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(13,2) NOT NULL,
  payment_method ENUM('cash','credit_card','debit_card','transfer','check','other') NOT NULL,
  reference VARCHAR(120) NULL,
  paid_at DATETIME NOT NULL,
  notes VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_receivable_payment (company_id,receivable_id,paid_at),
  CONSTRAINT fk_payment_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_receivable FOREIGN KEY (receivable_id) REFERENCES accounts_receivable(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
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
