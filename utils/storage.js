// utils/storage.js - 本地存储封装
const STORAGE_KEYS = {
  CONFIG: 'ai-painter-config',
  PRESETS: 'ai-painter-presets',
  HISTORY: 'ai-painter-history',
  THEME: 'ai-painter-theme'
};

function get(key, fallback = null) {
  try {
    const val = wx.getStorageSync(key);
    return val !== '' ? val : fallback;
  } catch (e) {
    return fallback;
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    console.error('Storage set failed:', e);
  }
}

function getJSON(key, fallback = null) {
  try {
    const raw = wx.getStorageSync(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setJSON(key, value) {
  try {
    wx.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage setJSON failed:', e);
  }
}

module.exports = {
  STORAGE_KEYS,
  get,
  set,
  getJSON,
  setJSON
};
