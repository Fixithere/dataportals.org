var request = require('request');
var recline = require('../public/vendor/backend.gdocs.js');
var marked = require('marked');

var Catalog = function() {
  this._cache = {};
  this._groups = {};
};

Catalog.prototype.clear = function() {
  this._cache = {};
  this._groups = {};
};

Catalog.prototype.load = function(catalogs) {
  var that = this;
  for (idx in catalogs) {
    var dp = catalogs[idx];
    dp.id = dp.name;
    dp.description_html = marked(dp.description);
    dp.tags = dp.tags || '';
    dp.tags = dp.tags.replace(/^\s+|\s+$/g, '');
    dp.tags = dp.tags ? dp.tags.split(' ') : [];
    dp.groups = dp.groups || '';
    dp.groups = dp.groups.replace(/^\s+|\s+$/g, '');
    dp.groups = dp.groups ? dp.groups.split(' ') : [];
    dp.groups.forEach(function(groupName) {
      if (groupName in that._groups) {
        var out = that._groups[groupName];
        out.push(dp.id);
        that._groups[groupName] = out;
      } else {
        that._groups[groupName] = [dp.id];
      }
    });
    that._cache[dp.id] = dp;
  }
  that.total = catalogs.length;
}

// Load catalog from a google spreadsheet
Catalog.prototype.loadUrl = function(url, cb) {
  var that = this;
  var urls = recline.Backend.GDocs.getGDocsApiUrls(url);
  request(urls.worksheetAPI, function(err, res, body) {
    if (err) {
      cb(err);
    } else {
      try {
        var data = JSON.parse(body);
      } catch(e) {
        console.log(urls.worksheetAPI);
        console.log(body);
        throw(e);
      }
      data = recline.Backend.GDocs.parseData(data);
      that.load(data.records);
      cb();
    }
  });
}

Catalog.prototype.get = function(id) {
  return this._cache[id];
}

Catalog.prototype.getGroup = function(group) {
  var that = this;
  return this._groups[group].map(function(catalogId) {
    return that.get(catalogId);
  });
}

Catalog.prototype.getGroups = function() {
  return this._groups;
}

Catalog.prototype.query = function(q) {
  var that = this;
  // TODO: actual search
  return Object.keys(this._cache).map(function(key) {
    return that._cache[key];
  });
}

exports.Catalog = Catalog;
// singleton catalog
exports.catalog = new Catalog();

