import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
const app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    kaipiaoDetail: null
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    tt.getStorage({
      key: 'kaipiaoDetail',
      success: res => {
        const kaipiaoDetail = clone(res.data);
        console.log(kaipiaoDetail, '..........');
        this.setData({
          kaipiaoDetail
        });
        tt.removeStorage({
          key: 'kaipiaoDetail',
          success: res => {
            console.log('删除查看开票详情成功....');
          }
        });
      }
    });
  }

});