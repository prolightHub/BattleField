var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing) {
    processing.size(400, 400);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function () { mouseIsPressed = true; };
    processing.mouseReleased = function () { mouseIsPressed = false; };

    var keyIsPressed = false;
    processing.keyPressed = function () { keyIsPressed = true; };
    processing.keyReleased = function () { keyIsPressed = false; };

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
        rotateFn(processing.radians(angle));
    };

    with (processing) {
       
       var game = {};
       var scenes = {
           scene : "menu",
       };
       
       var pointInRect = function(point1, rect1)
       {
           return ((point1.xPos > rect1.xPos && point1.xPos < rect1.xPos + rect1.width) && 
                  (point1.yPos > rect1.yPos && point1.yPos < rect1.yPos + rect1.height));
       };
       var getPlaceInGrid = function(xPos, yPos, grid)
       {
           return {
               col : constrain(round(((xPos - grid.xPos) - grid.unitWidth / 2) / grid.unitWidth), 0, grid.length - 1),
               row : constrain(round(((yPos - grid.yPos) - grid.unitHeight / 2) / grid.unitHeight), 0, grid[0].length - 1),
           };
       };
       
       var grid = [];
       grid.ships = {};
       grid.setup = function(xPos, yPos, cols, rows, unitWidth, unitHeight)
       {
           this.xPos = xPos;
           this.yPos = yPos;
           this.unitWidth = unitWidth;
           this.unitHeight = unitHeight;
           this.cols = cols;
           this.rows = rows;
           this.width = cols * unitWidth;
           this.height = rows * unitHeight;
       };
       grid.create = function()
       {
           this.splice(0, this.length);
           for(var col = 0; col < this.cols; col++)
           {
               var input = [];
               for(var row = 0; row < this.rows; row++)
               {
                  input.push('_'); 
               }
               this.push(input);
           }
       };  
       grid.addElements = function()
       {
          for(var col = 0; col < this.length; col++)
          {
              for(var row = 0; row < this.split; row++)
              {
                  var num = random(0, 100); 
                  if(num > 90)
                  {
                      this[col][row] = 'r'; 
                  }
              }
          }
          for(var col = 0; col < this.length; col++)
          {
              for(var row = this.split; row >= 0; row--)
              {
                  if(this[col][row] === 'r')
                  {
                      this[col][(this.split + abs(this.split - row)) - 1] = this[col][row]; 
                  }
              }
          }
          var mines = round(random(2, 5));
          for(var i = 0; i < mines; i++)
          {
              var col = round(random(0, this.length - 1));
              var row = round(random(0, this.split - 1));
              if(this[col][row] === '_')
              {
                  this[col][row] = 'm';
              }else{
                  i--; 
              }
          }
          for(var i = 0; i < mines; i++)
          {
              var col = round(random(0, this.length - 1));
              var row = round(random(this.split, this[0].length - 1));
              if(this[col][row] === '_')
              {
                  this[col][row] = 'm';
              }else{
                  i--; 
              }
          }
       };
       grid.safeRead = function(col, row)
       {
           if(col >= 0 && col < this.length && 
              row >= 0 && row < this[0].length)
           {
               return this[col][row];
           }
       };
       grid.safeSet = function(col, row, symbol)
       {
           if(col >= 0 && col < this.length && 
              row >= 0 && row < this[0].length)
           {
               this[col][row] = symbol;
           }
       };
       grid.explodeMine = function(col, row, range)
       {
           var setRange = range;
           for(var setCol = col - setRange; setCol <= col + setRange; setCol++)
           {
               for(var setRow = row - setRange; setRow <= row + setRange; setRow++)
               {
                   if(this.safeRead(setCol, setRow) === '1')
                   {
                       if(row < grid.split)
                       {
                           game.playerOneOffenceSoldiers--; 
                       }else{
                           game.playerOneDefenceSoldiers--; 
                       }
                   }
                   else if(this.safeRead(setCol, setRow) === '2')
                   {
                       if(row >= grid.split)
                       {
                           game.playerTwoOffenceSoldiers--; 
                       }else{
                           game.playerTwoDefenceSoldiers--; 
                       }
                   }
                   this.safeSet(setCol, setRow, "_");    
               }
           }
       };
       grid.isValidMove = function(col, row, symbol)
       {
           return (this.isValidSymbol(col, row) && 
           ((((this.safeRead(col - 1, row) === symbol) || 
           (this.safeRead(col + 1, row) === symbol) || 
           (this.safeRead(col, row - 1) === symbol) || 
           (this.safeRead(col, row + 1) === symbol))) ||
           (this.allowRowWrapping && 
           ((row === 0 && this.safeRead(col, this[0].length - 1) === symbol) ||
           (row === this[0].length - 1 && this.safeRead(col, 0) === symbol))) ||
           (this.allowColWrapping && 
           ((col === 0 && this.safeRead(this.length - 1, row) === symbol) ||
           (col === this.length - 1 && this.safeRead(0, row) === symbol)))));
       };
       grid.isValidSymbol = function(col, row)
       {
           return ((this.safeRead(col, row) === '_') || (this.safeRead(col, row) === 'm'));
       };
       grid.noMoves = function(symbol)
       {
           var nonValidMoves = 0;
           for(var col = 0; col < this.length; col++)
           {
               for(var row = 0; row < this[col].length; row++)
               {
                   if(!this.isValidMove(col, row, symbol))
                   {
                       nonValidMoves++;
                   }
               }
           }
           return (nonValidMoves >= this.length * this[0].length);
       };
       grid.draw = function()
       {
           var top = 0;
           var bottom = 0;
           for(var col = 0; col < this.length; col++)
           {
               for(var row = 0; row < this[col].length; row++)
               {
                   if(this[col][row] !== '_')
                   {
                       if(row < this.split)
                       {
                           top++;
                       }else{
                           bottom++; 
                       }
                   }
                   switch(this[col][row])
                   {
                       case '1' :
                           fill(200, 0, 0);  
                         break;
                        
                       case '2' :
                           fill(0, 0, 200);
                         break;
                       
                       case 'r' :
                           fill(100, 100, 100);
                         break;
                       
                       case '?' :
                             fill(15, 15, 15);
                          break;
    
                      //case 'm' :
                           //fill(50, 0, 0);
                         //break;
                         
                       case '_' : case 'm' :
                           fill(45, 45, 45);
                         break;
                     
                   }
                   rect(this.xPos + col * this.unitWidth, this.yPos + row * this.unitHeight, this.unitWidth, this.unitHeight);      
               }
           }
           this.topFull = (top >= this.length * this.split);
           this.bottomFull = (bottom >= this.length * abs(this[0].length - this.split));
       };
       
       grid.setup(45, 45, 20, 20, 15, 15);
       
       game.setup = function()
       {
           grid.create();
           grid.split = floor(grid[0].length / 2);
           grid.allowRowWrapping = false;
           grid.allowColWrapping = false;
           grid.addElements();
           this.done = false;
           this.playerTurn = 1;
           this.playerOneSoldiers = 0;
           this.playerTwoSoldiers = 0;
           this.playerOneUsedSoldiers = 0;
           this.playerTwoUsedSoldiers = 0;
           this.playerOneOffenceSoldiers = 0;
           this.playerTwoOffenceSoldiers = 0;
           this.playerOneDefenceSoldiers = 0;
           this.playerTwoDefenceSoldiers = 0;
           this.playerOneType = "soldier";
           this.playerTwoType = "soldier";
           this.maxSoldiers = 11;
           this.turnSetup();
       };  
       game.setSoldiers = function(player)
       {
           this["player" + player + "Soldiers"] = (this["player" + player + "UsedSoldiers"] === 0) ? 1 : (millis() % 6) + 1 + round(random(1, 6));
         
           if (this["player" + player + "Soldiers"] === 2)
           {
              this["player" + player + "Type"] = "spy";
              this["player" + player + "Soldiers"] = 1;
           }
           else if (this["player" + player + "Soldiers"] === 12)
           {
              this["player" + player + "Type"] = "guard";
              this["player" + player + "Soldiers"] = 1;
           }
       };
       game.turnSetup = function()
       {
           if(this.playerTurn === 1)
           {
               this.setSoldiers("One");
           }
           else if(this.playerTurn === 2)
           {
               this.setSoldiers("Two");
           }
       };
       game.changeTurns = function()
       {
           if(this.playerTurn === 1 && this.playerOneSoldiers <= 0)
           {
                this.playerTurn = 2;
                this.turnSetup();
           }
           else if(this.playerTurn === 2 && this.playerTwoSoldiers <= 0)
           {
                this.playerTurn = 1;
                this.turnSetup();
           }
       };
       game.isDone = function()
       {  
           return (this.done || (this.playerOneUsedSoldiers > 0 && 
           this.playerTwoUsedSoldiers > 0 && 
           ((grid.topFull || 
           grid.bottomFull) ||
           grid.noMoves('1') || 
           grid.noMoves('2'))));
       };
       game.whoWon = function()
       {
           var whoWon = "tie";
           if(this.playerOneOffenceSoldiers > this.playerTwoOffenceSoldiers)
           {
               whoWon = "one";
           }
           else if(this.playerOneOffenceSoldiers < this.playerTwoOffenceSoldiers)
           {
               whoWon = "two";
           }
           return whoWon;
       };
       game.playerOnePlaceSoldier = function(col, row)
       { 
             if(this.playerOneUsedSoldiers > 0 && grid[col][row] === 'm')
             {
                  grid.explodeMine(col, row, 1);
             }else{
                 grid[col][row] = '1';
                 if(row < grid.split)
                 {
                     this.playerOneOffenceSoldiers++; 
                 }else{
                     this.playerOneDefenceSoldiers++; 
                 }
             }
             this.playerOneSoldiers--;
             this.playerOneUsedSoldiers++;
       };
       game.playerTwoPlaceSoldier = function(col, row)
       {
           if(this.playerTwoUsedSoldiers > 0 && grid[col][row] === 'm')
           {
               grid.explodeMine(col, row, 1);
           }else{
               grid[col][row] = '2';
               if(row >= grid.split)
               {
                   this.playerTwoOffenceSoldiers++; 
               }else{
                   this.playerTwoDefenceSoldiers++; 
               }
           }
           this.playerTwoSoldiers--;
           this.playerTwoUsedSoldiers++;
       };
       game.mousePressed = function()
       {
           if(pointInRect({
           xPos : mouseX,
           yPos : mouseY,
           }, grid))
           {
               var place = getPlaceInGrid(mouseX, mouseY, grid);
               if(this.playerTurn === 1 && this.playerOneSoldiers > 0 && 
               ((this.playerOneUsedSoldiers === 0 && grid.isValidSymbol(place.col, place.row) && place.row >= grid.split) || 
               (this.playerOneType === "soldier" && grid.isValidMove(place.col, place.row, '1')) || 
               (this.playerOneType === "spy" && place.row < grid.split) ||
               (this.playerOneType === "guard" && place.row >= grid.split)))
               {   
                   game.playerOnePlaceSoldier(place.col, place.row);
                   this.playerOneType = "soldier";
               }
               else if(this.playerTurn === 2 && this.playerTwoSoldiers > 0 && 
               ((this.playerTwoUsedSoldiers === 0 && grid.isValidSymbol(place.col, place.row) && place.row < grid.split) || 
               (this.playerTwoType === "soldier" && grid.isValidMove(place.col, place.row, '2')) || 
               (this.playerTwoType === "spy" && place.row >= grid.split) || 
               (this.playerTwoType === "guard" && place.row < grid.split)))
               {
                   game.playerTwoPlaceSoldier(place.col, place.row);
                   this.playerTwoType = "soldier";
               }
           }
       };  
       
       game.setup();
       
       var Button = function(xPos, yPos, width, height, Color)
       {
           this.xPos = xPos;
           this.yPos = yPos;
           this.width = width;
           this.height = height;
           this.color = Color || color(45, 45, 45);
           this.message = "button";
           this.textColor = color(0, 0, 0);
           
           this.draw = function()
           {
               noStroke();
               fill(this.color);
               rect(this.xPos, this.yPos, this.width, this.height, 5);
               textAlign(CENTER, CENTER);
               fill(this.textColor);
               textSize(12);
               text(this.message, this.xPos + this.width / 2, this.yPos + this.height / 2);
               textAlign(NORMAL, NORMAL);
           };
           
           this.isMouseInside = function()
           {
               return pointInRect({
               xPos : mouseX,
               yPos : mouseY,
               }, this);
           };
       };
       
       var nextButton = new Button(165, 360, 60, 20);
       nextButton.message = "Next";
       
       var homeButton = new Button(165, 10, 60, 20);
       homeButton.message = "Home";
       
       var playButton = new Button(165, 165, 70, 30, color(50, 50, 210));
       playButton.message = "Play";
       
       var newGameButton = new Button(165, 200, 70, 30, color(50, 50, 210));
       newGameButton.message = "New Game";
       
       var howButton = new Button(165, 235, 70, 30, color(50, 50, 210));
       howButton.message = "How";
       
       var backButton = new Button(0, 370, 70, 30, color(50, 50, 210));
       backButton.message = "Back";
       
       var creditsButton = new Button(165, 270, 70, 30, color(50, 50, 210));
       creditsButton.message = "credits";
       
       scenes.safeRead = function(scene, atr)
       {
           if(this[scene] !== undefined && typeof this[scene][atr] === "function")
           {
              return this[scene][atr]; 
           }else{
              return function() {};
           }
       };
       scenes.play = function()
       {
           stroke(0, 0, 0);
           grid.draw();
           
           textSize(18);
           fill(200, 0, 0, 150);
           text(game.playerOneSoldiers + ' ' + game.playerOneType + '(s)', 280, 375);
           fill(0, 0, 200, 150);
           text(game.playerTwoSoldiers + ' ' + game.playerTwoType + '(s)', 45, 25);
           
           stroke(0, 0, 0);
           strokeWeight(4);
           var splitYPos = grid.yPos + grid.split * grid.unitHeight;
           line(grid.xPos, splitYPos, grid.xPos + grid.width, splitYPos);
           strokeWeight(1);
           
           if(game.done)
           {
                var whoWon = game.whoWon();
                textAlign(CENTER);
                textSize(30);
                fill(255, 255, 255);
                if(whoWon === "tie")
                {
                    text("Tie", 200, 190);
                }
                if(whoWon === "one")
                {
                    text("Red Player won!", 190, 190);
                }
                if(whoWon === "two")
                {
                    text("Blue Player Won", 190, 190);
                }
                
                newGameButton.draw();
           }
           
           if(pointInRect({
           xPos : mouseX,
           yPos : mouseY,
           }, grid))
           {
               var place = getPlaceInGrid(mouseX, mouseY, grid);
               if(game.playerTurn === 1)
               {
                  fill(200, 0, 0, 50);
               }else{
                  fill(0, 0, 200, 50); 
               }
               rect(grid.xPos + place.col * grid.unitWidth, grid.yPos + place.row * grid.unitHeight, grid.unitWidth, grid.unitHeight);
           }
           
           nextButton.draw();
           homeButton.draw();
           
           if(game.playerTurn === 1)
           {
              nextButton.color = color(200, 0, 0, 150);
           }else{
              nextButton.color = color(0, 0, 200, 150);
           }
           
           if(mouseIsPressed)
           {
              game.mousePressed();
           }
           
           if(game.isDone())
           {
              game.done = true; 
           }
       };
       scenes.play.mousePressed = function()
       {
           if(nextButton.isMouseInside())
           {
               game.changeTurns();
           }
           if(homeButton.isMouseInside())
           {
               scenes.scene = "menu";
           }
           if(game.done && newGameButton.isMouseInside())
           {
               game.setup();
           }
       };
       scenes.menu = function()
       {
            textSize(40);
            textAlign(CENTER, CENTER);
            fill(45, 45, 45, 150);
            text("Battle Field", 200, 80);
            
            playButton.draw();
            newGameButton.draw();
            howButton.draw();
            creditsButton.draw();
       };
       scenes.menu.mousePressed = function()
       {
           if(playButton.isMouseInside())
           {
               scenes.scene = "play"; 
           }
           if(newGameButton.isMouseInside())
           {
               scenes.scene = "play"; 
               game.setup();
           }
           if(howButton.isMouseInside())
           {
               scenes.scene = "how"; 
           }
           if(creditsButton.isMouseInside())
           {
               scenes.scene = "credits"; 
           }
       };
       scenes.credits = function()
       {
           backButton.draw();
           
           fill(50, 50, 50, 100);
           rect(110, 150, 170, 100, 5);
           
           textAlign(CENTER, CENTER);
           text("To my dad for designing the\n gameplay on paper and testing. \n\n To ProlightHub(me) for\n coding the game.", 195, 200);
       };
       scenes.credits.mousePressed = function()
       {
           if(backButton.isMouseInside())
           {
               scenes.scene = "menu";
           }
       };
       scenes.how = function()
       {
           backButton.draw();
           
           fill(50, 50, 50, 100);
           rect(80, 70, 240, 260, 5);
           
           textSize(9.5);
           textAlign(CENTER, CENTER);
           text("Welcome to Battle Field, a two\n player game. Where the object of the\n game is to claim as much turf as\n possible! Each Player will have to \n play on a grid thats been divided\n in two. You will place soldiers\n on this grid anywhere you like\n in your half at the start of the game but\n after that you must place your soldiers\n adjacently or next to your last soldier. Each turn\n you will get a random number of soldiers to place,\n after that click the next button for the\n next player's turn. You won't \nalways get the same type of soldier. You \n might get a spy where you can place\n it anywhere in your opponent's half\n, If it's a guard it will be your half. \nThe game is done when either\n player can't place a soldier.\n If you decide you want to quit early press the Done \n button, this will end the game. After\n the game is over who ever has the most\n soldiers in their opponent's half wins!", 200, 200);
       };
       scenes.how.mousePressed = function()
       {
           if(backButton.isMouseInside())
           {
               scenes.scene = "menu";
           }
       };
       
       var draw = function()
       {
           background(50, 150, 50); 
           frameRate(15);
           scenes[scenes.scene]();
       };
       
       var lastMouseReleased = mouseReleased;
       var mouseReleased = function()
       {
           lastMouseReleased();
            scenes.safeRead(scenes.scene, "mousePressed")();
       };
    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});