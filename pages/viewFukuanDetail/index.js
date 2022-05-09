import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
const app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    btnHidden: false,
    fukuanDetail: {}
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    const fukuanDetail = tt.getStorageSync('fukuanDetail');
    this.setData({
      fukuanDetail
    });
    tt.removeStorage({
      key: 'fukuanDetail',
      success: res => {
        console.log('删除查看付款详情成功....');
      }
    });
  },

  onShow() {},

  addLoading() {
    if (app.globalData.loadingCount < 1) {
      tt.showLoading({
        content: '加载中...'
      });
    }

    app.globalData.loadingCount++;
  },

  hideLoading() {
    app.globalData.loadingCount--;

    if (app.globalData.loadingCount === 0) {
      tt.hideLoading();
    }
  },

  onKeyboardShow() {
    this.setData({
      btnHidden: true
    });
  },

  onKeyboardHide() {
    this.setData({
      btnHidden: false
    });
  }

});