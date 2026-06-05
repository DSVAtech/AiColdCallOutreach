const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.ghl.apiBase,
  headers: {
    Authorization: `Bearer ${config.ghl.apiToken}`,
    Version: config.ghl.apiVersion,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

async function getContact(contactId) {
  const { data } = await client.get(`/contacts/${contactId}`);
  return data.contact;
}

async function addNote(contactId, body) {
  const { data } = await client.post(`/contacts/${contactId}/notes`, { body });
  return data;
}

async function addTags(contactId, tags) {
  const { data } = await client.post(`/contacts/${contactId}/tags`, { tags });
  return data;
}

async function removeTags(contactId, tags) {
  const { data } = await client.delete(`/contacts/${contactId}/tags`, {
    data: { tags },
  });
  return data;
}

async function updateContact(contactId, payload) {
  const { data } = await client.put(`/contacts/${contactId}`, payload);
  return data;
}

async function createTask(contactId, { title, body, dueDate }) {
  const { data } = await client.post(`/contacts/${contactId}/tasks`, {
    title,
    body,
    dueDate,
    completed: false,
  });
  return data;
}

async function findOpportunityByContact(contactId, pipelineId) {
  const { data } = await client.get('/opportunities/search', {
    params: {
      location_id: config.ghl.locationId,
      pipeline_id: pipelineId,
      contact_id: contactId,
      limit: 1,
    },
  });
  return data?.opportunities?.[0] || null;
}

async function createOpportunity({ contactId, pipelineId, stageId, name, monetaryValue }) {
  const { data } = await client.post('/opportunities/', {
    locationId: config.ghl.locationId,
    pipelineId,
    pipelineStageId: stageId,
    contactId,
    name: name || 'AI Cold Call Lead',
    status: 'open',
    monetaryValue: monetaryValue ?? 0,
  });
  return data?.opportunity || data;
}

async function updateOpportunityStage(opportunityId, stageId, extra = {}) {
  const { data } = await client.put(`/opportunities/${opportunityId}`, {
    pipelineStageId: stageId,
    ...extra,
  });
  return data?.opportunity || data;
}

async function upsertOpportunityStage({ contactId, pipelineId, stageId, name }) {
  const existing = await findOpportunityByContact(contactId, pipelineId).catch(() => null);
  if (existing) {
    return updateOpportunityStage(existing.id, stageId);
  }
  try {
    return await createOpportunity({ contactId, pipelineId, stageId, name });
  } catch (err) {
    const existingId = err.response?.data?.meta?.existingId;
    if (existingId) {
      console.log(`[ghl] 🔀 opportunity ${existingId} exists in another pipeline — moving it to AI Cold Call pipeline`);
      return updateOpportunityStage(existingId, stageId, { pipelineId });
    }
    throw err;
  }
}

module.exports = {
  getContact,
  addNote,
  addTags,
  removeTags,
  updateContact,
  createTask,
  findOpportunityByContact,
  createOpportunity,
  updateOpportunityStage,
  upsertOpportunityStage,
};
