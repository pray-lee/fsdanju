import moment from "moment";
import '../../util/handleLodash'
import { cloneDeep as clone } from 'lodash';
import { getErrorMessage, submitSuccess, formatNumber, validFn, request } from "../../util/getErrorMessage";
var app = getApp();
app.globalData.loadingCount = 0;
Page({
  data: {
    isPhoneXSeries: false,
    process: null,
    result: null
  },

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

    if (app.globalData.loadingCount <= 0) {
      tt.hideLoading();
    }
  },

  onLoad(query) {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    this.addLoading();
    const id = query.id;
    request({
      hideLoading: this.hideLoading(),
      url: app.globalData.url + 'paymentBillController.do?getDetail&id=' + id,
      method: 'GET',
      success: res => {
        if (res.data.obj) {
          const result = clone(res.data.obj);
          console.log(result, 'result');
          result.applicationAmount = formatNumber(Number(result.applicationAmount).toFixed(2));
          result.verificationAmount = formatNumber(Number(result.verificationAmount).toFixed(2));
          result.totalAmount = formatNumber(Number(result.totalAmount).toFixed(2));
          result.businessDateTime = result.businessDateTime.split(' ')[0];
          result.billDetailList.forEach(item => {
            item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2));

            if (item.subject.fullSubjectName.indexOf('_') !== -1) {
              item.subjectName = item.subject.fullSubjectName.split('_')[item.subject.fullSubjectName.split('_').length - 1];
            } else {
              item.subjectName = item.subject.fullSubjectName;
            }
          });
          this.setData({
            result
          });
          this.getProcessInstance(result.id, result.accountbookId);
        }
      }
    });
  },

  previewFile(e) {
    var url = e.currentTarget.dataset.url;
    tt.previewImage({
      urls: [url]
    });
  },

  onHide() {},

  getProcessInstance(billId, accountbookId) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'feishuController.do?getProcessinstanceJson&billType=9&billId=' + billId + '&accountbookId=' + accountbookId,
      method: 'GET',
      success: res => {
        console.log(res, '审批流');

        if (res.data && res.data.length) {
          const {
            operationRecords,
            ccUserids
          } = res.data[0]; // 抄送人

          let cc = [];

          if (ccUserids && ccUserids.length) {
            cc = ccUserids.map(item => {
              return {
                userName: item.split(',')[0],
                realName: item.split(',')[0].length > 1 ? item.split(',')[0].slice(-2) : item.split(',')[0],
                avatar: item.split(',')[1]
              };
            });
          }

          const operationArr = operationRecords.filter(item => {
            item.userName = item.userid.split(',')[0];
            item.avatar = item.userid.split(',')[1]; // if(item.operationType === 'START_PROCESS_INSTANCE') {
            //     item.operationName = '发起审批'
            // } else if(item.operationType !== 'NONE') {
            //     item.operationName = '审批人'
            // }

            if (item.operationResult == 1) {
              item.resultName = '（审批中）';
            } else if (item.operationResult == 2) {
              item.resultName = '（已同意）';
            } else if (item.operationResult == 3) {
              item.resultName = '（已驳回）';
            } else {
              item.resultName = '（已转审）';
            }

            return item;
          });
          this.setData({
            process: {
              operationRecords: operationArr,
              cc
            }
          });
        }
      }
    });
  },

  showFukuanDetail(e) {
    const index = e.currentTarget.dataset.index;
    const tempData = clone(this.data.result.billDetailList[index]);
    console.log(tempData, 'viewFukuan');
    tt.setStorage({
      key: 'fukuanDetail',
      data: tempData,
      success: res => {
        tt.navigateTo({
          url: '/pages/viewFukuanDetail/index'
        });
      }
    });
  }

});