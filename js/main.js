//first level

var vidas = 3;
var GameState = {

  //initiate game settings
  init: function() {
    //adapt to screen size
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1000

    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.game.world.setBounds(0,0,360,700);

    this.RUNNING_SPEED = 180;
    this.JUMPING_SPEED = 550;
  },

  //load the game assets before the game starts
  preload: function() {
    this.load.image('ground', 'assets/images/ground.png');    
    this.load.image('platform', 'assets/images/platform.png');    
    this.load.image('goal', 'assets/images/castle.png');    
    this.load.image('leftButton', 'assets/images/leftArrow.png');  
    this.load.image('rightButton', 'assets/images/rightArrow.png'); 
    this.load.image('jumpButton', 'assets/images/upArrow.png');    
    this.load.image('rock', 'assets/images/rock.png');    

    this.load.spritesheet('player', 'assets/images/playerN_spritesheet.png', 28, 30, 5, 1, 1);    
    this.load.spritesheet('bomb', 'assets/images/bomb_spritesheet.png', 20, 21, 2, 1, 1);      
  
    this.load.text('level', 'assets/data/level.json');
  },
    
  //executed after everything is loaded
  create: function() {    

    this.ground = this.add.sprite(0, 638, 'ground');
    this.game.physics.arcade.enable(this.ground);
    this.ground.body.allowGravity = false;
    this.ground.body.immovable = true;

    //parse the file
    this.levelData = JSON.parse(this.game.cache.getText('level'));

    this.platforms = this.add.group();
    this.platforms.enableBody = true;

    this.levelData.platformData.forEach(function(element){
      this.platforms.create(element.x, element.y, 'platform');
    }, this);

    this.platforms.setAll('body.immovable', true);
    this.platforms.setAll('body.allowGravity', false);

    //bombs
    this.bombs = this.add.group();
    this.bombs.enableBody = true;

    var bomb;
    this.levelData.bombData.forEach(function(element){
      bomb = this.bombs.create(element.x, element.y, 'bomb');
      bomb.animations.add('bomb', [0, 1], 4, true);
      bomb.play('bomb');
    }, this);

    this.bombs.setAll('body.allowGravity', false);
    
    //goal
    this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
    this.game.physics.arcade.enable(this.goal);
    this.goal.body.allowGravity = false;

    //create player
    this.player = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'player', 3);
    this.player.anchor.setTo(0.5);
    this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
    this.game.physics.arcade.enable(this.player);
    this.player.customParams = {};
    this.player.body.collideWorldBounds = true;

    this.game.camera.follow(this.player);

    this.createOnscreenControls();

    this.rocks = this.add.group();
    this.rocks.enableBody = true;

    this.createRock();
    this.rockCreator = this.game.time.events.loop(Phaser.Timer.SECOND * this.levelData.rockFrequency, this.createRock, this)
  },
    
    //when bomb hits
  update: function() {
    this.game.physics.arcade.collide(this.player, this.ground);
    this.game.physics.arcade.collide(this.player, this.platforms);

    this.game.physics.arcade.collide(this.rocks, this.ground);
    this.game.physics.arcade.collide(this.rocks, this.platforms);

    this.game.physics.arcade.overlap(this.player, this.bombs, this.killPlayer);
    this.game.physics.arcade.overlap(this.player, this.rocks, this.killPlayer);
    this.game.physics.arcade.overlap(this.player, this.goal, this.win);

    this.player.body.velocity.x = 0;

    if(this.cursors.left.isDown || this.player.customParams.isMovingLeft) {
      this.player.body.velocity.x = -this.RUNNING_SPEED;
      this.player.scale.setTo(1, 1);
      this.player.play('walking');
    }
    else if(this.cursors.right.isDown || this.player.customParams.isMovingRight) {
      this.player.body.velocity.x = this.RUNNING_SPEED;
      this.player.scale.setTo(-1, 1);
      this.player.play('walking');
    }
    else {
      this.player.animations.stop();
      this.player.frame = 3;

    }

    if((this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
      this.player.body.velocity.y = -this.JUMPING_SPEED;
      this.player.customParams.mustJump = false;
    }

    this.rocks.forEach(function(element){
      if(element.x < 10 && element.y > 600) {
        element.kill();
      }
    }, this);
  },
  createOnscreenControls: function(){
    this.leftArrow = this.add.button(20, 535, 'leftButton');
    this.rightArrow = this.add.button(110, 535, 'rightButton');
    this.actionButton = this.add.button(280, 535, 'jumpButton');

    this.leftArrow.alpha = 0.5;
    this.rightArrow.alpha = 0.5;
    this.actionButton.alpha = 0.5;

    this.leftArrow.fixedToCamera = true;
    this.rightArrow.fixedToCamera = true;
    this.actionButton.fixedToCamera = true;

    this.actionButton.events.onInputDown.add(function(){
      this.player.customParams.mustJump = true;
    }, this);

    this.actionButton.events.onInputUp.add(function(){
      this.player.customParams.mustJump = false;
    }, this);

    //left
    this.leftArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);

    this.leftArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);

    this.leftArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);

    this.leftArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);

    //right
    this.rightArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);

    this.rightArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);

    this.rightArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);

    this.rightArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);
  },
    
    //player dead
  killPlayer: function(player, bomb) {
    console.log('Auch!');
      vidas=vidas-1;
      bomb.kill();
      alert ("Le queda " + vidas + " vida(s)");
      if(vidas==0){
          var audioLose = new Audio('assets/sounds/lose.mp3');
          audioLose.play();
          alert('¡Perdiste!');
          console.log('Bye bye!');
          game.state.start('GameState');
          vidas=3;
      }
  },
    
    //when wins
  win: function(player, goal) {
    alert('¡Ganaste!');
        var audioWin = new Audio('assets/sounds/win.mp3');
        audioWin.play();
        game.state.start('GameState');
  },
  createRock: function() {
    //give me the first dead sprite
    var rock = this.rocks.getFirstExists(false);

    if(!rock) {
      rock = this.rocks.create(0, 0, 'rock');
    }

    rock.body.collideWorldBounds = true;
    rock.body.bounce.set(1, 0);

    rock.reset(this.levelData.goal.x, this.levelData.goal.y);
    rock.body.velocity.x = this.levelData.rockSpeed;
  }
  
};

//initiate framework
var game = new Phaser.Game(360, 592, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');

