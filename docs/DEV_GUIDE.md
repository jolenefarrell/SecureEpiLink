# Developer Guide

This document provides a guide for developers working on the SecureEpiLink project. It outlines the architecture, setup instructions, and key components of the code base.

## Table of Contents

## Architecture Overview

The SecureEpiLink system is designed to facilitate secure and efficient linkage of epidemiological data across different jurisdictions while maintaining data privacy. The architecture consists of the following key components:

-   **Data Nodes**: Representing different jurisdictions (e.g., Public Health Units, Laboratories) that host and manage their own datasets.
-   **Linkage Engine/API Layer**: Responsible for performing the data linkage process using cryptographic techniques to ensure privacy.Provides endpoints for interaction between the data nodes.
-   **Database**: Stores the data records, linkage transactions, and metadata.
- **Caddy Gateway & Reverse Proxy**: Caddy serves as a secure gateway and reverse proxy, managing HTTPS connections and routing requests to the appropriate services within the network.

TODO: Add architecture diagram

## Code layout

### Middleware

### Routes

### Controllers

### Services

### Enums

## Development environment