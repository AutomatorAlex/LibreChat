const axios = require('axios');
const { EventSource } = require('eventsource');
const { Time, CacheKeys } = require('librechat-data-provider');
const { MCPManager, FlowStateManager } = require('librechat-mcp');
const logger = require('./winston');

// Patch EventSource to support custom headers for N8N endpoints
const RawEventSource = EventSource;
class AuthEventSource extends RawEventSource {
  /**
   * @param {string} url
   * @param {object} [options]
   */
  constructor(url, options = {}) {
    // If this is an N8N MCP endpoint, ensure Authorization header is included
    if (url.includes('n8n.metamation.net') && process.env.N8N_API_KEY) {
      options = options || {};
      options.headers = options.headers || {};
      if (!options.headers.Authorization && !options.headers['X-N8N-API-KEY']) {
        options.headers.Authorization = `Bearer ${process.env.N8N_API_KEY}`;
      }
    }
    super(url, options);
  }
}
global.EventSource = AuthEventSource;

/** @type {MCPManager} */
let mcpManager = null;
let flowManager = null;

/**
 * @param {string} [userId] - Optional user ID, to avoid disconnecting the current user.
 * @returns {MCPManager}
 */
function getMCPManager(userId) {
  if (!mcpManager) {
    mcpManager = MCPManager.getInstance(logger);
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
      logger,
    });
  }
  return flowManager;
}

/**
 * Sends message data in Server Sent Events format.
 * @param {ServerResponse} res - The server response.
 * @param {{ data: string | Record<string, unknown>, event?: string }} event - The message event.
 * @param {string} event.event - The type of event.
 * @param {string} event.data - The message to be sent.
 */
const sendEvent = (res, event) => {
  if (typeof event.data === 'string' && event.data.length === 0) {
    return;
  }
  res.write(`event: message\ndata: ${JSON.stringify(event)}\n\n`);
};

/**
 * Creates and configures an Axios instance with optional proxy settings.
 *
 * @typedef {import('axios').AxiosInstance} AxiosInstance
 * @typedef {import('axios').AxiosProxyConfig} AxiosProxyConfig
 *
 * @returns {AxiosInstance} A configured Axios instance
 * @throws {Error} If there's an issue creating the Axios instance or parsing the proxy URL
 */
function createAxiosInstance() {
  const instance = axios.create();

  if (process.env.proxy) {
    try {
      const url = new URL(process.env.proxy);

      /** @type {AxiosProxyConfig} */
      const proxyConfig = {
        host: url.hostname.replace(/^\[|\]$/g, ''),
        protocol: url.protocol.replace(':', ''),
      };

      if (url.port) {
        proxyConfig.port = parseInt(url.port, 10);
      }

      instance.defaults.proxy = proxyConfig;
    } catch (error) {
      console.error('Error parsing proxy URL:', error);
      throw new Error(`Invalid proxy URL: ${process.env.proxy}`);
    }
  }

  return instance;
}

module.exports = {
  logger,
  sendEvent,
  getMCPManager,
  createAxiosInstance,
  getFlowStateManager,
};
