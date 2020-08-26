import {expect, test} from '@oclif/test'

describe('hooks', () => {
  test
  .stdout()
  .hook('init', {id: 'mycommand'})
  .do(output => expect(output.stdout).to.contain('Our terms of service have changed'))
  .it('shows a message')
})
