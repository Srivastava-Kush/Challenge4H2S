const token = process.env.HF_TOKEN;
if (!token) {
  console.error('❌ Error: HF_TOKEN is not defined.');
  process.exit(1);
}

// We MUST use open source models hosted on Hugging Face router, NOT gemini-2.5-flash!
const CHAT_MODEL = 'Qwen/Qwen2.5-72B-Instruct';
const EMBEDDING_MODEL = 'BAAI/bge-base-en-v1.5';  // 768-dim feature-extraction model

console.log(`🔑 Testing HF Token: ${token.substring(0, 8)}...`);

async function run() {
  // Test 1: Chat Completion via new router
  try {
    console.log(`🤖 Test 1: Testing Chat Completion via router (${CHAT_MODEL})...`);
    const chatResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: 'Respond with the word "Success" and nothing else.' }],
        temperature: 0.1,
        max_tokens: 16
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`HF Status: ${chatResponse.status} - ${await chatResponse.text()}`);
    }

    const data = await chatResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    console.log(`✅ Test 1 Success: "${reply}"`);
  } catch (err) {
    console.error('❌ Test 1 Failed:', err);
  }

  // Test 2: Feature Extraction via new router
  try {
    console.log(`📦 Test 2: Testing Feature Extraction via router (${EMBEDDING_MODEL})...`);
    const embedResponse = await fetch(`https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inputs: ['Test connection'] })  // array for feature-extraction
    });

    if (!embedResponse.ok) {
      throw new Error(`HF Status: ${embedResponse.status} - ${await embedResponse.text()}`);
    }

    const data = await embedResponse.json();
    
    let vector = data;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      vector = data[0];
      if (Array.isArray(data[0][0])) {
        vector = data[0][0];
      }
    }

    console.log(`✅ Test 2 Success: Generated vector of length ${vector.length} (expected 768)`);
  } catch (err) {
    console.error('❌ Test 2 Failed:', err);
  }
}

run();
