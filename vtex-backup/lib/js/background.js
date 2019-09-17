chrome.pageAction.onClicked.addListener(click);
        //When the icon is clicked -> click() will be executed
chrome.tabs.onUpdated.addListener(check);
        //When a tab is changed -> check() will be executed


function check(tab_id, data, tab){
    if(tab.url.match(/vtexcommercestable.com.br/)){
           //if the url of the tab matches a certain website 
        chrome.pageAction.show(tab_id);
        //show the icon (by default it is not shown).
        chrome.tabs.executeScript(tab_id, {code:"var tab_id = '" + tab_id + "'"});
        //executes JS code on the WEBPAGE ON THE SCREEN ITSELF.
        //YOUR EXTENSIONS JAVASCRIPT AND CONTENT SCRIPTS ARE SEPERATE ENVIRONMENTS
    }
}

function click(){
    chrome.tabs.query({currentWindow: true, active : true},function(tab){
    //checks the tab ID of the currently open wndow
        chrome.tabs.executeScript(null, {file: vtexbkp.js});
        //executes a script from the file codeToInsert.js.
    })
}