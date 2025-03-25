# mdelapenya.xyz

GoHugo site for my personal website, which is a blog and a portfolio.

## Development

To start the development server, run:

```bash
hugo server
```

This will start the server at `http://localhost:1313`.

To generate the static site, run:

```bash
hugo build
```

This will generate the static site in the `public` directory.

## Deployment

The site is deployed to a staging and a production environment, pushing the contents of the `public` directory to the respective FTP servers.

For that reason, the `.git-ftp-include` file contains the contents of the `public` directory, so it is uploaded to the FTP server.

### Staging

- The staging environment is triggered when a PR is sent, using git-ftp.
- The staging environment is deployed to an FTP server.
- The `deploy-to-staging` GH workflow is triggered when a PR is sent, using the `FTP_SERVER` and `STAGING_FTP_DIR` secrets.

### Production

- The production environment is triggered when a commit is merged into the `main` branch, using git-ftp.
- The production environment is deployed to an FTP server.
- The `release` GH workflow is triggered when a commit is merged into the `main` branch, using the `FTP_SERVER` and `FTP_DIR` secrets.

## TODO

- [ ] Add a CI workflow that prunes PR sites, in a nighly basis.
