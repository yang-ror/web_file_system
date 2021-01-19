<?php
    //ini_set('display_errors', 1);
    //ini_set('display_startup_errors', 1);
    //error_reporting(E_ALL);
    //$path = 'json/';
    //$directory = FALSE;
    //$name = 'Tsubasa';
    //$owner = '192.168.8.182';
    //$date = '2020-07-29 04:24:51am';
    //$size = '315,689KB';
    //$star = FALSE;
    //$hide = FALSE;
    // $srcPath = 'json/';

    $path = $_POST['itemPath'];
    $directory = $_POST['itemDir'] == 'true' ? TRUE : FALSE;
    $name = $_POST['itemName'];
    $owner = $_POST['itemOwner'];
    $date = $_POST['itemDate'];
    $size = $_POST['itemSize'];
    $star = $_POST['itemStar'] == 'true' ? TRUE : FALSE;
    $hide = $_POST['itemHide'] == 'true' ? TRUE : FALSE;
    $srcPath = $_POST['srcPath'];
    
    $jsonPath = '../' . $path . 'directory.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $maxId = 0;
    $newData = [];

    if(count($data) != 0){
        foreach($data as $item){
            array_push($newData, $item);
            if($maxId < $item['id']){
                $maxId = $item['id'];
            }
        }
    }

    $id = $maxId + 1;

    $newItem = new \stdClass();
    $newItem->id = $id;
    $newItem->directory = $directory;
    $newItem->name = $name;
    $newItem->owner = $owner;
    $newItem->date = $date;
    $newItem->size = $size;
    $newItem->star = $star;
    $newItem->hide = $hide;

    array_push($newData, $newItem);

    $newJsonFile = json_encode($newData);
    file_put_contents($jsonPath, $newJsonFile);

    $jsonPath = '../' . $path . 'update.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $data["update"]++;

    $newJsonFile = json_encode($data);
    file_put_contents($jsonPath, $newJsonFile);

    if($directory){
        $srcPath = '../' . $srcPath . $name;
        $desPath = '../' . $path . $name;
        rename($srcPath, $desPath);
    }
?>