/// <reference path=".config/sa.d.ts" />

let policeIDs = [427, 490, 528, 523, 596, 597, 598, 599, 432, 601];

let missionActive = false;

addEventListener("OnVehicleCreate", ({ data }) => {
  if (!missionActive) return;

  let { address } = data;
  let car = Memory.GetVehicleRef(address);

  if (policeIDs.includes(car.getModel())) {
    Blip.AddForCar(car).changeScale(2);
  }
});

function getCharDistanceTo3DCoords(char, px, py, pz) {
  const { x, y, z } = char.getCoordinates();
  return Math.GetDistanceBetweenCoords3D(px, py, pz, x, y, z);
}

async function spawnCar(id, x, y, z, clr1, clr2, heading) {
  Streaming.RequestModel(id);
  Streaming.LoadAllModelsNow();
  while (!Streaming.IsModelAvailable(id)) {
    Streaming.RequestModel(id);
    await asyncWait(250);
  }
  let veh = Car.Create(id, x, y, z);
  veh.changeColor(clr1, clr2);
  veh.setHeading(heading);
  veh.setCanBeDamaged(false);
  return veh;
}

async function fade(time, mode) {
  Camera.DoFade(time, mode);
  await asyncWait(time);
}

function getRandomIndex(len) {
  return Math.floor(Math.random() * len);
}

function getRandomBool(bias) {
  if (!bias) bias = 0.5;
  return Math.random() > bias;
}

function areCopsNearby() {
  var player = new Player(0);
  var char = player.getChar();
  const { x, y, z } = char.getCoordinates();
  return World.IsCopVehicleInArea3DNoSave(
    x - 75,
    y - 75,
    z - 75,
    x + 75,
    y + 75,
    z + 75
  );
}

let startCheckpoints = [[2351.4167, -652.9949, 127.6202, 359]];

let endCheckpoints = [[-934.9498, -529.3381, 25.9536]];

async function main() {
  var player = new Player(0);
  var char = player.getChar();

  let start = startCheckpoints[getRandomIndex(startCheckpoints.length)];

  let currentCP = Sphere.Create(start[0], start[1], start[2], 1.2);
  let currentBlip = Blip.AddSpriteForCoord(start[0], start[1], start[2], 55);

  let shownMSG = false;
  let sleep = 100;

  while (!missionActive) {
    if (
      char.locateStoppedOnFoot3D(
        start[0],
        start[1],
        start[2],
        1.2,
        1.2,
        1.2,
        false
      ) &&
      !ONMISSION
    ) {
      if (ONMISSION) {
        if (!shownMSG) {
          showTextBox("Prvo zavrsi sto radis pa se vrati!");
          shownMSG = true;
        }
      } else {
        sleep = 5;
        if (!shownMSG) {
          showTextBox("Pritisni E da zapocnes misiju!!");
          shownMSG = true;
        }
        if (Pad.IsKeyPressed(69)) {
          missionActive = true;
        }
      }
    } else {
      shownMSG = false;
      sleep = 100;
    }
    await asyncWait(sleep);
  }

  Text.PrintBigString("transportator", 2500, 2);
  await fade(1000, 0);

  ONMISSION = true;
  Stat.RegisterMissionGiven();
  currentCP.remove();
  currentBlip.remove();

  let end = endCheckpoints[getRandomIndex(endCheckpoints.length)];
  let zarada = getCharDistanceTo3DCoords(char, end[0], end[1], end[2]) * 5;

  let veh = await spawnCar(411, start[0], start[1], start[2], 0, 0, start[3]);
  char.warpIntoCar(veh);
  await fade(1000, 1);
  Text.PrintStringNow("Prevezi vozilo i pazi na kerove!", 5000);

  currentCP = Sphere.Create(end[0], end[1], end[2], 3);
  currentBlip = Blip.AddSpriteForCoord(end[0], end[1], end[2], 0);
  currentBlip.changeColor(4);
  currentBlip.changeScale(3);

  let inCP = false;
  while (ONMISSION) {
    if (
      veh.locate3D(end[0], end[1], end[2], 3.0, 3.0, 3.0, false) &&
      veh.getSpeed() === 0 &&
      !inCP
    ) {
      inCP = true;

      if (player.isWantedLevelGreater(0)) {
        Text.PrintStringNow("Panduri te jure, otarasi ih se prvo!", 5000);
      } else {
        await fade(1000, 0);
        currentCP.remove();

        zarada = (zarada / 100) * (veh.getHealth() / 10);

        char.removeFromCarMaintainPosition(veh);
        veh.delete();
        currentBlip.remove();
        await fade(1000, 1);

        player.addScore(zarada);
        Text.PrintWithNumberBig("M_PASS", zarada, 2500, 1);
        Audio.PlayMissionPassedTune(2);
        ONMISSION = false;
        missionActive = false;
      }
    } else inCP = false;

    if (
      char.isInCar(veh) &&
      areCopsNearby() &&
      !player.isWantedLevelGreater(0)
    ) {
      player.alterWantedLevel(3);
      Text.PrintStringNow(
        "Policija je prepoznala vozilo! Otarasi ih se pre nego sto ga dostavis!",
        5000
      );
    }

    await asyncWait(1000);
  }
}

(async () => {
  await main();
})();
