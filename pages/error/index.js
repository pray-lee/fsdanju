Page({
  data: {
    errorData: {
      type: 'empty',
      title: '什么都没有了',
      button: '返回',
      onButtbindtap: 'handleBack',
      href: '/pages/index/index'
    }
  },

  handleBack() {
    tt.reLaunch({
      url: '/pages/index/index'
    });
  },

  handleErrorButtbindtap(e) {
    const {
      dataset
    } = e.currentTarget;

    if (dataset.href) {
      tt.redirectTo({
        url: dataset.href
      });
    } else {
      console.warn('no href specified');
    }
  }

});