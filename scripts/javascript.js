// =============================================================================
// javascript.js
// project: Web File System
// author: Zifan Yang
// date created: 2020-08-03
// last modified: 2021-01-20
// =============================================================================

var path;
var items;
var posBeforeDrag;
var view;
var lastClicked = 0;
var sortBy;
var reversed;
var update;
var rMenuPosY;
var rMenuPosX;
var filesInMemory = [];
var idOfNameInEditing;
var showingPropertiesOf = -1;

//where to find json file for root directory
var root = 'json/';

$("document").ready(function() {
    //prevent cache as the data may updating frequently
    $.ajaxSetup({
        cache: false,
    });
    
    //default view settings
    view = 'icons';
    sortBy = 'date';
    reversed = false;

    goToDir(root);

    addMenuListener();

    //temporary updating method. will be replaced by socket
    window.setInterval(function(){
        checkUpdate();
    }, 1000);
});

//add click listeners to button
function addMenuListener(){
    var root = 'json/';
    $('#backBtn').click(function(event){
        if(path != root){
            var indexOfSlash = path.substring(0, path.length - 1).lastIndexOf('/');
            var p = path.substring(0, indexOfSlash + 1);
            goToDir(p);
        }
        $(".cMenu").finish().hide(100);
    });

    $('#homeBtn').click(function(event){
        if(path != root){
            goToDir(root);
        }
        $(".cMenu").finish().hide(100);
    });

    $('#addBtn').click(function(event){
        // var directory = false;
        // var name = 'filename.dat';
        // var owner = '192.168.8.192';
        // var date = '2020-08-21 04:24:51am';
        // var size = '43,343KB'
        // var star = false;
        // var hide = false;
        // addToDir(path, name, directory, owner, date, size, star, hide);
        // $(".cMenu").finish().hide(100);
    });

    $('#viewBtn').click(function(event){
        $(".cMenu").finish().hide(100);

        if(view == 'icons'){
            changeView('list');
        }
        else if(view == 'list'){
            changeView('icons');
        }
    });

    $("#items").click(function(event){
        if(event.target.id == 'items'){
            dimLastClickedItem();
            if(idOfNameInEditing != -1){
                prepareRename();
            }
        }
        $(".cMenu").finish().hide(100);
    });

    //customized right-click menu
    $(document).bind("contextmenu", function(event) {
        event.preventDefault();
        
        if(idOfNameInEditing != -1){
            prepareRename();
        }

        $(".cMenu").finish().hide(100);
        
        // var clickedId;
        rMenuPosY = event.pageY + 1;
        rMenuPosX = event.pageX + 1;

        if(event.target.id == 'items'){
            dimLastClickedItem();

            if(filesInMemory.length === 0){
                $("#eMenu-paste").addClass("cMenu-disable");
                // $("#eMenu-paste").removeClass("cMenu-hover");
            }
            else{
                $("#eMenu-paste").removeClass("cMenu-disable");
                // $("#eMenu-paste").addClass("cMenu-hover");
            }

            $("#eMenu").finish().show(100).css({
                top: rMenuPosY + 'px',
                left: rMenuPosX + 'px'
            });
        }
        else{
            if(event.target.id.includes('-')){
                var clickedId = getIdFromTagId(event.target.id);

                if(!isNaN(clickedId)){
                    highLightItem(clickedId);
                    $("#iMenu").finish().show(100).css({
                        top: rMenuPosY + 'px',
                        left: rMenuPosX + 'px'
                    });
                }
            }
        }
    });

    $(".cMenu li").click(function(){
        $(".cMenu").finish().hide(100);

        switch($(this).attr("id")){
            case 'eMenu-refresh': loadJSON(); break;
            case 'eMenu-newFolder': newFolder(); break;
            case 'iMenu-delete': deleteItem(); break;
            case 'iMenu-rename': renameItem(); break;
            case 'iMenu-properties': showProperties(true); break;
            case 'vMenu-icons': changeView('icons'); break;
            case 'vMenu-list': changeView('list'); break;
            case 'sMenu-name': goSortBy('name'); break;
            case 'sMenu-date': goSortBy('date'); break;
            case 'sMenu-owner': goSortBy('owner'); break;
            case 'sMenu-type': goSortBy('type'); break;
            case 'sMenu-size': goSortBy('size'); break;
        }
    });

    $("#eMenu-view").hover(
        function(){
            var posY = rMenuPosY;
            var posX = rMenuPosX + 151;
            
            $("#vMenu").finish().show(100).css({
                top: posY + 'px',
                left: posX + 'px'
            });

            $("#sMenu").finish().hide(100);
        },
        function(){
            setTimeout(function(){
                if(!$("#vMenu").is(":hover")){
                    $("#vMenu").finish().hide(100);
                }
            }, 100);
        }
    );

    $("#eMenu-sort").hover(
        function(){
            var posY = rMenuPosY + 33;
            var posX = rMenuPosX + 151;

            $("#sMenu").finish().show(100).css({
                top: posY + 'px',
                left: posX + 'px'
            });

            $("#vMenu").finish().hide(100);
        },
        function(){
            setTimeout(function(){
                if(!$("#sMenu").is(":hover")){
                    $("#sMenu").finish().hide(100);
                }
            }, 100);
        }
    );

    $("#prop-name").on('keypress', function(event){
        if(event.which == 13){
            var id = showingPropertiesOf;
            var name = getItemName(id);
            var nameInput = $("#prop-name");
            var newName = nameInput.val();

            if(newName != name){
                renameInDir(id, newName);
            }
        }
        else if(event.which == 27){

        }
    });

    $("#propertiesWindow").draggable({
        handle: "#propTitleBar"
    });

    $("#propWinCloseBtn").click(function(){
        showingPropertiesOf = -1;
        $("#propertiesWindow").finish().hide(100);
    });
}

