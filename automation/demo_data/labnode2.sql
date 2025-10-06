# LABNODE2: Demo Pathology Lab 2
# Tables: Records, Metadata, SequenceFiles


INSERT INTO Records (`internal_id`, `pathogen`, `record_type`, `linkage_status`, `file_attached`)
VALUES
('H2SEQ_LABNODE2_1', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE2_2', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE2_3', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE2_4', 'HIV', 'sequence', 'not_linked', 'true');


INSERT INTO Metadata (`internal_id`, `column_name`, `value`)
VALUES
('H2SEQ_LABNODE2_1', 'sequence_id', 'H2SEQ_LABNODE2_1'),
('H2SEQ_LABNODE2_1', 'first_name', 'jo'),
('H2SEQ_LABNODE2_1', 'last_name', 'fa'),
('H2SEQ_LABNODE2_1', 'dob', '30/07/1998'),
('H2SEQ_LABNODE2_1', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE2_2', 'sequence_id', 'H2SEQ_LABNODE2_2'),
('H2SEQ_LABNODE2_2', 'first_name', 'mn'),
('H2SEQ_LABNODE2_2', 'last_name', 'op'),
('H2SEQ_LABNODE2_2', 'dob', '10/01/2010'),
('H2SEQ_LABNODE2_2', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE2_3', 'sequence_id', 'H2SEQ_LABNODE2_3'),
('H2SEQ_LABNODE2_3', 'first_name', 'qr'),
('H2SEQ_LABNODE2_3', 'last_name', 'st'),
('H2SEQ_LABNODE2_3', 'dob', '18/02/2011'),
('H2SEQ_LABNODE2_3', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE2_4', 'sequence_id', 'H2SEQ_LABNODE2_4'),
('H2SEQ_LABNODE2_4', 'first_name', 'uv'),
('H2SEQ_LABNODE2_4', 'last_name', 'wx'),
('H2SEQ_LABNODE2_4', 'dob', '11/07/2000'),
('H2SEQ_LABNODE2_4', 'date_of_collection', '1/01/2022');


INSERT INTO SequenceFiles (`internal_id`, `file_name`, `file_path`, `source_node_id`)
VALUES 
('H2SEQ_LABNODE2_1', 'H2SEQ_LABNODE2_1.fasta', '/user/code/data/fasta/H2SEQ_LABNODE2_1.fasta', 'LABNODE2'),
('H2SEQ_LABNODE2_2', 'H2SEQ_LABNODE2_2.fasta', '/user/code/data/fasta/H2SEQ_LABNODE2_2.fasta', 'LABNODE2'),
('H2SEQ_LABNODE2_3', 'H2SEQ_LABNODE2_3.fasta', '/user/code/data/fasta/H2SEQ_LABNODE2_3.fasta', 'LABNODE2'),
('H2SEQ_LABNODE2_4', 'H2SEQ_LABNODE2_4.fasta', '/user/code/data/fasta/H2SEQ_LABNODE2_4.fasta', 'LABNODE2');