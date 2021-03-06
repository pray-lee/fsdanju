import '../../util/handleLodash'
import { cloneDeep as clone } from "lodash";
import { getErrorMessage, submitSuccess, formatNumber, request } from "../../util/getErrorMessage";
import moment from "moment";
var app = getApp();
app.globalData.loadingCount = 0;
Page({
  data: {
    billId: '',
    isPhoneXSeries: false,
    process: null,
    type: '',
    btnHidden: false,
    accountbookIndex: 0,
    accountbookList: [],
    departmentIndex: 0,
    departmentList: [],
    customerList: [],
    customerDetail: {},
    taxRateIndex: 0,
    taxRateArr: [],
    deliveryMode: 0,
    subjectList: [],
    submitData: {
      id: '',
      invoiceType: 1,
      billFilesObj: [],
      businessDateTime: moment().format('YYYY-MM-DD'),
      amount: 0,
      status: 20,
      remark: '',
      deliveryMode: 0,
      formatAmount: '0.00'
    },
    kaipiaoList: [],
    importList: []
  },

  onRemarkBlur(e) {
    this.setData({
      submitData: { ...this.data.submitData,
        remark: e.detail.value
      }
    });
  },

  setTotalAmount() {
    // 计算一下总价
    let amount = 0;
    this.data.kaipiaoList.forEach(item => {
      amount += Number(item.applicationAmount);
    });
    console.log(amount, 'amount总价');
    this.setData({
      submitData: { ...this.data.submitData,
        formatAmount: formatNumber(amount.toFixed(2)),
        amount: amount
      }
    });
  },

  onBusinessFocus(e) {
    this.setData({
      submitData: { ...this.data.submitData,
        businessDateTime: e.detail.value
      }
    });
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

  formatExpress() {
    const expressInfo = tt.getStorageSync('expressInfo');

    if (!!expressInfo) {
      this.setData({
        submitData: { ...this.data.submitData,
          ...expressInfo
        }
      });
    }
  },

  formSubmit(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      submitData: { ...this.data.submitData,
        status
      }
    }); // 删除辅助核算的信息，然后通过formatSubmitData重新赋值

    Object.keys(this.data.submitData).forEach(item => {
      if (item.indexOf('billDetailList') != -1) {
        delete this.data.submitData[item];
      }
    }); // 处理一下提交格式

    this.formatSubmitData(this.data.kaipiaoList, 'billDetailList');
    this.formatSubmitData(this.data.submitData.billFilesObj, 'billFiles'); // 处理快递信息

    this.formatExpress();
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(this.data);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    this.addLoading();
    var url = '';

    if (this.data.type === 'add') {
      url = app.globalData.url + 'invoicebillController.do?doAdd';
    } else {
      url = app.globalData.url + 'invoicebillController.do?doUpdate';
    } // 处理一下 null 变成字符串的问题


    const submitData = clone(this.data.submitData);

    for (let i in submitData) {
      if (submitData[i] == null) {
        delete submitData[i];
      }
    }

    console.log(submitData, 'submitData');
    request({
      hideLoading: this.hideLoading,
      url,
      method: 'POST',
      data: submitData,
      success: res => {
        if (res.data && typeof res.data == 'string') {
          getErrorMessage(res.data);
        } // 提交成功


        if (res.data.success) {
          submitSuccess();
        }
      },
      fail: res => {
        if (res.data && typeof res.data == 'string') {
          getErrorMessage(res.data);
        }

        console.log(res, 'fail');
      }
    });
  },

  // 把baoxiaoList的数据，重组一下，拼在submitData里提交
  formatSubmitData(array, name) {
    array.forEach((item, index) => {
      Object.keys(item).forEach(keys => {
        if (item[keys] instanceof Array && keys.indexOf('billDetail') !== -1) {
          item[keys].forEach((arrItem, arrIndex) => {
            Object.keys(arrItem).forEach(arrKeys => {
              this.setData({
                submitData: { ...this.data.submitData,
                  [`${name}[${index}].${keys.slice(0, -3)}[${arrIndex}].${arrKeys}`]: arrItem[arrKeys]
                }
              });
            });
          });
        } else {
          this.setData({
            submitData: { ...this.data.submitData,
              [`${name}[${index}].${keys}`]: item[keys]
            }
          });
        }
      });
    });
  },

  bindObjPickerChange(e) {
    var name = e.currentTarget.dataset.name;
    var listName = e.currentTarget.dataset.list;
    var value = e.detail.value;
    var index = e.currentTarget.dataset.index; // 设置当前框的值

    this.setData({
      [index]: e.detail.value,
      submitData: { ...this.data.submitData,
        [name]: this.data[listName][value].id
      }
    });

    if (name === 'taxRate') {
      if (this.data[listName][value] != '请选择') {
        this.setData({
          submitData: { ...this.data.submitData,
            taxRate: this.data[listName][value]
          }
        });
      }
    } // --------------------------------------------------------


    if (name === 'accountbookId') {
      this.setData({
        kaipiaoList: [],
        submitData: { ...this.data.submitData,
          taxpayerType: this.data.accountbookList[value].taxpayerType,
          applicationAmount: '',
          totalAmount: '',
          verificationAmount: ''
        }
      });
      this.clearCustomerList();
      this.getDepartmentList(this.data[listName][value].id);
      this.getCustomerList(this.data[listName][value].id);
      this.getTaxRateFromAccountbookId(this.data[listName][value].id);
      this.getRemarks(this.data[listName][value].id);
      this.setTotalAmount();
    }

    if (name === 'submitterDepartmentId') {
      // 重新获取科目以后，就要置空开票列表
      this.setData({
        kaipiaoList: [],
        submitData: { ...this.data.submitData,
          applicationAmount: '',
          totalAmount: '',
          verificationAmount: ''
        }
      });
      this.getSubjectList(this.data.submitData.accountbookId, this.data[listName][value].id);
      this.setTotalAmount();
    }
  },

  // 获取开票内容
  getRemarks(accountbookId) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading(),
      method: 'GET',
      url: app.globalData.url + 'invoicebillDetailController.do?findRemark&accountbookId=' + accountbookId,
      success: res => {
        const remarks = res.data.obj.map(item => ({
          id: item.id,
          remark: item.remark
        }));
        remarks.unshift({
          id: '',
          remark: '请选择'
        });
        tt.setStorage({
          key: 'remarks',
          data: remarks
        });
      }
    });
  },

  // 组成初始详情数据
  generateBaseDetail() {
    if (this.data.subjectList.length) {
      var subjectList = clone(this.data.subjectList);
      var obj = {
        subjectList: subjectList,
        selectedAuxpty: null,
        allAuxptyList: {},
        accountbookId: this.data.submitData.accountbookId,
        submitterDepartmentId: this.data.submitData.submitterDepartmentId,
        applicationAmount: '',
        remarkIndex: 0
      };
    }

    return obj;
  },

  // 请求编辑回显数据
  getEditData(id) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'invoicebillController.do?getDetail&id=' + id,
      method: 'GET',
      dataType: 'json',
      success: res => {
        if (res.data.obj) {
          this.setRenderData(res.data.obj);
        }
      }
    });
  },

  // 回显数据设置
  setRenderData(data) {
    // 请求
    this.getAccountbookList(data); //fileList

    if (data.billFiles.length) {
      var billFilesObj = data.billFiles.map(item => {
        return item;
      });
    } // customerDetail


    if (data.customerDetailEntity && data.customerDetailEntity.customer) {
      var customerDetail = {
        id: data.customerDetailEntity.id,
        bankAccount: data.customerDetailEntity.customer.bankAccount,
        bankName: data.customerDetailEntity.customer.bankName,
        customerName: data.customerDetailEntity.customer.customerName,
        taxCode: data.customerDetailEntity.customer.taxCode,
        invoiceAddress: data.customerDetailEntity.customer.invoiceAddress,
        invoicePhone: data.customerDetailEntity.customer.invoicePhone,
        invoiceType: data.customerDetailEntity.customer.invoiceType
      };
    } // 设置数据


    this.setData({ ...this.data,
      customerDetail,
      status: data.status,
      deliveryMode: data.deliveryMode,
      submitData: { ...this.data.submitData,
        id: this.data.billId,
        formatAmount: formatNumber(Number(data.amount).toFixed(2)),
        amount: data.amount,
        billFilesObj: billFilesObj || [],
        customerDetailId: data.customerDetailEntity ? data.customerDetailEntity.id : '',
        submitDate: moment().format('YYYY-MM-DD'),
        businessDateTime: data.businessDateTime.split(' ')[0],
        status: data.status,
        accountbookId: data.accountbookId,
        billCode: data.billCode,
        remark: data.remark,
        deliveryMode: data.deliveryMode,
        invoiceType: customerDetail.invoiceType || 1,
        contacts: data.contacts ? data.contacts : null,
        telephone: data.telephone ? data.telephone : null,
        address: data.address ? data.address : null
      }
    });
  },

  onAddKaipiao() {
    var obj = this.generateBaseDetail();

    if (!!obj) {
      tt.setStorage({
        key: 'initKaipiaoDetail',
        data: obj,
        success: res => {
          tt.navigateTo({
            url: '/pages/kaipiaoDetail/index'
          });
        }
      });
    } else {
      tt.showModal({
        content: '当前部门没有可用的开票类型',
        confirmText: '好的',
        showCancel: false,
        success: () => {//
        }
      });
    }
  },

  clearCustomerList() {
    this.setData({
      customerList: [],
      customerDetail: {},
      submitData: { ...this.data.submitData,
        invoiceType: 1
      }
    });
  },

  invoiceTypeChange(e) {
    tt.showModal({
      title: '温馨提示',
      content: '修改此项会清除导入的单据，是否继续',
      confirmText: '是',
      cancelText: '否',
      success: result => {
        if (result.confirm) {
          // 清除导入单据
          const newList = this.data.kaipiaoList.filter(item => !item.billId);
          this.setData({
            kaipiaoList: newList
          });
        } else {
          this.setData({
            submitData: { ...this.data.submitData,
              invoiceType: this.data.submitData.invoiceType == 1 ? 2 : 1
            }
          });
        }
      }
    });
    this.setData({
      submitData: { ...this.data.submitData,
        invoiceType: e.detail.value
      }
    });
  },

  radioChange(e) {
    if (e.detail.value == 1) {
      // 去快递页面选择
      this.setData({
        deliveryMode: 1,
        submitData: { ...this.data.submitData,
          deliveryMode: 1
        }
      }); // 获取快递信息

      this.getExpressList();
    } else {
      // 自取
      this.setData({
        deliveryMode: 0,
        submitData: { ...this.data.submitData,
          deliveryMode: 0
        }
      });
      this.setData({
        submitData: { ...this.data.submitData,
          contacts: null,
          telephone: null,
          address: null
        }
      });
    }
  },

  getExpressList() {
    tt.setStorageSync('customerDetailId', this.data.customerDetail.id);
    tt.navigateTo({
      url: '/pages/express/index'
    });
  },

  goUpdateCustomer() {
    tt.setStorageSync("updateCustomerDetailData", this.data.customerDetail);
    tt.navigateTo({
      url: '/pages/updateCustomerInfo/index'
    });
  },

  goKaipiaoDetail() {
    tt.navigateTo({
      url: '/pages/kaipiaoDetail/index'
    });
  },

  goYingshouList() {
    if (!this.data.customerDetail.id) {
      tt.showModal({
        content: '请选择客户',
        confirmText: '好的',
        showCancel: false
      });
      return;
    }

    if (this.data.taxRateIndex == 0) {
      tt.showModal({
        content: '请选择税率',
        confirmText: '好的',
        showCancel: false
      });
      return;
    }

    this.addLoading();
    request({
      url: app.globalData.url + 'receivableBillController.do?datagrid&customerDetailId=' + this.data.customerDetail.id + '&taxRate=' + this.data.taxRateArr[this.data.taxRateIndex] + '&invoiceType=' + this.data.submitData.invoiceType + '&query=import&field=id,receivablebillCode,accountbookId,accountbookEntity.accountbookName,submitterId,user.realName,submitterDepartmentId,departDetailEntity.depart.departName,customerDetailId,customerDetailEntity.customer.customerName,invoiceType,subjectId,trueSubjectId,subjectEntity.fullSubjectName,trueSubjectEntity.fullSubjectName,auxpropertyNames,taxRate,amount,unverifyAmount,submitDateTime,businessDateTime,remark,',
      method: 'GET',
      success: res => {
        if (res.data.rows.length) {
          tt.setStorage({
            key: 'tempImportList',
            data: res.data.rows,
            success: () => {
              this.hideLoading();
              tt.navigateTo({
                url: '/pages/importYingshouList/index'
              });
            }
          });
        } else {
          this.hideLoading();
          tt.showModal({
            content: '暂无应收单',
            confirmText: '好的',
            showCancel: false,
            success: () => {}
          });
        }
      },
      fail: err => {
        console.log(app.globalData.url + 'receivableBillController.do?datagrid&customerDetailId=' + this.data.customerDetail.id + '&taxRate=' + this.data.taxRateArr[this.data.taxRateIndex] + '&invoiceType=' + this.data.submitData.invoiceType + '&query=import&field=id,receivablebillCode,accountbookId,accountbookEntity.accountbookName,submitterId,user.realName,submitterDepartmentId,departDetailEntity.depart.departName,customerDetailId,customerDetailEntity.customer.customerName,invoiceType,subjectId,trueSubjectId,subjectEntity.fullSubjectName,trueSubjectEntity.fullSubjectName,auxpropertyNames,taxRate,amount,unverifyAmount,submitDateTime,businessDateTime,remark,');
        console.log('failed', err);
      }
    });
  },

  onHide() {},

  getKaipiaoDetailFromStorage() {
    const index = tt.getStorageSync('index');
    console.log(index, 'index');
    this.setData({
      submitData: { ...this.data.submitData
      }
    });
    tt.getStorage({
      key: 'newKaipiaoDetailArr',
      success: res => {
        const kaipiaoDetail = res.data;
        console.log(kaipiaoDetail, 'kaipiaoDetail..........');

        if (!!kaipiaoDetail) {
          let kaipiaoList = clone(this.data.kaipiaoList);

          if (!!index || index === 0) {
            kaipiaoList.splice(index, 1);
            tt.removeStorage({
              key: 'index',
              success: res => {
                console.log('清除index成功');
              }
            });
            kaipiaoList.splice(index, 0, kaipiaoDetail[0]);
            kaipiaoList = kaipiaoList.concat(kaipiaoDetail.slice(1));
            this.setData({
              kaipiaoList: kaipiaoList
            });
          } else {
            this.setData({
              kaipiaoList: kaipiaoList.concat(kaipiaoDetail)
            });
          } // 处理一下科目名称显示


          const tempList = this.data.kaipiaoList.map(item => ({ ...item,
            subjectName: item.subjectName.indexOf('_') != -1 ? item.subjectName.split('_')[item.subjectName.split('_').length - 1] : item.subjectName
          }));
          this.setData({
            kaipiaoList: tempList
          });
          this.setTotalAmount();
          tt.removeStorage({
            key: 'newKaipiaoDetailArr',
            success: res => {
              console.log('清除newkaipiaoDetailArr成功...');
            }
          });
        }

        this.handleBillId();
      }
    });
  },

  handleBillId() {
    // 特殊处理, 如果billId是null,不传
    const kaipiaoList = this.data.kaipiaoList.map(item => {
      if (item.billId == null) {
        delete item['billId'];
      }

      return item;
    });
    this.setData({
      kaipiaoList
    });
  },

  getImportYingshouList() {
    const importList = tt.getStorageSync('importCommonList');
    console.log(importList, 'importList');

    if (!!importList && importList.length) {
      importList.forEach(item => {
        item.subjectName = item.subjectName.indexOf('_') != -1 ? item.subjectName.split('_')[item.subjectName.split('_').length - 1] : item.subjectName;
      }); // 之前导入的单据

      let oldList = this.data.kaipiaoList.concat();

      if (oldList.length) {
        for (let i = 0; i < importList.length; i++) {
          if (oldList.every(item => item.billId !== importList[i].billId)) {
            oldList.push(importList[i]);
          } else {
            oldList = oldList.map(item => {
              if (item.billId === importList[i].billId) {
                return Object.assign({}, item, importList[i]);
              } else {
                return item;
              }
            });
          } // 数据组合


          this.setData({
            kaipiaoList: oldList
          });
        }
      } else {
        this.setData({
          kaipiaoList: oldList.concat(importList)
        });
      }

      this.setTotalAmount();
      tt.removeStorageSync('importCommonList');
    }
  },

  onShow() {
    this.getCustomerDetailFromStorage();
    this.getUpdatedCustomerFromStorage();
    this.getExpressInfoFromStorage(); // 从缓存里获取baoxiaoDetail

    this.getKaipiaoDetailFromStorage(); // 从缓存里获取导入应收单

    setTimeout(() => {
      this.getImportYingshouList();
    }, 100);
  },

  // 删除得时候把submitData里面之前存的报销列表数据清空
  clearListSubmitData(submitData) {
    Object.keys(submitData).forEach(key => {
      if (key.indexOf('billDetailList') != -1) {
        delete submitData[key];
      }
    });
  },

  // 删除得时候把submitData里面之前存的报销列表数据清空
  clearFileList(submitData) {
    Object.keys(submitData).forEach(key => {
      if (key.indexOf('billFiles') != -1) {
        delete submitData[key];
      }
    });
  },

  deleteFile(e) {
    var file = e.currentTarget.dataset.file;
    var fileList = this.data.submitData.billFilesObj.filter(item => {
      return item.name !== file;
    });
    this.clearFileList(this.data.submitData);
    this.setData({
      submitData: { ...this.data.submitData,
        billFilesObj: fileList
      }
    });
  },

  handleUpload() {
    tt.chooseImage({
      count: 9,
      success: res => {
        this.uploadFile(res.tempFilePaths);
      },
      fail: res => {
        console.log('用户取消操作');
      }
    });
  },

  /**
   *
   * @param 上传图片字符串列表
   */
  uploadFile(array) {
    console.log(array, 'array');

    if (array.length) {
      let promiseList = [];
      array.forEach(item => {
        promiseList.push(new Promise((resolve, reject) => {
          this.addLoading();
          tt.uploadFile({
            url: app.globalData.url + 'aliyunController/uploadImages.do',
            name: item,
            filePath: item,
            formData: {
              accountbookId: this.data.submitData.accountbookId,
              submitterDepartmentId: this.data.submitData.submitterDepartmentId
            },
            success: res => {
              const result = JSON.parse(res.data);
              console.log(result);

              if (result.obj && result.obj.length) {
                const file = result.obj[0];
                resolve(file);
              } else {
                reject('上传失败');
              }
            },
            fail: res => {
              reject(res);
            },
            complete: res => {
              this.hideLoading();
            }
          });
        }));
      });
      Promise.all(promiseList).then(res => {
        // 提交成功的处理逻辑
        var billFilesList = [];
        res.forEach(item => {
          billFilesList.push(item);
        });
        this.setData({
          submitData: { ...this.data.submitData,
            billFilesObj: this.data.submitData.billFilesObj.concat(billFilesList)
          }
        });
      }).catch(error => {
        console.log(error, 'catch');
        tt.showModal({
          content: '上传失败',
          confirmText: '好的',
          showCancel: false,
          success: res => {
            console.log(res, '上传失败');
          }
        });
      });
    }
  },

  previewFile(e) {
    var url = e.currentTarget.dataset.url;
    tt.previewImage({
      urls: [url]
    });
  },

  onLoad(query) {
    app.globalData.loadingCount = 0;
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries,
      submitData: { ...this.data.submitData
      }
    });
    var type = query.type;
    this.setData({
      type
    });
    var id = query.id;
    this.setData({
      billId: id
    }); // 获取账簿列表

    if (type === 'add') {
      this.getAccountbookList();
    }

    if (type === 'edit') {
      // 渲染
      this.getEditData(id);
    }
  },

  getAccountbookList(data) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'accountbookController.do?getAccountbooksJsonByUserId&appId=' + app.globalData.appId,
      method: 'GET',
      success: res => {
        if (res.data.success && res.data.obj.length) {
          var accountbookIndex = 0;
          var accountbookId = !!data ? data.accountbookId : res.data.obj[0].id;
          const accountbookList = res.data.obj;

          if (accountbookId) {
            accountbookList.forEach((item, index) => {
              if (item.id === accountbookId) {
                accountbookIndex = index;
              }
            });
          }

          this.setData({
            accountbookList,
            accountbookIndex: accountbookIndex,
            submitData: { ...this.data.submitData,
              accountbookId
            }
          });
          var submitterDepartmentId = data ? data.submitterDepartmentId : '';
          var subjectId = data ? data.subjectId : '';
          var billDetailList = data ? data.billDetailList : [];
          this.getDepartmentList(accountbookId, submitterDepartmentId, billDetailList);
          this.getCustomerList(accountbookId);
          const taxRate = data ? data.taxRate : null;
          this.getTaxRateFromAccountbookId(accountbookId, taxRate);
          this.getRemarks(accountbookId);
        }
      }
    });
  },

  // 获取申请部门
  getDepartmentList(accountbookId, departmentId, billDetailList) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'newDepartController.do?departsJson&accountbookId=' + accountbookId,
      method: 'GET',
      success: res => {
        if (res.data && res.data.length) {
          var arr = res.data.map(item => {
            return {
              id: item.departDetail.id,
              name: item.departDetail.depart.departName
            };
          }); // edit 的时候设置departmentIndex

          var departmentIndex = 0;
          var submitterDepartmentId = !!departmentId ? departmentId : arr[0].id;

          if (submitterDepartmentId) {
            arr.forEach((item, index) => {
              if (item.id === submitterDepartmentId) {
                departmentIndex = index;
              }
            });
          }

          this.setData({
            departmentList: arr,
            departmentIndex: departmentIndex,
            submitData: { ...this.data.submitData,
              submitterDepartmentId
            }
          });
          this.getSubjectList(accountbookId, submitterDepartmentId, billDetailList);
        } else {
          tt.showModal({
            content: '当前用户未设置部门或者所属部门已禁用',
            confirmText: '好的',
            showCancel: false,
            success: res => {
              tt.reLaunch({
                url: '/pages/index/index'
              });
            }
          });
        }
      }
    });
  },

  // 获取科目类型
  getSubjectList(accountbookId, departId, billDetailList) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading,
      url: app.globalData.url + 'subjectController.do?combotree&accountbookId=' + accountbookId + '&departId=' + departId + '&billTypeId=5&findAll=false',
      method: 'GET',
      success: res => {
        var arr = [];

        if (res.data.length) {
          res.data.forEach(item => {
            if (!item.childrenCount) {
              arr.push({
                id: item.id,
                name: item.text
              });
            }
          }); // 写入缓存

          tt.setStorage({
            key: 'subjectList',
            data: arr,
            success: res => {
              console.log('写入科目成功....');
            }
          });
          this.setData({
            subjectList: arr
          }); // billDetailList

          if (billDetailList && billDetailList.length) {
            var kaipiaoList = billDetailList.map(item => {
              var obj = {};
              var subjectId = item.subjectId;
              obj.accountbookId = accountbookId;

              if (item.billId) {
                obj.billId = item.billId;
              }

              obj.receivablebillCode = item.invoicebillDetailCode;
              obj.subjectId = item.subjectId;
              obj.subjectName = item.subjectEntity.fullSubjectName.indexOf('_') != -1 ? item.subjectEntity.fullSubjectName.split('_')[item.subjectEntity.fullSubjectName.split('_').length - 1] : item.subjectEntity.fullSubjectName;
              obj.trueSubjectId = item.trueSubjectId;
              obj.trueSubjectName = item.subjectEntity.trueSubjectName;
              obj.applicationAmount = item.applicationAmount;
              obj.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2)); // 用户之前有的辅助核算项

              const auxptyObj = item.billDetailApEntityList.map(auxptyItem => {
                return {
                  auxptyId: auxptyItem.auxptyId,
                  auxptyDetailId: auxptyItem.auxptyDetailId,
                  auxptyDetailName: auxptyItem.auxptyDetailName
                };
              });
              const billDetailApEntityObj = {};
              auxptyObj.forEach(item => {
                billDetailApEntityObj[item.auxptyId] = {
                  auxptyId: item.auxptyId,
                  id: item.auxptyDetailId,
                  name: item.auxptyDetailName
                };
              });
              obj.selectedAuxpty = billDetailApEntityObj;
              obj.billDetailApEntityListObj = auxptyObj;
              obj.allAuxptyList = {};

              if (item.subjectEntity.subjectAuxptyList && item.subjectEntity.subjectAuxptyList.length) {
                obj.subjectAuxptyList = item.subjectEntity.subjectAuxptyList.map(item => {
                  return {
                    auxptyId: item.auxptyId,
                    auxptyName: item.auxpropertyConfig.auxptyName
                  };
                });
              }

              obj.remark = item.remark;
              obj.id = item.id;
              return obj;
            });
            this.setData({
              kaipiaoList
            });
          }
        } else {
          // 写入缓存
          tt.setStorage({
            key: 'subjectList',
            data: [],
            success: res => {
              console.log('写入科目成功....');
            }
          });
        }
      }
    });
  },

  // 获取客户信息
  getCustomerList(accountbookId) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading(),
      url: app.globalData.url + 'customerDetailController.do?json&accountbook.id=' + accountbookId,
      method: 'GET',
      success: res => {
        console.log(res);

        if (res.statusCode === 200) {
          this.setData({
            customerList: res.data
          });
        }
      }
    });
  },

  goCustomerList() {
    this.addLoading();
    tt.setStorage({
      key: 'customerList',
      data: this.data.customerList,
      success: () => {
        this.hideLoading();
        tt.navigateTo({
          url: '/pages/customerList/index'
        });
      }
    });
  },

  // 获取选择的客户信息和客户快递列表
  getCustomerDetailFromStorage() {
    const customerDetail = tt.getStorageSync('customerDetail');

    if (!!customerDetail) {
      this.setData({
        customerDetail: customerDetail,
        submitData: { ...this.data.submitData,
          invoiceType: customerDetail.invoiceType,
          customerDetailId: customerDetail.id
        }
      });
      tt.removeStorage({
        key: 'customerDetail',
        success: () => {
          console.log('清除客户缓存...');
        }
      });
    }
  },

  // 获取修改后的客户信息
  getUpdatedCustomerFromStorage() {
    const updatedCustomInfo = tt.getStorageSync('updatedCustomInfo');

    if (updatedCustomInfo) {
      this.setData({
        customerDetail: updatedCustomInfo
      });
    }

    tt.removeStorage({
      key: 'updatedCustomInfo',
      success: () => {
        console.log('清除修改后的客户数据缓存...');
      }
    });
  },

  // 获取用户选择或者修改后的快递信息用于页面渲染
  getExpressInfoFromStorage() {
    let expressInfo = tt.getStorageSync('expressInfo');

    if (expressInfo) {
      delete expressInfo['createDate'];
      delete expressInfo['id'];
      delete expressInfo['updateDate'];
      delete expressInfo['updateTime'];
      delete expressInfo['updateBy'];
      this.setData({
        deliveryMode: 1,
        submitData: { ...this.data.submitData,
          ...expressInfo,
          deliveryMode: 1
        }
      });
      tt.removeStorage({
        key: 'expressInfo',
        success: () => {
          console.log('清除快递信息成功...');
        }
      });
    } else {
      if (!this.data.submitData.contacts && this.data.submitData.contacts != 'null') {
        this.setData({
          deliveryMode: 0,
          submitData: { ...this.data.submitData,
            deliveryMode: 0
          }
        });
      }
    }
  },

  // 获取某个账簿的税率
  getTaxRateFromAccountbookId(accountbookId, taxRate) {
    this.addLoading();
    request({
      hideLoading: this.hideLoading(),
      method: 'GET',
      url: app.globalData.url + 'accountbookController.do?findAccountbookTaxrate&accountbookId=' + accountbookId,
      success: res => {
        if (res.data.success) {
          if (res.data.obj.length) {
            const arr = res.data.obj.map(item => item.taxRate);
            arr.unshift('请选择'); // 如果只有一个税率，默认选中第一个

            if (arr.length <= 2) {
              this.setData({
                taxRateIndex: 1,
                submitData: { ...this.data.submitData,
                  taxRate: arr[1]
                }
              });
            } // 如果是编辑，就不能默认选择


            if (taxRate) {
              arr.forEach((item, index) => {
                if (item == taxRate) {
                  this.setData({
                    taxRateIndex: index
                  });
                }
              });
            }

            this.setData({
              taxRateArr: arr
            });
          }
        }
      }
    });
  },

  // 给导入的数据加上辅助核算的信息
  setImportSelectedAuxptyList(data) {
    const obj = {};
    data.forEach(item => {
      obj[item.auxptyId] = {
        id: item.auxptyDetailId,
        name: item.auxptyDetailName,
        auxptyId: item.auxptyId
      };
    });
    return obj;
  },

  showKaipiaoDetail(e) {
    // 加一个编辑标志
    const index = e.currentTarget.dataset.index; // return

    tt.setStorage({
      key: 'edit',
      data: true,
      success: res => {
        console.log('编辑标志缓存成功...');
      }
    });
    this.addLoading();
    var obj = this.generateBaseDetail();
    tt.setStorage({
      key: 'index',
      data: index,
      success: res => {
        console.log('index设置成功...');
      }
    });
    this.data.kaipiaoList[index].allAuxptyList = {};
    this.data.kaipiaoList[index].remarkIndex = 0;
    console.log(this.data.kaipiaoList[index], '[index]');

    if (!!this.data.kaipiaoList[index].billId && !this.data.kaipiaoList[index].selectedAuxpty) {
      this.addLoading();
      request({
        hideLoading: this.hideLoading,
        url: app.globalData.url + 'receivableBillController.do?getDetail&id=' + this.data.kaipiaoList[index].billId,
        method: 'GET',
        dataType: 'json',
        success: res => {
          console.log(res, '..........res');

          if (res.data.obj) {
            const renderObj = res.data.obj;
            const selectedAuxptyList = this.setImportSelectedAuxptyList(renderObj.billApEntityList);
            this.data.kaipiaoList[index].selectedAuxpty = selectedAuxptyList;
            this.data.kaipiaoList[index].subjectAuxptyList = renderObj.subjectEntity.subjectAuxptyList;
            this.data.kaipiaoList[index].subjectId = renderObj.subjectId;
            this.data.kaipiaoList[index].subjectName = renderObj.subjectEntity.fullSubjectName;
            this.data.kaipiaoList[index].trueSubjectId = renderObj.trueSubjectId;
            this.data.kaipiaoList[index].trueSubjectName = renderObj.trueSubjectEntity.fullSubjectName;
            tt.setStorage({
              key: 'kaipiaoDetail',
              data: this.data.kaipiaoList[index],
              success: res => {
                tt.setStorage({
                  key: 'initKaipiaoDetail',
                  data: obj,
                  success: res => {
                    this.hideLoading();
                    tt.navigateTo({
                      url: '/pages/kaipiaoDetail/index'
                    });
                  }
                });
              }
            });
          }
        }
      });
    } else {
      tt.setStorage({
        key: 'kaipiaoDetail',
        data: this.data.kaipiaoList[index],
        success: res => {
          tt.setStorage({
            key: 'initKaipiaoDetail',
            data: obj,
            success: res => {
              this.hideLoading();
              tt.navigateTo({
                url: '/pages/kaipiaoDetail/index'
              });
            }
          });
        }
      });
    }
  },

  deleteKaipiaoDetail(e) {
    var idx = e.currentTarget.dataset.index;
    var kaipiaoList = this.data.kaipiaoList.filter((item, index) => {
      return idx !== index;
    });
    this.clearListSubmitData(this.data.submitData);
    this.setData({
      kaipiaoList
    });
    this.setTotalAmount();
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

  // 删除单据
  deleteBill() {
    tt.showModal({
      title: '温馨提示',
      content: '确认删除该单据吗?',
      confirmText: '是',
      cancelText: '否',
      success: res => {
        if (res.confirm) {
          this.addLoading();
          request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoicebillController.do?doBatchDel&ids=' + this.data.billId,
            method: 'GET',
            success: res => {
              if (res.data.success) {
                tt.navigateBack({
                  delta: 1
                });
              } else {
                tt.showModal({
                  content: '报销单删除失败',
                  confirmText: '好的',
                  showCancel: false
                });
              }
            }
          });
        }
      }
    });
  }

});