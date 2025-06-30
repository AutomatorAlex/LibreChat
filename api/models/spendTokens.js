const { createTransaction, createStructuredTransaction } = require('./Transaction');

/**
 * Spend tokens for a user
 * @param {Object} params - The parameters for spending tokens
 * @param {string} params.user - The user ID
 * @param {string} params.model - The model name
 * @param {string} params.endpoint - The endpoint name
 * @param {number} params.promptTokens - Number of prompt tokens
 * @param {number} params.completionTokens - Number of completion tokens
 * @param {Object} [params.endpointTokenConfig] - Token configuration for the endpoint
 * @returns {Promise<Object>} Transaction result
 */
async function spendTokens({
  user,
  model,
  endpoint,
  promptTokens = 0,
  completionTokens = 0,
  endpointTokenConfig,
}) {
  const transactions = [];

  // Create prompt transaction if there are prompt tokens
  if (promptTokens > 0) {
    const promptTx = await createTransaction({
      user,
      model,
      endpoint,
      tokenType: 'prompt',
      rawAmount: -Math.abs(promptTokens),
      endpointTokenConfig,
    });
    if (promptTx) {
      transactions.push(promptTx);
    }
  }

  // Create completion transaction if there are completion tokens
  if (completionTokens > 0) {
    const completionTx = await createTransaction({
      user,
      model,
      endpoint,
      tokenType: 'completion',
      rawAmount: -Math.abs(completionTokens),
      endpointTokenConfig,
    });
    if (completionTx) {
      transactions.push(completionTx);
    }
  }

  // Return the last transaction result (which contains the final balance)
  return transactions.length > 0 ? transactions[transactions.length - 1] : null;
}

/**
 * Spend structured tokens for a user (with cache support)
 * @param {Object} params - The parameters for spending tokens
 * @param {string} params.user - The user ID
 * @param {string} params.model - The model name
 * @param {string} params.endpoint - The endpoint name
 * @param {number} [params.inputTokens] - Number of input tokens
 * @param {number} [params.writeTokens] - Number of cache write tokens
 * @param {number} [params.readTokens] - Number of cache read tokens
 * @param {number} [params.completionTokens] - Number of completion tokens
 * @param {Object} [params.endpointTokenConfig] - Token configuration for the endpoint
 * @returns {Promise<Object>} Transaction result
 */
async function spendStructuredTokens({
  user,
  model,
  endpoint,
  inputTokens = 0,
  writeTokens = 0,
  readTokens = 0,
  completionTokens = 0,
  endpointTokenConfig,
}) {
  const transactions = [];

  // Create structured prompt transaction if there are any prompt-related tokens
  const totalPromptTokens = inputTokens + writeTokens + readTokens;
  if (totalPromptTokens > 0) {
    const promptTx = await createStructuredTransaction({
      user,
      model,
      endpoint,
      tokenType: 'prompt',
      inputTokens: inputTokens || 0,
      writeTokens: writeTokens || 0,
      readTokens: readTokens || 0,
      endpointTokenConfig,
    });
    if (promptTx) {
      transactions.push(promptTx);
    }
  }

  // Create completion transaction if there are completion tokens
  if (completionTokens > 0) {
    const completionTx = await createStructuredTransaction({
      user,
      model,
      endpoint,
      tokenType: 'completion',
      rawAmount: completionTokens,
      endpointTokenConfig,
    });
    if (completionTx) {
      transactions.push(completionTx);
    }
  }

  // Return the last transaction result (which contains the final balance)
  return transactions.length > 0 ? transactions[transactions.length - 1] : null;
}

module.exports = {
  spendTokens,
  spendStructuredTokens,
};
