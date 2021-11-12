# Google Classroom Sync 🚀

Synchronises CSV files generated from our school's timetable using the Google Classroom API.

## Table of Contents

1. [Setup](#Setup)

## Setup

* Sign into the Google Cloud Platform dashboard and create a new project.
* Create a new 'Service Account' with your project's name.
* Generate keys and download them as option JSON. (see JSON example below)
* Note your OAuth 2 Client ID as you will need it later
* Grant the 'Service Account Token Creator' role to the service account you created.
* Enable Domain-wide Delegation
* Sign into the Google Admin console and go to 'Security > API Control > Domain-wide Delegation'
* Using your OAuth 2 Client ID register the Google Classroom scopes you want you service accounts to be able to access. They are referenced here: https://developers.google.com/classroom/reference/rest/

**Example JSON File**
This file is generated for you and should look like this
```json
{
  "type": "service_account",
  "project_id": "YOUR-SERVICE-ACCOUNT NAME",
  "private_key_id": "0374f62a8cf437728ebc53de6265950f58716cdc",
  "private_key": "-----BEGIN PRIVATE KEY-----\YOUR KEY DATA\n-----END PRIVATE KEY-----\n",
  "client_email": "service-acct@your-service-account-name",
  "client_id": "YOUR-CLIENT-ID-NUMBER",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-acct%40your-service-accout-name.iam.gserviceaccount.com"
}
```