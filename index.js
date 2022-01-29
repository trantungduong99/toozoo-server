const WebSocket = require('ws')

const CONNECTION_CONST = {
  CMD_DIVIDER : "&|"
}

const GAME_FPS = 24;
const TICKS_LENGTH = 1000 / GAME_FPS;

const CLIENT_STATUS = {
  HAND_SHAKE : 0,
  LOBBY : 1,
  WAIT_IN_ROOM: 2,
  PLAYING: 3
}

var clientId = 0;

const CMD = {
  LOGIN     : 1000,
  REGISTER  : 1001,
  LOGOUT    : 1002,
  PLAY_NOW  : 1003,
  TRAIN     : 1004,
  ENEMY_CREATE: 1005,
  TROOP_ATTACK    : 1006,
}

const ROOM_STATUS = {
  WAITING     : 0,
  PLAYING     : 1
}

var roomId = 0;

const ELEMENTS = {
  WATER       : 0,
  FIRE        : 1,
  WIND        : 2,
  EARTH       : 3,
  LIGHING     : 4
}

const PARTS = {
  BODY : 0,
  HEAD : 1,
  LEGS : 2,
  BACK : 3,
  TAIL : 4,
}

const ATTRIBUTES = {
  DAMAGE       : 0,
  HEALTH       : 1,
  SPEED        : 2,
  MORALE       : 3,
  FLEXIBLE     : 4
}

const GENDER = {
  FEMALE       : 0,
  MALE     : 1
}

const BASE_ATTRIBUTE = 100;
const NUM_OF_ATTRIBUTE = 5;
const NUM_OF_PART = 5;
const ATTACK_RANGE = 20;
const DISTANCE_PER_SEC = 100;
class Troop {
  _head;
  _body;
  _legs;
  _back;
  _tail;
  _element = [];
  _damage;
  _health;
  _speed;
  _morale;
  _flexible;
  _attribute = [];
  _gender;
  _x;
  _lastTimeAttack;
  _status;
  _owner;
  // constructor(head,body,legs,back,tail,gender)
  // {
  //   this._element[PARTS.HEAD] = head;
  //   this._element[PARTS.BODY] = body;
  //   this._element[PARTS.LEGS] = legs;
  //   this._element[PARTS.BACK] = back;
  //   this._element[PARTS.TAIL] = tail;
  //   this._gender = gender;
  //   this.updateAttribute();
  //   this._x = 0;
  //   this._lastTimeAttack = -1;
  // }
  constructor(listPartElements,gender)
  {
    this._element = listPartElements;
    this._gender = gender;
    this.updateAttribute();
    this._x = 0;
    this._lastTimeAttack = -1;

    console.log("Troop moi ne:");
    console.log(this);
  }
  updateAttribute()
  {
    for (var i = 0; i < NUM_OF_ATTRIBUTE; i++)
    {
      this._attribute.push(BASE_ATTRIBUTE);
    }
    for (var element in this._element)
    {
      console.log(this._element[element]);
      switch (Number(this._element[element]))
      {
        case ELEMENTS.WATER:
          this._attribute[ATTRIBUTES.FLEXIBLE] += 30;
          break;
        case ELEMENTS.FIRE:
          this._attribute[ATTRIBUTES.DAMAGE] += 30;
          break;
        case ELEMENTS.WIND:
          this._attribute[ATTRIBUTES.MORALE] += 30;
          break;
        case ELEMENTS.EARTH:
          this._attribute[ATTRIBUTES.HEALTH] += 30;
          break;
        case ELEMENTS.LIGHING:
          this._attribute[ATTRIBUTES.SPEED] += 30;
        break;
      }
    }
    if (this._gender == GENDER.MALE)
    {
      this._attribute[ATTRIBUTES.DAMAGE] += 15;
      this._attribute[ATTRIBUTES.HEALTH] += 15;
    }
    else
    {
      this._attribute[ATTRIBUTES.SPEED] += 15;
      this._attribute[ATTRIBUTES.FLEXIBLE] += 15;
    }
    this._damage = this._attribute[ATTRIBUTES.DAMAGE] / 2;
    this._health = this._attribute[ATTRIBUTES.HEALTH] * 2;
    this._morale = this._attribute[ATTRIBUTES.MORALE] - 100;
    this._speed  = this._attribute[ATTRIBUTES.SPEED] - 50;
    this._flexible = (this._attribute[ATTRIBUTES.FLEXIBLE] - 100) / 165 * 80;    
  }
  canAttack()
  {
    var now = Date.now();
    if (now - this._lastTimeAttack > (200 - this._speed) * 20)
    {
      return true;
    }
    return false;
  }
  attack(target)
  {
    this._lastTimeAttack = Date.now();
    target.getAttacked(this._damage);
    this._owner.room.sendCmdAttack(this._owner);
    //updateRoom(,this._owner.id.toString() + " troops Attack, update Status: ");
  }
  setOwner(owner)
  {
    this._owner = owner;
  }
  getAttacked(dameTaken)
  {
    this._health -= dameTaken;
    if (this._health <= 0)
    {
      //this.die();
    }
  }
  isDead()
  {
    if (this._health <= 0)
      return true;
    return false
  }
  die()
  {
    if (this._owner)
    {
      this._owner.lostTroop();
    }
  }
  attackBase(opponent)
  {
    this.attack(opponent);
  }
}

