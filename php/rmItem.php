<?php
    // ini_set('display_errors', 1);
    // ini_set('display_startup_errors', 1);
    // error_reporting(E_ALL);
    // $id = 9;
    // $path = 'json/';

    $id = $_POST['itemId'];
    $path = $_POST['itemPath'];

    $jsonPath = '../' . $path . 'directory.json';
    $jsonFile = file_get_contents($jsonPath);
    $data = json_decode($jsonFile, true);

    $newData = [];
    $isDir = 'false';

    foreach($data as $item){
        if($id != $item['id']){
            array_push($newData, $item);
        }
        else{
            $isDir = $item['directory'] == 'true' ? $item['name'] : 'false';
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

    if($isDir != 'false'){
        $dirPath = '../' . $path . '/' . $isDir;
        rmFolder($dirPath);
    }

    function rmFolder($dir){
        $dirScan = scandir($dir);
        foreach ($dirScan as $item){
            if ($item != '.' && $item != '..'){
                if(is_dir($dir . '/' . $item)){
                    rmFolder($dir . '/' . $item);
                }
                else{
                    unlink($dir . '/' . $item);
                }
            }
        }
        rmdir($dir);
    }
?>