//begin the redirection to another file
function goToDir(p){
    path = p;
    showingPropertiesOf = -1;
    $("#propertiesWindow").finish().hide();
    loadJSON();
}

//User ajax to read the json file in the backend once succeed, store the data in an array
function loadJSON(){
    $.ajax({
        dataType: 'json',
        url: path + 'directory.json',
        error: function (e){
            alert("An error occurred while load json");
            console.log("json reading Failed: ", e);
            goToDir('json/');
        },
        success: function(data){
            items = [];
            if(data.length > 0){
                for(var info of data){
                    items.push({
                        'id': info.id,
                        'directory': info.directory,
                        'name': info.name,
                        'owner': info.owner,
                        'date': info.date,
                        'size': info.size,
                        'type': info.directory ? 'Folder' : getFileType(info.name),
                        'star': info.star,
                        'hide': info.hide
                    });
                }
            }
        },
        complete: function(){
            showPath();
            sortItem();
            displayItems();
            addFilesListener();
        }
    });

    //check if there is any update in this directory
    $.ajax({
        dataType: 'json',
        url: path + 'update.json',
        error: function (e){
            alert("An error occurred while load json");
            console.log("json reading Failed: ", e);
        },
        success: function(data){
            update = data.update;
        },
        complete: function(){

        }
    });
}

function getFileType(name){
    var indexOfDot = -1;
    
    for(let i = name.length-1; i >= 0 ; i--){
        if(name.charAt(i) == '.'){
            indexOfDot = i;
            break;
        }
    }

    return indexOfDot === -1 ? 'Unknown' : name.substring(indexOfDot+1, name.length);
}

//display current path in the top address bar
function showPath(){
    $("#pathHolder").empty();
    $("#pathHolder").append('<label class="slash" style="padding-left: 10px;"> / </label>');

    if(path != 'json/'){
        var indexOfSlashes = [];

        for(let i = 0; i < path.length; i++) {
            if (path[i] === "/") indexOfSlashes.push(i);
        }

        var upperPath = [];
        
        for(let i = 1; i < indexOfSlashes.length; i++){
            var pathfinder = path.substring(indexOfSlashes[i-1]+1, indexOfSlashes[i]);
            upperPath.push(pathfinder);
        }

        var curPath = upperPath.pop();

        if(upperPath.length > 0){
            for(let i = 0; i < upperPath.length; i++) {
                var linkToPath = "'" + path.substring(0, indexOfSlashes[i+1]+1) + "'";
                $("#pathHolder").append('<a onClick="goToDir(' + linkToPath + ')" href="#" class="path"> ' + upperPath[i] + ' </a>');
                $("#pathHolder").append('<label class="slash"> / </label>');
            }
        }

        $("#pathHolder").append('<label id="curPath"> ' + curPath + ' </label>');
    }
}

