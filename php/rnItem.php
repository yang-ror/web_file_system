<?php
    // ini_set('display_errors', 1);
    // ini_set('display_startup_errors', 1);
    // error_reporting(E_ALL);
    // $id = 9;
    // $path = 'json/';
    // $name = 'MyWife';

    $id = $_POST['itemId'];
    $path = $_POST['itemPath'];
    $name = $_POST['newName'];

    $jsonPath = '../' . $path . 'directory.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $newData = [];
    $oldName;
    $isDir;

    foreach($data as $item){
        if($id == $item['id']){
            $oldName = $item['name'];
            $isDir = $item['directory'] == 'true' ? TRUE : FALSE;

            $newItem = new \stdClass();
            $newItem->id = $item['id'];
            $newItem->directory = $item['directory'];
            $newItem->name = $name;
            $newItem->owner = $item['owner'];
            $newItem->date = date("Y-m-d h:i:sa");
            $newItem->size = $item['size'];
            $newItem->star = $item['star'];
            $newItem->hide = $item['hide'];

            array_push($newData, $newItem);
        }
        else{
            array_push($newData, $item);
        }
    }

    $newJsonFile = json_encode($newData);
    file_put_contents($jsonPath, $newJsonFile);

    $jsonPath = '../' . $path . 'update.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $data["update"]++;

    $newJsonFile = json_encode($data);
    file_put_contents($jsonPath, $newJsonFile);

    if($isDir){
        $oldPath = '../' . $path . $oldName;
        $newPath = '../' . $path . $name;
        rename($oldPath, $newPath);
    }
?>