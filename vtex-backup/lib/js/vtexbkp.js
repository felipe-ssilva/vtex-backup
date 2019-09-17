/**
 * @author Cristiano Rodrigues - cristianorsjunior13@hotmail.com
 * @description vtexbkp is a plugin that download all files and templates from a vtex store. 
 * @version 1.2 - templates and subtemplates added
 */

var vtexbkp = function(){

    this.saveArr = [];

    this.reportArr = [];

    this.tplArr = [];

    this.zip = null;

    this.img = null;

    this.js = null;

    this.css = null;

    this.tpl = null;

    this.subTpl = null;

    this.url = "/admin/a/PortalManagement/HandleFileListByType/?siteId=undefined&fileType=";

    this.headers = { "Content-Type": "application/x-www-form-urlencoded" };

    this.formData = "page=1&rp=100&sortname=IdArquivo&sortorder=desc&query=&qtype=Nome";

    this.includeImg = false;

    this.init = function(){
        var _this = this;

        this.zip = new JSZip();
        this.img = this.zip.folder("images");
        this.js = this.zip.folder("js");
        this.css = this.zip.folder("css");
        this.tpl = this.zip.folder("templates");
        this.subTpl = this.zip.folder("subtemplates");

        var urlFile = this.getFileUrl();
        var formData = this.formData;

        window.vtexbkpdown = true;
        window.vtexbkpinfo = {};
        window.vtexbkpinfo.cont = 0;
        window.vtexbkpinfo.total = 0;

        this.includeImg = window.ischecked;

        this.getTotalFilesAndTpls(function(){
            _this.getQtyOfFiles('*', function(total){
                formData = formData.replace("100", total);
                _this.post(_this.url, _this.headers, formData, function(files){
                    _this.handleEachResult(urlFile, files, total);
                });
            });
        });
    };

    this.req = function(url, method, headers, payload, callback){
        $.ajax({
            url: url,
            type: method,
            headers: headers,
            data: payload
        }).done(function(res){
            if(typeof callback == "function") callback(res);
        })
    };

    this.get = function(url, headers, callback) {
        this.req(url, "GET", headers, null, callback);
    };

    this.post = function(url, headers, payload, callback) {
        this.req(url, "POST", headers, payload, callback);
    };

    this.getQtyOfFiles = function(type, callback){
        var _this = this;
        _this.post(_this.url + type, _this.headers, _this.formData, function(files){
            if(typeof callback == "function") callback(files.total);
        });
    };

    this.getQtyOfTemplates = function(isSub, callback){
        var _this = this;
        var subNum = (isSub ? 1 : 0);
        var url = "/admin/a/PortalManagement/GetTemplateList?type=viewTemplate&IsSub=" + subNum;
        this.post(url, null, null, function(data){
            var templateHtml = new DOMParser().parseFromString(data, "text/html");
            var lis = templateHtml.getElementsByTagName('li');
            var len = lis.length;
            callback(len);
        });
    };

    this.getFileUrl = function(){
        return location.origin.replace("commercestable", "img") + "/arquivos/";
    };

    this.getTemplateList = function(isSub, callback){
        var _this = this;
        var subNum = (isSub ? 1 : 0);
        var type = (isSub ? "subtemplate" : "template");
        var url = "/admin/a/PortalManagement/GetTemplateList?type=viewTemplate&IsSub=" + subNum;
        this.post(url, null, null, function(data){

            var cont = 0;

            var templateHtml = new DOMParser().parseFromString(data, "text/html");

            var lis = templateHtml.getElementsByTagName('li');

            var len = lis.length;

            for(var i = 0; i < len; i++){
                var name = lis[i].getElementsByTagName('div')[0].innerHTML; 
                var id = lis[i].getElementsByTagName('a')[0].href.split("=")[1];
                _this.getTemplateFile(name, id, "template", isSub, function(){
                    cont++;
                    if(cont == len - 1){
                        callback();
                    }
                });
            }
        });
    };

    this.getTemplateFile = function(name, id, type, isSub, callback){
        var _this = this;
        var url = "/admin/a/PortalManagement/TemplateContent?templateId=";
        $.ajax({
            url: url + id,
            type: 'POST'
        }).done(function(res){
            var nameFinal = (isSub) ? name + ".sub" : name + ".html";
            _this.saveTempFile(nameFinal, res, null, type);
            callback();
        });
    };

    this.getTotalFilesAndTpls = function(callback){
        var _this = this;
        _this.getQtyOfFiles("*", function(totalFiles){
            _this.getQtyOfTemplates(false, function(totalTpl){
                _this.getQtyOfTemplates(true, function(totalSubTpl){
                    window.vtexbkpinfo.total = totalFiles + totalTpl + totalSubTpl;
                    callback();
                });
            });
        });
    };

    this.showStatus = function(i, total){
        var perc = parseInt((100 * i) / total - 1);
        if(perc % 10 == 0){
            console.info("carregando...", perc + "%");
        }
    };

    this.saveTempFile = function(item, data, urlFile, type){

        var name, linkFile;

        window.vtexbkpinfo.cont++;

        if(type == "template"){

            var tplHTML = new DOMParser().parseFromString(data, 'text/html');
            data = tplHTML.getElementById('template').value;

            name = item;
            linkFile = null;

            window.vtexbkpinfo.status = "baixando template";
            window.vtexbkpinfo.name = name.replace('.sub', '.html');

        }else if(type == "arquivo"){
            if(item.cell[1].indexOf(".") != -1){
                name = item.cell[1];
                linkFile = urlFile + item.cell[1]
            }else{
                name = item.cell[1] + "." + item.cell[2];
                linkFile = urlFile + "/ids/" + item.cell[0] + "/" + name;
            }

            window.vtexbkpinfo.status = "baixando arquivo";
            window.vtexbkpinfo.name = name;
        }

        this.reportArr.push({ "arquivo": name, "link": linkFile });
        this.saveArr.push({ "name": name, "content": data });
    };

    this.handleFinalResult = function(cont, total){
        var _this = this;
        if(cont == total - 1){
            if(this.reportArr.length == 0){
                console.info("Não foram encontrados arquivos ou houve algum erro.");
            }else{
                console.table(this.reportArr);
                this.getTemplateList(false, function(){
                    _this.getTemplateList(true, function(){
                        _this.zipAllFiles();
                    });
                });
            }
        }
    };

    this.handleEachResult = function(urlFile, files, total){
        var _this = this;
        var cont = 0;

        var filesToIterate = null;

        var filesNoImg = files.rows.filter(function(row){
            if(row.cell.length == 3){
                return (row.cell[2] != "png" && row.cell[2] != "gif" && row.cell[2] != "jpg");
            }else {
                return true;
            }
        });

        filesToIterate = ((this.includeImg) ? files.rows : filesNoImg);

        total = filesToIterate.length;

        window.vtexbkpinfo.total = total;

        filesToIterate.map(function(item){ 

            $.ajax({
                url: urlFile + item.cell[1],
                dataType: "text"
            }).done(function(data){
                cont++;

                _this.showStatus(cont, total);

                _this.saveTempFile(item, data, urlFile, "arquivo");

                _this.handleFinalResult(cont, total);
            });
        });
    };

    this.folderFile = function(data, filename){

        var fileArr = filename.split(".");
        var type = fileArr[fileArr.length - 1];

        if(type == "png" || type == "gif" || type == "jpg"){
            this.img.file(filename, data);
        };

        if(type == "js"){
            this.js.file(filename, data);
        };

        if(type == "css"){
            this.css.file(filename, data);
        };

        if(type == "html"){
            this.tpl.file(filename, data);
        };

        if(type == "sub"){
            this.subTpl.file(filename.replace('.sub', '.html'), data);
        }
    };

    this.zipAllFiles = function(){
        var _this = this;
        this.saveArr.forEach(function(file){
            _this.folderFile(file.content, file.name);
        });

        this.zip.generateAsync({type:"blob"}).then(function(content) {
            _this.saveFile(content, location.hostname.split(".")[0] + ".zip");
        });
    };

    this.saveFile = function(data, filename) {
        var file = new Blob([data], {type: "text/plain;charset=utf-8"});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0);
        }
    };

    (function(){
        this.init();
    }).bind(this)();
};