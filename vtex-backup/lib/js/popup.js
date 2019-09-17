;(function() {

    function handlePercent(percent){

        $('.progress > .progress-bar').css('width', percent + '%');

        if(percent < 10) $('.container').addClass('five');

        if(percent > 15 && percent < 40){
            $('.container').removeClass('five')
            $('.container').addClass('twenty-five');  
        } 

        if(percent > 40 && percent < 65){
            $('.container').removeClass('twenty-five');
            $('.container').addClass('fifth');
        }

        if(percent > 65 && percent < 90) { 
            $('.container').removeClass('fifth');
            $('.container').addClass('seventh-five');
        }

        if(percent > 95){
            $('.container').removeClass('seventh-five');
            $('.container').addClass('one-hundred');
        }
    }

    $(window).load(function(){

        chrome.tabs.query({currentWindow: true, active : true},function(tab){
            chrome.tabs.executeScript(null, {file: 'lib/js/jquery.min.js'});
            chrome.tabs.executeScript(null, {file: 'lib/js/jszip.min.js'});
            chrome.tabs.executeScript(null, {file: 'lib/js/vtexbkp.js' });
        });

        $('#backup-files').on('click', function(e){
            e.preventDefault();

            $('#progress-container').slideDown(); //mudar para css
            $('.upload-related').addClass('disabled');

            var isChecked = $('#chk-img').is(':checked');

            chrome.tabs.query({currentWindow: true, active : true}, function(tab){
                chrome.tabs.executeScript(null, {code: 'window.ischecked=' + isChecked });
                chrome.tabs.executeScript(null, {code: 'new vtexbkp();' });
                chrome.tabs.executeScript(null, {code: '(function() { return window.vtexbkpinfo })();' }, function(res){

                    var percent = parseInt((res[0].cont/res[0].total) * 100);

                    var text = (res[0].status == undefined || res[0].name == undefined) ? "verificando arquivos..." : res[0].status + " - " + res[0].name;

                    if(res[0] != undefined) document.querySelector('#bind-status').innerHTML = text;

                    handlePercent(percent || 0);
                });
                var interval = setInterval(function(){
                    chrome.tabs.executeScript(null, {code: '(function() { return window.vtexbkpinfo })();' }, function(res){

                        var percent = parseInt((res[0].cont/res[0].total) * 100);

                        var text = (res[0].status == undefined || res[0].name == undefined) ? "verificando arquivos..." : res[0].status + " - " + res[0].name;

                        if(res[0] != undefined) document.querySelector('#bind-status').innerHTML = text;

                        handlePercent(percent || 0);

                        if(percent == 100){
                             clearInterval(interval);
                             $('#progress-container').slideUp();
                             $('#backup-done').slideDown();
                             setTimeout(function(){
                                $('#backup-done').slideUp();
                                $('.upload-related').removeClass('disabled');
                             }, 2000);    
                        }
                    });
                }, 10);
            });
        });        
    });
})();