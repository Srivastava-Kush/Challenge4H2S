/**
 * ragService.js
 *
 * Semantic RAG (Retrieval-Augmented Generation) service.
 *
 * Primary path  — MongoDB Atlas Vector Search:
 *   Documents are chunked, embedded via text-embedding-004, and stored in
 *   the `stadium_docs` collection with a vector index. Searches use cosine
 *   similarity. Embeddings are cached per-chunk and regenerated only when the
 *   source document changes (detected via a hash of the chunk text).
 *
 * Fallback path — TF-IDF keyword scoring:
 *   When Atlas is unavailable or GEMINI_API_KEY is missing, falls back to a
 *   deterministic keyword scorer so the chatbot still answers questions.
 *
 * Exports:
 *   loadKnowledgeBase()         — call on server startup
 *   search(query, k)            — primary entry point for chatController
 *   retrieveDocs(query)         — legacy export kept for backward compatibility
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { generateEmbedding } from './llmService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DOCUMENTS_DIR       = path.join(__dirname, '..', '..', 'docs');
const VECTOR_INDEX_NAME   = process.env.VECTOR_INDEX_NAME || 'stadium_docs';
const EMBEDDING_DIMENSION = 768; // text-embedding-004 output dimension

// ─── Mongoose Schema ─────────────────────────────────────────────────────────

const docSchema = new mongoose.Schema({
  chunkId:   { type: String, unique: true },   // sha256 of content
  source:    String,
  content:   String,
  embedding: { type: [Number], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// Text index for keyword fallback
docSchema.index({ content: 'text' });

const StadiumDoc = mongoose.models.StadiumDoc
  || mongoose.model('StadiumDoc', docSchema);

// ─── In-Memory Fallback Store ─────────────────────────────────────────────────

/** @type {{ source: string; content: string; embedding: number[] | null }[]} */
let inMemoryDocs = [];

// ─── Document Loading & Chunking ──────────────────────────────────────────────

const KNOWLEDGE_FILES = [
  'faq.txt',
  'emergency.txt',
  'accessibility.txt',
  'transport.txt',
  'policies.txt',
  'operations.txt',
];

function chunkText(text, source) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20)
    .map(content => ({
      source,
      content,
      chunkId: crypto.createHash('sha256').update(content).digest('hex').slice(0, 24),
    }));
}

/**
 * Load all knowledge documents, chunk them, generate embeddings where needed,
 * and persist to MongoDB Atlas. Falls back gracefully when Atlas is offline.
 */
