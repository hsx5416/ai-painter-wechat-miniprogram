// app.js
App({
  globalData: {
    theme: 'dark' // dark | light
  },

  onLaunch() {
    // 读取本地存储的主题设置
    const savedTheme = wx.getStorageSync('ai-painter-theme');
    if (savedTheme) {
      this.globalData.theme = savedTheme;
    } else {
      // 跟随系统主题
      const sysInfo = wx.getSystemInfoSync();
      this.globalData.theme = sysInfo.theme || 'dark';
    }
  },

  toggleTheme() {
    const next = this.globalData.theme === 'dark' ? 'light' : 'dark';
    this.globalData.theme = next;
    wx.setStorageSync('ai-painter-theme', next);

    // 更新导航栏颜色
    const navBg = next === 'dark' ? '#0b0d17' : '#f6f7fb';
    const navText = next === 'dark' ? 'white' : 'black';
    wx.setNavigationBarColor({
      frontColor: navText === 'white' ? '#ffffff' : '#000000',
      backgroundColor: navBg
    });
  }
});
