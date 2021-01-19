<?php
	$dir = "files/";
	$file = $dir . $_FILES["nfile"]["name"];
	
	$uploadOk = 1;
	$fileType = strtolower(pathinfo($file, PATHINFO_EXTENSION));

	if(file_exists($file)){

		$endOfName = 0;

		for($i = 5; $i < strlen($file); $i++){

			if($file[$i] == "."){
				$endOfName = $i;
				//break;
			}
		}

		$file = substr_replace($file, "(2)", $endOfName, 0);
		$j = 3;
		while(file_exists($file)){
			$file[$endOfName + 1] = $j;
			$j++;
		}
	}

	if($uploadOk == 1){
		if(move_uploaded_file($_FILES["nfile"]["tmp_name"], $file)){
			updateXML($file);
			if(isImage(getFileType($file))){
				cropImg($file);
			}
		}
		else{
			echo "Error code: ".$_FILES["nfile"]["error"];
		}
	}

	function updateXML($file){
		$dom = new DOMDocument();
		$dom->load('files.xml');
		$dom->formatOutput = true; 
		$dom->encoding = 'UTF-8';

		$r = $dom->documentElement;

		$c = $dom->createElement('file');
		$r->appendChild($c);

		$id = $dom->createElement('id');
		$id->appendChild($dom->createTextNode(getMaxID()+1));
		$c->appendChild($id);
		
		$name = $dom->createElement('name');
		$name->appendChild($dom->createTextNode(substr($file, 6)));
		$c->appendChild($name);
		
		$owner = $dom->createElement('owner');
		$owner->appendChild($dom->createTextNode($_SERVER['REMOTE_ADDR']));
		$c->appendChild($owner);

		$date = $dom->createElement('date');
		$date->appendChild($dom->createTextNode(date("Y-m-d h:i:sa")));
		$c->appendChild($date);

		$star = $dom->createElement('star');
		$star->appendChild($dom->createTextNode('FALSE'));
		$c->appendChild($star);

		$hide = $dom->createElement('hide');
		$hide->appendChild($dom->createTextNode('FALSE'));
		$c->appendChild($hide);

		$dom->saveXML();
		$dom->save('files.xml');
	}

	function getMaxID(){
		$doc = new DOMDocument();
		$doc->load('files.xml');
		$files = $doc->getElementsByTagName('file');

		if(count($files) == 0){
			return 0;
		}
		else{
			$id = 0;
			foreach($files as $f){
				$thisId = $f->getElementsByTagName('id')->item(0)->nodeValue;
				if($id < $thisId){
					$id = $thisId;
				}
			}
			return $id;
		}
	}

	function isImage($fileType){
		$types = ["jpg", "jpeg", "gif","png", "webp", "tiff", "psd", "raw", "bmp", "heif", "indd"];
		return in_array($fileType, $types);
	}

	function getFileType($file){
		$endOfName = 0;
		for($i = strlen($file)-1; $i > 0; $i--){
			if($file[$i] == "."){
				$endOfName = $i+1;
				break;
			}
		}
		return substr($file, $endOfName);
	}

	function cropImg($file){
		
	}

	header("Location: index.php");
?>
