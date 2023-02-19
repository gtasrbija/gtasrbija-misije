/// <reference path=".config/sa.d.ts" />

Game.EnableBurglaryHouses(true); // Enable burglary houses

var player = new Player(0);
var char = player.getChar();

const kafanaX = 681.4,
  kafanaY = -453.6,
  kafanaZ = -26.61;
var currentBlip = Blip.AddSpriteForCoord(kafanaX, kafanaY, kafanaZ, 49);
var inCP = false;
var nivaID = 424;
var prodavnice = [
  [1315.488, -900.843, 39.5781],
  [997.4465, -919.681, 42.1797],
  [1351.934, -1755.936, 13.352],
  [1830.412, -1843.954, 13.5781],
];

function waitWhileNotInCP(x, y, z, s1, s2, s3, draw) {
  while (!inCP) {
    if (char.locateStoppedOnFoot3D(x, y, z, s1, s2, s3, draw)) {
      var inCP = true;
    }
    wait(100);
  }
}

function getPlayerDistanceTo3DCoords(x, y, z) {
  const { px, py, pz } = char.getCoordinates();
  return Math.GetDistanceBetweenCoords3D(px, py, pz, x, y, z);
}

function spawnCar(id, x, y, z, clr1, clr2, heading) {
  if (kola) kola.delete();
  Streaming.RequestModel(id);
  Streaming.LoadAllModelsNow();
  while (!Streaming.IsModelAvailable(id)) {
    Streaming.RequestModel(id);
    wait(250);
  }
  kola = Car.Create(id, x, y, z);
  kola.changeColor(clr1, clr2);
  kola.setHeading(heading);
  kola.setCanBeDamaged(false);
  return kola;
}

function fade(time, mode) {
  Camera.DoFade(time, mode);
  wait(time);
}

function getRandomIndex(len) {
  return Math.floor(Math.random() * len);
}

function getRandomBool(bias) {
  if (!bias) bias = 0.5;
  return Math.random() > bias;
}

var misijaProdavnica;

var kola;

var zarada = 0;

//waitWhileNotInCP(681.4766, -451.1510, -25.6094, 3.0, 3.0, 3.0, false);

currentCP = Sphere.Create(kafanaX, kafanaY, kafanaZ, 1.2); //681.4766 -451.1510 -25.6094
var shownMSG = true;
var started = false;
var sleep = 100;
while (!started) {
  if (
    char.locateStoppedOnFoot3D(
      kafanaX,
      kafanaY,
      kafanaZ,
      1.2,
      1.2,
      1.2,
      false
    ) &&
    !ONMISSION
  ) {
    if (ONMISSION) {
      if (!shownMSG) {
        showTextBox(
          "Trenutno nema vinjaka, a i ti imas preca posla, vrati se kada ih zavrsis!"
        );
        shownMSG = true;
      }
    } else {
      sleep = 5;
      if (!shownMSG) {
        showTextBox(
          "Trenutno nema vinjaka, pritisni E ako zelis da ga dostavis!"
        );
        shownMSG = true;
      }
      if (Pad.IsKeyPressed(69)) {
        started = true;
      }
    }
  } else {
    shownMSG = false;
    sleep = 100;
  }
  wait(sleep);
}

ONMISSION = true;
Stat.RegisterMissionGiven();
currentCP.remove();
currentBlip.remove();

Text.PrintBigString("vinjak pijem, zenu bijem", 2500, 2);
fade(1000, 0);

spawnCar(nivaID, 687.1619, -480.8694, 16.0559, 1, 1, 90.0);

currentBlip = Blip.AddForCar(kola);
currentBlip.changeColor(4);
currentBlip.changeScale(3);

Camera.DoFade(1000, 1);
//
Text.PrintStringNow("Udji u ~y~Ladu Nivu~w~!", 5000);
wait(1000);

inCP = false;

function prodavnicasranje() {
  misijaProdavnica = prodavnice[getRandomIndex(prodavnice.length)];
  currentCP = Sphere.Create(
    misijaProdavnica[0],
    misijaProdavnica[1],
    misijaProdavnica[2],
    3
  );
  currentBlip.remove();
  currentBlip = Blip.AddSpriteForCoord(
    misijaProdavnica[0],
    misijaProdavnica[1],
    misijaProdavnica[2],
    0
  );
  currentBlip.changeColor(4);
  currentBlip.changeScale(3);

  waitWhileNotInCP(
    misijaProdavnica[0],
    misijaProdavnica[1],
    misijaProdavnica[2],
    3.0,
    3.0,
    3.0,
    false
  );
  zarada += getPlayerDistanceTo3DCoords(
    misijaProdavnica[0],
    misijaProdavnica[1],
    misijaProdavnica[2]
  );
  currentCP.remove();

  if (!getRandomBool()) {
    Text.PrintStringNow(
      "U ovoj prodavnici ~r~nema vinjaka~w~, idi do ~y~druge~w~!",
      5000
    );
    prodavnicasranje();
  }
}

while (!char.isInCar(kola)) wait(250);
Text.PrintStringNow("Idi do ~y~prodavnice~w~ i kupi vinjak!", 5000);
prodavnicasranje();

Text.PrintStringNow("Sada dostavi vinjak u ~y~kafanu~w~!", 5000);
var currentCP = Sphere.Create(681.2266, -474.8171, 16.5363, 3);
inCP = false;

currentBlip.remove();
currentBlip = Blip.AddSpriteForCoord(681.2266, -474.8171, 16.5363, 0);
currentBlip.changeColor(4);
currentBlip.changeScale(3);

while (!inCP) {
  if (
    kola.locate3D(681.2266, -474.8171, 16.5363, 3.0, 3.0, 3.0, false) &&
    kola.getSpeed() === 0
  ) {
    inCP = true;
    //
  }
  wait(100);
}

fade(1000, 0);
currentCP.remove();

zarada = (zarada / 100) * (kola.getHealth() / 10);

char.removeFromCarMaintainPosition(kola);
kola.delete();
currentBlip.remove();
fade(1000, 1);

player.addScore(zarada);
Text.PrintWithNumberBig("M_PASS", zarada, 2500, 1);
Audio.PlayMissionPassedTune(2);
ONMISSION = false;

// 681.4442 -453.8750 -25.6094

currentCP = Sphere.Create(kafanaX, kafanaY, kafanaZ, 1.2); //681.4766 -451.1510 -25.6094
var shownMSG = true;
var popio = false;
var sleep = 100;
while (1 < 2) {
  if (
    char.locateStoppedOnFoot3D(kafanaX, kafanaY, kafanaZ, 1.2, 1.2, 1.2, false)
  ) {
    sleep = 5;
    if (!shownMSG) {
      showTextBox("Pritisni E da kupis vinjak!");
      shownMSG = true;
    }
    if (Pad.IsKeyPressed(69) && !popio) {
      player.setDrunkenness(300);
      Pad.SetDrunkInputDelay(0, getRandomIndex(10));
      Pad.SetDrunkInputDelay(1, getRandomIndex(10));
      popio = true;
    }
  } else {
    popio = false;
    shownMSG = false;
    sleep = 100;
  }
  wait(sleep);
}
