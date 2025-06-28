const { EventSource } = require('eventsource');
const { Time } = require('librechat-data-provider');
const { MCPManager, FlowStateManager } = require('@librechat/api');
const logger = require('./winston');

// Patch EventSource at module level before any other imports
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (...args) {
  const module = originalRequire.apply(this, args);

  // Patch eventsource module when it's required
  if (args[0] === 'eventsource' && module.EventSource) {
    const RawEventSource = module.EventSource;

    class AuthEventSource extends RawEventSource {
      constructor(url, options = {}) {
        if (url.includes('n8n.metamation.net')) {
          logger.info(`[AuthEventSource] Intercepting N8N SSE connection to: ${url}`);
          options = options || {};
          options.headers = options.headers || {};

          if (process.env.N8N_API_KEY) {
            options.headers.Authorization = `Bearer ${process.env.N8N_API_KEY}`;
            logger.info(`[AuthEventSource] Added Authorization header for N8N endpoint`);
          } else {
            logger.warn(`[AuthEventSource] N8N_API_KEY environment variable not found`);
          }

          logger.info(`[AuthEventSource] Final options:`, JSON.stringify(options, null, 2));
        }
        super(url, options);
      }
    }

    module.EventSource = AuthEventSource;
    logger.info(`[AuthEventSource] Patched eventsource module successfully`);
  }

  return module;
};

// Also set global for any direct global usage
global.EventSource = EventSource;

/** @type {MCPManager} */
let mcpManager = null;
let flowManager = null;

/**
 * @param {string} [userId] - Optional user ID, to avoid disconnecting the current user.
 * @returns {MCPManager}
 */
function getMCPManager(userId) {
  if (!mcpManager) {
    mcpManager = MCPManager.getInstance();
  } else {
    mcpManager.checkIdleConnections(userId);
  }
  return mcpManager;
}

/**
 * @param {Keyv} flowsCache
 * @returns {FlowStateManager}
 */
function getFlowStateManager(flowsCache) {
  if (!flowManager) {
    flowManager = new FlowStateManager(flowsCache, {
      ttl: Time.ONE_MINUTE * 3,
    });
  }
  return flowManager;
}

module.exports = {
  logger,
  getMCPManager,
  getFlowStateManager,
};