class Room {
  _status
  _client = [];
  constructor()
  {
    this._id = roomId;
    roomId++;
    console.log("ROOMID: ", this._id, "CREATED!!");
    this._status = ROOM_STATUS.WAITING;
    this._client = [];
    this._startTime;
    this._previousTick;
    this._actualTicks = 0;
    this._timeChecker = -1;
  };
  setStatus(status)
  {
    this._status = status;
    if (this._status === ROOM_STATUS.PLAYING)
    {
      this.startBattle();
    }
  }
  addClient(ws)
  {
    this._client.push(ws);
  }
  gameLoop()
  {
    var now = Date.now()
    this._actualTicks++
    if (this._previousTick + TICKS_LENGTH <= now) {
      var delta = (now - this._previousTick) / 1000
      this._previousTick = now;

      this.update(delta);

      //console.log('delta', delta, '(target: ' + tickLengthMs +' ms)', 'node ticks', this._actualTicks)
      this._actualTicks = 0
    }

    if (Date.now() - this._previousTick < TICKS_LENGTH - 16) {
      setTimeout(function(){
        this.gameLoop();
      }.bind(this));
    } else {
      setImmediate(function(){
        this.gameLoop();
      }.bind(this));
    }
  }

  startBattle()
  {
    this._client[0].opponent = this._client[1];
    this._client[1].opponent = this._client[0];
    this._client[0].playerHeath = 300;
    this._client[1].playerHeath = 300;
    console.log("START BATTLEEEEE");
    //var troop1 = new Troop([0,0,0,0,0],0);
    this._startTime = Date.now();
    this._previousTick = this._startTime;
    console.log("Call game Loop");
    this._client[0].queueTroop = [];
    //this._client[0].addTroop(troop1);
    this._client[1].queueTroop = [];
    this.gameLoop(); 
  }

  finishBattle()
  {
    this.gameLoop = function(){
      console.log("BATTLE HAS ENDED!!!");
    };
  }

