import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
import { formatNumber, request } from "../../util/getErrorMessage";
var app = getApp();
app.globalData.loadingCount = 0;
Page({
  data: {
    // 增加申请人
    realName: '',
    result: null,
    isPhoneXSeries: false
  },

  addLoading() {
    if (app.globalData.loadingCount < 1) {
      tt.showLoading({
        title: '加载中...',
        mask: true,
      });
    }

    app.globalData.loadingCount++;



    },

  hideLoading() {
    app.globalData.loadingCount--;

    if (app.globalData.loadingCount <= 0) {
      tt.hideLoading();
    }
  },

  previewFile(e) {
    var url = e.currentTarget.dataset.url;
    tt.previewImage({
      urls: [url]
    });
  },

  onLoad(query) {
    // 增加申请人
    this.setData({
      realName: app.globalData.realName
    })
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    this.addLoading();
    const id = query.id;
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoicebillController.do?getDetail&id=' + id,
      method: 'GET',
      success: res => {
        if (res.data.obj) {
          console.log(res.data.obj, 'obj');
          const result = clone(res.data.obj);
          result.businessDateTime = result.businessDateTime.split(' ')[0];
          result.billDetailList.forEach(item => {
            item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2));

            if (item.subjectEntity.fullSubjectName.indexOf('_') !== -1) {
              item.subjectName = item.subjectEntity.fullSubjectName.split('_')[item.subjectEntity.fullSubjectName.split('_').length - 1];
            } else {
              item.subjectName = item.subject.fullSubjectName;
            }
          });
          this.setData({
            result
          });
        }
      }
    });
  },

  showKaipiaoDetail(e) {
    const index = e.currentTarget.dataset.index;
    const tempData = clone(this.data.result.billDetailList[index]);
    console.log(tempData, 'viewKaipiao');
    tt.setStorage({
      key: 'kaipiaoDetail',
      data: tempData,
      success: res => {
        tt.navigateTo({
          url: '/pages/viewKaipiaoDetail/index'
        });
      }
    });
  },

  rollBack() { this.addLoading();
    request({
      hideLoading: this.hideLoading(),
      url: app.globalData.url + 'invoicebillController.do?doBatchTemporaryStorage&ids=' + this.data.result.id,
      method: 'GET',
      success: res => {
        if (res.data.success) {
          tt.redirectTo({
            url: `/pages/addKaipiao/index?type=edit&id=${this.data.result.id}`
          });
        } else {
          tt.showModal({
            content: '撤回失败',
            confirmText: '好的',
            showCancel: false
          });
        }
      }
    });
  }

});