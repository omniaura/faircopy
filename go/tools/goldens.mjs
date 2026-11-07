// Writes the parity goldens for the Go engine: for each request, what the
// @faircopy/chat standalone bundle returns.
//
//   pnpm --filter @faircopy/chat build
//   node go/tools/goldens.mjs packages/chat/dist/review.global.js go/testdata/corpus/*.txt \
//     | gzip -9 -n > go/testdata/golden.jsonl.gz
//
// The bundle is evaluated in a bare vm context, as an embedded host does.
// Each output line is [function, input, output]. Corpus files hold documents
// separated by lines of "---"; built-in cases cover the rules' edges, limits
// and malformed requests.
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const [bundlePath, ...corpusPaths] = process.argv.slice(2)
const context = vm.createContext({})
vm.runInContext(readFileSync(bundlePath, 'utf8') + '\n;globalThis.FaircopyChat = FaircopyChat', context)
const api = context.FaircopyChat

const out = []
const call = (fn, input) => {
  const output = input === undefined ? api[fn]() : api[fn](input)
  out.push(JSON.stringify([fn, input ?? null, output]))
}

// Every text goes through each entry point and context.
const requests = text => {
  call('reviewChatJSON', JSON.stringify({ version: 1, profile: 'chat-v1', text }))
  call('reviewTextJSON', JSON.stringify({ version: 1, text }))
  for (const context of ['general', 'chat', 'email']) call('reviewTextJSON', JSON.stringify({ version: 1, text, context }))
  call('reviewTextJSON', JSON.stringify({ version: 1, text, profile: 'email-v1' }))
}

const texts = []
for (const path of corpusPaths) {
  for (const doc of readFileSync(path, 'utf8').split(/\n---\n/)) if (doc.trim()) texts.push(doc)
}

