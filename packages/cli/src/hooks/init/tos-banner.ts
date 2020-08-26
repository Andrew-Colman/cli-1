import {Hook} from '@oclif/config'
import {APIClient} from '@heroku-cli/command'
import {color} from '@heroku-cli/color'

const hook: Hook<'init'> = async function (_opts) {
  // if (today < expiration) { return true }
  const heroku = new APIClient(this.config)
  const {body: account} = await heroku.get('/account')
  if (!account.acknowledgedMsa) {
    const message = 'Notice - Our terms of service have changed: https://dashboard.heroku.com/terms-of-service'
    process.stderr.write(`${color.yellow(message)}\n\n`)
  }
}

export default hook
