import { describe, expect, it, vi } from 'vitest';
import { addClient, broadcastToSSE } from '../../services/sseService.js';

describe('sseService', () => {
  it('broadcasts to connected clients and removes a closed client', () => {
    let closeHandler;
    const first = { write: vi.fn(), on: vi.fn((event, handler) => { if (event === 'close') closeHandler = handler; }) };
    const second = { write: vi.fn(), on: vi.fn() };
    addClient(first);
    addClient(second);
    broadcastToSSE({ type: 'UPDATED' });
    expect(first.write).toHaveBeenCalledWith('data: {"type":"UPDATED"}\n\n');
    expect(second.write).toHaveBeenCalledOnce();
    closeHandler();
    broadcastToSSE({ type: 'NEXT' });
    expect(first.write).toHaveBeenCalledOnce();
    expect(second.write).toHaveBeenCalledTimes(2);
  });
});
