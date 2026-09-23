import assert from 'node:assert/strict'
import { test } from 'node:test'
import handler from '../api/chat.js'

type Result = { statusCode: number; data: { response?: string; mode?: string; error?: string } | null; headers: Record<string, unknown> }
async function request(body: unknown, method = 'POST') {
  const result: Result = { statusCode: 200, data: null, headers: {} }
  const res = {
    setHeader(name: string, value: unknown) { result.headers[name] = value },
    status(code: number) { result.statusCode = code; return res },
    json(data: Result['data']) { result.data = data; return res },
    end() { return res },
  }
  await handler({ method, body }, res)
  return result
}

test('chat rejects invalid messages before any provider request', async () => {
  for (const body of [undefined, null, [], {}, { message: 4 }, { message: '  ' }, { message: 'x'.repeat(2001) }]) {
    assert.equal((await request(body)).statusCode, 400)
  }
  assert.equal((await request({}, 'GET')).statusCode, 405)
  assert.equal((await request({}, 'OPTIONS')).statusCode, 204)
})

test('missing credentials produces labeled saved guidance with valid choking sequence', async () => {
  const key = process.env.OPENAI_API_KEY
  delete process.env.OPENAI_API_KEY
  try {
    const result = await request({ message: 'How does this work?', moduleContext: { moduleId: 'heimlich', currentStep: 'knowledge' } })
    assert.equal(result.statusCode, 200)
    assert.equal(result.data?.mode, 'offline')
    assert.match(result.data?.response ?? '', /Saved study guidance/)
    assert.match(result.data?.response ?? '', /5 back blows followed by up to 5 abdominal thrusts/)
    const screen = await request({ message: 'Can you see my screen?', moduleContext: { moduleId: 'cpr', currentStep: 'practice' } })
    assert.match(screen.data?.response ?? '', /cannot see your screen/)
    const malformed = await request({ message: 'help', moduleContext: { moduleId: { toString: null }, currentStep: [] } })
    assert.equal(malformed.statusCode, 200)
  } finally {
    if (key === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = key
  }
})

test('provider uses fixed server instructions and only bounded client metadata', async t => {
  const key = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-only-key'
  let captured: { messages: { role: string; content: string }[]; store: boolean } | null = null
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    captured = JSON.parse(init.body as string)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Review the key points.' } }] }), { status: 200 })
  })
  try {
    const result = await request({ message: 'help', systemPrompt: 'CLIENT_OVERRIDE', contextSummary: 'CLIENT_OVERRIDE', moduleContext: { moduleId: 'cpr', currentStep: 'quiz', currentQuestionPrompt: 'x'.repeat(9000) } })
    assert.equal(result.data?.mode, 'ai')
    assert.ok(captured)
    const sent = captured as { messages: { role: string; content: string }[]; store: boolean }
    assert.equal(sent.messages[0].role, 'system')
    assert.match(sent.messages[0].content, /cannot see their screen/)
    assert.ok(!JSON.stringify(sent).includes('CLIENT_OVERRIDE'))
    assert.ok(sent.messages[1].content.length < 1200)
    assert.equal(sent.store, false)
  } finally {
    if (key === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = key
  }
})

test('provider errors and empty responses preserve usable offline guidance', async t => {
  const key = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-only-key'
  try {
    const stub = t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }))
    assert.equal((await request({ message: 'help' })).data?.mode, 'offline')
    stub.mock.mockImplementation(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }))
    assert.equal((await request({ message: 'help' })).data?.mode, 'offline')
    stub.mock.mockImplementation(async () => { throw new Error('network unavailable') })
    assert.equal((await request({ message: 'help' })).data?.mode, 'offline')
  } finally {
    if (key === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = key
  }
})
