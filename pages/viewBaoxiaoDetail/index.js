import { formatNumber, request } from "../../util/getErrorMessage";
import '../../util/handleLodash';
import { cloneDeep as clone } from 'lodash';
const app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    baoxiaoDetail: null,
    noticeHidden: true
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    tt.getStorage({
      key: 'baoxiaoDetail',
      success: res => {
        const baoxiaoDetail = clone(res.data);
        this.setData({
          noticeHidden: baoxiaoDetail.invoiceType == 2 ? false : true
        });
        this.setData({
          baoxiaoDetail
        });
        tt.removeStorage({
          key: 'baoxiaoDetail',
          success: res => {
            console.log('删除查看报销详情成功....');
          }
        });
      }
    });
  },

  openExtraInfo(e) {
    const extraMessage = this.data.baoxiaoDetail.extraMessage;
    const subjectExtraConf = this.data.baoxiaoDetail.subjectExtraConf;
    console.log(subjectExtraConf, 'subjectExtraConf');
    const applicationAmount = this.data.baoxiaoDetail.applicationAmount;
    tt.setStorage({
      key: 'extraObj',
      data: {
        extraMessage,
        subjectExtraConf,
        applicationAmount
      },
      success: res => {
        tt.navigateTo({
          url: '/pages/viewExtra/index'
        });
      }
    });
  }

});