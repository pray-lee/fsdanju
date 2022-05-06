var app = getApp();
Page({
  data: {
    uploadSrc: ''
  },

  onLoad() {
    // web-view init
    this.webViewContext = tt.createWebViewContext('web-view-1');
    tt.httpRequest({
      url: app.globalData.url + 'aliyunController.do?getUUID',
      method: 'GET',
      dataType: 'json',
      success: res => {
        console.log(res);

        if (res.data.success && !!res.data.obj) {
          var uuid = res.data.obj;
          this.setData({
            uploadSrc: app.globalData.url + app.globalData.uploadUrl + uuid
          });
        }
      },
      fail: res => {
        console.log(res, 'error');
        this.hideLoading();
      }
    });
  },

  uploadCallback(data) {
    console.log(data, 'messsage info...');

    if (!!data) {
      // 获取缓存数据
      tt.setStorage({
        key: 'fileList',
        data: data.detail,
        success: () => {
          if (!!data.detail) {
            tt.navigateBack({
              delta: 1
            });
          }
        }
      });
    }
  }

});