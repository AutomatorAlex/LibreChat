const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
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
const {
  getTransactions,
  createTransaction,
  createAutoRefillTransaction,
  createStructuredTransaction,
} = require('./Transaction');
const { spendTokens, spendStructuredTokens } = require('./spendTokens');

module.exports = {
  ...methods,
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
  getTransactions,
  createTransaction,
  createAutoRefillTransaction,
  createStructuredTransaction,
  spendTokens,
  spendStructuredTokens,
};