export async function loadKnowledgeBase() {
  const allChunks = [];

  for (const file of KNOWLEDGE_FILES) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[RAG] Skipping missing doc: ${file}`);
      continue;
    }
    const text   = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(text, file);
    allChunks.push(...chunks);
  }

  inMemoryDocs = allChunks.map(c => ({ ...c, embedding: null }));
  console.log(`[RAG] Loaded ${allChunks.length} chunks from ${KNOWLEDGE_FILES.length} documents.`);

  // Try to sync with MongoDB Atlas for vector search
  if (mongoose.connection.readyState === 1) {
    await syncVectorStore(allChunks);
  } else {
    console.warn('[RAG] MongoDB offline — using keyword fallback. Embeddings will be generated when Atlas connects.');
    // Still generate in-memory embeddings for a lightweight semantic experience
    await generateInMemoryEmbeddings(allChunks);
  }
}

async function syncVectorStore(chunks) {
  console.log('[RAG] Syncing embeddings to MongoDB Atlas Vector Search…');
  let newCount = 0;

  for (const chunk of chunks) {
    const existing = await StadiumDoc.findOne({ chunkId: chunk.chunkId });
    if (existing && existing.embedding.length > 0) {
      // Already embedded — update in-memory cache
      const idx = inMemoryDocs.findIndex(d => d.chunkId === chunk.chunkId);
      if (idx !== -1) inMemoryDocs[idx].embedding = existing.embedding;
      continue;
    }

    const embedding = await generateEmbedding(chunk.content);
    if (!embedding) continue;

    await StadiumDoc.updateOne(
      { chunkId: chunk.chunkId },
      { $set: { source: chunk.source, content: chunk.content, embedding, updatedAt: new Date() } },
      { upsert: true }
    );

    const idx = inMemoryDocs.findIndex(d => d.chunkId === chunk.chunkId);
    if (idx !== -1) inMemoryDocs[idx].embedding = embedding;
    newCount++;
  }

  console.log(`[RAG] Vector sync complete. ${newCount} new chunks embedded.`);
}

async function generateInMemoryEmbeddings(chunks) {
  console.log('[RAG] Generating in-memory embeddings (no Atlas)…');
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    const idx = inMemoryDocs.findIndex(d => d.chunkId === chunk.chunkId);
    if (idx !== -1 && embedding) inMemoryDocs[idx].embedding = embedding;
  }
  console.log('[RAG] In-memory embeddings ready.');
}

// ─── Semantic Search ──────────────────────────────────────────────────────────

/**
 * Primary retrieval function. Uses Atlas Vector Search when available,
 * falls back to cosine similarity over in-memory embeddings, then
 * falls back to TF-IDF keyword scoring.
 *
 * @param {string} query
 * @param {number} k — top-k results to return
 * @returns {Promise<{ chunks: string[], sources: string[] }>}
 */
export async function search(query, k = 3) {
  // Atlas Vector Search
  if (mongoose.connection.readyState === 1) {
    try {
      const queryEmbedding = await generateEmbedding(query);
      if (queryEmbedding) {
        const results = await StadiumDoc.aggregate([
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: k * 10,
              limit: k,
            },
          },
          { $project: { content: 1, source: 1, score: { $meta: 'vectorSearchScore' } } },
        ]);

        if (results.length > 0) {
          return {
            chunks:  results.map(r => r.content),
            sources: results.map(r => r.source),
          };
        }
      }
    } catch (err) {
      console.warn('[RAG] Atlas vector search failed, falling back:', err.message);
    }
  }

  // In-memory cosine similarity (when embeddings are available)
  const docsWithEmbeddings = inMemoryDocs.filter(d => d.embedding && d.embedding.length > 0);
  if (docsWithEmbeddings.length > 0) {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const scored = docsWithEmbeddings.map(doc => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding),
      }));
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, k);
      return {
        chunks:  top.map(r => r.doc.content),
        sources: top.map(r => r.doc.source),
      };
    }
  }

  // TF-IDF keyword fallback
  return keywordSearch(query, k);
}

/** Cosine similarity between two equal-length float vectors */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

/** TF-IDF-inspired keyword scoring over in-memory docs */
function keywordSearch(query, k) {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (keywords.length === 0) {
    const top = inMemoryDocs.slice(0, k);
    return { chunks: top.map(d => d.content), sources: top.map(d => d.source) };
  }

  const totalDocs = inMemoryDocs.length;
  // Document frequency for IDF
  const df = {};
  keywords.forEach(kw => {
    df[kw] = inMemoryDocs.filter(d => d.content.toLowerCase().includes(kw)).length || 1;
  });

  const scored = inMemoryDocs.map(doc => {
    const lower = doc.content.toLowerCase();
    let score = 0;
    keywords.forEach(kw => {
      const tf = (lower.match(new RegExp(kw, 'g')) || []).length / lower.split(/\s+/).length;
      const idf = Math.log(totalDocs / df[kw]);
      score += tf * idf;
    });
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0).slice(0, k);

  if (top.length === 0) {
    const fallback = inMemoryDocs.slice(0, k);
    return { chunks: fallback.map(d => d.content), sources: fallback.map(d => d.source) };
  }

  return {
    chunks:  top.map(r => r.doc.content),
    sources: top.map(r => r.doc.source),
  };
}

/** @deprecated Use search() instead */
export function retrieveDocs(query) {
  const { chunks, sources } = keywordSearch(query, 3);
  return chunks.map((content, i) => ({ content, source: sources[i] }));
}
