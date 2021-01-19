<?php
    // ini_set('display_errors', 1);
    // ini_set('display_startup_errors', 1);
    // error_reporting(E_ALL);
    // $path = 'json/';

    $path = $_POST['curPath'];

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
    $newItem->directory = 'true';
    $newItem->name = 'New folder';
    $newItem->owner = $_SERVER['REMOTE_ADDR'];
    $newItem->date = date("Y-m-d h:i:sa");
    $newItem->size = '0';
    $newItem->star = FALSE;
    $newItem->hide = FALSE;

    array_push($newData, $newItem);

    $newJsonFile = json_encode($newData);
    file_put_contents($jsonPath, $newJsonFile);

    $jsonPath = '../' . $path . 'update.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $data["update"]++;

    $newJsonFile = json_encode($data);
    file_put_contents($jsonPath, $newJsonFile);

    $newDirPath = '../' . $path . 'New folder/';
    mkdir($newDirPath, 0777);

    $newJsonPath = $newDirPath . 'directory.json';
    $newJsonFile = json_encode (json_decode ("{}"));
    file_put_contents($newJsonPath, $newJsonFile);

    $newJsonPath = $newDirPath . 'update.json';
    $newJsonFile = json_encode (json_decode ('{"update":0}'));
    file_put_contents($newJsonPath, $newJsonFile);
?>