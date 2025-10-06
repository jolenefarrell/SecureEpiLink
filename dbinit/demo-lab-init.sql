CREATE DATABASE IF NOT EXISTS h2seq;
USE h2seq;

CREATE TABLE IF NOT EXISTS `users` 
( 
  `id`         INT(11) NOT NULL auto_increment,
  `name`       VARCHAR(255) NOT NULL,
  `age`        INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)  
);

CREATE TABLE IF NOT EXISTS `Nodes`
( 
  `node_id`      VARCHAR(255) NOT NULL,
  `node_name`    VARCHAR(255) NOT NULL,
  `key`          VARCHAR(255) NOT NULL,
  `hostname`     VARCHAR(255) NOT NULL,
  `port`         VARCHAR(255) NOT NULL,
  `node_type`    VARCHAR(255) NOT NULL,
  `state`        VARCHAR(255) NOT NULL,
  `date_created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`node_name`),
  PRIMARY KEY (`node_id`)
);

CREATE TABLE `Salt` 
( 
  `salt_id`          INT(11)  NOT NULL auto_increment,
  `correlation_id`   VARCHAR(255) NOT NULL,
  `salt`             VARCHAR(255) NOT NULL,
  `date_generated`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`salt_id`)
);

CREATE TABLE IF NOT EXISTS `Transactions`  
( 
  `transaction_id` INT(11) NOT NULL auto_increment,
  `correlation_id` VARCHAR(255) NOT NULL,
  `type`           VARCHAR(255) NOT NULL,
  `stage`          VARCHAR(255),
  `target_id`      VARCHAR(255) NOT NULL, -- Participating node
  `source_id`      VARCHAR(255) NOT NULL, -- Node that instigated transaction
  `status`         VARCHAR(255),
  `message`        VARCHAR(255),
  `records_linked` INT(11),
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_updated`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`)
);

CREATE TABLE `Permissions` 
( 
  `permission_id`  VARCHAR(255) NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `description`    VARCHAR(255) NOT NULL,
  PRIMARY KEY (`permission_id`)
);

CREATE TABLE `NodePermissions` 
( 
  `node_id`                     VARCHAR(255) NOT NULL,
  `permission_id`               VARCHAR(255) NOT NULL,
  FOREIGN KEY (`node_id`)       REFERENCES Nodes(`node_id`),
  FOREIGN KEY (`permission_id`) REFERENCES Permissions(`permission_id`)
);

CREATE TABLE `Pathogens` 
( 
  `id`                            INT(11)  NOT NULL auto_increment,
  `name`                          VARCHAR(255) NOT NULL,
  `abbreviation`                  VARCHAR(255) NOT NULL,
  UNIQUE (`name`),
  UNIQUE (`abbreviation`),
  PRIMARY KEY (`id`)
);

/* NEW */
/* Columns, Records, Metadata: Same between both node types */
CREATE TABLE `Columns`
(
  `id`              INT(11) NOT NULL auto_increment,
  `column_name`     VARCHAR(255) NOT NULL,
  `display_name`    VARCHAR(255) NOT NULL,
  `data_type`       VARCHAR(255) NOT NULL,
  `record_type`     ENUM('notification', 'sequence'),
  `pathogen`        VARCHAR(255) NOT NULL,
  `identifiable`    ENUM('true', 'false'),
  `linkage_field`   ENUM('true', 'false'),
  PRIMARY KEY (`id`)
);

CREATE TABLE `Records` 
( 
  `id`                            INT(11) NOT NULL auto_increment,
  `internal_id`                   VARCHAR(255) NOT NULL,
  `date_uploaded`                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  `pathogen`                      VARCHAR(255) NOT NULL,
  `record_type`                   ENUM('notification', 'sequence'),
  `file_attached`                 ENUM('true', 'false') NOT NULL DEFAULT 'false',     
  `linkage_status`                ENUM('linked', 'not_linked') NOT NULL DEFAULT 'not_linked',
  UNIQUE (`internal_id`),
  FOREIGN KEY (`pathogen`)        REFERENCES Pathogens(`abbreviation`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `Metadata`
( 
  `id`                      INT(11) NOT NULL auto_increment,
  `internal_id`             VARCHAR(255) NOT NULL,
  `column_name`             VARCHAR(255) NOT NULL,
  `value`                   VARCHAR(255) NOT NULL,
  `date_uploaded`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY (`id`)
);

/* --- */

CREATE TABLE `LinkageIdentifiers`
(
  `id`               INT(11) NOT NULL auto_increment,
  `transient_id`     VARCHAR(255) NOT NULL,
  `correlation_id`   VARCHAR(255) NOT NULL,
  `partner_node`     VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `TransientIdentifiers` 
( 
  `id`                          INT(11) NOT NULL auto_increment,
  `transient_id`                VARCHAR(255) NOT NULL,
  `record_id`                   INT(11) NOT NULL,
  `pathogen`                    VARCHAR(255) NOT NULL,
  `date_generated`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`record_id`),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`record_id`)     REFERENCES Records(`id`),
  FOREIGN KEY (`pathogen`)      REFERENCES Pathogens(`abbreviation`)
);

CREATE TABLE `SequenceFiles` 
( 
  `id`                            INT(11)  NOT NULL auto_increment,
  `internal_id`                   VARCHAR(255) NOT NULL,
  `file_name`                     VARCHAR(255) NOT NULL,
  `file_path`                     VARCHAR(255) NOT NULL,
  `source_node_id`                VARCHAR(255) NOT NULL,
  `date_added`                    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

/* STANDARD TABLE POPULATION */

INSERT INTO Pathogens (`name`, `abbreviation`)
VALUES 
('Human immunodeficiency virus','HIV'),
('Hepatitis C','HCV');

INSERT INTO Nodes (`node_id`, `node_name`, `key`, `port`, `hostname`, `node_type`, `state`)
VALUES 
('PHUNODE1', 'Public Health Node', 'uYmQuX39bU', '3000', 'host.docker.internal', 'phu', 'NSW'),
('LABNODE1', 'Lab A', 'Ok395OrWyy', '3001', 'host.docker.internal', 'lab', 'NSW'),
('LABNODE2', 'Lab B', '2vkwxfZBlx', '3002', 'host.docker.internal', 'lab', 'NSW'),
('H2SEQADMIN', 'H2SEQADMIN', '-', '-', '-', 'admin', '-');

INSERT INTO Columns (`column_name`, `display_name`, `data_type`, `record_type`, `pathogen`, `identifiable`, `linkage_field`)
VALUES
('notification_id', 'Notification ID', 'string', 'notification', 'HIV', 'true', 'false'),
('date_of_notification', 'Date of notification', 'date', 'notification', 'HIV', 'false', 'false'),
('first_name', 'First name', 'string', 'notification', 'HIV', 'true', 'true'),
('last_name', 'Last name', 'string', 'notification', 'HIV', 'true', 'true'),
('dob', 'Date of Birth', 'date', 'notification', 'HIV', 'true', 'true'),
('postcode', 'Postcode', 'string', 'notification', 'HIV', 'false', 'false'),
('age_at_diagnosis', 'Age at diagnosis', 'categorical', 'notification', 'HIV', 'false', 'false'),
('place_of_birth', 'Place of birth', 'categorical', 'notification', 'HIV', 'false', 'false'),
('risk_of_exposure', 'Risk of exposure', 'categorical', 'notification', 'HIV', 'false', 'false'),
('stage_of_infection', 'Stage of infection', 'categorical', 'notification', 'HIV', 'false', 'false'),
('testing_history', 'Testing history', 'categorical', 'notification', 'HIV', 'false', 'false'),
('acquisition', 'Acquisition', 'categorical', 'notification', 'HIV', 'false', 'false'),
('country_of_origin', 'Country of origin', 'string', 'notification', 'HIV', 'false', 'false'),
('date_of_arrival', 'Date of arrival', 'date', 'notification', 'HIV', 'false', 'false'),
('first_name', 'First name', 'string', 'sequence', 'HIV', 'true', 'true'),
('last_name', 'Last name', 'string', 'sequence', 'HIV', 'true', 'true'),
('dob', 'Date of Birth', 'date', 'sequence', 'HIV', 'true', 'true'),
('postcode', 'Postcode', 'string', 'sequence', 'HIV', 'false', 'false'),
('sequence_id', 'Sequence ID', 'string', 'sequence', 'HIV', 'false', 'false'),
('date_of_collection', 'Date collected', 'date', 'sequence', 'HIV', 'false', 'false'),
('subtype', 'Subtype', 'string', 'sequence', 'HIV', 'false', 'false');