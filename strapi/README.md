# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

This project is **self-hosted** on an Oracle Cloud Always Free VM (Ubuntu 24.04 ARM,
Caddy + PM2 + PostgreSQL). It is no longer on Strapi Cloud.

- First-time server setup: [`deploy/setup-vps.sh`](../deploy/setup-vps.sh)
- Subsequent updates: [`deploy/deploy-strapi.sh`](../deploy/deploy-strapi.sh)
- Full guide: [`deploy/DEPLOYMENT.md`](../deploy/DEPLOYMENT.md)

## ⛔ `strapi transfer` erases the destination

`strapi transfer` **wipes the destination database and uploads before copying**.
It was a one-time operation used to migrate off Strapi Cloud.

Do **not** run it against the production server again. That server now collects
`contact-message` and `calculator-request` rows submitted through the website,
and those exist nowhere else — a re-run destroys every enquiry received since
the migration.

If you ever genuinely need to re-import, take a backup first:

```bash
ssh strapi@<server>
./backup.sh     # writes db_*.dump + uploads_*.tar.gz to ~/backups
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
