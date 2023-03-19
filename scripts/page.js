// ===================== Winter 2021 EECS 493 Assignment 2 =====================
// This starter code provides a structure and helper functions for implementing
// the game functionality. It is a suggestion meant to help you, and you are not
// required to use all parts of it. You can (and should) add additional functions
// as needed or change existing functions.

// ==============================================
// ============ Page Scoped Globals Here ========
// ==============================================

// Counters
let throwingItemIdx = 1;

// Size Constants
const FLOAT_1_WIDTH = 149;
const FLOAT_2_WIDTH = 101;
const FLOAT_SPEED = 2;
const PERSON_SPEED = 25;
const OBJECT_REFRESH_RATE = 50;  //ms
const SCORE_UNIT = 100;  // scoring is in 100-point units
const MAX_SCORE = 5000;
let fadeDuration = 5000;
// Size vars
let maxPersonPosX, maxPersonPosY;
let maxItemPosX;
let maxItemPosY;

// Global Window Handles (gwh__)
let gwhGame, gwhStatus, gwhScore;

let gameOverScreen;
// Global Object Handles
let player;
let paradeRoute;
let paradeFloat1;
let paradeFloat2;
let paradeTimer;

/*
 * This is a handy little container trick: use objects as constants to collect
 * vals for easier (and more understandable) reference to later.
 */

const KEYS = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  shift: 16,
  spacebar: 32
};

let createThrowingItemIntervalHandle;
let currentThrowingFrequency = 2000;


// ==============================================
// ============ Functional Code Here ============
// ==============================================

// Main
$(document).ready(function() {
  console.log("Ready!");
  
  // TODO: Event handlers for the settings panel
  $("#discard").on("click", function(){
    $(".settings-show").hide();
    $(".settings-button").show();
    console.log("CLICKED");
  });

  $("#submit").on("click", function(){
    let v = $("#time").val();
    if(v == null) v = 2000;

    let f = $("#fade").val();
    if(v < 100){
      alert("Frequency must be a number greater than or equal to 100");
    } else if (f < 0) {
      alert("Fade duration must be greater than or equal to 0");
    }
    else {
      currentThrowingFrequency = v;
      clearInterval(createThrowingItemIntervalHandle);
      createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);

      fadeDuration = f;
      $(".settings-show").hide();
      $(".settings-button").show();
    }
  });

  $("#show").on("click", function(){
    $(".settings-show").show();
    $(".settings-button").hide();
    $("#settings-button").val(currentThrowingFrequency);
  });

  
  $(".settings-show").hide();
  $(".settings-button").show();
  
  $("#actualGame").hide();
  $(".gameover").hide();
  // TODO: Add a splash screen and delay starting the game
  setTimeout(function() {
    let splash = $(".splash");
    splash.hide();

    $("#actualGame").show();
    // Set global handles (now that the page is loaded)
    // Allows us to quickly access parts of the DOM tree later
    gwhGame = $('#actualGame');
    gwhStatus = $('.status-window');
    gwhScore = $('#score-box');
    player = $('#player');  // set the global player handle
    paradeRoute = $("#paradeRoute");
    paradeFloat1 = $("#paradeFloat1");
    paradeFloat2 = $("#paradeFloat2");
  
    gameOverScreen = $(".gameover");
    // Set global positions for thrown items
    maxItemPosX = $('.game-window').width() - 50;
    maxItemPosY = $('.game-window').height() - 40;
  
    // Set global positions for the player
    maxPersonPosX = $('.game-window').width() - player.width();
    maxPersonPosY = $('.game-window').height() - player.height();
  
    // Keypress event handler
    $(window).keydown(keydownRouter);
    
    // Periodically check for collisions with thrown items (instead of checking every position-update)
    setInterval( function() {
      checkCollisions();
    }, 100);
  
    // Move the parade floats
    startParade();
  
    // Throw items onto the route at the specified frequency
    createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
  }, 3000)
});