//sort files by data|name|owner|type|size
function sortItem(){
    $("#sDate").removeClass("ui-icon-radio-btn-on");
    $("#sName").removeClass("ui-icon-radio-btn-on");
    $("#sOwner").removeClass("ui-icon-radio-btn-on");
    $("#sType").removeClass("ui-icon-radio-btn-on");
    $("#sSize").removeClass("ui-icon-radio-btn-on");

    if(sortBy == 'date'){
        items.sort((a, b) => (a.date > b.date) ? 1 : -1);
        if(view == 'list'){
            items.reverse();
        }
        $("#sDate").addClass("ui-icon-radio-btn-on");
    }

    else if(sortBy == 'name'){
        items.sort((a, b) => (a.name > b.name) ? 1 : -1);
        $("#sName").addClass("ui-icon-radio-btn-on");
    }

    else if(sortBy == 'owner'){
        items.sort((a, b) => (a.owner > b.owner) ? 1 : -1);
        $("#sOwner").addClass("ui-icon-radio-btn-on");
    }

    else if(sortBy == 'type'){
        items.sort((a, b) => (a.type > b.type) ? 1 : -1);
        $("#sType").addClass("ui-icon-radio-btn-on");
    }

    else if(sortBy == 'size'){
        items.sort((a, b) => (a.size > b.size) ? 1 : -1);
        $("#sSize").addClass("ui-icon-radio-btn-on");
    }

    if(reversed){
        items.reverse();
    }
}

