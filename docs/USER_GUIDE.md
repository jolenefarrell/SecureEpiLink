# User Guide

This document provides a guide for users of the SecureEpiLink project. It outlines the steps to set up demo nodes, upload data, initiate a linkage transaction, and inspect the results.

## Table of Contents

1.  [Setting up demo nodes](#setting-up-demo-nodes)
2.  [Uploading data](#uploading-data)
3.  [Initiating a linkage transaction](#initiating-a-linkage-transaction)
4.  [Inspecting a linkage transaction](#inspecting-a-linkage-transaction)

## 1. Setting up demo nodes

## 2. Uploading data

Demo nodes will be initialised with demo data that can be utilised to test linkage, but there is also more [test data](../automation/test_data) that can be uploaded to the database. You can also upload your own data to the database.

1.  Open a [template upload file](/docs/data_management/templates/) or use a [pre-populated test data file](../automation/test_data/)

    -   There are 3 pre-populated files annotated with their node type - one for each demo node
    -   Please ensure you are uploading a template that matches the node type (PHU or LAB)

2.  If populating your own template, ensure to follow the [data dictionary](/docs/data_management/data-dictionary.xlsx) provided

3.  Call one of the internal user testing upload APIs to either:

    | Task | Node Type | Endpoint |
    |---------------|-----------|----------------------------------------------|
    | Upload a sequence record | Lab | `https://{{host:port}}/testing/records/upload/sequence` |
    | Upload a notification record | Public Health Unit | `https://{{host:port}}/testing/records/upload/notification` |
    | Upload a fasta file | Lab | `https://{{host:port}}/testing/fasta/upload/` |

## 3. Initiating a linkage transaction

Once data has been uploaded to **both** the LAB node type and the PHU node type, a linkage transaction can be initiated to link data between the two nodes.

Linkage transactions are initiated currently via a POST request to the LAB node type, which includes information about which PHU node will also be participating in the transaction.

\*\*For linkage to run successfully between PHU and LAB node types, sequence records on the LAB node type need to have attached fasta files.

**Endpoint:** `https://{{host:port}}/transaction/initiate`

## 4. Inspecting a linkage transaction

After initiating a linkage transaction successfully, you should receive a `correlationId`. Using this correlation Id the status of the transaction can be checked, and once complete, a summary of the transaction can be retrieved.

| Task | Endpoint |
|---------------------------|---------------------------------------------|
| Get transaction details | `https://{{host:port}}/testing/transaction/getTransaction` |
| Get linked records & metadata | `https://{{host:port}}/testing/records/getLinked` |
| Get linkage transaction summary | `https://{{host:port}}/testing/transaction/getSummary` |


## 5. Running a demo HIV analysis pipeline

A demo HIV analysis pipeline is available to run on the demo pipeline service. This pipeline is a simple Snakemake workflow that demonstrates the feasibility of running analysis pipelines within the SecureEpiLink platform.

`Endpoint: `https://pipeline.phunode1.localhost/testing/run/hiv`


## 6. Generate a demo HIV analysis report

A demo HIV analysis report is available to generate on the demo pipeline service. This report is a simple FastAPI endpoint that generates a PDF report from a Quarto markdown (QMD) template.

`Endpoint: `https://pipeline.phunode1.localhost/report/generate/hiv`