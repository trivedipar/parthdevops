# Real-Time Multi-User Location Tracking App

## Overview

This project is a real-time, multi-user location tracking application designed to showcase the integration of modern technologies for seamless, dynamic user interactions. The application allows primary users to register, login, and have their movements tracked in real-time. Other users can also register to view the locations of these primary users.

## Features

- **Real-Time Location Updates:** Utilizes Pigeon Map for dynamic location tracking, updating user positions as they move.
- **Multi-User Support:** Supports multiple users, allowing registered primary users to be tracked and other users to view these movements.
- **Secure Authentication:** Robust registration and login mechanisms for user authentication.
- **High Performance:** Leverages Redis online database for efficient memory queue management, enhancing performance.

## Technology Stack

- **Frontend:** ReactJS for the user interface, served via Nginx for efficient content delivery.
- **Backend:** Spring Boot and Flask for handling business logic and server-side operations.
- **Database:** Redis online database for fast data storage and retrieval.
- **Deployment:** AWS services including ECS for container management and Route 53 for DNS management.

## Prerequisites

Before setting up the project, ensure you have the following:
- AWS account
- Git and Docker installed on your machine
- Accounts on Namecheap for domain registration and ZeroSSL for SSL certificates

## Installation Guide

### Step 1: Domain Registration and SSL Configuration
- Register two `.me` domains using Namecheap.
- Obtain SSL certificates for both domains through ZeroSSL.

### Step 2: AWS and Route 53 Setup
- Configure AWS Route 53 with two hosted zones and update DNS as per ZeroSSL's instructions to verify domain ownership.

### Step 3: Clone the Repository

- git clone <repository-url>
- cd <repository-directory>

### Step 4: Configure GitHub Secrets
- Set up the following secrets in the GitHub repository for AWS access:

- AWS_ACCESS_KEY_ID
- AWS_ACCOUNT_ID
- AWS_REGION
- AWS_SECRET_ACCESS_KEY

### Step 5: Deploy Application
- Trigger the deployment through GitHub Actions by pushing changes to your repository.

## Usage
- Access the application through the following URLs:

- Frontend URL: https://devopsgame.me - For viewing and interacting with the user interface.
- Backend URL: https://backenddevops.me - For backend interactions and API access.

## Acknowledgments
- Namecheap for domain services.
- ZeroSSL for handling SSL certifications.
- AWS for hosting and data management solutions.

## Contact
- For more information, support, or to report issues, please email [trivedi.par@northeastern.edu].