//construct the files container
function displayItems(){
    idOfNameInEditing = -1;

    $("#tableHead").empty();
    $("#items").empty();
    $("#vIcons").removeClass("ui-icon-radio-btn-on");
    $("#vList").removeClass("ui-icon-radio-btn-on");
    
    if(view == 'icons'){
        $("#vIcons").addClass("ui-icon-radio-btn-on");
        for(let i = 0; i < items.length; i++){
            var newDiv = $('<div id="' + items[i].id + '-item"></div>');
            newDiv.addClass("item");
            var image;

            if(items[i].directory){
                newDiv.addClass("folder");
                image = '<img class="icon-64" id="' + items[i].id + '-img" src="icons/folder.png">';
            }
            else{
                newDiv.addClass("file");
                image = '<img class="icon-64" id="' + items[i].id + '-img" src="icons/file.png">';
            }

            newDiv.append(image);
            
            var nameDiv = $('<div class="nameHolder" id="' + items[i].id + '-nameHolder"></div>');
            nameDiv.append('<label class="name" id="' + items[i].id + '-label">' + getDisplayName(items[i].name) + '</label>');
            newDiv.append(nameDiv);

            $("#items").append(newDiv);
        }
    }
    else if(view == 'list'){
        $("#vList").addClass("ui-icon-radio-btn-on");
        var newTable = $('<table id="itemTH"></table>');

        var topRow = $('<tr></tr>');

        var iconTh = $('<td id="iconTH"></td>');
        var nameTh = $('<td class = "itemCol" id="nameTH"></td>');
        var dateTh = $('<td class = "itemCol" id="dateTH"></td>');
        var ownerTh = $('<td class = "itemCol" id="ownerTH"></td>');
        var typeTh = $('<td class = "itemCol" id="typeTH"></td>');
        var sizeTh = $('<td class = "itemCol" id="sizeTH"></td>');

        var directionPointer = reversed ? 'ui-icon-triangle-1-n' : 'ui-icon-triangle-1-s';
        
        var namePointerClass = 'ui-icon';
        var datePointerClass = 'ui-icon';
        var ownerPointerClass = 'ui-icon';
        var typePointerClass = 'ui-icon';
        var sizePointerClass = 'ui-icon';
        
        switch(sortBy){
            case 'name' : 
                namePointerClass = namePointerClass + ' ' + directionPointer;
                break;
            case 'date' :
                datePointerClass = datePointerClass + ' ' + directionPointer;
                break;
            case 'owner' : 
                ownerPointerClass = ownerPointerClass + ' ' + directionPointer;
                break;
            case 'type' :
                typePointerClass = typePointerClass + ' ' + directionPointer;
                break;
            case 'size' : 
                sizePointerClass = sizePointerClass + ' ' + directionPointer;
                break;
        }

        nameTh.append('<label class="itemColDes">Name</label>');
        nameTh.append('<span id="sortByName" class = "' + namePointerClass + '"></span>');

        dateTh.append('<label class="itemColDes">Date Modified</label>');
        dateTh.append('<span id="sortByDate" class = "' + datePointerClass + '"></span>');

        ownerTh.append('<label class="itemColDes">Uploaded by</label>');
        ownerTh.append('<span id="sortByOwner" class = "' + ownerPointerClass + '"></span>');

        typeTh.append('<label class="itemColDes">Type</label>');
        typeTh.append('<span id="sortByType" class = "' + typePointerClass + '"></span>');

        sizeTh.append('<label class="itemColDes">Size</label>');
        sizeTh.append('<span id="sortBySize" class = "' + sizePointerClass + '"></span>');

        topRow.append(iconTh);
        topRow.append(nameTh);
        topRow.append(dateTh);
        topRow.append(ownerTh);
        topRow.append(typeTh);
        topRow.append(sizeTh);

        newTable.append(topRow);

        $("#tableHead").append(newTable);

        for(let i = 0; i < items.length; i++){
            var newSubTable = $('<table id="' + items[i].id + '-item-list"></table>');
            newSubTable.addClass("item-list");
            newSubTable.addClass("item-list-hover");

            var tableRow = $('<tr class="itemRow" id="' + items[i].id + '-row-list"></tr>');

            var icon_image;

            if(items[i].directory){
                newSubTable.addClass("folder");
                icon_image = '<img class="icon-20" id="' + items[i].id + '-img-list" src="icons/folder.png">';
            }
            else{
                newSubTable.addClass("file");
                icon_image = '<img class="icon-20" id="' + items[i].id + '-img-list" src="icons/file.png">';
            }

            var iconTd = $('<td class="iconTD" id="' + items[i].id + '-iconTD"></td>');
            iconTd.append(icon_image);

            var nameTd = $('<td class="nameTD" id="' + items[i].id + '-nameTD"></td>');
            var nameTdHolder = $('<div id="' + items[i].id + '-nameTdHolder"></div>');
            nameTdHolder.append('<label class="name-list" id="' + items[i].id + '-name-list">' + items[i].name + '</label>');
            nameTd.append(nameTdHolder);

            var dateTd = $('<td class="dateTD" id="' + items[i].id + '-dateTD"></td>');
            dateTd.append('<label class="name-list" id="' + items[i].id + '-date-list">' + items[i].date + '</label>');

            var ownerTD = $('<td class="ownerTD" id="' + items[i].id + '-ownerTD"></td>');
            ownerTD.append('<label class="name-list" id="' + items[i].id + '-owner-list">' + items[i].owner + '</label>');

            var typeTD = $('<td class="typeTD" id="' + items[i].id + '-typeTD"></td>');
            typeTD.append('<label class="name-list" id="' + items[i].id + '-type-list">' + items[i].type + '</label>');

            var sizeTD = $('<td class="sizeTD" id="' + items[i].id + '-sizeTD"></td>');

            if(!items[i].directory){
                sizeTD.append('<label class="name-list" id="' + items[i].id + '-size-list">' + items[i].size + '</label>');
            }
            else{
                sizeTD.append('<label class="name-list" id="' + items[i].id + '-size-list"> </label>');
            }

            tableRow.append(iconTd);
            tableRow.append(nameTd);
            tableRow.append(dateTd);
            tableRow.append(ownerTD);
            tableRow.append(typeTD);
            tableRow.append(sizeTD);

            newSubTable.append(tableRow);
            $("#items").append(newSubTable);
        }
    }

    $("#items").append('<br><br><br>');
}