// Key down event handler
// Check which key is pressed and call the associated function
function keydownRouter(e) {
  switch (e.which) {
    case KEYS.shift:
      break;
    case KEYS.spacebar:
      break;
    case KEYS.left:
    case KEYS.right:
    case KEYS.up:
    case KEYS.down:
      movePerson(e.which);
      break;
    default:
      console.log("Invalid input!");
  }
}

// Handle player movement events
// TODO: Stop the player from moving into the parade float. Only update if
// there won't be a collision
function movePerson(arrow) {
  
  switch (arrow) {
    case KEYS.left: { // left arrow
      if(!willCollide(player, paradeFloat2, -PERSON_SPEED, 0)){
        let newPos = parseInt(player.css('left'))-PERSON_SPEED;
        if (newPos < 0) {
          newPos = 0;
        }
        player.css('left', newPos);
      }
      break;
    }
    case KEYS.right: { // right arrow
      if(!willCollide(player, paradeFloat1, PERSON_SPEED, 0)){
        let newPos = parseInt(player.css('left'))+PERSON_SPEED;
        if (newPos > maxPersonPosX) {
          newPos = maxPersonPosX;
        }
        player.css('left', newPos);
      }
      break;
    }
    case KEYS.up: { // up arrow
      if(!willCollide(player, paradeFloat2, 0, -PERSON_SPEED) && !willCollide(player, paradeFloat1, 0, -PERSON_SPEED)){
        let newPos = parseInt(player.css('top'))-PERSON_SPEED;
        if (newPos < 0) {
          newPos = 0;
        }
        player.css('top', newPos);
      }
      break;
    }
    case KEYS.down: { // down arrow
      if(!willCollide(player, paradeFloat2, 0, PERSON_SPEED) && !willCollide(player, paradeFloat1, 0, PERSON_SPEED)){
        let newPos = parseInt(player.css('top'))+PERSON_SPEED;
        if (newPos > maxPersonPosY) {
          newPos = maxPersonPosY;
        }
        player.css('top', newPos);
      }
      break;

    }
  }
}

// Check for any collisions with thrown items
// If needed, score and remove the appropriate item
function checkCollisions() {
  // TODO
  $(".throwingItem").each(function(){
    let obj = $(this);
      if(isColliding(player,obj) && !obj.hasClass("inactive")){
        console.log("COLLIDED");

        var $circle = $("<span class='dot'></span>")
        $circle.css("top", obj.height()/2);
        $circle.css("left", obj.width()/2);
        //$circle.index(-1);

        obj.addClass("dot");
        obj.addClass("inactive");

        obj.fadeTo(1000, 0, function(){
          $(this).remove();
        });
        var audio = new Audio('audio/coin.wav');
        audio.play();
        let prev = parseInt($("#score-box").text());
        $("#score-box").text(prev + 100);
        if(parseInt($("#score-box").text()) >= MAX_SCORE){
          gameOver();
        }
        if(obj.hasClass("beads")) $("#beadsCounter").text(parseInt($("#beadsCounter").text()) + 1);
        else $("#candyCounter").text(parseInt($("#candyCounter").text()) + 1);
      }
  });
}

function gameOver(){
  gameOverScreen.show();
  gwhGame.hide();
  clearInterval(createThrowingItemIntervalHandle);
  clearInterval(paradeTimer);
}
// Move the parade floats (Unless they are about to collide with the player)
function startParade(){
  console.log("Starting parade...");
  paradeTimer = setInterval( function() {

      // TODO: (Depending on current position) update left value for each 
      // parade float, check for collision with player, etc.
      if(!isOrWillCollide(paradeFloat2, player, FLOAT_SPEED, 0)){
        let newPos = parseInt(paradeFloat1.css('left'))+FLOAT_SPEED;
        paradeFloat1.css('left',newPos)
  
        paradeFloat2.css('left',parseInt(paradeFloat2.css('left'))+FLOAT_SPEED)
  
        if (parseInt(paradeFloat1.css('left')) > 500){
          paradeFloat1.css('left',-300);
          paradeFloat2.css('left',-150);
        }
      }
  }, OBJECT_REFRESH_RATE);
}

