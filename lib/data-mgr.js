var path = require('path');
var fs = require('fs');
var Storage = require('./storage');
var util = require('./util');
var eignie = require('./engine');
var VASE_DATA_ROOT = path.join(util.getHomeDir(), '.VaseAppData');
var dataStorage = new Storage(path.join(VASE_DATA_ROOT, 'data'));
var NAME_RE = /^[\w.\-]{1,64}$/;
var ENGINE_LIST = eignie.getEngineList();

function getTplName(name, type) {
  if (ENGINE_LIST.indexOf(type) == -1 || !NAME_RE.test(name)) {
    return;
  }

  return name + '.' + type;
}

function getList() {

  return dataStorage.getFileList().map(function(item) {
    var name = item.name;
    var index = name.lastIndexOf('.');
    var type;
    if (index != -1) {
      type = name.substring(index + 1);
      name = name.substring(0, index);
    }

    return {
      name: name.substring(0, index),
      value: item.data,
      type: type || 'default'
    };
  });
}

// 获取本地 mock 文件
var getMockList = function(vaseId) {
  var rule = vaseId.split(':');
  var mockFilePath = path.resolve(rule[1]);

  try {
    var mockConfig = fs.readFileSync(mockFilePath);
    var mockData = JSON.parse(mockConfig);
    return mockData;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getList: getList,
  getTpl: function(vaseId) {
    var list = getList();
    var _vaseId = vaseId;
    // 如果有冒号分割，说明走本地文件查找
    if (vaseId.indexOf(':') > 0) {
      var rules = vaseId.split(':');
      _vaseId = rules[2];
      list = getMockList(vaseId);
    }

    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (item.name == _vaseId) {
        return item;
      }
    }
  },
  setTplValue: function(item) {
    var name = getTplName(item.name, item.type);
    if (!name || !dataStorage.existsFile(name)) {
      return;
    }

    dataStorage.writeFile(name, item.value);
  },
  addTpl: function(item) {
    var name = getTplName(item.name, item.type);
    if (!name || dataStorage.existsFile(name)) {
      return;
    }

    dataStorage.writeFile(name, typeof item.value === 'string' ? item.value : '');
  },
  editTpl: function(item) {
    var name = getTplName(item.name, item.type);
    var newName = getTplName(item.newName, item.newType);
    if (!name || !newName || !dataStorage.existsFile(name)) {
      return;
    }
    if (dataStorage.getProperty('activeName') == item.name) {
      dataStorage.setProperty('activeName', item.newName);
    }
    dataStorage.renameFile(name, newName);
  },
  removeTpl: function(item) {
    dataStorage.removeFile(getTplName(item.name, item.type));
  },
  getAllNoScriptTpl: function() {

    return [];
  },
  getEngineList: function() {
    return ENGINE_LIST;
  },
  setProperty: function(name, value) {
    dataStorage.setProperty(name, value);
  },
  getProperty: function(name) {
    return dataStorage.getProperty(name);
  }
};

