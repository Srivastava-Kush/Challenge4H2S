import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import chatRoutes from '../../routes/chatRoutes.js';

vi.mock('../../services/stadiumDataService.js', () => ({
  getNavigationData: vi.fn().mockResolvedValue({
    nodes: [
      { id: 'gate_metlife', name: 'MetLife Gate', type: 'gate', level: 'ground', x: 0, y: 0, accessible: true },
      { id: 'restroom_1', name: 'Restroom 1', type: 'restroom', level: '100', x: 10, y: 0, accessible: true },
    ],
    edges: [{ id: 'gate_restroom', from: 'gate_metlife', to: 'restroom_1', distance: 10, walkTime: 10, accessible: true, stairs: false }],
    crowd: { nodes: {}, edges: {} },
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat API Integration (/api/chat)', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock the environment token to force API flow instead of fallback
    process.env.HF_TOKEN = 'mock_hf_token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('orchestrates intent -> tool calls -> final response successfully', async () => {
    // Mock fetch for both:
    // 1. Chat Completion for intent classification
    // 2. Chat Completion for final answer generation
    global.fetch = vi.fn().mockImplementation((url, init) => {
      const body = JSON.parse(init.body);
      
      // If it is the intent classifier request
      if (body.messages[0].content.includes('Classify the user\'s message')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'navigation',
                  language: 'en',
                  entities: { from: 'gate_metlife', to: 'restroom_1', facilityType: null },
                  toolCalls: ['routing']
                })
              }
            }]
          })
        });
      }

      // If it is the final response generation request
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Follow the South Concourse corridor straight to the Restroom.'
            }
          }]
        })
      });
    });

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'How do I go to the restroom from Gate A?',
        startNodeId: 'gate_metlife'
      });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('navigation');
    expect(res.body.reply).toBe('Follow the South Concourse corridor straight to the Restroom.');
    expect(res.body.route).toBeDefined();
    expect(res.body.route.totalDistance).toBeGreaterThan(0);
  });
});
