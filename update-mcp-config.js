#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const yaml = require('js-yaml');

const GATEWAY_URL = 'https://mcps-7hm5.onrender.com';
const CONFIG_FILE = 'librechat.yaml';

// Function to discover available MCP services
async function discoverMCPServices() {
  return new Promise((resolve, reject) => {
    https.get(`${GATEWAY_URL}/api/mcp`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // You'll need to adjust this based on your gateway's response format
          const response = JSON.parse(data);
          resolve(response.services || []);
        } catch (error) {
          // Fallback: try to detect services by checking endpoints
          checkKnownEndpoints().then(resolve).catch(reject);
        }
      });
    }).on('error', reject);
  });
}

// Fallback method to check known service patterns
async function checkKnownEndpoints() {
  const services = [];
  
  // Check for mcp-1, mcp-2, etc.
  for (let i = 1; i <= 10; i++) {
    try {
      const isAvailable = await checkEndpoint(`/api/mcp/mcp-${i}`);
      if (isAvailable) {
        services.push({
          id: `mcp-${i}`,
          name: `MCP Service ${i}`,
          url: `${GATEWAY_URL}/api/mcp/mcp-${i}`
        });
      }
    } catch (error) {
      // Service doesn't exist, continue
    }
  }
  
  return services;
}

// Check if an endpoint is available
function checkEndpoint(path) {
  return new Promise((resolve) => {
    https.get(`${GATEWAY_URL}${path}`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// Update the LibreChat config
function updateConfig(services) {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = yaml.load(configContent);
    
    // Backup existing non-gateway MCP servers
    const existingServers = {};
    if (config.mcpServers) {
      Object.entries(config.mcpServers).forEach(([key, value]) => {
        if (!key.startsWith('my-') || key === 'my-business-mcp' || key === 'outlook-mcp') {
          existingServers[key] = value;
        }
      });
    }
    
    // Create new MCP servers object
    const newMcpServers = {};
    
    // Add discovered services
    services.forEach((service, index) => {
      const serviceName = getServiceName(service.id || `service-${index}`);
      newMcpServers[serviceName] = {
        type: 'streamable-http',
        url: service.url,
        timeout: 60000,
        initTimeout: 30000
      };
    });
    
    // Add back existing non-gateway servers
    Object.assign(newMcpServers, existingServers);
    
    // Update config
    config.mcpServers = newMcpServers;
    
    // Write back to file
    const updatedYaml = yaml.dump(config, { 
      indent: 2,
      lineWidth: -1,
      noRefs: true 
    });
    
    fs.writeFileSync(CONFIG_FILE, updatedYaml);
    console.log(`✅ Updated ${CONFIG_FILE} with ${services.length} MCP services`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating config:', error.message);
    return false;
  }
}

// Map service IDs to friendly names
function getServiceName(serviceId) {
  const nameMap = {
    'mcp-1': 'my-openrouter-mcp',
    'mcp-2': 'my-exa-search', 
    'mcp-3': 'my-sequential-thinking',
    'mcp-4': 'my-toolbox',
    'mcp-5': 'my-duckduckgo'
  };
  
  return nameMap[serviceId] || `my-${serviceId}`;
}

// Main function
async function main() {
  console.log('🔍 Discovering MCP services...');
  
  try {
    const services = await discoverMCPServices();
    console.log(`📡 Found ${services.length} services:`, services.map(s => s.name || s.id));
    
    if (services.length > 0) {
      const success = updateConfig(services);
      if (success) {
        console.log('🎉 LibreChat config updated successfully!');
        console.log('💡 Restart LibreChat to pick up the new MCP services.');
      }
    } else {
      console.log('⚠️  No MCP services found');
    }
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { discoverMCPServices, updateConfig }; 