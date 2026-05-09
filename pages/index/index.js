// pages/index/index.js
const storage = require('../../utils/storage');
const api = require('../../utils/api');

// 随机灵感提示词
const RANDOM_PROMPTS = [
  'a serene japanese garden with koi pond and cherry blossoms at dawn, ultra detailed',
  'a futuristic city skyline at night, flying cars, neon reflections, cyberpunk',
  'a cute corgi astronaut floating in space with earth in background, pixar style',
  'an ancient library filled with glowing floating books, magical atmosphere',
  'a majestic dragon perched on a snowy mountain peak, cinematic lighting',
  'a cozy cabin in autumn forest, golden hour, warm light through windows, oil painting',
  'underwater temple ruins with bioluminescent fish, mysterious, photorealistic',
  'a steampunk airship above Victorian london, intricate details, brass and copper',
];

const CFG_FIELDS = ['apiBase', 'apiKey', 'model'];
const PARAM_FIELDS = ['prompt', 'negPrompt', 'seed'];

Page({
  data: {
    // 主题
    themeClass: 'dark',

    // 模式: t2i=文生图, i2i=图生图
    mode: 't2i',

    // UI 展开/折叠
    showApiConfig: true,
    showPresets: false,
    showAdvanced: false,

    // API 配置
    apiBase: '',
    apiKey: '',
    model: '',
    apiProtocols: [
      { name: 'OpenAI 兼容 (/images/generations)', value: 'openai' },
      { name: 'OpenAI 图像编辑 (/images/edits)', value: 'openai-edit' },
      { name: '自定义 JSON (POST)', value: 'custom' },
    ],
    apiProtocolIndex: 0,
    testing: false,

    // 预设
    presetNames: [],
    presetIndex: null,
    presetName: '',

    // 创作参数
    prompt: '',
    negPrompt: '',
    quickTags: [
      { name: '高质量', value: 'masterpiece, best quality, ultra detailed' },
      { name: '电影级', value: 'cinematic lighting, 8k, photorealistic' },
      { name: '动漫风', value: 'anime style, vibrant colors' },
      { name: '水彩', value: 'watercolor, soft pastel' },
      { name: '油画', value: 'oil painting, thick brush strokes' },
      { name: '赛博朋克', value: 'cyberpunk, neon lights' },
    ],
    sizes: [
      { name: '1024 × 1024 (正方形)', value: '1024x1024' },
      { name: '1024 × 1792 (竖版)', value: '1024x1792' },
      { name: '1792 × 1024 (横版)', value: '1792x1024' },
      { name: '512 × 512', value: '512x512' },
      { name: '768 × 1024', value: '768x1024' },
      { name: '1024 × 768', value: '1024x768' },
    ],
    sizeIndex: 0,
    counts: ['1', '2', '3', '4'],
    countIndex: 0,
    qualities: [
      { name: '标准', value: 'standard' },
      { name: '高清', value: 'hd' },
    ],
    qualityIndex: 0,
    styles: [
      { name: '鲜艳 (Vivid)', value: 'vivid' },
      { name: '自然 (Natural)', value: 'natural' },
    ],
    styleIndex: 0,
    strength: 0.7,
    strengthPercent: 70,
    strengthStr: '0.70',
    seed: '',

    // 图片上传
    uploadedImagePath: '',
    uploadedImageBase64: '',

    // 生成状态
    loading: false,
    loadingCount: [],
    errorMsg: '',

    // 结果
    results: [],
    resultsMeta: {},

    // 历史
    history: [],

    // 请求取消
    abortSignal: null,
  },

  /* ================= 生命周期 ================= */
  onLoad() {
    const app = getApp();
    const theme = app.globalData.theme;
    this.setData({ themeClass: theme });

    this.loadConfig();
    this.renderPresets();
    this.renderHistory();
  },

  onShow() {
    // 主题可能在其他页面被修改
    const app = getApp();
    this.setData({ themeClass: app.globalData.theme });
  },

  /* ================= 配置加载 / 保存 ================= */
  loadConfig() {
    const cfg = storage.getJSON(storage.STORAGE_KEYS.CONFIG, {});
    const updates = {};

    CFG_FIELDS.forEach(k => {
      if (cfg[k] != null) updates[k] = cfg[k];
    });
    PARAM_FIELDS.forEach(k => {
      if (cfg[k] != null) updates[k] = cfg[k];
    });
    if (cfg.apiProtocolIndex != null) updates.apiProtocolIndex = cfg.apiProtocolIndex;
    if (cfg.sizeIndex != null) updates.sizeIndex = cfg.sizeIndex;
    if (cfg.countIndex != null) updates.countIndex = cfg.countIndex;
    if (cfg.qualityIndex != null) updates.qualityIndex = cfg.qualityIndex;
    if (cfg.styleIndex != null) updates.styleIndex = cfg.styleIndex;
    if (cfg.strength != null) {
      updates.strength = cfg.strength;
      updates.strengthPercent = Math.round(cfg.strength * 100);
      updates.strengthStr = Number(cfg.strength).toFixed(2);
    }

    if (Object.keys(updates).length > 0) {
      this.setData(updates);
    }
  },

  saveConfigToStorage() {
    const d = this.data;
    const cfg = {};
    CFG_FIELDS.forEach(k => (cfg[k] = d[k]));
    PARAM_FIELDS.forEach(k => (cfg[k] = d[k]));
    cfg.apiProtocolIndex = d.apiProtocolIndex;
    cfg.sizeIndex = d.sizeIndex;
    cfg.countIndex = d.countIndex;
    cfg.qualityIndex = d.qualityIndex;
    cfg.styleIndex = d.styleIndex;
    cfg.strength = d.strength;
    storage.setJSON(storage.STORAGE_KEYS.CONFIG, cfg);
  },

  /* ================= 字段输入 ================= */
  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const update = { [field]: value };

    // 滑块联动
    if (field === 'strengthPercent') {
      const val = Number(value) / 100;
      update.strength = val;
      update.strengthStr = val.toFixed(2);
    }

    this.setData(update);
    this.saveConfigToStorage();
  },

  onProtocolChange(e) {
    this.setData({ apiProtocolIndex: Number(e.detail.value) });
    this.saveConfigToStorage();
  },

  onSizeChange(e) {
    this.setData({ sizeIndex: Number(e.detail.value) });
    this.saveConfigToStorage();
  },

  onCountChange(e) {
    this.setData({ countIndex: Number(e.detail.value) });
    this.saveConfigToStorage();
  },

  onQualityChange(e) {
    this.setData({ qualityIndex: Number(e.detail.value) });
    this.saveConfigToStorage();
  },

  onStyleChange(e) {
    this.setData({ styleIndex: Number(e.detail.value) });
    this.saveConfigToStorage();
  },

  onStrengthChange(e) {
    const val = Number(e.detail.value) / 100;
    this.setData({
      strength: val,
      strengthStr: val.toFixed(2)
    });
    this.saveConfigToStorage();
  },

  /* ================= 折叠面板 ================= */
  toggleSection(e) {
    const section = e.currentTarget.dataset.section;
    this.setData({ [section]: !this.data[section] });
  },

  /* ================= 模式切换 ================= */
  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  /* ================= 图片选择 ================= */
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];

        // 读取为 base64 (用于 JSON 请求体)
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success(readRes) {
            const ext = tempFilePath.split('.').pop().toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
            const base64Url = `data:image/${mime};base64,${readRes.data}`;

            that.setData({
              uploadedImagePath: tempFilePath,
              uploadedImageBase64: base64Url
            });
          },
          fail() {
            // 如果 base64 读取失败，至少保留路径
            that.setData({ uploadedImagePath: tempFilePath });
          }
        });
      }
    });
  },

  /* ================= 快速标签追加 ================= */
  appendTag(e) {
    const tag = e.currentTarget.dataset.tag;
    let prompt = this.data.prompt.trim();
    if (prompt) {
      prompt = prompt.endsWith(',') ? prompt + ' ' + tag : prompt + ', ' + tag;
    } else {
      prompt = tag;
    }
    this.setData({ prompt });
    this.saveConfigToStorage();
  },

  /* ================= 随机灵感 ================= */
  randomPrompt() {
    const prompt = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    this.setData({ prompt });
    this.saveConfigToStorage();
  },

  /* ================= 预设管理 ================= */
  renderPresets() {
    const presets = storage.getJSON(storage.STORAGE_KEYS.PRESETS, {});
    const names = Object.keys(presets);
    this.setData({ presetNames: names, presetIndex: null });
  },

  savePreset() {
    const name = this.data.presetName.trim();
    if (!name) {
      wx.showToast({ title: '请输入预设名称', icon: 'none' });
      return;
    }
    const presets = storage.getJSON(storage.STORAGE_KEYS.PRESETS, {});
    presets[name] = {};
    CFG_FIELDS.forEach(k => (presets[name][k] = this.data[k]));
    presets[name].apiProtocolIndex = this.data.apiProtocolIndex;
    storage.setJSON(storage.STORAGE_KEYS.PRESETS, presets);

    this.setData({ presetName: '' });
    this.renderPresets();
    wx.showToast({ title: `预设 "${name}" 已保存`, icon: 'success' });
  },

  deletePreset() {
    const presets = storage.getJSON(storage.STORAGE_KEYS.PRESETS, {});
    const names = this.data.presetNames;
    if (names.length === 0) {
      wx.showToast({ title: '没有可删除的预设', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: names,
      success: (res) => {
        const name = names[res.tapIndex];
        wx.showModal({
          title: '确认删除',
          content: `确定删除预设 "${name}"？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              delete presets[name];
              storage.setJSON(storage.STORAGE_KEYS.PRESETS, presets);
              this.renderPresets();
              wx.showToast({ title: `预设 "${name}" 已删除`, icon: 'success' });
            }
          }
        });
      }
    });
  },

  onPresetSelect(e) {
    const name = this.data.presetNames[Number(e.detail.value)];
    if (!name) return;

    const presets = storage.getJSON(storage.STORAGE_KEYS.PRESETS, {});
    const p = presets[name];
    if (!p) return;

    const updates = {};
    CFG_FIELDS.forEach(k => { if (p[k] != null) updates[k] = p[k]; });
    if (p.apiProtocolIndex != null) updates.apiProtocolIndex = p.apiProtocolIndex;

    this.setData(updates);
    this.saveConfigToStorage();
    wx.showToast({ title: `已加载预设 "${name}"`, icon: 'success' });
  },

  /* ================= 主题切换 ================= */
  toggleTheme() {
    const app = getApp();
    app.toggleTheme();
    this.setData({ themeClass: app.globalData.theme });
  },

  /* ================= API 测试 ================= */
  testApi() {
    const apiBase = this.data.apiBase.trim().replace(/\/+$/, '');
    const apiKey = this.data.apiKey.trim();
    if (!apiBase || !apiKey) {
      wx.showToast({ title: '请先填写地址和密钥', icon: 'none' });
      return;
    }

    this.setData({ testing: true });
    wx.showToast({ title: '正在测试连接...', icon: 'loading', duration: 10000 });

    api.testConnection(apiBase, apiKey)
      .then(() => {
        wx.hideToast();
        wx.showToast({ title: '连接成功', icon: 'success' });
      })
      .catch(err => {
        wx.hideToast();
        wx.showToast({ title: '连接失败: ' + err.message, icon: 'none', duration: 3000 });
      })
      .finally(() => {
        this.setData({ testing: false });
      });
  },

  /* ================= 核心：生成图片 ================= */
  generate() {
    const d = this.data;
    const apiBase = d.apiBase.trim().replace(/\/+$/, '');
    const apiKey = d.apiKey.trim();
    const model = d.model.trim();
    const prompt = d.prompt.trim();

    if (!apiBase) { wx.showToast({ title: '请填写请求地址', icon: 'none' }); return; }
    if (!apiKey) { wx.showToast({ title: '请填写 API 密钥', icon: 'none' }); return; }
    if (!model) { wx.showToast({ title: '请填写模型名称', icon: 'none' }); return; }
    if (!prompt) { wx.showToast({ title: '请输入提示词', icon: 'none' }); return; }
    if (d.mode === 'i2i' && !d.uploadedImagePath) {
      wx.showToast({ title: '图生图模式请先上传参考图片', icon: 'none' });
      return;
    }

    this.saveConfigToStorage();

    const protocol = d.apiProtocols[d.apiProtocolIndex].value;
    const size = d.sizes[d.sizeIndex].value;
    const n = parseInt(d.counts[d.countIndex], 10);
    const quality = d.qualities[d.qualityIndex].value;
    const style = d.styles[d.styleIndex].value;
    const negPrompt = d.negPrompt.trim();
    const strength = d.strength;
    const seed = d.seed ? parseInt(d.seed, 10) : null;

    // 进入加载状态
    this.setData({
      loading: true,
      loadingCount: Array.from({ length: n }),
      errorMsg: '',
      results: [],
      resultsMeta: {}
    });

    const abortSignal = new api.AbortSignal();
    this.setData({ abortSignal });

    const startRequest = d.mode === 'i2i' && protocol === 'openai-edit'
      ? api.callOpenAIEdit({
          apiBase, apiKey, model, prompt, size, n,
          imagePath: d.uploadedImagePath,
          signal: abortSignal
        })
      : api.callGenerate({
          apiBase, apiKey, model, prompt, negPrompt,
          size, n, quality, style, strength, seed, protocol,
          referenceImage: d.mode === 'i2i' ? d.uploadedImageBase64 : null,
          signal: abortSignal
        });

    startRequest
      .then(data => {
        const images = api.extractImages(data);
        const meta = { prompt, mode: d.mode, model, size };

        this.setData({ results: images, resultsMeta: meta });
        this.addToHistory(images, meta);
        wx.showToast({ title: `成功生成 ${images.length} 张图片`, icon: 'success' });
      })
      .catch(err => {
        const msg = err.message || String(err);
        console.error('生成失败:', msg);
        wx.showToast({ title: '生成失败', icon: 'none' });
        this.setData({ errorMsg: msg });
      })
      .finally(() => {
        this.setData({ loading: false, abortSignal: null });
      });
  },

  stopGenerate() {
    if (this.data.abortSignal) {
      this.data.abortSignal.abort();
      wx.showToast({ title: '已取消生成', icon: 'none' });
    }
  },

  /* ================= 图片预览 ================= */
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    // 收集所有可预览的图片
    const allResults = this.data.results.map(r => r.src);
    const allHistory = this.data.history.map(h => h.src);
    const urls = [...allResults, ...allHistory].filter(u => u);
    wx.previewImage({
      current: src,
      urls: urls.length > 0 ? urls : [src]
    });
  },

  /* ================= 下载图片 ================= */
  downloadImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;

    // base64 的 data: URL 需要先保存为本地临时文件
    if (src.startsWith('data:')) {
      // 将 base64 转为本地文件
      const fs = wx.getFileSystemManager();
      const filePath = wx.env.USER_DATA_PATH + '/ai-painter-' + Date.now() + '.png';
      // data:image/png;base64,xxxx => xxxx
      const base64 = src.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFile({
        filePath: filePath,
        data: base64,
        encoding: 'base64',
        success: () => {
          this.saveToAlbum(filePath);
        },
        fail: (err) => {
          wx.showToast({ title: '保存失败: ' + err.errMsg, icon: 'none' });
        }
      });
    } else {
      // HTTP URL：先下载为本地文件
      wx.downloadFile({
        url: src,
        success: (res) => {
          if (res.statusCode === 200) {
            this.saveToAlbum(res.tempFilePath);
          } else {
            wx.showToast({ title: '下载失败', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.showToast({ title: '下载失败: ' + err.errMsg, icon: 'none' });
        }
      });
    }
  },

  saveToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
          wx.showModal({
            title: '需要相册权限',
            content: '保存图片需要授权访问您的相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  /* ================= 复制提示词 ================= */
  copyPrompt(e) {
    const prompt = e.currentTarget.dataset.prompt;
    if (!prompt) return;
    wx.setClipboardData({
      data: prompt,
      success: () => {
        wx.showToast({ title: '提示词已复制', icon: 'success' });
      }
    });
  },

  /* ================= 重用提示词 ================= */
  reusePrompt(e) {
    const prompt = e.currentTarget.dataset.prompt;
    if (!prompt) return;
    this.setData({ prompt });
    this.saveConfigToStorage();
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    wx.showToast({ title: '提示词已填入', icon: 'success' });
  },

  /* ================= 历史记录 ================= */
  addToHistory(images, meta) {
    let history = storage.getJSON(storage.STORAGE_KEYS.HISTORY, []);
    // 生成卡片数据
    const cards = images.map((src, i) => ({ src, meta, index: i, unique: Date.now() + '-' + i }));
    history = [...cards, ...history].slice(0, 60); // 最多保留 60 项
    storage.setJSON(storage.STORAGE_KEYS.HISTORY, history);
    this.setData({ history });
  },

  renderHistory() {
    const history = storage.getJSON(storage.STORAGE_KEYS.HISTORY, []);
    this.setData({ history });
  },

  clearHistory() {
    if (this.data.history.length === 0) {
      wx.showToast({ title: '没有历史记录', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有历史记录？',
      success: (res) => {
        if (res.confirm) {
          storage.setJSON(storage.STORAGE_KEYS.HISTORY, []);
          this.setData({ history: [] });
          wx.showToast({ title: '历史已清空', icon: 'success' });
        }
      }
    });
  },

  /* ================= 页面触底加载更多 ================= */
  onReachBottom() {
    // 预留扩展
  }
});