//format the filename to make it display properly
function getDisplayName(name){
    if(name.length >= 14){
        var indexOfSpace = -1;
        var indexOfCharA = -1;
        var indexOfCharB = -1;

        for(let i = 0; i <= 14; i++){
            if(name.charAt(i) === ' '){
                indexOfSpace = i;
            }
            if([".", "'", "-", "_", "@", "#", "$", "^", "&", "(", "+", "["].includes(name.charAt(i))){
                indexOfCharA = i;
            }
            if(["!", "%", ")", "]"].includes(name.charAt(i))){
                indexOfCharB = i;
            }
        }

        if(indexOfSpace === -1 && indexOfCharA === -1 && indexOfCharB === -1){
            return spliceToRows(name, 14);
        }

        if(indexOfSpace === -1){
            if(indexOfCharA > indexOfCharB){
                return spliceToRows(name, indexOfCharA);
            }
            else{
                return spliceToRows(name, indexOfCharB + 1);
            }
        }
        else{
            return name;
        }
    }
    else{
        return name;
    }
}

function spliceToRows(name, i){
    var firstRow = name.substring(0, i);
    var secondRow = name.substring(i, name.length);

    return firstRow + ' ' + secondRow;
}

function addSortListener(colName){
    $('#' + colName + 'TH').click(function(event){
        goSortBy(colName);
    });
}

//begin a sort action
function goSortBy(a){
    if(sortBy == a){
        reversed = reversed ? false : true;
    }
    else{
        reversed = false;
    }
    sortBy = a;
    sortItem();
    displayItems();
    addFilesListener();
}

//unselect the file previously selected
function dimLastClickedItem(){
    if(view == 'icons'){
        $(lastClicked).removeClass("highlight");
    }
    else if(view == 'list'){
        $(lastClicked).removeClass("highlight-list");
        $(lastClicked).addClass("item-list-hover");
    }
}

//hight light an item whe selected 
function highLightItem(id){
    dimLastClickedItem();
    
    var HLClass;
    if(view =='icons'){
        HLClass = "highlight";
    }
    else if(view == 'list'){
        HLClass = "highlight-list";
    }

    var itemId;
    if(view == 'icons'){
        itemId = '#' + id + "-item";
    }
    else{
        itemId = '#' + id + "-item-list";
    }

    if(view == 'list'){
        $(itemId).removeClass("item-list-hover");
    }

    $(itemId).addClass(HLClass);
    lastClicked = itemId;
}

// add listener to files
function addFilesListener(){
    var item;
    var HLClass;

    if(view =='icons'){
        item = $(".item");
        HLClass = "highlight";
    }
    else if(view == 'list'){
        item = $(".item-list");
        HLClass = "highlight-list";

        addSortListener('name');
        addSortListener('date');
        addSortListener('owner');
        addSortListener('type');
        addSortListener('size');
    }

    item.draggable({
        handle: "img",
        revert: true,
        start: function(event,ui) {
            $(lastClicked).removeClass(HLClass);
            this.style.zIndex = 1;
            posBeforeDrag = ui.helper.position();
            if(view == 'list'){
                var draggingId = getIdFromTagId(this.id);
                $('#' + draggingId + '-item-list').removeClass("item-list-hover");
                $('#' + draggingId + '-name-list').addClass("draggingText");
                $('#' + draggingId + '-dateTD').toggle();
                $('#' + draggingId + '-ownerTD').toggle();
                $('#' + draggingId + '-typeTD').toggle();
                $('#' + draggingId + '-sizeTD').toggle();
            }
        },
        stop: function(event,ui) {
            this.style.zIndex = 0;
            if(view == 'list'){
                $(lastClicked).addClass("item-list-hover");
                var draggingId = getIdFromTagId(this.id);
                $('#' + draggingId + '-item-list').addClass("item-list-hover");
                $('#' + draggingId + '-name-list').removeClass("draggingText");
                $('#' + draggingId + '-dateTD').toggle();
                $('#' + draggingId + '-ownerTD').toggle();
                $('#' + draggingId + '-typeTD').toggle();
                $('#' + draggingId + '-sizeTD').toggle();
            }
        }
    });

    $(".folder").droppable({
        accept: item,
        hoverClass: HLClass,
        drop: function(evt, ui){
            var srcId = getIdFromTagId(ui.draggable.attr('id'));
            var desId = getIdFromTagId(this.id);
            ui.draggable.fadeTo(200,0.001);
            moveToDir(srcId, desId);
        }
    });

    item.click(function(event){
        var clickedId = getIdFromTagId(event.target.id);
        highLightItem(clickedId);
    });

    item.dblclick(function(event){
        var clickedId = getIdFromTagId(event.target.id);

        if(idOfNameInEditing != clickedId){
            var itemClicked;
            
            for(var i=0; i <items.length; i++){
                if(items[i].id == clickedId){
                    itemClicked = items[i];
                    break;
                }
            }
            
            if(itemClicked.directory){
                $(lastClicked).removeClass(HLClass);
                var p = path + itemClicked.name + '/';
                goToDir(p);
            }
            else{
                //TODO: add double click to action
            }
        }
    });
}

