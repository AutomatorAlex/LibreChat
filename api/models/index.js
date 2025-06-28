const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);

// DEBUG: Log what methods are available from data-schemas
console.log('[DEBUG] Available methods from data-schemas:', Object.keys(methods));

// DEBUG: Check if critical functions exist
console.log('[DEBUG] findUser exists:', typeof methods.findUser);
console.log('[DEBUG] getUserById exists:', typeof methods.getUserById);
console.log('[DEBUG] comparePassword exists:', typeof methods.comparePassword);
console.log('[DEBUG] hashPassword exists:', typeof methods.hashPassword);

// TEMPORARY: Import only comparePassword from legacy file for now
const { comparePassword: legacyComparePassword } = require('./userMethods');
console.log('[DEBUG] Legacy comparePassword exists:', typeof legacyComparePassword);
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');

module.exports = {
  ...methods,
  // Use legacy comparePassword temporarily until we add it to data-schemas
  comparePassword: legacyComparePassword,
  // All other methods should come from data-schemas
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,
  getPreset,
  getPresets,
  savePreset,
  deletePresets,
};
