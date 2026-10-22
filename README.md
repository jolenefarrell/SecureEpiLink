# SecureEpiLink

This repository contains the source code for the SecureEpiLink project, which aims to provide a secure and efficient way to link epidemiological data across different jurisdictions while maintaining data privacy.

### Table of Contents

-   [Introduction](#introduction)
-   [Business logic](#business-logic)
-   [Prerequisites](#prerequisites)
-   [Documentation](#documentation)
-   [License](#license)

## Introduction

The proof of concept (POC) will focus on establishing and testing a system for data node initialisation and data linkage, with a key objective to illustrate how within-jurisdiction data linkage between two illustrative data nodes, representing a public health unit and a pathology laboratory, can occur in near real-time. The POC will showcase the concept of decentralised data sharing and data linkage and assess the practical potential in application and implementation in a product framework.

Users are able to:

1.  Set up demo nodes (One public health node and two lab nodes)

2.  Upload mock data to nodes

3.  Initiate a data linkage transaction between two nodes

4.  Inspect the status and results of a linkage transaction

## Business logic

#### Nodes

Data linkage with the H2Seq platform is described as a transaction between a Laboratory node and a Public Health Unit node.

-   **Laboratory node** (Lab node): Data node that hosts any sequence records and respective sequence files. Linkage transactions are initiated from lab nodes and these nodes take care of majority of the business logic

-   **Public Health Unit node** (PHU node): Data node that hosts any public health notification records. Although the majority of the business logic is carried out by the LAB node type, the linked data is stored at the PHU node

#### Linkage

Upon commencement of the data linkage transaction, a one-way cryptographic hash function is used to de-identify the participant data and generate “linkage IDs” at both node types. These linkage IDs are generated from the combination of a record’s sensitive fields (2x2 and D.O.B) and a “salt”, which is a randomly generated string unique to each linkage transaction. The cryptographic hash function hashes, or transforms, these fields into non-decodable form.

During linkage only the hashed IDs are shared between nodes, and once linkage has occurred, only the non-sensitive fields are shared between nodes. After the completion of a linkage transaction the salt can be destroyed, ensuring privacy and adding a layer of security by preventing further linkage or re-identification.

The linkage and data sharing process between two nodes is managed within one transaction which is identifiable through a correlation ID. See a more detailed flow diagram of a linkage transaction below.

``` mermaid
  sequenceDiagram
    Dev ->> Lab Node: Initiate linkage (/transaction/initiate)
    Lab Node ->> Public Health Node: Salt proposal
    Note over Lab Node,Public Health Node: Hashed IDs are generated on both node types
    Lab Node ->> Public Health Node: Get hashed IDs
    Public Health Node -->> Lab Node: Hashed IDs
    Lab Node ->> Lab Node: Data linkage
    Lab Node ->> Public Health Node: Share matched records + sequence data
    Public Health Node ->> Public Health Node: Verify matches/linked records
    Lab Node ->> Public Health Node: Get verification
    Public Health Node -->> Lab Node: Verified matches
```

## Prerequisites

-   Docker Engine / Desktop (⩾ v20.10)

-   Docker Compose plugin (⩾ v2.0)

-   GNU Make (⩾ v3.8)

## Documentation

Detailed user and dev guides can be found in the `docs` folder.

-   [**User guide**](/docs/USER_GUIDE.md) - outlines how to set up demo nodes, upload custom data and run linkage transactions

-   [**Dev guide**](/docs/DEV_GUIDE.md) - briefly outlines some of the key components of the code base

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
