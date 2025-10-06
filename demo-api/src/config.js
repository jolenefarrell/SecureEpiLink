// const dotenv = require('dotenv')
// const envFile = `.env.dev.${process.env.NODE_ID}`
// dotenv.config({ path: envFile })

// dotenv.config()

const config = {
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10 || process.env.DB_CONNECTION_LIMIT,
    queueLimit: 0
  },
  fileStorage: {
    fasta: process.env.FASTA_STORAGE_PATH,
    records: process.env.RECORD_STORAGE_PATH
  },
  node: {
    type: process.env.NODE_TYPE,
    id: process.env.NODE_ID,
    jurisdiction: process.env.JURISDICTION
  },
  nodes: {
    NSW: JSON.parse(process.env.NSW),
    VIC: JSON.parse(process.env.VIC),
    QLD: JSON.parse(process.env.QLD),
    TAS: JSON.parse(process.env.TAS),
    WA: JSON.parse(process.env.WA),
    NT: JSON.parse(process.env.NT),
    SA: JSON.parse(process.env.SA)
  },
  // Selection fields for sequence records only as these are the records "shared"
  sequenceSelectionFields: {
    'HIV': ['date_collected', 'internal_id', 'reference_genome_id', 'record_type', 'sequence_id'],
    'HCV': ['date_collected', 'internal_id', 'reference_genome_id', 'record_type', 'sequence_id']
  }
}

// console.log(config)

module.exports = config
