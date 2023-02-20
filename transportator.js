/// <reference path=".config/sa.d.ts" />

let policeIDs = [427, 490, 528, 523, 596, 597, 598, 599, 432, 601];
let carIDs = [
  602, 496, 401, 518, 527, 589, 419, 587, 533, 526, 474, 545, 517, 410, 600,
  436, 439, 549, 491, 602, 496, 401, 518, 527, 589, 419, 587, 533, 526, 474,
  545, 517, 410, 600, 436, 439, 549, 491, 536, 575, 534, 567, 535, 576, 412,
  402, 542, 603, 475, 429, 541, 415, 480, 562, 565, 434, 494, 502, 503, 411,
  559, 561, 560, 506, 451, 558, 555, 477,
];

let checkpoints = [
  [2351.4167, -652.9949, 127.6202, 359],
  [249.9106, -1387.6295, 53.1093, 90],
  [2802.9223, -2377.5175, 13.6299, 188],
  [-541.12, -74.1752, 62.8593, 92],
  [-91.957, -38.45, 3.1171, 161],
  [886.3692, -25.6296, 62.9788, 157],
  [1019.9101, -302.5046, 73.993, 0],
  [2149.1872, -97.7282, 2.7176, 346],
  [2348.1723, -1245.2332, 22.5, 95],
  [290.699, -1517.6916, 24.3588, 50],
  [2791.6044, -1431.4107, 23.9477, 90],
  [1645.7396, -1699.6694, 20.2427, 271],
  [1246.8513, -2009.8676, 59.559, 0],
  [833.3419, -1166.2478, 16.7368, 91],
  [2138.1577, -1284.8424, 24.3358, 0],
];

let stuff = ["prljav novac", "trava", "belo", "zlato", "heroin"];

let newMissionMSGs = [
  "Yo, treba da mi se preveze neka roba! Jel bi ti to mogao da uradis?",
  "Imam posao za tebe!",
  "Hej, treba mi neko da mi preveze auto! Da li si slobodan?",
  "Znas li da vozis? Imam dobru ponudu za tebe!",
];

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

async function mission() {
  var player = new Player(0);
  var char = player.getChar();

  let start = checkpoints[getRandomIndex(checkpoints.length)];
  let currentBlip = Blip.AddSpriteForCoord(start[0], start[1], start[2], 55);
  let veh;

  while (!veh) {
    if (
      char.locateStoppedOnFoot3D(
        start[0],
        start[1],
        start[2],
        150,
        150,
        150,
        false
      )
    ) {
      veh = await spawnCar(
        carIDs[getRandomIndex(carIDs.length)],
        start[0],
        start[1],
        start[2],
        0,
        0,
        start[3]
      );
      break;
    }

    await asyncWait(1000);
  }

  while (!missionActive) {
    if (char.isInCar(veh) && !ONMISSION) missionActive = true;
    await asyncWait(1000);
  }

  Text.PrintBigString("transportator", 2500, 2);
  await fade(1000, 0);

  ONMISSION = true;
  Stat.RegisterMissionGiven();
  currentBlip.remove();

  let end;
  while (!end || end == start)
    end = checkpoints[getRandomIndex(checkpoints.length)];

  let carrying = getRandomIndex(stuff.length);
  let zarada =
    getCharDistanceTo3DCoords(char, end[0], end[1], end[2]) *
    (5 + carrying * 1.5);

  await fade(1000, 1);

  Text.PrintStringNow(
    `U autu se nalazi ~g~${stuff[carrying]}~w~! Prevezi ~b~auto~w~ do ~y~lokacije~w~ i izbegavaj ~r~muriju~w~!`,
    5000
  );

  let currentCP = Sphere.Create(end[0], end[1], end[2], 3);
  currentBlip = Blip.AddSpriteForCoord(end[0], end[1], end[2], 0);
  currentBlip.changeColor(4).changeScale(3);

  let inCP = false;
  while (ONMISSION) {
    if (
      veh.locate3D(end[0], end[1], end[2], 3.0, 3.0, 3.0, false) &&
      veh.getSpeed() === 0 &&
      !inCP
    ) {
      inCP = true;

      if (player.isWantedLevelGreater(0)) {
        Text.PrintStringNow(
          "~r~Panduri~w~ te jure, ~y~otarasi~w~ ih se prvo!",
          5000
        );
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
        break;
      }
    } else inCP = false;

    if (
      char.isInCar(veh) &&
      areCopsNearby() &&
      !player.isWantedLevelGreater(0)
    ) {
      player.alterWantedLevel(3);
      Text.PrintStringNow(
        "~r~Policija~w~ je prepoznala ~b~vozilo~w~! ~y~Otarasi~w~ ih se pre nego sto ga dostavis!",
        5000
      );
    }
    if (Car.IsDead(veh)) {
      await fade(1000, 0);
      char.removeFromCarMaintainPosition(veh);
      veh.delete();
      currentCP.remove();
      currentBlip.remove();
      await fade(1000, 1);
      ONMISSION = false;
      missionActive = false;
      Text.PrintBig("M_FAIL", 2500, 1);
      break;
    }

    await asyncWait(1000);
  }
}

(async () => {
  while (1 < 2) {
    await asyncWait((getRandomIndex(0) + 0) * 60000);
    await asyncWait(15000);
    let msg = newMissionMSGs[getRandomIndex(newMissionMSGs.length)];
    showTextBox(`PEDZER: ${msg}`);
    await mission();
  }
})();
