const moment = require('moment');

function getOffset(currentPage = 1, listPerPage) {
  return (currentPage - 1) * [listPerPage]
}

function emptyOrRows(rows) {
  if (!rows) {
    return []
  }
  return rows
}

function compareArrayOfObj(array1, array2, property) {
  const matchedArray = []
  array1.forEach(record1 => {
    array2.forEach(record2 => {
      if (record1[property] === record2[property]) {
        matchedArray.push(record1)
      }
    })
  })
  // Returns an array of objects that match on property param
  return matchedArray
}

function compareArrayOfObjMulti(array1, array2, prop1, prop2) {
  const matchedArray = []
  array1.forEach(record1 => {
    array2.forEach(record2 => {
      if (record1[prop1] === record2[prop1] && record1[prop2] === record2[prop2]) {
        matchedArray.push(record1)
      }
    })
  })
  // Returns an array of objects that match on property param
  return matchedArray
}

function generatePostOpt(hostname, path, port, method, ids) {
  const options = {
    hostname,
    port,
    path,
    method,
    // url: 'https://' + hostname + ':' + port + path,
    url: 'http://' + hostname + ':' + port + path,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js',
      'Target-Node': ids.target,
      'Source-Node': ids.source
    }
  }
  return options
}

function getNodeDetails(ids, config) {
  let target = null // phu node
  let source = null // lab node
  Object.keys(config.nodes).forEach(jurisdiction => {
    const nodes = config.nodes[jurisdiction]
    if (target === null && source === null) {
      target = nodes.find(node => node.id === ids.target) || null
      source = nodes.find(node => node.id === ids.source) || null
    }
  })

  return { target, source }
}

function generateExternalIdString(nodeId, id) {
  const externalId = `${nodeId}_H2SEQ_${id}`
  return externalId
}

function getCurrentNodeId(config) {
  const nodeId = config.node.id

  return nodeId
}

// TODO: Validation on categorical values and validation on data sharing columns

const isString = async (value) => {
  if (typeof value == "string") {
    return true
  } else {
    return false
  }
}

const isDate = async (value) => {
  const dateIsValid = moment(value, "DD/MM/YYYY", true).isValid();

  if (dateIsValid) {
    return true
  } else {
    return false
  }
}

const isInteger = async (value) => {
  if (typeof value == "number") {
    return true
  } else {
    return false
  }
}

const isValidPathogen = async () => {

}

module.exports = {
  getOffset,
  emptyOrRows,
  compareArrayOfObj,
  compareArrayOfObjMulti,
  generatePostOpt,
  getNodeDetails,
  generateExternalIdString,
  getCurrentNodeId,
  isString,
  isDate,
  isInteger,
  isValidPathogen
}
