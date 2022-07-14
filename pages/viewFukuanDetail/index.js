import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
import {formatNumber, request} from "../../util/getErrorMessage";
const app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    btnHidden: false,
    fukuanDetail: {},
    // 发票
    ocrList: []
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    const fukuanDetail = tt.getStorageSync('fukuanDetail');
    // ==========发票相关=========
    if(fukuanDetail.invoiceInfoId) {
      this.getInvoiceDetailById(fukuanDetail.invoiceInfoId)
    }
    // ==========================
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

  onKeyboardShow() {
    this.setData({
      btnHidden: true
    });
  },

  onKeyboardHide() {
    this.setData({
      btnHidden: false
    });
  },
  // 发票
  getInvoiceDetailById(ids) {
    this.addLoading()
    request({
      hideLoading: this.hideLoading(),
      method: 'GET',
      url: app.globalData.url + 'invoiceInfoController.do?getInvoiceInfoByIds',
      data: {
        ids,
      },
      success: res => {
        if(res.data.success) {
          if(res.data.obj.length) {
            res.data.obj.forEach(item => {
              item.formatJshj = formatNumber(Number(item.jshj).toFixed(2))
            })
          }
          this.setData({
            ocrList: res.data.obj
          })
        }else{
          tt.showModal({
            content: '获取发票详情失败',
            confirmText: '好的',
            showCancel: false,
          })
        }
      },
      fail: err => {
        console.log(err, 'error')
      }
    })
  },
  goToInvoiceDetail(e) {
    const index = e.currentTarget.dataset.index
    tt.setStorage({
      key: 'invoiceDetail',
      data: this.data.ocrList[index],
      success: res => {
        tt.navigateTo({
          url: '/pages/invoiceInput/index'
        })
      }
    })
  }

});