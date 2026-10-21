#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createFaircopyServer, parseVoiceProfile } from './server.js'

try {
  const { values } = parseArgs({ options: {
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '8787' },
    profile: { type: 'string', multiple: true },
    help: { type: 'boolean' },
  } })
  if (values.help) {
    process.stdout.write('faircopy-chat-server [--host 127.0.0.1] [--port 8787] [--profile voice.json ...]\nBearer auth: FAIRCOPY_API_TOKEN environment variable. Non-loopback binding requires it.\n')
  } else {
    const port = Number(values.port)
    if (!/^\d+$/.test(values.port) || !Number.isInteger(port) || port < 1 || port > 65535) throw new TypeError('Invalid port')
    if (!['127.0.0.1', '::1', 'localhost'].includes(values.host) && !process.env.FAIRCOPY_API_TOKEN) throw new TypeError('Non-loopback binding requires FAIRCOPY_API_TOKEN')
    const profiles = []
    for (const filename of values.profile ?? []) {
      const bytes = await readFile(filename)
      if (bytes.length > 65536) throw new TypeError('Profile too large')
      profiles.push(parseVoiceProfile(JSON.parse(bytes.toString('utf8'))))
    }
    const server = createFaircopyServer({ profiles, token: process.env.FAIRCOPY_API_TOKEN })
    server.on('error', () => { process.stderr.write('Fair Copy server could not listen\n'); process.exitCode = 1 })
    server.listen(port, values.host, () => process.stderr.write(`Fair Copy API listening on ${values.host}:${port}\n`))
    const stop = (): void => { server.close(); server.closeAllConnections() }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  }
} catch {
  process.stderr.write('Invalid Fair Copy server configuration. Run faircopy-chat-server --help\n')
  process.exitCode = 2
}
