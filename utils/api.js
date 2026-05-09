// utils/api.js - API 请求封装

/**
 * 调用图像生成 API (JSON body)
 */
function callGenerate(opts) {
  return new Promise((resolve, reject) => {
    const {
      apiBase, apiKey, model, prompt, negPrompt,
      size, n, quality, style, strength, seed,
      protocol, referenceImage, signal
    } = opts;

    const url = protocol === 'custom'
      ? apiBase
      : apiBase + '/images/generations';

    const body = { model, prompt, n, size };
    if (quality) body.quality = quality;
    if (style) body.style = style;
    if (negPrompt) body.negative_prompt = negPrompt;
    if (seed != null) body.seed = seed;
    if (referenceImage) {
      body.image = referenceImage;
      body.strength = strength;
    }
    body.response_format = 'b64_json';

    const requestTask = wx.request({
      url: url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: body,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const errMsg = typeof res.data === 'string'
            ? res.data.slice(0, 300)
            : JSON.stringify(res.data || {}).slice(0, 300);
          reject(new Error(`HTTP ${res.statusCode}: ${errMsg}`));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });

    // 支持 abort
    if (signal) {
      signal._addTask(requestTask);
    }
  });
}

/**
 * 调用 OpenAI 图像编辑 API (multipart/form-data)
 */
function callOpenAIEdit(opts) {
  return new Promise((resolve, reject) => {
    const { apiBase, apiKey, model, prompt, size, n, imagePath, signal } = opts;
    const url = apiBase + '/images/edits';

    const uploadTask = wx.uploadFile({
      url: url,
      filePath: imagePath,
      name: 'image',
      formData: {
        model: model,
        prompt: prompt,
        n: String(n),
        size: size,
        response_format: 'b64_json'
      },
      header: {
        'Authorization': 'Bearer ' + apiKey
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data));
          } catch (e) {
            reject(new Error('解析响应失败: ' + res.data.slice(0, 200)));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data.slice(0, 300)}`));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });

    if (signal) {
      signal._addTask(uploadTask);
    }
  });
}

/**
 * 测试 API 连接
 */
function testConnection(apiBase, apiKey) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiBase + '/models',
      header: {
        'Authorization': 'Bearer ' + apiKey
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '连接失败'));
      }
    });
  });
}

/**
 * 从响应中提取图片列表
 */
function extractImages(data) {
  const results = [];
  const candidates = data.data || data.images || data.output || data.result || [];
  const arr = Array.isArray(candidates) ? candidates : [candidates];

  for (const item of arr) {
    if (!item) continue;
    if (typeof item === 'string') {
      // 判断是否已经是 data: URL 或 http URL
      if (item.startsWith('data:') || item.startsWith('http')) {
        results.push(item);
      } else {
        // 纯 base64，补上前缀
        results.push('data:image/png;base64,' + item);
      }
    } else if (item.b64_json) {
      results.push('data:image/png;base64,' + item.b64_json);
    } else if (item.url) {
      results.push(item.url);
    } else if (item.image) {
      const i = item.image;
      results.push(
        i.startsWith('data:') || i.startsWith('http')
          ? i
          : 'data:image/png;base64,' + i
      );
    }
  }

  if (!results.length) {
    throw new Error('未能从响应中解析出图片: ' + JSON.stringify(data).slice(0, 300));
  }

  return results;
}

/**
 * 取消令牌 —— 用于中止请求
 */
class AbortSignal {
  constructor() {
    this._aborted = false;
    this._tasks = [];
  }
  _addTask(task) {
    if (this._aborted) {
      task.abort();
    } else {
      this._tasks.push(task);
    }
  }
  abort() {
    this._aborted = true;
    this._tasks.forEach(t => {
      try { t.abort(); } catch (e) { /* ignore */ }
    });
    this._tasks = [];
  }
}

module.exports = {
  callGenerate,
  callOpenAIEdit,
  testConnection,
  extractImages,
  AbortSignal
};