function moveToDir(srcId, desId){
    var srcItem;
    var desDir;
    var foundSrc = false;
    var foundDes = false;

    for(let i = 0; i < items.length; i++){
        if(items[i].id == srcId){
            srcItem = items[i];
            foundSrc = true;
        }

        if(items[i].id == desId){
            desDir = items[i];
            foundDes = true;
        }

        if(foundSrc && foundDes){
            break;
        }
    }

    var desPath = path + desDir.name + '/';
    addToDir(desPath, srcItem.name, srcItem.directory, srcItem.owner, srcItem.date, srcItem.size, srcItem.star, srcItem.hide);
    rmFromDir(srcId, true);
}

function getIdFromTagId(tag){
    var indexOfDash = tag.indexOf('-');
    return tag.substring(0, indexOfDash);
}

function getIdFromElement(element){
    var indexOfDash = element.indexOf('-');
    return element.substring(1, indexOfDash);
}

function getItemName(id){
    for(var item of items){
        if(item.id == id){
            return item.name;
        }
    }
}

//check if a rename in the backend is necessary
function prepareRename(){
    var id = getIdFromElement(lastClicked);
    var name = getItemName(id);
    var nameInput = $('#' + idOfNameInEditing + '-nameInput');
    var newName = nameInput.val();

    if(newName != name){
        renameInDir(idOfNameInEditing, newName);
    }
    else{
        displayItems();
        addListener();
    }
}

//hide file icon and call another function to 
function deleteItem(){
    var id = getIdFromElement(lastClicked);
    var itemClass;
    
    if(view == 'icons'){
        itemClass = '-item';
    }
    else if(view == 'icons'){
        itemClass = '-item-list';
    }

    $('#' + id + itemClass).fadeTo(200,0.001);
    rmFromDir(id, false);
}

//begin a rename action
function renameItem(){
    var id = getIdFromElement(lastClicked);
    var name = getItemName(id);
    var nameHolder;

    if(view == 'icons'){
        nameHolder = $('#' + id + '-nameHolder');
        $('#' + id + '-item').draggable( 'disable' );
    }
    else if(view == 'list'){
        nameHolder = $('#' + id + '-nameTdHolder');
        $('#' + id + '-item-list').draggable( 'disable' );
    }
    // var indexOfDot = name.length;

    // for(let i = name.length - 1; i >= 0; i--){
    //     if(name.charAt(i) == '.'){
    //         indexOfDot = i;
    //         break;
    //     }
    // }

    nameHolder.empty();
    var nameInput = $('<input id="' + id + '-nameInput" class="nameInput" value="' + name + '">');
    nameHolder.append(nameInput);
    nameInput.focus();
    
    //TODO nameInput.setSelectionRange(0, indexOfDot);

    idOfNameInEditing = id;
    
    nameInput.on('keypress', function(event){
        if(event.key == 'Enter'){
            prepareRename();
        }
        else if(event.key == 'Escape'){
            displayItems();
            addListener();
        }
    });
}

