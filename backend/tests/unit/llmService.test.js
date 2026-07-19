import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyIntent, generateEmbedding, generateResponse } from '../../services/llmService.js';

describe('llmService', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('classifies fallback intents without a token', async () => {
    vi.stubEnv('HF_TOKEN', '');
    await expect(classifyIntent('How do I get to Gate A?')).resolves.toMatchObject({ intent: 'navigation', toolCalls: ['rag', 'routing'] });
    await expect(classifyIntent('Where is the restroom?')).resolves.toMatchObject({ intent: 'facility_lookup', toolCalls: ['rag', 'facility'] });
    await expect(classifyIntent('Is the queue busy?')).resolves.toMatchObject({ intent: 'crowd_status', toolCalls: ['crowd', 'rag'] });
    await expect(classifyIntent('Need wheelchair access')).resolves.toMatchObject({ intent: 'accessibility' });
    await expect(classifyIntent('Which bus should I take?')).resolves.toMatchObject({ intent: 'transport' });
    await expect(classifyIntent('Fire emergency!')).resolves.toMatchObject({ intent: 'emergency' });
  });

  it('uses and safely falls back from Hugging Face responses', async () => {
    vi.stubEnv('HF_TOKEN', 'test-token');
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: '```json\n{"intent":"faq","language":"es","entities":{},"toolCalls":["rag"]}\n```' } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [[1, 2]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'Answer' } }] }) })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'down' });
    vi.stubGlobal('fetch', fetch);
    await expect(classifyIntent('hello')).resolves.toMatchObject({ intent: 'faq', language: 'es' });
    await expect(generateEmbedding('hello')).resolves.toEqual([1, 2]);
    await expect(generateResponse({ message: 'hello', ragChunks: ['fact'], ragSources: ['faq'], routingOutput: null, crowdOutput: null, facilityOutput: null, language: 'en' })).resolves.toBe('Answer');
    await expect(generateEmbedding('failure')).resolves.toBeNull();
  });

  it('uses each deterministic response fallback in priority order', async () => {
    vi.stubEnv('HF_TOKEN', '');
    await expect(generateResponse({ ragChunks: [], routingOutput: 'route', crowdOutput: 'crowd', facilityOutput: 'facility' })).resolves.toBe('route');
    await expect(generateResponse({ ragChunks: [], routingOutput: null, crowdOutput: null, facilityOutput: 'facility' })).resolves.toBe('facility');
    await expect(generateResponse({ ragChunks: [], routingOutput: null, crowdOutput: 'crowd', facilityOutput: null })).resolves.toBe('crowd');
    await expect(generateResponse({ ragChunks: ['fact'], routingOutput: null, crowdOutput: null, facilityOutput: null })).resolves.toContain('fact');
  });
});
