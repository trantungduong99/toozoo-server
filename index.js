const WebSocket = require('ws')
const https = require('https')
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

const serverData = process.env.SERVER_DATA_URL || 'https://toozoodata.herokuapp.com';

const PORT = process.env.PORT || 80;

var clientId = 0;

const CMD = {
  LOGIN     : 1000,
  REGISTER  : 1001,
  LOGOUT    : 1002,
  PLAY_NOW  : 1003,
  TRAIN     : 1004,
  ENEMY_CREATE: 1005,
  TROOP_ATTACK    : 1006,
  BOTH_ATTACK   :1007,
  BATTLE_END: 1008,
  CANCEL_PLAY: 1009,
  PING: 1010,
  UPDATE: 1111,
}

const ROOM_STATUS = {
  WAITING     : 0,
  PLAYING     : 1
}

const BATTLE_RESULT = {
  LOSE : 0,
  WIN : 1,
  DRAW : 2,
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
  HEAD : 0,
  BODY : 1,
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

const TROOP_STATUS = {
  CREATED : 0,
  WAIT : 1,
  MOVE : 2,
  ATTACK : 3,
  IDLE : 4,
  LAST_STAND : 5,
  DEAD : 6,
}

const BASE_ATTRIBUTE = 100;
const NUM_OF_ATTRIBUTE = 5;
const NUM_OF_PART = 5;
const SPACE_BETWEEN_TROOP = 80;
const ATTACK_RANGE = 120;
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
          this._attribute[ATTRIBUTES.SPEED] += 20;
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
    //target.getAttacked(this._damage);
    //this._owner.room.sendCmdAttack(this._owner);
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
      console.log("DIEEE");
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
  checkCrit() {
    if (this._rateCrit == undefined) {
      this._rateCrit = this._morale * 100 / 150;
    }
    if (Math.floor(Math.random() * 100) < this._rateCrit)
    {
      return true;
    }
    return false;
  }
  getDamageCrit()
  {
    return this._damage * (2 + (this._morale) / 100);
  }
  getDamageToElement(elementId, isCrit)
  {
    let damage;
    if (isCrit == true)
      damage = this.getDamageCrit();
    else
      damage = this._damage;
    if (elementId - this._element[0] == 1 ||  elementId - this._element[0] == -4)
    {
      damage = damage*1.1;
    }
    else if (elementId - this._element[0] == -1 || elementId - this._element == 4)
    {
      damage = damage*0.9;
    }
    return damage;
  }
  checkDodge()
  {
    return Math.floor(Math.random() * 100) < this._flexible;
    return false;
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
    this._timeChecker = 0;
    this._timeBattle = 0;
  };
  setStatus(status)
  {
    this._status = status;
    if (this._status === ROOM_STATUS.PLAYING)
    {
      this.startBattle();
      var newGame = {};
      newGame.cmdId = CMD.PLAY_NOW
      this._client[0].send(JSON.stringify(newGame));
      this._client[1].send(JSON.stringify(newGame));
      this._client[0].status = CLIENT_STATUS.PLAYING;
      this._client[1].status = CLIENT_STATUS.PLAYING;
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

    if (Date.now() - this._previousTick < TICKS_LENGTH - 24) {
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
    this._client[0].gold = 300;
    this._client[1].gold = 300;
    console.log("START BATTLEEEEE");
    //var troop1 = new Troop([0,0,0,0,0],0);
    this._startTime = Date.now();
    this._previousTick = this._startTime;
    console.log("Call game Loop");
    this._client[0].queueTroop = [];
    //this._client[0].addTroop(troop1);
    this._client[1].queueTroop = [];
    this._timeBattle = 0;
    this.gameLoop(); 
  }

  finishBattle()
  {
    this._client[0].status = CLIENT_STATUS.LOBBY;
    this._client[1].status = CLIENT_STATUS.LOBBY;
    this.gameLoop = function(){
      console.log("BATTLE HAS ENDED!!!");
    };
  }

  // sendCmdAttack(clientWhoTroopAttack)
  // {
  //
  //   for (var i = 0; i < 2; i ++)
  //   {
  //     var client = this._client[i];
  //     var ourTroops = "";
  //     for (var i = 0; i < client.queueTroop.length; i++)
  //     {
  //       if (client.queueTroop[i])
  //       ourTroops += client.queueTroop[i]._health+"||"+client.queueTroop[i]._x;
  //     }
  //     var oppomentTroops = "";
  //     for (var i = 0; i < client.opponent.queueTroop.length; i++)
  //     {
  //       oppomentTroops += client.opponent.queueTroop[i]._health + "||" + client.opponent.queueTroop[i]._x;
  //     }
  //     console.log(clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
  //     var attackData = {};
  //     attackData.cmdId = CMD.TROOP_ATTACK;
  //     attackData.myDamage = 50;
  //     attackData.isCrit = false;
  //     attackData.isMiss = false;
  //     attackData.message = clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops;
  //     client.send(JSON.stringify(attackData));
  //     //client.send(CMD.TROOP_ATTACK + CONNECTION_CONST.CMD_DIVIDER + clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
  //   }
  // }
  //
  // sendCmdAttackBoth()
  // {
  //   for (var i = 0; i < 2; i ++)
  //   {
  //     var client = this._client[i];
  //     var ourTroops = "";
  //     // for (var i = 0; i < client.queueTroop.length; i++)
  //     // {
  //     //   if (client.queueTroop[i])
  //     //     ourTroops += client.queueTroop[i]._health+"||"+client.queueTroop[i]._x;
  //     // }
  //     // var oppomentTroops = "";
  //     // for (var i = 0; i < client.opponent.queueTroop.length; i++)
  //     // {
  //     //   oppomentTroops += client.opponent.queueTroop[i]._health + "||" + client.opponent.queueTroop[i]._x;
  //     // }
  //     //console.log("Both troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
  //     var attackData = {};
  //     attackData.cmdId = CMD.BOTH_ATTACK;
  //     attackData.message = "take object";
  //     attackData.myDamage = 50;
  //     attackData.isCrit = false;
  //     attackData.isMiss = false;
  //     attackData.enemyDamage = 50;
  //     attackData.isEnemyCrit = false;
  //     attackData.isEnemyMiss = false;
  //     //attackData.message = "Both troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops;
  //     client.send(JSON.stringify(attackData));
  //     //client.send(CMD.TROOP_ATTACK + CONNECTION_CONST.CMD_DIVIDER + clientWhoTroopAttack.id+"'s troop attack, our HP: " +client.playerHeath+"-"+ client.opponent.playerHeath+ " update status troop: "+ourTroops+"~~"+oppomentTroops);
  //   }
  // }

  checkRemoveDeadTroop()
  {
    if (this._client[0].queueTroop[0]) {
      if (this._client[0].queueTroop[0]._health <= 0)
      {
        console.log("Remove troop of ", this._client[0].id);
        this._client[0].queueTroop.shift();
        this._client[1].gold += 45;
      }
    }
    if (this._client[1].queueTroop[0]) {
      if (this._client[1].queueTroop[0]._health <= 0)
      {
        console.log("Remove troop of ", this._client[1].id);
        this._client[1].queueTroop.shift();
        this._client[0].gold += 45;
      }
    }
  }

  update(deltaTime)
  {
    this._timeChecker++;
    if (this._timeChecker == GAME_FPS)
    {
      this._timeChecker = 0;
    }
    //console.log("Update called",deltaTime);
    var troop0 = this._client[0].queueTroop[0];
    var troop1 = this._client[1].queueTroop[0];


    if (!troop0 && !troop1)
    {
      //ko ben nao co troop
    }
    else
    {
      if (!troop0)
      {
        //ta ko co troop, enemy co troop
        if (troop1._x < 1000)
        {
          troop1._status = TROOP_STATUS.MOVE;
        }
        else
        {
          troop1._status = TROOP_STATUS.IDLE;
          if (troop1.canAttack())
          {
            troop1.attack(null);
            var attackData = {};
            attackData.cmdId = CMD.TROOP_ATTACK;
            attackData.isCrit = troop1.checkCrit();
            if (attackData.isCrit)
            {
              attackData.myDamage = troop1.getDamageCrit();
            }
            else {
              attackData.myDamage = troop1._damage;
            }
            attackData.isMiss = false;

            if (!attackData.isMiss)
            {
              this._client[0].getAttacked(attackData.myDamage);
            }

            attackData.message = "troop attack Base";
            attackData.isMyAttack = true;
            this._client[1].send(JSON.stringify(attackData));
            console.log("Troop of ",this._client[1].id," attack base");
            attackData.isMyAttack = false;
            this._client[0].send(JSON.stringify(attackData));
          }
        }
        for (var i = 1; i < this._client[1].queueTroop.length; i++) {
          if (Math.abs(this._client[1].queueTroop[i]._x - this._client[1].queueTroop[i-1]._x) < SPACE_BETWEEN_TROOP)
          {
            this._client[1].queueTroop[i]._status = TROOP_STATUS.WAIT;
          }
          else
          {
            this._client[1].queueTroop[i]._status = TROOP_STATUS.MOVE;
          }
        }
      }
      else if (!troop1)
      {
        //dich ko co troop, ta co troop
        if (troop0._x >= 1000)
        {
          //dich tan cong base
          troop0._status = TROOP_STATUS.IDLE;
          if (troop0.canAttack())
          {
            troop0.attack(null);
            var attackData = {};
            attackData.cmdId = CMD.TROOP_ATTACK;
            attackData.myDamage = troop0._damage;
            attackData.isCrit = troop0.checkCrit();
            attackData.isMiss = false;

            if (!attackData.isMiss)
            {
              this._client[1].getAttacked(attackData.myDamage);
            }
            console.log("Troop of ",this._client[0].id," attack base");
            attackData.message = "troop attack Base";
            attackData.isMyAttack = true;
            this._client[0].send(JSON.stringify(attackData));
            attackData.isMyAttack = false;
            this._client[1].send(JSON.stringify(attackData));
          }
        }
        else
        {
          troop0._status = TROOP_STATUS.MOVE;
        }

        for (var i = 1; i < this._client[0].queueTroop.length; i++)
        {
          if (Math.abs((this._client[0].queueTroop[i]._x - this._client[0].queueTroop[i - 1]._x)) < SPACE_BETWEEN_TROOP)
          {
            this._client[0].queueTroop[i]._status = TROOP_STATUS.WAIT;
          }
          else
          {
            this._client[0].queueTroop[i]._status  = TROOP_STATUS.MOVE;
          }
        }
      }
      else
      {
        //ca 2 ben cung co linh
        for (var i = 0; i < this._client[0].queueTroop.length; i++)
        {
          this._client[0].queueTroop[i]._status  = TROOP_STATUS.MOVE;
        }
        for (var i = 0; i < this._client[1].queueTroop.length; i++)
        {
          this._client[1].queueTroop[i]._status  = TROOP_STATUS.MOVE;
        }
        if (Math.abs(troop0._x - (1000 - troop1._x)) <= ATTACK_RANGE)
        {
          troop0._status = TROOP_STATUS.IDLE;
          troop1._status = TROOP_STATUS.IDLE;
          // linh dau tien nam trong tam danh
          // test
          if (troop1.canAttack() && troop0.canAttack())
          {
            this._attackBothData = {};
            this._attackBothData.cmdId = CMD.BOTH_ATTACK;
            this._attackBothData.message = "take object";
            this._attackBothData.isCrit = troop0.checkCrit();
            //this._attackBothData.isCrit = false;
            if (this._attackBothData.isCrit) {
              this._attackBothData.myDamage = troop0.getDamageCrit();
            }
            else
            {
              this._attackBothData.myDamage = troop0._damage;
            }
            this._attackBothData.myDamage = troop0.getDamageToElement(troop1._element[0], this._attackBothData.isCrit);
            this._attackBothData.isMiss = troop1.checkDodge();
            //this._attackBothData.isMiss = false;
            troop0.attack();
            if (!this._attackBothData.isMiss)
            {
              troop1.getAttacked(this._attackBothData.myDamage);
            }

            this._attackBothData.isEnemyCrit = troop1.checkCrit();
            if (this._attackBothData.isEnemyCrit)
            {
              this._attackBothData.enemyDamage = troop1.getDamageCrit();
            }
            else
            {
              this._attackBothData.enemyDamage = troop1._damage;
            }
            this._attackBothData.enemyDamage = troop1.getDamageToElement(troop0._element[0], this._attackBothData.isEnemyCrit);
            this._attackBothData.isEnemyMiss = troop0.checkDodge();
            troop1.attack();
            if (!this._attackBothData.isEnemyMiss)
            {
              troop0.getAttacked(this._attackBothData.enemyDamage);
            }
            this._client[0].send(JSON.stringify(this._attackBothData));
            //reverse attack
            var tempDame = this._attackBothData.enemyDamage;
            var tempCrit = this._attackBothData.isEnemyCrit;
            var tempMiss = this._attackBothData.isEnemyMiss;
            this._attackBothData.enemyDamage = this._attackBothData.myDamage;
            this._attackBothData.isEnemyCrit = this._attackBothData.isCrit;
            this._attackBothData.isEnemyMiss = this._attackBothData.isMiss;
            this._attackBothData.myDamage = tempDame;
            this._attackBothData.isCrit = tempCrit;
            this._attackBothData.isMiss = tempMiss;
            this._client[1].send(JSON.stringify(this._attackBothData));

            console.log("Send attack both");
            //this.sendCmdAttack(this._client[0]);
            //this._owner.room.sendCmdAttack(this._owner);
            // troop1.attack(troop0);
            //this.sendCmdAttackBoth();

          }
          else
          {
            // 1 trong 2 ben co the tan cong
            if (troop0.canAttack())
            {
              troop0.attack(troop1);

              var attackData = {};
              attackData.cmdId = CMD.TROOP_ATTACK;
              attackData.myDamage = troop0._damage;
              attackData.isCrit = troop0.checkCrit();
              attackData.isMiss = troop1.checkDodge();
              if (attackData.isCrit)
              {
                attackData.myDamage = troop0.getDamageCrit();
              }
              attackData.myDamage = troop0.getDamageToElement(troop1._element[0],attackData.isCrit)
              if (!attackData.isMiss)
              {
                troop1.getAttacked(attackData.myDamage);
              }

              attackData.message = "troop attack";
              attackData.isMyAttack = true;
              console.log("Troop of ",this._client[0].id," attack clientas");
              this._client[0].send(JSON.stringify(attackData));
              attackData.isMyAttack = false;
              this._client[1].send(JSON.stringify(attackData));
              //this.sendCmdAttack(this._client[0]);
            }
            if (troop1.canAttack())
            {
              troop1.attack(troop0);

              var attackData = {};
              attackData.cmdId = CMD.TROOP_ATTACK;
              attackData.myDamage = troop1._damage;
              attackData.isCrit = troop1.checkCrit();
              attackData.isMiss = troop0.checkDodge();
              if (attackData.isCrit)
              {
                attackData.myDamage = troop1.getDamageCrit();
              }
              attackData.myDamage = troop1.getDamageToElement(troop0._element[0],attackData.isCrit);
              if (!attackData.isMiss)
              {
                troop0.getAttacked(attackData.myDamage);
              }

              attackData.message = "troop attack";
              attackData.isMyAttack = true;
              console.log("Troop of ",this._client[1].id," attack tropasd");
              this._client[1].send(JSON.stringify(attackData));
              attackData.isMyAttack = false;
              this._client[0].send(JSON.stringify(attackData));
              //this.sendCmdAttack(this._client[0]);
              //this.sendCmdAttack(this._client[1]);
            }
          }
        }
        this.checkRemoveDeadTroop();
        for (let client of this._client)
        {
          for (var i = 1; i < client.queueTroop.length; i++)
          {
            if (Math.abs(client.queueTroop[i]._x - client.queueTroop[i-1]._x) < SPACE_BETWEEN_TROOP)
            {
              client.queueTroop[i]._status = TROOP_STATUS.WAIT;
            }
          }
        }
      }
    }

    //update status

    // if (this._client[0].queueTroop[0] && this._client[0].queueTroop[0]._health <= 0)
    // {
    //   this._client[0].lostTroop();
    // }
    //
    // if (this._client[1].queueTroop[0] && this._client[1].queueTroop[0]._health <= 0)
    // {
    //   this._client[1].lostTroop();
    // }

    for (let client of this._client)
    {
      for (let troop of client.queueTroop)
      {
        if (troop._status == TROOP_STATUS.MOVE)
        {
          troop._x += DISTANCE_PER_SEC / GAME_FPS;
        }
      }
    }

    // if (troop0)
    // {
    //   if (troop1)
    //   {
    //     // 2 quan linh dau tien cham mat nhau
    //     if (troop0._x + ATTACK_RANGE > (1000 - troop1._x))
    //     {
    //       //neu ca 2 cung co the tan cong thi tan cong cung luc
    //       if (troop0.canAttack() && troop1.canAttack())
    //       {
    //         troop0.attack(troop1);
    //         //this.sendCmdAttack(this._client[0]);
    //         //this._owner.room.sendCmdAttack(this._owner);
    //         troop1.attack(troop0);
    //         this.sendCmdAttackBoth();
    //
    //       }
    //       else
    //       {
    //         // check 1 trong 2 ben tan cong
    //         if (troop0.canAttack())
    //         {
    //           troop0.attack(troop1);
    //           this.sendCmdAttack(this._client[0]);
    //         }
    //         if (troop1.canAttack())
    //         {
    //           troop1.attack(troop0);
    //           this.sendCmdAttack(this._client[1]);
    //         }
    //       }
    //     }
    //     else
    //     {
    //       //ca 2 ben di chuyen
    //       for (let client of this._client)
    //       {
    //         for (let troop of client.queueTroop)
    //         {
    //           troop._x += DISTANCE_PER_SEC / GAME_FPS;
    //         }
    //       }
    //     }
    //   }
    //   else
    //   {
    //     // client1 ko co troop, check tan cong, neu ko thi di chuyen
    //     if (troop0._x > 1000 - ATTACK_RANGE) // co the tan cong doi phuong
    //     {
    //       if (troop0.canAttack())
    //       {
    //         troop0.attackBase(this._client[1]);
    //       }
    //     }
    //     else
    //     {
    //       for (var i = 0; i < this._client[0].queueTroop.length; i++)
    //       {
    //         this._client[0].queueTroop[i]._x += DISTANCE_PER_SEC / GAME_FPS;
    //       }
    //     }
    //   }
    // }
    // else
    // {
    //   //client0 ko co troop
    //   //check troop client1
    //   if (troop1)
    //   {
    //     if (troop1._x > 1000 - ATTACK_RANGE) // co the tan cong doi phuong
    //     {
    //       if (troop1.canAttack())
    //         troop1.attackBase(this._client[0]);
    //     }
    //     else
    //     {
    //       for (let troop of this._client[1].queueTroop)
    //       {
    //         troop._x += DISTANCE_PER_SEC / GAME_FPS;
    //       }
    //     }
    //   }
    //   else
    //   {
    //     // ca 2 ben ko co quan, ko lam gi ca
    //   }
    // }

    //check status
    if (this._timeChecker == 0)
    {
      this._timeBattle ++;
      console.log("updateStatus: ", this._timeBattle);
      if (this._client[0].queueTroop[0])
        console.log(this._client[0].queueTroop[0]._x);
      if (this._client[1].queueTroop[0])
        console.log(this._client[1].queueTroop[0]._x);
      this._client[0].gold += 3;
      this._client[1].gold += 3;
      if (this._timeBattle % 3 == 0) {
        var updateData = {};
        updateData.cmdId = CMD.UPDATE;
        var data = {};
        data.playerHeath = this._client[0].playerHeath;
        var listTroop = [];
        var troopData = [];
        for (var i = 0; i < this._client[0].queueTroop.length; ++i) {
          listTroop.push(this._client[0].queueTroop[i]._x);
          var attribute = [];
          for (var element of this._client[0].queueTroop[i]._element)
            attribute.push(element)
          attribute.push(this._client[0].queueTroop[i]._gender)
          troopData.push(attribute);
          if (i === 0)
            data.firstTroopHeal = this._client[0].queueTroop[i]._health;
        }
        data.listTroop = listTroop;
        data.troopData = troopData;
        var data2 = {};
        data2.playerHeath = this._client[1].playerHeath;
        listTroop = [];
        troopData = [];
        for (var i = 0; i < this._client[1].queueTroop.length; ++i) {
          listTroop.push(this._client[1].queueTroop[i]._x);
          attribute = [];
          for (var element of this._client[1].queueTroop[i]._element)
            attribute.push(element);
          attribute.push(this._client[1].queueTroop[i]._gender)
          troopData.push(attribute);
          if (i === 0)
            data2.firstTroopHeal = this._client[1].queueTroop[i]._health;
        }
        data2.listTroop = listTroop;
        data2.troopData = troopData;
        updateData.errorCode = 0;
        updateData.myData = data;
        updateData.enemyData = data2;

        this._client[0].send(JSON.stringify(updateData));

        updateData.myData = data2;
        updateData.enemyData = data;

        this._client[1].send(JSON.stringify(updateData));

      }
      if (this._timeBattle >= 600)
      {
        console.log("TIME OUT");
        console.log(this._client[0].id + "'s HEALTH: " + this._client[0].playerHeath);
        console.log(this._client[1].id + "'s HEALTH: " + this._client[1].playerHeath);
        var endBattleData = {};
        endBattleData.cmdId = CMD.BATTLE_END;
        if (this._client[0].playerHeath < this._client[1].playerHeath)
        {
          console.log(this._client[1].id + " is WINNER");
          endBattleData.battleResult = BATTLE_RESULT.LOSE;
          this._client[0].send(JSON.stringify(endBattleData));
          endBattleData.battleResult = BATTLE_RESULT.WIN;
          this._client[1].send(JSON.stringify(endBattleData));
        }
        else if (this._client[0].playerHeath > this._client[1].playerHeath)
        {
          console.log(this._client[0].id + " is WINNER");
          endBattleData.battleResult = BATTLE_RESULT.LOSE;
          this._client[1].send(JSON.stringify(endBattleData));
          endBattleData.battleResult = BATTLE_RESULT.WIN;
          this._client[0].send(JSON.stringify(endBattleData));
        }
        else
        {
          console.log("BOTH LOSE!!");
          endBattleData.battleResult = BATTLE_RESULT.LOSE;
          this._client[0].send(JSON.stringify(endBattleData));
          this._client[1].send(JSON.stringify(endBattleData));
        }
        this.finishBattle();
      }
    }
  }
}

var listToken = [];

const wss = new WebSocket.Server({ port: PORT })
CLIENTS=[];
CLIENTS_IN_LOBBY = [];
rooms = [];
wss.on('connection', ws => {
  ws.on('close', wsClose =>{
    console.log(wsClose, " close connection");
    if (wsClose) {
      if (wsClose.id) {
        console.log(wsClose.id, " close connect");
      }
    }
  })
  ws.on('message', message => {
    console.log(ws.id + `sent message => ${message}`);
    var cmd = message.toString().split(CONNECTION_CONST.CMD_DIVIDER);
    let packet = JSON.parse(message);
    switch (Number(packet["cmdId"]))
    {
      case CMD.LOGIN:
      {
        console.log(`USER SEND LOGIN WITH DATA => ${cmd[1]}`);
        let userName = packet["username"];
        let password = packet["password"];
        let urlLoginGame = serverData + "/loginGame?username="+userName+"&password="+password;

        https.get(urlLoginGame,(res) => {
          let body = "";

          res.on("data", (chunk) => {
            body += chunk;
          });

          res.on("end", () => {
            try {
              let json = JSON.parse(body);
              json.cmdId = CMD.LOGIN;
              for (let a in json["assets"])
              {
                let tokenData = json["assets"][a];
                listToken[tokenData["token_id"]] = tokenData;
              }
              console.log(JSON.stringify(json));
              json.isReconnect = false;
              json.isDup = false;
              if (json.errorCode == 0)
              {
                //ws.status = CLIENT_STATUS.LOBBY;
                ws.publicAddress = json.publicAddress;
                var index = -1;
                for (var client of CLIENTS) {
                  index++;
                  console.log("Client address: ", client.publicAddress);
                  if (client.publicAddress == ws.publicAddress) {
                    console.log("RELOGINN");
                    var cmdDup = {};
                    cmdDup.cmdId = 1112;
                    cmdDup.message = "";
                    cmdDup.errorCode = 0;
                    if (client.status == CLIENT_STATUS.PLAYING)
                    {
                      console.log("RECONNECTTTTTTTTTTTT");
                      json.isReconnect = true;
                      var target;
                      if (client.room._client[0].publicAddress == ws.publicAddress) {
                        target = client.room._client[0];
                      } else {
                        target = client.room._client[1];
                      }

                      ws.room = target.room;
                      ws.queueTroop = target.queueTroop;
                      ws.playerHeath = target.playerHeath;
                      ws.gold = target.gold;
                      ws.id = target.id;
                      ws.opponent = target.opponent;
                      console.log("OKE assign");
                      if (client.room._client[0].publicAddress == ws.publicAddress) {
                        client.room._client[0] = ws;
                        client.room._client[1].opponent = ws;
                      } else {
                        client.room._client[1] = ws;
                        client.room._client[0].opponent = ws;
                      }
                      json.timeBattle = ws.room._timeBattle;
                      json.gold = ws.gold;
                      json.playerHeath
                      //ws.send(JSON.stringify(json));
                    }
                    ws.send(JSON.stringify(json));
                    client.send(JSON.stringify(cmdDup));
                    CLIENTS.splice(index,1);
                    CLIENTS.push(ws);
                    return;
                  }
                }
                ws.status = CLIENT_STATUS.LOBBY;
                CLIENTS.push(ws);
              }
              ws.send(JSON.stringify(json));
              // do something with JSON
            } catch (error) {
              console.error(error.message);
            };
          });

        }).on("error", (error) => {
          console.error(error.message);
        });
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
            ws.status = CLIENT_STATUS.PLAYING;
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
        var cmdTrain = {};
        cmdTrain.cmdId = CMD.TRAIN;
        console.log('USER SEND TRAIN TOKEN ID: ',packet["token_id"]);
        if (ws.gold < 50)
        {
          cmdTrain.errorCode = 1; // not enoug gold
          ws.send(JSON.stringify(cmdTrain));
          return;
        }
        cmdTrain.errorCode = 0;

        // var troopAttribute = cmd[1].split(',');
        // var random_boolean = Math.random() < 0.5;
        // var gender = random_boolean?1:0;
        var troopData = "";
        var troopAttribute = listToken[Number(packet["token_id"])]["listAttribute"];
        var gender = listToken[Number(packet["token_id"])]["gender"];
        console.log("Gender: ",gender);
        console.log("Gender: ",troopAttribute);
        var newTroop = new Troop(troopAttribute,gender);
        ws.addTroop(newTroop);
        ws.gold -= 50;

        cmdTrain.troopAttribute = troopAttribute;
        cmdTrain.gender = gender;
        console.log(JSON.stringify(cmdTrain));
        ws.send(JSON.stringify(cmdTrain));
        cmdTrain.cmdId = CMD.ENEMY_CREATE;
        console.log(JSON.stringify(cmdTrain));
        ws.opponent.send(JSON.stringify(cmdTrain));

        // var createTroopData = {};
        // createTroopData.cmdId = CMD.TRAIN;
        // createTroopData.troopData = cmd[1].toString()+","+gender.toString();
        // ws.send(JSON.stringify(createTroopData));
        //
        // var enemyCreateTroopData = {}
        // enemyCreateTroopData.cmdId = CMD.ENEMY_CREATE;
        // enemyCreateTroopData.troopData = cmd[1].toString()+","+gender.toString();
        // ws.opponent.send(JSON.stringify(enemyCreateTroopData));
        //ws.opponent.send(CMD.ENEMY_CREATE+"HELLC");
        //ws.opponent.send(CMD.ENEMY_CREATE+CONNECTION_CONST.CMD_DIVIDER+cmd[1].toString());
        break;
      }
      case CMD.CANCEL_PLAY:
      {
        var cmdCancel = {};
        cmdCancel.cmdId = CMD.CANCEL_PLAY;
        cmdCancel.errorCode  = 0;
        for (var i = 0;i < rooms.length; i++)
        {
          if (rooms[i] === ws.room)
          {
            if (rooms[i]._status === ROOM_STATUS.WAITING)
            {
              rooms.splice(i, 1);
              ws.send(JSON.stringify(cmdCancel));
              return;
            }
            else
            {

            }
          }
        }
        return;
        break;

      }
      case CMD.PING:
      {
        var cmdPing = {};
        cmdPing.cmdId = CMD.PING;
        ws.send(JSON.stringify(cmdPing));
        break;
      }
      default:
        console.log("No cmdId match ?");
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
    if (ws.playerHeath <= 0)
    {
      console.log(ws.id+"'s base destroyed, player "+ ws.opponent.id+" is winner!!");
      var endBattleData = {};
      endBattleData.cmdId = CMD.BATTLE_END;
      endBattleData.battleResult = BATTLE_RESULT.LOSE;
      ws.send(JSON.stringify(endBattleData));
      endBattleData.battleResult = BATTLE_RESULT.WIN;
      ws.opponent.send(JSON.stringify(endBattleData));
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