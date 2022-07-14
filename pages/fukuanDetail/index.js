import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
import { formatNumber, validFn, request } from "../../util/getErrorMessage";
const app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    btnHidden: false,
    fukuanDetail: {},
    // 发票
    maskHidden: true,
    animationInfo: {},
    nosupportInvoiceType: {
      '02': '货运运输业增值税专用发票',
      '03': '机动车销售统一发票',
      '14': '通行费发票',
      '15': '二手车发票',
      '16': '区块链电子发票',
      '21': '全电发票（专用发票）',
      '22': '全电发票（普通发票）',
      '96': '国际小票',
      '85': '可报销其他发票',
      '86': '滴滴出行行程单',
      '87': '完税证明',
      '00': '其他未知票种',
    },
    ocrList: [],
    accountbookId: ''
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    // 发票
    this.getAccountbookId()
  },

  onShow() {
    let fukuanDetail = tt.getStorageSync('fukuanDetail') || this.data.fukuanDetail;
    if (!!fukuanDetail || Object.keys(this.data.fukuanDetail).length) {
      if(fukuanDetail.unverifyAmount) {
        fukuanDetail.formatUnverifyAmount = formatNumber(Number(fukuanDetail.unverifyAmount).toFixed(2))
      }
      this.setData({
        fukuanDetail
      });
      // 发票
      if(fukuanDetail.ocrList) {
        this.setInvoiceList(fukuanDetail.ocrList)
      }
      if(fukuanDetail.invoiceInfoId && !fukuanDetail.ocrList) {
        this.getInvoiceDetailById(fukuanDetail.invoiceInfoId)
      }
      // =======
      tt.removeStorage({
        key: 'fukuanDetail'
      });
      // =======发票相关==========
      var animation = tt.createAnimation({
        duration: 250,
        timeFunction: 'ease-in'
      })
      this.animation = animation
      this.setData({
        animationInfo: animation.export()
      })
      this.getSelectOcrListFromStorage()
      this.getBillInvoiceDetail()
      this.getOcrListFromListFromStorage()
      this.getInvoiceAccountbookIdFromStorage()
      // =======================
    }
  },

  onKaipiaoBlur(e) {
    var tempData = clone(this.data.fukuanDetail);
    tempData.applicationAmount = e.detail.value;
    tempData['formatApplicationAmount'] = formatNumber(Number(e.detail.value).toFixed(2));
    this.setData({
      fukuanDetail: tempData
    });
  },

  addLoading() {
    if (app.globalData.loadingCount < 1) {
      tt.showLoading({
        title: '加载中...',
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

  submitFukuanDetail() {
    if (Number(this.data.fukuanDetail.applicationAmount) > Number(this.data.fukuanDetail.unverifyAmount)) {
      tt.showModal({
        content: '开票金额不能大于可申请余额',
        confirmText: '好的',
        showCancel: false
      });
      return;
    }

    tt.setStorage({
      key: 'fukuanDetail',
      data: this.data.fukuanDetail,

      success() {
        tt.navigateBack({
          delta: 1
        });
      }

    });
  },

  disabled(e) {
    tt.showModal({
      content: '导入的单据此处不可编辑',
      confirmText: '好的',
      showCancel: false
    });
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
  onAddShow(e) {
    this.addLoading()
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoiceConfigController.do?getInvoiceConfigByAccountbook&accountbookId=' + this.data.accountbookId,
      method: 'GET',
      success: res => {
        if(res.statusCode == 200) {
          if(res.data) {
            this.animation.translateY(0).step()
            this.setData({
              animationInfo: this.animation.export(),
              maskHidden: false
            })
            const index = e.currentTarget.dataset.index
            this.setData({
              invoiceIndex: index
            })
          }else{
            tt.showModal({
              content: '当前组织未开通票据管理',
              confirmText: '好的',
              showCancel: false
            })
          }
        }
      }
    })
  },
  onAddHide() {
    this.animation.translateY('100%').step()
    this.setData({
      animationInfo: this.animation.export(),
      maskHidden: true
    })
  },
  // 发票
  handleUpload() {
    this.goToInvoiceAccountbookList()
  },
  goToInvoiceAccountbookList() {
    this.addLoading()
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoiceConfigController.do?getAccountbookListByUserId&userId=' + app.globalData.applicantId,
      method: 'GET',
      success: res => {
        if (res.statusCode === 200) {
          if(res.data && res.data.length) {
            tt.setStorage({
              key: 'invoiceAccountbookList',
              data: res.data.filter(item => item.id === this.data.accountbookId),
              success: res => {
                tt.navigateTo({
                  url: "/pages/invoiceAccountbookList/index"
                })
              }
            })
          }else{
            tt.showModal({
              content: '当前用户没有开通发票模块',
              confirmText: '好的',
              showCancel: false
            })
          }
        }
      }
    })
  },
  getInvoiceAccountbookIdFromStorage() {
    const accountbookId = tt.getStorageSync('invoiceAccountbookId')
    if(accountbookId) {
      tt.chooseImage({
        count: 9,
        success: res => {
          this.uploadFile(res.tempFilePaths, accountbookId)
        },
        fail: res => {
          console.log('用户取消操作')
        }
      })
      tt.removeStorage({
        key: 'invoiceAccountbookId',
        success: () => {}
      })
    }
  },
  invoiceInput() {
    tt.setStorageSync(
        'fromDetail',
        'fromDetail'
    )
    tt.setStorageSync(
        'accountbookId',
        this.data.accountbookId
    )
    tt.navigateTo({
      url: '/pages/invoiceInput/index'
    })
  },
  invoiceSelect() {
    tt.navigateTo({
      url: '/pages/invoiceListSelect/index?accountbookId=' + this.data.accountbookId
    })
  },
  /**
   *
   * @param 上传图片字符串列表
   */
  uploadFile(array, accountbookId) {
    if (array.length) {
      let promiseList = []
      array.forEach(item => {
        promiseList.push(new Promise((resolve, reject) => {
          this.addLoading()
          tt.uploadFile({
            url: app.globalData.url + 'aliyunController/uploadImages.do',
            name: item,
            filePath: item,
            formData: {
              accountbookId,
              submitterDepartmentId: 'department-invoice'
            },
            success: res => {
              const result = JSON.parse(res.data)
              if (result.obj && result.obj.length) {
                const file = result.obj[0]
                resolve(file)
              } else {
                reject('上传失败')
              }
            },
            fail: res => {
              reject(res)
            },
            complete: res => {
              this.hideLoading()
            }
          })
        }))
      })
      Promise.all(promiseList).then(res => {
        // 提交成功的处理逻辑
        var billFilesList = []
        res.forEach(item => {
          billFilesList.push({
            name: item.name,
            uri: item.uri,
            size: item.size
          })
        })
        this.doOCR(billFilesList, accountbookId)
      }).catch(error => {
        tt.showModal({
          content: '上传失败',
          confirmText: '好的',
          showCancel: false,
          success: res => {
            console.log(res, '上传失败')
          }
        })
      })
    }
  },
  doOCR(fileList, accountbookId) {
    this.addLoading()
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoiceInfoController.do?doOCR',
      data: {
        fileList: JSON.stringify(fileList),
        accountbookId
      },
      method: 'POST',
      success: res => {
        if(res.data.success) {
          if(res.data.obj.length){
            const result = this.hasInvoiceType(res.data.obj)
            // 去发票编辑页面
            if(result) {
              tt.setStorage({
                key: 'ocrList',
                data:res.data.obj,
                success: () => {
                  tt.setStorageSync(
                      'accountbookId',
                      this.data.accountbookId
                  )
                  tt.navigateTo({
                    url: '/pages/invoiceSelect/index?invoiceAccountbookId=' + accountbookId
                  })
                }
              })
            }
          }
        }else{
          tt.showModal({
            content: res.data.msg,
            confirmText: '好的',
            showCancel: false,
          })
        }
      }
    })
  },
  hasInvoiceType(data) {
    var noSupportInvoiceType = data.filter(item => !!this.data.nosupportInvoiceType[item.invoiceType])
    if(noSupportInvoiceType && noSupportInvoiceType.length) {
      tt.showModal({
        content: `暂不支持${this.data.nosupportInvoiceType[noSupportInvoiceType[0].invoiceType]}，请重新上传`,
        confirmText: '好的',
        showCancel: false,
      })
      return false
    }
    return true
  },
  // 从上传识别之后的列表选
  getSelectOcrListFromStorage() {
    const ocrList = tt.getStorageSync('selectOcrList')
    if(ocrList) {
      this.saveInvoice(ocrList)
      tt.removeStorage({
        key: 'selectOcrList',
        success: () => {}
      })
    }
  },
  // 从发票录入选
  getBillInvoiceDetail() {
    const data = tt.getStorageSync('billInvoiceDetail')
    if(data) {
      this.saveInvoice([data])
      tt.removeStorage({
        key: 'billInvoiceDetail',
        success: () => {}
      })
    }
  },
  // 从个人票夹选
  getOcrListFromListFromStorage() {
    const ocrList = tt.getStorageSync('ocrListFromList')
    if(ocrList) {
      const data = clone(this.data.ocrList).concat(ocrList)
      this.setInvoiceList(data)
      this.setInvoiceInFukuanDetail(data)
      tt.removeStorage({
        key: 'ocrListFromList',
        success: () => {}
      })
    }
    this.onAddHide()
  },
  saveInvoice(data) {
    data.forEach(item => {
      if(item.formatJshj) {
        delete item.formatJshj
      }
    })
    // 飞机行程单特殊处理
    data.forEach(item => {
      if(item.invoiceType == '93') {
        if(!item.qtsf) {
          item.qtsf = 0
        }
      }
    })
    this.addLoading()
    this.addSuffix(data)
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoiceInfoController.do?doAddList',
      method: 'POST',
      headers:  {'Content-Type': 'application/json;charset=utf-8'},
      data: JSON.stringify(data),
      success: res => {
        if(res.data.success) {
          const ocrList = clone(this.data.ocrList).concat(res.data.obj)
          this.setInvoiceList(ocrList)
          this.setInvoiceInFukuanDetail(ocrList)
        }else{
          tt.showModal({
            content: res.data.msg,
            confirmText: '好的',
            showCancel: false,
          })
          console.log('发票保存失败')
        }
      },
      fail: res => {
        console.log(res, 'error')
      },
      complete: res => {
        this.onAddHide()
      }
    })
  },
  addSuffix(data) {
    data && data.length && data.forEach(item => {
      Object.keys(item).forEach(key => {
        if(typeof item[key] == 'string' && key == 'kprq' || key == 'rq') {
          if(item[key].indexOf(' ') < 0)
            item[key] = `${item[key]} 00:00:00`
        }
      })
    })
  },
  // 发票
  setInvoiceList(data) {
    if(data && data.length) {
      data.forEach(item => {
        item.formatJshj = formatNumber(Number(item.jshj).toFixed(2))
      })
      this.setData({
        ocrList: data,
        fukuanDetail: {
          ...this.data.fukuanDetail,
          ocrList: data,
        }
      })
    }
  },
  deleteInvoice(e) {
    const index = e.currentTarget.dataset.index
    let list = clone(this.data.ocrList)
    let invoiceInfoId = list[index].id
    list.splice(index, 1)
    this.setData({
      ocrList: list,
      fukuanDetail: {
        ...this.data.fukuanDetail,
        ocrList: list
      }
    })
    this.removeInvoiceInfoId(invoiceInfoId)
    this.setInvoiceApplicationAmount(list)
    this.setInvoiceInFukuanDetail(list)
  },
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
            ocrList: res.data.obj,
            fukuanDetail: {
              ...this.data.fukuanDetail,
              ocrList: res.data.obj,
            }
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
  },
  removeInvoiceInfoId(id) {
    let invoiceInfoId = this.data.fukuanDetail.invoiceInfoId.split(',')
    let newIds = ''
    if(invoiceInfoId.length) {
      let ids = invoiceInfoId.filter(item => item !== id)
      newIds = ids.join(',')
    }
    this.setData({
      fukuanDetail: {
        ...this.data.fukuanDetail,
        invoiceInfoId: newIds
      }
    })
  },
  // 获取账簿id
  getAccountbookId() {
    const accountbookId = tt.getStorageSync('accountbookId')
    this.setData({
      accountbookId
    })
  },
  setInvoiceApplicationAmount(data) {
    // applicationAmount
    let applicationAmount = 0
    data.forEach(item => {
      applicationAmount += parseFloat(item.jshj)
    })
    this.setData({
      fukuanDetail: {
        ...this.data.fukuanDetail,
        applicationAmount,
        formatApplicationAmount: formatNumber(Number(applicationAmount).toFixed(2))
      }
    })
  },
  setInvoiceInFukuanDetail(data) {
    if(data && data.length) {
      this.setInvoiceInfoId(data)
      this.setOtherInvoiceInfo(data)
    }
  },
  setInvoiceInfoId(data) {
    let invoiceInfoId = ''
    data.forEach(item => {
      invoiceInfoId += item.id + ','
    })
    invoiceInfoId = invoiceInfoId.slice(0, -1)
    this.setData({
      fukuanDetail: {
        ...this.data.fukuanDetail,
        invoiceInfoId
      }
    })
  },
  setOtherInvoiceInfo(data) {
    this.setInvoiceApplicationAmount(data)
  },

});