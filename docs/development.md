# Development

Add details here to give a brief overview of how to work with the provider APIs.
Please reference any SDKs or API docs used to help build the integration here.

## Prerequisites

Supply details about software or tooling (like maybe Docker or Terraform) that
is needed for development here.

Please supply references to documentation that details how to install those
dependencies here.

Tools like Node.js and NPM are already covered in the [README](../README.md) so
don't bother documenting that here.

## Provider account setup

1. Log in to [Orca dashboard](https://app.orcasecurity.io) and navigate to
   [integrations](https://app.orcasecurity.io/integrations).
2. Click the **Manage Keys** button to create a new Orca API token.
3. Click "Generate A New Key" and make sure to supply it as the ENV variable
   (CLIENT_SECRET=[token you've just generated]).
4. Next, you also need to supply the account email as the ENV variable
   (CLIENT_EMAIL=[the email you've used for authenticating]).

## Authentication

Copy the `.env.example` to `.env` file and fill in the variables using the user
information and API token information generated from instructions above. The
mapping is as follows:

- CLIENT_SECRET= ${`accessToken`}
- CLIENT_EMAIL= ${`userEmail`}