//right click menu functions
function showProperties(ClickedOnItem){
    if(ClickedOnItem){
        var id = getIdFromElement(lastClicked);
        showingPropertiesOf = id;

        for(var item of items){
            if(id == item.id){
                var iconPath = item.directory ? 'icons/folder.png' : 'icons/file.png';
                $("#prop-icon").attr('src', iconPath);
                $("#prop-name").val(item.name);
                $("#prop-type").html(item.type);
                $("#prop-path").html(path.substring(4));
                $("#prop-size").html(item.size);
                $("#prop-owner").html(item.owner);
                $("#prop-date").html(item.date);
                break;
            }
        }
    }

    $("#propertiesWindow").finish().show(100).css({
        top: rMenuPosY + 'px',
        left: rMenuPosX + 'px'
    });
}

function changeView(toView){
    if(toView == 'icons'){
        view = 'icons';
        $('#viewBtn').removeClass("ui-icon-view-icons-b");
        $('#viewBtn').addClass("ui-icon-view-list");
    }
    else if(toView == 'list'){
        view = 'list';
        $('#viewBtn').removeClass("ui-icon-view-list");
        $('#viewBtn').addClass("ui-icon-view-icons-b");
    }
    
    sortItem();
    displayItems();
    addListener();
}

//fade current file and then pull any files after current file
function playRemoveAnimation(id, dragged){
    var idPostfix;

    if(view == 'icons'){
        idPostfix = '-item';
    }
    else if(view == 'list'){
        idPostfix = '-item-list';
    }

    var removedItem = $('#' + id + idPostfix);
    var removedItemIndex;
    var toPos;

    for(let i = 0; i < items.length; i++){
        if(items[i].id == id){
            removedItemIndex = i;
        }
    }

    if(dragged){
        toPos = posBeforeDrag;
    }
    else{
        toPos = removedItem.position();
    }

    if(removedItemIndex < (items.length - 1)){
        for(let i = removedItemIndex + 1; i < items.length; i++){
            var movingItem = $('#' + items[i].id + idPostfix);

            if(i != removedItemIndex + 1){
                toPos =  $('#' + items[i-1].id + idPostfix).position();
            }

            var top = toPos.top - movingItem.position().top;
            var left = toPos.left - movingItem.position().left;

            movingItem.animate({
                top: top,
                left: left
            },
            {
                queue:false
            });
        }
    }
    
    setTimeout(function(){
        loadJSON();
    }, 500);
}

function checkUpdate(){
    var newUpdateInt;
    $.ajax({
        dataType: 'json',
        url: path + 'update.json',
        error: function (e){
            alert("An error occurred while load json");
            console.log("json reading Failed: ", e);
        },
        success: function(data){
            newUpdateInt = data.update;
        },
        complete: function(){
            if(newUpdateInt > update){
                loadJSON();
            }
        }
    });
}

function newFolder(){
    $.ajax({
        type: "POST",
        url: "./php/newFolder.php",
        data:{curPath: path},
        complete: function(){
            loadJSON();
        }
    });
}

function renameInDir(id, newName){
    $.ajax({
        type: "POST",
        url: "./php/rnItem.php",
        data:{itemId: id, itemPath: path, newName: newName},
        complete: function(){
            // nameInEditing = -1;
            loadJSON();
        }
    });
}

function rmFromDir(id, dragged){
    $.ajax({
        type: "POST",
        url: "./php/rmItem.php",
        data:{itemId: id, itemPath: path},
        complete: function(){
            playRemoveAnimation(id, dragged);
        }
    });
}

function addToDir(desPath, name, directory, owner, date, size, star, hide){
    $.ajax({
        type: "POST",
        url: "./php/addItem.php",
        data:{
            itemPath: desPath, 
            itemDir: directory, 
            itemName: name, 
            itemOwner: owner, 
            itemDate: date, 
            itemSize: size, 
            itemStar: star, 
            itemHide: hide,
            srcPath: path
        },
        // complete: function(){
        //     loadJSON();
        // }
    });
}