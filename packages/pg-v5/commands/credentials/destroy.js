'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')

  const { app, args, flags } = context
  let cred = flags.name

  if (cred === 'default') {
    throw new Error('Default credential cannot be destroyed.')
  }

  let db = yield fetcher.addon(app, args.database)
  if (util.starterPlan(db)) {
    throw new Error(`Only one default credential is supported for Hobby tier databases.`)
  }

  let attachments = yield heroku.get(`/addons/${db.name}/addon-attachments`)
  let credAttachments = attachments.filter(a => a.namespace === `credential:${flags.name}`)
  let credAttachmentApps = Array.from(new Set(credAttachments.map(a => a.app.name)))
  if (credAttachmentApps.length > 0) throw new Error(`Credential ${flags.name} must be detached from the app${credAttachmentApps.length > 1 ? 's' : ''} ${credAttachmentApps.map(name => cli.color.app(name)).join(', ')} before destroying.`)

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive action`)

  yield cli.action(`Destroying credential ${cli.color.cmd(cred)}`, co(function * () {
    yield heroku.delete(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}`, { host: host(db) })
  }))

  cli.log(`The credential has been destroyed within ${db.name}.`)
  cli.log(`Database objects owned by ${cred} will be assigned to the default credential.`)
}

module.exports = {
  topic: 'pg',
  command: 'credentials:destroy',
  description: 'destroy credential within database',
  needsApp: true,
  needsAuth: true,
  help: `Example:

    heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
`,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'name', char: 'n', hasValue: true, required: true, description: 'unique identifier for the credential' },
    { name: 'confirm', char: 'c', hasValue: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
