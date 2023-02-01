import { world, system } from "@minecraft/server";

world.events.worldInitialize.subscribe(event => {
  world.scoreboard.addObjective('db', "§dData")
})

const ow = world.getDimension('Overworld')

function t2b(string) {
  return string.split('').map(function (char) {
    return char.charCodeAt(0).toString(2);
  }).join(' ');
}

function b2t(binary) {
  return binary.split(" ").map((char) => {
    return String.fromCharCode(parseInt(char, 2));
  }).join("");
}

function getItem(name) {
  var datas = world.scoreboard.getObjective("db").getParticipants()
  var data = []
  for (const part of datas) {
    data.push(JSON.parse(b2t(part.displayName)))
  }
  return data.find(x => x.name == name)
}

function addItem(name, data) {
  var finalitems = { name: name, data: data }
  const binary = (t2b(JSON.stringify(finalitems)));
  ow.runCommandAsync(`scoreboard players add "${binary}" db 0`)
}

function setItem(name, data) {
  const previousData = getItem(name)
  ow.runCommandAsync(`scoreboard players reset "${t2b(JSON.stringify(previousData))}" db`)
  addItem(name, data)
}



//function set() {
//  setItem("adfsa", ["afa",123123])
//  setItem("adafsa", ["afa",1234123312123])
//}
//
//set()

//system.runSchedule(() => {
//  const start = Date.now()
//  //console.warn(getItem("blocks").data)
//  console.warn(Date.now() - start)
//}, 0)


world.events.blockBreak.subscribe(() => {
  let prev = getItem("blocks").data
  prev.push(Math.random())
  setItem("blocks", prev)
})