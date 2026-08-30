-- Auth schema. Owner: Rajnish.
--
-- NOTE FOR THE TEAM: user_story_02-backend assumed V1__schema.sql would create all
-- seven tables. This migration takes V1 for the auth slice only, so the customer,
-- product, account_transaction, document_template, document_job and email_outbox
-- tables must land in V2+ instead. Migrations are append-only — never edit this file
-- once it has been pushed.
--
-- H2 dialect. Kept portable where it costs nothing, so moving back to PostgreSQL
-- later is a dialect change rather than a rewrite.

CREATE TABLE relationship_manager (
    id              VARCHAR(20)   PRIMARY KEY,
    username        VARCHAR(64)   NOT NULL,
    password_hash   VARCHAR(100)  NOT NULL,
    name            VARCHAR(120)  NOT NULL,
    initials        VARCHAR(8)    NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    branch          VARCHAR(160)  NOT NULL,
    mfa_enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Usernames are compared case-insensitively at login, so uniqueness has to be
-- enforced case-insensitively too. Without this, 'rm001' and 'RM001' could both
-- exist and the lookup would be ambiguous.
CREATE UNIQUE INDEX ux_rm_username_lower ON relationship_manager (LOWER(username));

-- Append-only audit of every login attempt, successful or not.
--
-- The brute-force counters are derived from this table rather than stored on
-- relationship_manager, for two reasons: attempts against usernames that do not
-- exist are recorded too (which is what makes a real and a fake account behave
-- identically), and the history doubles as an audit trail.
CREATE TABLE login_attempt (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    username_attempted  VARCHAR(64)   NOT NULL,
    ip_address          VARCHAR(45)   NOT NULL,   -- 45 chars fits IPv6
    outcome             VARCHAR(24)   NOT NULL,   -- SUCCESS | BAD_CREDENTIALS | LOCKED | CAPTCHA_FAILED | MFA_FAILED
    attempted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Both counter queries filter on a time window, so the timestamp belongs in the index.
CREATE INDEX ix_login_attempt_username ON login_attempt (username_attempted, attempted_at);
CREATE INDEX ix_login_attempt_ip       ON login_attempt (ip_address, attempted_at);








-- Demo data. Owner: Rajnish.
--
-- GENERATED from frontend/src/services/mockData.js so the API returns exactly what the
-- frontend already renders. If you change a customer here, change it there too — the
-- README's contract rule cuts both ways.
--
-- RM001 is inserted with an unusable password hash ('!'), which BCrypt can never match.
-- DemoDataSeeder replaces it with a real hash on startup when wealthcore.demo.seed-enabled
-- is on. That keeps the hash out of version control while still letting customer rows
-- reference the RM.

INSERT INTO relationship_manager
  (id, username, password_hash, name, initials, email, branch, mfa_enabled)
VALUES
  ('RM001', 'RM001', '!', 'avengers', 'AV', 'rajnish@sc.com',
   'Standard Chartered Global Private Bank', TRUE);


INSERT INTO customer (id, rm_id, name, name_zh, email, tier, segment, risk, priority,
                      portfolio_value, next_due_date, due_category, due_reason, due_amount) VALUES
  ('CUST1001', 'RM001', 'Rohan Mehta', '罗汉·梅塔', 'rohan.mehta@example.com', 'Premium', 'HNI', 'Moderate', 'High', 1355000, DATE '2026-09-05', 'Bond', 'FD matures this month', 1355000),
  ('CUST1002', 'RM001', 'Priya Nair', '普里娅·奈尔', 'priya.nair@example.com', 'Regular', 'HNI', 'Conservative', 'High', 1512000, DATE '2026-08-25', 'Bond', 'Portfolio management fee due soon', 1512000),
  ('CUST1003', 'RM001', 'Arjun Reddy', '阿俊·雷迪', 'arjun.reddy@example.com', 'Premium', 'HNI', 'Aggressive', 'High', 2370000, DATE '2026-09-10', 'Mutual Fund', 'SIP renewal due', 2370000),
  ('CUST1004', 'RM001', 'Sneha Kulkarni', '斯内哈·库尔卡尼', 'sneha.kulkarni@example.com', 'Regular', 'HNI', 'Moderate', 'High', 1098000, DATE '2026-08-27', 'Insurance', 'Insurance premium due', 1098000),
  ('CUST1005', 'RM001', 'Vikram Singh', '维克拉姆·辛格', 'vikram.singh@example.com', 'Premium', 'HNI', 'Aggressive', 'Medium', 2450000, DATE '2026-09-28', 'Portfolio Management', 'Annual portfolio review', 2450000),
  ('CUST1006', 'RM001', 'Ananya Iyer', '阿南亚·艾耶尔', 'ananya.iyer@example.com', 'Premium', 'Priority', 'Moderate', 'Medium', 1875000, DATE '2026-10-04', 'FD', 'FD renewal instruction pending', 1875000),
  ('CUST1007', 'RM001', 'Karthik Menon', '卡尔提克·梅农', 'karthik.menon@example.com', 'Regular', 'Priority', 'Conservative', 'Low', 642000, DATE '2026-11-19', 'Bond', 'Coupon reinvestment decision', 642000),
  ('CUST1008', 'RM001', 'Meera Desai', '米拉·德赛', 'meera.desai@example.com', 'Premium', 'HNI', 'Moderate', 'High', 3120000, DATE '2026-08-21', 'Mutual Fund', 'KYC review overdue', 3120000),
  ('CUST1009', 'RM001', 'Rahul Bhatia', '拉胡尔·巴蒂亚', 'rahul.bhatia@example.com', 'Regular', 'Mass Affluent', 'Conservative', 'Low', 486000, DATE '2026-12-08', 'FD', 'FD maturity', 486000),
  ('CUST1010', 'RM001', 'Divya Raghavan', '迪维娅·拉加万', 'divya.raghavan@example.com', 'Premium', 'HNI', 'Aggressive', 'Medium', 2790000, DATE '2026-09-16', 'Portfolio Management', 'Rebalancing proposal pending', 2790000),
  ('CUST1011', 'RM001', 'Sanjay Verma', '桑杰·维尔马', 'sanjay.verma@example.com', 'Regular', 'Priority', 'Moderate', 'Medium', 934000, DATE '2026-10-22', 'Insurance', 'Policy renewal', 934000),
  ('CUST1012', 'RM001', 'Nisha Pillai', '妮莎·皮莱', 'nisha.pillai@example.com', 'Premium', 'Mass Affluent', 'Conservative', 'Low', 715000, DATE '2027-01-09', 'FD', 'FD maturity', 715000);

INSERT INTO product (id, customer_id, type, name, value, maturity_date, due_date, status) VALUES
  ('P1', 'CUST1001', 'FD', 'SC Fixed Deposit 12M', 500000, DATE '2026-09-05', NULL, 'active'),
  ('P2', 'CUST1001', 'Bond', 'Corporate Bond Series VII', 605000, DATE '2027-01-20', NULL, 'active'),
  ('P3', 'CUST1001', 'Insurance', 'Wealth Protect Plus', 250000, NULL, DATE '2026-11-02', 'pending'),
  ('P4', 'CUST1002', 'Portfolio Management', 'Discretionary Mandate', 1012000, NULL, DATE '2026-08-25', 'pending'),
  ('P5', 'CUST1002', 'Bond', 'Govt Securities 2029', 500000, DATE '2029-04-11', NULL, 'active'),
  ('P6', 'CUST1003', 'Mutual Fund', 'India Equity Growth Fund', 1470000, NULL, NULL, 'active'),
  ('P7', 'CUST1003', 'Mutual Fund', 'Small Cap Opportunities', 600000, NULL, NULL, 'active'),
  ('P8', 'CUST1003', 'FD', 'SC Fixed Deposit 24M', 300000, DATE '2026-09-10', NULL, 'active'),
  ('P9', 'CUST1003', 'Bond', 'High Yield Bond 2028', 0, DATE '2028-06-30', NULL, 'closed'),
  ('P10', 'CUST1004', 'Insurance', 'Life Secure Elite', 700000, NULL, DATE '2026-08-27', 'pending'),
  ('P11', 'CUST1004', 'FD', 'SC Fixed Deposit 6M', 250000, DATE '2026-12-01', NULL, 'active'),
  ('P12', 'CUST1004', 'Mutual Fund', 'Balanced Advantage Fund', 148000, NULL, NULL, 'active'),
  ('P13', 'CUST1005', 'Portfolio Management', 'Advisory Mandate', 1800000, NULL, DATE '2026-09-28', 'active'),
  ('P14', 'CUST1005', 'Bond', 'Corporate Bond Series IX', 650000, DATE '2027-08-15', NULL, 'active'),
  ('P15', 'CUST1006', 'FD', 'SC Fixed Deposit 18M', 1200000, DATE '2026-10-04', NULL, 'active'),
  ('P16', 'CUST1006', 'Mutual Fund', 'Global Feeder Fund', 675000, NULL, NULL, 'active'),
  ('P17', 'CUST1007', 'Bond', 'Tax Free Bond 2031', 442000, DATE '2031-03-30', NULL, 'active'),
  ('P18', 'CUST1007', 'Insurance', 'Health Shield', 200000, NULL, DATE '2026-11-19', 'active'),
  ('P19', 'CUST1008', 'Mutual Fund', 'Multi Asset Allocation', 1920000, NULL, NULL, 'overdue'),
  ('P20', 'CUST1008', 'Portfolio Management', 'Discretionary Mandate', 1200000, NULL, DATE '2026-08-21', 'overdue'),
  ('P21', 'CUST1009', 'FD', 'SC Fixed Deposit 12M', 386000, DATE '2026-12-08', NULL, 'active'),
  ('P22', 'CUST1009', 'Insurance', 'Term Cover Basic', 100000, NULL, DATE '2027-01-15', 'active'),
  ('P23', 'CUST1010', 'Portfolio Management', 'Advisory Mandate', 2100000, NULL, DATE '2026-09-16', 'active'),
  ('P24', 'CUST1010', 'Mutual Fund', 'Thematic Tech Fund', 690000, NULL, NULL, 'active'),
  ('P25', 'CUST1011', 'Insurance', 'Wealth Protect Plus', 534000, NULL, DATE '2026-10-22', 'active'),
  ('P26', 'CUST1011', 'Bond', 'Govt Securities 2030', 400000, DATE '2030-07-01', NULL, 'active'),
  ('P27', 'CUST1012', 'FD', 'SC Fixed Deposit 24M', 515000, DATE '2027-01-09', NULL, 'active'),
  ('P28', 'CUST1012', 'Mutual Fund', 'Debt Short Term Fund', 200000, NULL, NULL, 'active');

INSERT INTO account_transaction (id, customer_id, tx_date, description, amount) VALUES
  ('T1', 'CUST1001', DATE '2026-08-14', 'Subscription — Corporate Bond Series VII', -250000),
  ('T2', 'CUST1001', DATE '2026-08-02', 'Interest credited — SC Fixed Deposit', 18750),
  ('T3', 'CUST1001', DATE '2026-07-21', 'Premium debit — Wealth Protect Plus', -12000),
  ('T4', 'CUST1002', DATE '2026-08-10', 'Management fee accrual', -8400),
  ('T5', 'CUST1002', DATE '2026-07-30', 'Coupon — Govt Securities 2029', 21500),
  ('T6', 'CUST1003', DATE '2026-08-18', 'SIP debit — India Equity Growth Fund', -50000),
  ('T7', 'CUST1003', DATE '2026-08-05', 'Redemption — Small Cap Opportunities', 120000),
  ('T8', 'CUST1004', DATE '2026-08-12', 'Premium debit — Life Secure Elite', -35000),
  ('T9', 'CUST1005', DATE '2026-08-09', 'Advisory fee', -14500),
  ('T10', 'CUST1006', DATE '2026-08-01', 'Interest credited — SC Fixed Deposit', 24000),
  ('T11', 'CUST1007', DATE '2026-07-15', 'Coupon — Tax Free Bond 2031', 15400),
  ('T12', 'CUST1008', DATE '2026-08-16', 'Switch — Multi Asset Allocation', 0),
  ('T13', 'CUST1009', DATE '2026-08-03', 'Salary credit', 145000),
  ('T14', 'CUST1010', DATE '2026-08-11', 'Purchase — Thematic Tech Fund', -190000),
  ('T15', 'CUST1011', DATE '2026-07-28', 'Premium debit — Wealth Protect Plus', -22000),
  ('T16', 'CUST1012', DATE '2026-08-06', 'Purchase — Debt Short Term Fund', -60000);