  sendCmdAttack(clientWhoTroopAttack)
  {

    for (var i = 0; i < 2; i ++)
    {
      var client = this._client[i];
      var ourTroops = "";
      for (var i = 0; i < client.queueTroop.length; i++)
      {
        if (client.queueTroop[i])
        ourTroops += client.queueTroop[i]._health+"||"+client.queueTroop[i]._x;
      }
      var oppomentTroops = "";
      for (var i = 0; i < client.opponent.queueTroop.length; i++)
      {
        oppomentTroops += client.opponent.queueTroop[i]._health + "||" + client.opponent.queueTroop[i]._x;
      }
      console.log(clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
      client.send(CMD.TROOP_ATTACK + CONNECTION_CONST.CMD_DIVIDER + clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
    }
  }

  update(deltaTime)
  {
    this._timeChecker++;
    if (this._timeChecker == GAME_FPS * 2)
    {
      this._timeChecker = 0;
    }
    //console.log("Update called",deltaTime);
    var troop0 = this._client[0].queueTroop[0];
    var troop1 = this._client[1].queueTroop[0];
    if (troop0)
    {
      if (troop1)
      {
        // 2 quan linh dau tien cham mat nhau
        if (troop0._x + ATTACK_RANGE > (1000 - troop1._x))
        {
          //neu ca 2 cung co the tan cong thi tan cong cung luc
          if (troop0.canAttack() && troop1.canAttack())
          {
            troop0.attack(troop1);
            troop1.attack(troop0);
          }
          else
          {
            // check 1 trong 2 ben tan cong
            if (troop0.canAttack())
              troop0.attack(troop1);
            if (troop1.canAttack())
              troop1.attack(troop0);
          }
        }
        else
        {
          //ca 2 ben di chuyen
          for (let client of this._client)
          {
            for (let troop of client.queueTroop)
            {
              troop._x += DISTANCE_PER_SEC / GAME_FPS;
            }
          }
        }
      }
      else
      {
        // client1 ko co troop, check tan cong, neu ko thi di chuyen
        if (troop0._x > 1000 - ATTACK_RANGE) // co the tan cong doi phuong
        {
          if (troop0.canAttack())
          {
            troop0.attackBase(this._client[1]);
          }
        }
        else
        {
          for (var i = 0; i < this._client[0].queueTroop.length; i++)
          {
            this._client[0].queueTroop[i]._x += DISTANCE_PER_SEC / GAME_FPS;
          }
        }
      }
    }
    else
    {
      //client0 ko co troop
      //check troop client1
      if (troop1)
      {
        if (troop1._x > 1000 - ATTACK_RANGE) // co the tan cong doi phuong
        {
          if (troop1.canAttack())
            troop1.attackBase(this._client[0]);
        }
        else
        {
          for (let troop of this._client[1].queueTroop)
          {
            troop._x += DISTANCE_PER_SEC / GAME_FPS;
          }
        }
      }
      else
      {
        // ca 2 ben ko co quan, ko lam gi ca
      }
    }

    //update status
    
    if (this._client[0].queueTroop[0] && this._client[0].queueTroop[0]._health <= 0)
    {
      this._client[0].lostTroop();
    }

    if (this._client[1].queueTroop[0] && this._client[1].queueTroop[0]._health <= 0)
    {
      this._client[1].lostTroop();
    }

    //check status
    if (this._timeChecker == 0)
    {
      console.log("updateStatus: ");
      if (this._client[0].queueTroop[0])
        console.log(this._client[0].queueTroop[0]._x);
      if (this._client[1].queueTroop[0])
        console.log(this._client[1].queueTroop[0]._x);
    }
  }
}

const wss = new WebSocket.Server({ port: 80 })
CLIENTS=[];
CLIENTS_IN_LOBBY = [];
rooms = [];
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log((message.toString()));
    console.log(ws.id + `sent message => ${message}`);
    var cmd = message.toString().split(CONNECTION_CONST.CMD_DIVIDER);
    console.log(cmd);
    switch (Number(cmd[0]))
    {
      case CMD.LOGIN:
        {
          console.log(`USER SEND LOGIN WITH DATA => ${cmd[1]}`);
          break;
        }
      case CMD.REGISTER:
        {
          console.log(`USER SEND REGISTER WITH DATA => ${cmd[1]}`);
          break;
        }
      case CMD.LOGOUT:
        {
          console.log(`USER LOGGED OUT => ${cmd[1]}`);
          break;
        }
      case CMD.PLAY_NOW:
      {
        console.log(`USER SEND PLAY NOW WITH DATA => ${cmd[1]}`);
        for (var i = 0;i < rooms.length; i++)
        {
          if (rooms[i]._status === ROOM_STATUS.PLAYING)
            continue;
          if (rooms[i]._status === ROOM_STATUS.WAITING)
          {
            ws.room = rooms[i];
            ws.status = CLIENT_STATUS.PLAY_NOW
            rooms[i].addClient(ws);
            rooms[i].setStatus(ROOM_STATUS.PLAYING);
            return;
          }
        }
        console.log("CREATE NEW ROOM");
        var newRoom = new Room();
            newRoom.setStatus(ROOM_STATUS.WAITING)
            newRoom.addClient(ws);
            ws.room = newRoom;
            rooms.push(newRoom);
            return;
        break;
      }
      case CMD.TRAIN:
        {
          console.log(`USER SEND TRAIN => ${cmd[1]}`);
          var troopAttribute = cmd[1].split(',');
          var newTroop = new Troop(troopAttribute,0);
          ws.addTroop(newTroop);
          console.log(CMD.TRAIN+CONNECTION_CONST.CMD_DIVIDER+cmd[1].toString());
          console.log(CMD.ENEMY_CREATE+CONNECTION_CONST.CMD_DIVIDER+cmd[1].toString());
          ws.send("HELLC");
          //ws.opponent.send(CMD.ENEMY_CREATE+"HELLC");
          //ws.opponent.send(CMD.ENEMY_CREATE+CONNECTION_CONST.CMD_DIVIDER+cmd[1].toString());
          break;
        }
      default:
        console.log("No cmdId match ?");
    }
    if (cmd[0] == CMD.LOGIN)
    {
      console.log(`USER SEND LOGIN WITH DATA => ${cmd[1]}`);
    }
  });
  ws.send('Hello! Message From Server!!');
  ws.clientState = CLIENT_STATUS.HAND_SHAKE;
  ws.id = clientId;
  clientId++;
  console.log('User ' + ws.id + ' join server');
  ws.addTroop = function(troop)
  {
    troop.setOwner(ws);
    ws.queueTroop.push(troop);
  }.bind(ws);
  ws.lostTroop = function()
  {
    ws.queueTroop.shift();
  }.bind(ws);
  ws.getAttacked = function(dameTaken)
  {
    ws.playerHeath -= dameTaken;
    if (ws.playerHeath < 0)
    {
      console.log(ws.id+"'s base destroyed, player "+ ws.opponent.id+" is winner!!");
      ws.room.finishBattle();
    }
  }
});

function sendAll (ws,message) {
    for (var i=0; i<CLIENTS.length; i++) {
        CLIENTS[i].send(ws.id + ": " + message);
    }
}

function updateRoom (room,message)
{
  console.log(room);
  room._client[0].send(message);
  room._client[1].send(message);
}

var troop1 = new Troop([0,1,0,0,0],0);

var troop2 = new Troop([1,1,3,3,0],1);

var troop3 = new Troop([4,1,1,4,0],0);