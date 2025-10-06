const TransactionStage = {
  CREATED: 'created',
  SALT_GENERATED: 'salt_generation',
  SALT_PROPOSAL: 'salt_proposal',
  SALT_RECEIVED: 'salt_received',
  HASHING_IDS: 'hashing_ids',
  HASHED_IDS: 'hashed_ids', // For polling
  HASHED_IDS_RETRIEVED: 'hashed_ids_retrieved',
  LINKAGE: 'linkage',
  METADATA_RETRIEVAL: 'metadata_retrieval',
  MATCHED_DATA_TRANSFER: 'matched_data_transfer',
  PROCESSING_MATCHES: 'processing_matches',
  VERIFYING: 'verifying',
  VERIFICATION_COMPLETE: 'verification_complete', // For polling
  COMPLETE: 'complete'
}

const TransactionStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete',
  FAILED: 'failed'
}

module.exports = {
  TransactionStage,
  TransactionStatus
}