// --- rule edges ---------------------------------------------------------------
const phrases = [
  'I hope this message finds you well', 'I am writing to', 'please do not hesitate to', 'kindly let me know',
  'furthermore', 'moreover', 'in conclusion', 'best regards', 'yours sincerely', 'pursuant to',
  'as an AI language model', 'as an AI,', 'as an AI I', "I'd be happy to assist", "I'm here to help",
  "it's important to note", 'it is worth noting', 'delve into', 'I will now proceed',
  'game-changing', 'game changer', 'revolutionize', 'unparalleled', 'take it to the next level', 'supercharge your',
]
const wraps = [
  p => p, p => p.toUpperCase(), p => p[0].toUpperCase() + p.slice(1), p => p.replace(/'/g, '’'),
  p => p.replace(/ /g, '  '), p => p.replace(/ /g, '\t'), p => p.replace(/ /g, ' '), p => p.replace(/ /g, '\n'),
  p => `x${p}`, p => `${p}x`, p => `_${p}`, p => `${p}_`, p => `9${p}`, p => `é${p}`, p => `${p}é`,
  p => `(${p})`, p => `"${p}"`, p => `${p}.`, p => `🙂${p}🙂`, p => `${p}${p}`, p => `${p} ${p}`,
  p => `see https://example.com/${p.replace(/ /g, '-')} now`, p => `[${p}](https://example.com/wiki/${p.replace(/ /g, '_')}_(topic))`,
  p => `www.${p.replace(/\W+/g, '')}.com and ${p}`, p => `HTTPS://EXAMPLE.COM/a(b)c) ${p}`,
]
for (const p of phrases) for (const w of wraps) texts.push(`Hi there. ${w(p)} thanks`)

const scaffolding = [
  'The tool is fast, not just cheap.', 'It was a test, not a launch.', 'They are partners, not merely vendors.',
  'This is the plan,\nnot the only plan.', 'is ' + 'x'.repeat(79) + ', not a thing', 'is ' + 'x'.repeat(80) + ', not a thing',
  'is ' + 'x'.repeat(81) + ', not a thing', 'is ' + '🙂'.repeat(40) + ', not a thing', 'is ' + '🙂'.repeat(39) + 'x, not a thing',
  'Without a plan, we drift. With a plan, we ship.', 'Without it nothing works. Then. Again. With it all works.',
  'Without coffee! Sleep? Work. With coffee.', 'without a plan. with a plan.', 'Withoutx a plan. With',
  'This distinction matters.', 'That difference matters!!!', 'Note it. This distinction matters', 'This distinction matters because x.',
  'This distinction matters: it is.', '"This distinction matters."', 'Hello. ("That difference matters.")', 'x\n\nThis distinction matters.',
  'x\r\n\r\nthat distinction matters?', 'x\n  \nThis difference matters   ', 'This distinction matters to us.',
  'A. This distinction matters. That difference matters. This difference matters.', 'THIS DISTINCTION MATTERS.',
  'x.This distinction matters.', 'Stop.” This distinction matters.', 'Stop.] that distinction matters!',
  'Em—dash', '— leading', 'trailing —', '——', 'a – b -- c', '😀—😀', 'line1\nline2 — x\nline3 — y',
]
for (const s of scaffolding) texts.push(s)
texts.push('', ' ', '\n', '🙂', 'é'.repeat(10))
// /i without /u folds ASCII only; /iu folds by Unicode simple case folding.
// U+017F (ſ) and U+212A (Kelvin sign) tell the two apart.
texts.push('The tool i\u017f fast, not ju\u017ft cheap.', 'The tool is fast, not just cheap\u212a.', 'Thi\u017f distinction matters.',
  'http\u017f://example.com/delve-into and delve into', '\u212aindly let me know', 'best regard\u017f', 'furthermore \u212a',
  'WITHOUT a plan. WITH a plan.', 'Without a plan. with a plan.')

// --- limits ---------------------------------------------------------------------
texts.push('a'.repeat(16384), 'a'.repeat(16385), '🙂'.repeat(8192), '🙂'.repeat(8192) + 'a', '—'.repeat(100), '—'.repeat(101),
  'delve into '.repeat(60), ('— delve into game changer ').repeat(30))

for (const text of texts) requests(text)

// --- malformed requests -------------------------------------------------------
const raw = [
  '', 'null', '[]', '1', '"x"', '{', '{}', '{"version":1}', '{"version":1,"text":1}', '{"version":"1","text":"x"}',
  '{"version":1.0,"text":"x"}', '{"version":1e0,"text":"x"}', '{"version":2,"text":"x"}', '{"version":true,"text":"x"}',
  '{"version":1,"text":"x","extra":1}', '{"version":1,"text":"x","context":null}', '{"version":1,"text":"x","context":"blog"}',
  '{"version":1,"text":"x","profile":null}', '{"version":1,"text":"x","profile":"nope"}', '{"version":1,"text":"x","context":"chat","profile":"email-v1"}',
  '{"version":1,"text":"x","context":"email","profile":"email-v1"}', '{"version":1,"text":"x","profile":"chat-v1"}',
  '{"version":1,"profile":"chat-v1","text":"x"}', '{"version":1,"profile":"general-v1","text":"x"}', '{"version":1,"text":"x"} ',
  ' {"version":1,"text":"x"}', '{"version":1,"text":"x","text":"delve into"}', '{"version":1,"te\\u0078t":"x"}', '{"__proto__":1,"version":1,"text":"x"}',
  '{"version":1,"text":"\\ud83d\\ude00 — x"}', '{"version":1,"text":"\\ud800 — x"}', '{"version":1,"text":"x"}garbage',
  '{"version":1,"profile":"chat-v1","text":"x","context":"chat"}', '{"version":1,"profile":"chat-v1"}',
  JSON.stringify({ version: 1, text: 'x'.repeat(65530) }), JSON.stringify({ version: 1, text: 'x'.repeat(65600) }),
  JSON.stringify({ version: 1, profile: 'chat-v1', text: 'é'.repeat(33000) }),
]
for (const input of raw) {
  call('reviewTextJSON', input)
  call('reviewChatJSON', input)
}
call('describePresetsJSON')

process.stdout.write(out.join('\n') + '\n')
