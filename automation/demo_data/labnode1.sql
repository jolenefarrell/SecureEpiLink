# LABNODE1: Demo Pathology Lab 1
# Tables: Records, Metadata, SequenceFiles

INSERT INTO Records (`internal_id`, `pathogen`, `record_type`, `linkage_status`, `file_attached`)
VALUES
('H2SEQ_LABNODE1_1', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_2', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_3', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_4', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_5', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_6', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_7', 'HIV', 'sequence', 'not_linked', 'true'),
('H2SEQ_LABNODE1_8', 'HIV', 'sequence', 'not_linked', 'true');

INSERT INTO Metadata (`internal_id`, `column_name`, `value`)
VALUES
('H2SEQ_LABNODE1_1', 'sequence_id', 'H2SEQ_LABNODE1_1'),
('H2SEQ_LABNODE1_1', 'first_name', 'jo'),
('H2SEQ_LABNODE1_1', 'last_name', 'fa'),
('H2SEQ_LABNODE1_1', 'dob', '30/07/1996'),
('H2SEQ_LABNODE1_1', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_2', 'sequence_id', 'H2SEQ_LABNODE1_2'),
('H2SEQ_LABNODE1_2', 'first_name', 'ab'),
('H2SEQ_LABNODE1_2', 'last_name', 'cd'),
('H2SEQ_LABNODE1_2', 'dob', '10/01/2000'),
('H2SEQ_LABNODE1_2', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_3', 'sequence_id', 'H2SEQ_LABNODE1_3'),
('H2SEQ_LABNODE1_3', 'first_name', 'ef'),
('H2SEQ_LABNODE1_3', 'last_name', 'gh'),
('H2SEQ_LABNODE1_3', 'dob', '11/02/2001'),
('H2SEQ_LABNODE1_3', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_4', 'sequence_id', 'H2SEQ_LABNODE1_4'),
('H2SEQ_LABNODE1_4', 'first_name', 'ij'),
('H2SEQ_LABNODE1_4', 'last_name', 'kl'),
('H2SEQ_LABNODE1_4', 'dob', '12/03/2002'),
('H2SEQ_LABNODE1_4', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_5', 'sequence_id', 'H2SEQ_LABNODE1_5'),
('H2SEQ_LABNODE1_5', 'first_name', 'mn'),
('H2SEQ_LABNODE1_5', 'last_name', 'op'),
('H2SEQ_LABNODE1_5', 'dob', '13/04/2003'),
('H2SEQ_LABNODE1_5', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_6', 'sequence_id', 'H2SEQ_LABNODE1_6'),
('H2SEQ_LABNODE1_6', 'first_name', 'qr'),
('H2SEQ_LABNODE1_6', 'last_name', 'st'),
('H2SEQ_LABNODE1_6', 'dob', '14/04/2004'),
('H2SEQ_LABNODE1_6', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_7', 'sequence_id', 'H2SEQ_LABNODE1_7'),
('H2SEQ_LABNODE1_7', 'first_name', 'hu'),
('H2SEQ_LABNODE1_7', 'last_name', 'la'),
('H2SEQ_LABNODE1_7', 'dob', '14/04/2004'),
('H2SEQ_LABNODE1_7', 'date_of_collection', '1/01/2022'),
('H2SEQ_LABNODE1_8', 'sequence_id', 'H2SEQ_LABNODE1_8'),
('H2SEQ_LABNODE1_8', 'first_name', 'hu'),
('H2SEQ_LABNODE1_8', 'last_name', 'la'),
('H2SEQ_LABNODE1_8', 'dob', '14/04/2004'),
('H2SEQ_LABNODE1_8', 'date_of_collection', '1/01/2022');

INSERT INTO SequenceFiles (`internal_id`, `file_name`, `file_path`, `source_node_id`)
VALUES 
('H2SEQ_LABNODE1_1', 'H2SEQ_LABNODE1_1.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_1.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_2', 'H2SEQ_LABNODE1_2.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_2.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_3', 'H2SEQ_LABNODE1_3.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_3.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_4', 'H2SEQ_LABNODE1_4.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_4.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_5', 'H2SEQ_LABNODE1_5.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_5.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_6', 'H2SEQ_LABNODE1_6.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_6.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_7', 'H2SEQ_LABNODE1_7.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_7.fasta', 'LABNODE1'),
('H2SEQ_LABNODE1_8', 'H2SEQ_LABNODE1_8.fasta', '/user/code/data/fasta/H2SEQ_LABNODE1_8.fasta', 'LABNODE1');