// Get random position to throw object to, create the item, begin throwing
function createThrowingItem(){
  console.log("Creating Projectile");
  var itemDivStr;
  if(Math.random() < 2/3) itemDivStr = createItemDivString(throwingItemIdx, "beads", "beads.png");
  else itemDivStr = createItemDivString(throwingItemIdx, "candy", "candy.png");

  gwhGame.append(itemDivStr);

  var curItem = $('#i-' + throwingItemIdx);
  throwingItemIdx++;

  curItem.css("top", parseInt(paradeRoute.css("top")) + paradeRoute.height()/2);
  var itemPosX = parseInt(paradeFloat2.css("left")) + paradeFloat2.width()/2
  curItem.css("left", itemPosX)
  curItem.css("z-index", 1)
  console.log(curItem.css("left"))
  randX = Math.random() * 5;
  randY = Math.random() * 5 + 5;
  if(Math.random() < 0.5) randY*=-1;
  updateThrownItemPosition(curItem, randX, randY, 20);

}

// Helper function for creating items
// throwingItemIdx - index of the item (a unique identifier)
// type - beads or candy
// imageString - beads.png or candy.png
function createItemDivString(itemIndex, type, imageString){
  return "<div id='i-" + itemIndex + "' class='throwingItem " + type + "'><img src='img/" + imageString + "'/></div>";
}

// Throw the item. Meant to be run recursively using setTimeout, decreasing the 
// number of iterationsLeft each time. You can also use your own implementation.
// If the item is at it's final postion, start removing it.
function updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft){
  // TODO
  if(iterationsLeft===0){
    setTimeout(function(){
      graduallyFadeAndRemoveElement(elementObj)}, fadeDuration);
  } else {
    elementObj.css('left',parseInt(elementObj.css('left'))+xChange);
    elementObj.css('top',parseInt(elementObj.css('top'))+yChange);
    // if (xPos > maxItemPosX) return;
    // if (yPos > maxItemPosY) return;
    setTimeout(function(){
      updateThrownItemPosition(elementObj,xChange, yChange, iterationsLeft-1)}, 50);
  }
}

function graduallyFadeAndRemoveElement(elementObj){
  // Fade to 0 opacity over 2 seconds
  elementObj.fadeTo(1000, 0, function(){
    $(this).remove();
  });
}

// ==============================================
// =========== Utility Functions Here ===========
// ==============================================

// Are two elements currently colliding?
function isColliding(o1, o2) {
  return isOrWillCollide(o1, o2, 0, 0);
}

// Will two elements collide soon?
// Input: Two elements, upcoming change in position for the moving element
function willCollide(o1, o2, o1_xChange, o1_yChange){
  return isOrWillCollide(o1, o2, o1_xChange, o1_yChange);
}

// Are two elements colliding or will they collide soon?
// Input: Two elements, upcoming change in position for the moving element
// Use example: isOrWillCollide(paradeFloat2, person, FLOAT_SPEED, 0)
function isOrWillCollide(o1, o2, o1_xChange, o1_yChange){
  const o1D = { 'left': o1.offset().left + o1_xChange,
        'right': o1.offset().left + o1.width() + o1_xChange,
        'top': o1.offset().top + o1_yChange,
        'bottom': o1.offset().top + o1.height() + o1_yChange
  };
  const o2D = { 'left': o2.offset().left,
        'right': o2.offset().left + o2.width(),
        'top': o2.offset().top,
        'bottom': o2.offset().top + o2.height()
  };
  // Adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  if (o1D.left < o2D.right &&
    o1D.right > o2D.left &&
    o1D.top < o2D.bottom &&
    o1D.bottom > o2D.top) {
     // collision detected!
     return true;
  }
  return false;
}

// Get random number between min and max integer
function getRandomNumber(min, max){
  return (Math.random() * (max - min)) + min;
}