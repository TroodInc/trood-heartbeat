const fetch = require('node-fetch');

const getHeaders = (apiKey, apiUsername) => ({
  'Content-Type': 'application/json',
  'Api-Key': apiKey,
  'Api-Username': apiUsername,
});

const resolveCategory = async (baseUrl, apiKey, apiUsername, category) => {
  if (!category) {
    return undefined;
  }

  const value = String(category).trim();
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  const res = await fetch(`${baseUrl}/categories.json`, {
    headers: getHeaders(apiKey, apiUsername),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to resolve Discourse category: ${res.status} ${text}`);
  }

  const data = await res.json();
  const categories = data.category_list?.categories || [];
  const normalized = value.toLowerCase();
  const match = categories.find((item) =>
    item.slug?.toLowerCase() === normalized || item.name?.toLowerCase() === normalized
  );

  if (!match) {
    throw new Error(`Discourse category "${value}" not found. Use a valid category ID, slug, or exact name.`);
  }

  return match.id;
};

const publish = async ({ category, topic, title, markdown }) => {
  const url = process.env.DISCOURSE_URL?.replace(/\/+$/, '');
  const apiKey = process.env.DISCOURSE_API_KEY;
  const apiUsername = process.env.DISCOURSE_API_USERNAME;

  if (!url || !apiKey || !apiUsername) {
    throw new Error('Discourse credentials not configured');
  }

  const payload = { raw: markdown };

  if (topic) {
    const topicId = parseInt(String(topic).trim(), 10);
    if (!topicId) {
      throw new Error('Discourse topic must be a numeric topic ID');
    }
    payload.topic_id = topicId;
  } else {
    payload.title = title;
    payload.category = await resolveCategory(url, apiKey, apiUsername, category);
  }

  const res = await fetch(`${url}/posts.json`, {
    method: 'POST',
    headers: getHeaders(apiKey, apiUsername),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discourse API error: ${res.status} ${text}. Check that the category exists and the API user can post there.`);
  }

  return res.json();
};

module.exports = { publish };
