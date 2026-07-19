import { describe, expect, it, vi } from 'vitest';
vi.mock('../../services/llmService.js', () => ({ classifyIntent: vi.fn() }));
import { classifyIntent } from '../../services/llmService.js';
import { classifyAndResolve } from '../../services/intentService.js';

describe('intentService', () => {
  it('resolves recognized aliases and preserves canonical IDs', async () => {
    classifyIntent.mockResolvedValue({ intent: 'navigation', entities: { from: 'Gate A', to: 'prayer_1' }, toolCalls: ['routing'] });
    await expect(classifyAndResolve('route')).resolves.toMatchObject({ entities: { from: 'gate_metlife', to: 'prayer_1' } });
  });

  it('converts unknown or missing node names to null', async () => {
    classifyIntent.mockResolvedValue({ intent: 'faq', entities: { from: 'unknown', to: null } });
    await expect(classifyAndResolve('hello')).resolves.toMatchObject({ entities: { from: null, to: null } });
  });
});
