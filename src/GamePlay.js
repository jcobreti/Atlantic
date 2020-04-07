/** type {import(../typings/phaser)} */
var config = {
    type: Phaser.CANVAS,
    mode:Phaser.Scale.FIT,
    parent:'contenedor',
    width: window.innerWidth,
    height: window.innerHeight,
    autoResize: true,
    autoCenter:Phaser.Scale.CENTER_BOTH,
    align:Phaser.Scale.pageAlignVertically,
    physics: {
        default:'arcade',
        arcade:{
          debug:false,    
          gravity:{y:0}
          }
    },
    scene: [
      {
        preload: preload,
        create: create,
        update: update
      }
    ]
};
//NOTE VARIABLES GLOBALES
var AMOUNT_DIAMONTS=30;
var CANTIDAD_BURBUJAS=200;
var TIEMPO_JUEGO=30;
var game = new Phaser.Game(config);
var anchoJuego=game.config.width;
var altoJuego=game.config.height;
var bg;
var flagFirstMouseDown=false;
var diamantesGroup=[];
var diamantesPillados=0;
var endGame=false;
var alerta=0;
var tiburon,pescado,molusco,caballo;
var moluscoTween;
var scoreText,timerText;
var totalTime;
var currentScore;
var orientacion=0;//orientacion del tiburon
var ratonX,ratonY;
var contadorTimer;
var rectangulo;
var escenaActual;
var iniciaMolusco=false;
var inicio=1;
var tweenGroup=[];
var contadorBombas=0;

function preload() {
    this.load.image('background', 'assets/images/background.png');
    this.load.image('molusco','assets/images/mollusk.png');        
    this.load.image('tiburon','assets/images/shark.png');
    this.load.image('pescados','assets/images/fishes.png');
    this.load.image('booble1', 'assets/images/booble1.png');
    this.load.image('booble2', 'assets/images/booble2.png'); 
    
    this.load.spritesheet('caballo', 'assets/images/horse.png',{frameWidth:84,frameHeight:156,frame:2}); 
    this.load.spritesheet('diamante', 'assets/images/diamonds.png', {frameWidth:81,frameHeight:84,frame:4}); 
    
}
function create()
{   
    escenaActual=this;
    bg=this.add.image(0, 0, 'background').setOrigin(0,0).setInteractive();
    bg.setDisplaySize(anchoJuego, altoJuego);
    game.config.backgroundColor.setTo(108, 210, 222);
//NOTE zona de burbujas
    this.boobleArray = [];
     for(var i=0; i<CANTIDAD_BURBUJAS; i++){
        var xBooble = Phaser.Math.Between(20, anchoJuego-20);
        var yBooble = Phaser.Math.Between(400, anchoJuego);
        var booble = this.physics.add.image(xBooble, yBooble,'booble' + Phaser.Math.Between(1,2));
       
        booble.alpha = 0.8;
        booble.scale=0.8 + Phaser.Math.Between(0,1);
       
        this.boobleArray[i] = booble; 
    } 
 //NOTE zona de pescado y molusco   
    
    pescado=this.add.image(100,550,'pescados');
    molusco=this.add.image(500,50,'molusco');
    tiburon=this.add.image(500, 80, 'tiburon');
      
    caballo=this.physics.add.sprite(0,0,'caballo').setOrigin(0.5,0.5); //El anchor al centro del objeto
    caballo.x=anchoJuego/2;
    caballo.y=altoJuego/2;
    caballo.angle=0;
    caballo.scaleX=1;
    caballo.scaleY=1;
    caballo.scale=1;//Es lo mismo que:--> caballo.scaleX=1;caballo.scaleY=1
    caballo.setFrame(0);//OJO CERRADO
    caballo.alpha=1;
//NOTE animacion del caballo
    this.anims.create({
        key: 'ojos',
        frames: this.anims.generateFrameNumbers('caballo', { start: 1, end: 0 }),
        frameRate: 2,
        duration:400,
        repeat: 0,
     });
//NOTE captura de eventos en una imagen   
    //bg.on('pointerover', function(){tiburon.setTint(0xf0ff00);}, this)
    //bg.on('pointerout', function(){this.button.setTint(0xffffff);}, this)
    //bg.on('pointerdown', function(){});
    
    moluscoTween=this.tweens.add({
        targets: molusco,
        y: {start:50,to:440},
        duration: 4000,
        repeat:-1,
        alpha: {start:0.3,to:1},
       ease: 'Phaser.Easing.Elastic.Out',
       yoyo:true
      });
    moluscoTween.stop();
    
    for (var i=0;i<AMOUNT_DIAMONTS;i++)
    { 
       diamantesGroup[i]=this.physics.add.sprite(Phaser.Math.FloatBetween(50, anchoJuego-50), Phaser.Math.FloatBetween(100, altoJuego-50), 'diamante');
       d=diamantesGroup[i];
       d.scale=0.3+Phaser.Math.FloatBetween(0, 1);
       d.anchor=0
       d.setFrame(Phaser.Math.Between(0, 3));

       while (chocan2Rectangulos(d.getBounds(),caballo.getBounds())||chocanDiamantesEntreSi(d.getBounds(),i))
         {  d.x =Phaser.Math.Between(50, 300);
            d.y =Phaser.Math.Between(100, 600);
         }
    }
   
//NOTE CAJAS DE TEXTO    
    totalTime=TIEMPO_JUEGO;    
    estilo={ fontFamily:'Verdana', fontSize: '32px', fill: 'white' };
    
    scoreText = this.add.text(anchoJuego/4, 40,'PUNTUACION: 0',estilo);
    timerText = this.add.text((anchoJuego/2+200), 40,'TIEMPO RESTANTE: '+totalTime+'',estilo);
    
    rectangulo = this.add.rectangle(anchoJuego/2, altoJuego/2, anchoJuego, altoJuego,'#000',0);
    finText=this.add.text(anchoJuego/2, altoJuego/2, 'FIN DEL JUEGO',{ fontFamily:'Verdana', fontSize: '150px', fill: 'white'}).setOrigin(0.5,0.5);
    
    scoreText.anchor=0.5; //PAra quitar el efecto visual al pasar de 900 a 1000
    timerText.anchor=0.5; //PAra quitar el efecto visual al pasar de 900 a 1000
    finText.alpha=0;
 //NOTE contador tiempo    
    contadorTimer= this.time.addEvent(
        {delay:1000,
        callback:updateCounter,
        //args: [],
        loop:true,
        });
    
    this.physics.add.overlap(caballo, diamantesGroup, colisionDiamantes, null, this);
  
    bg.on('pointerdown',function(pointer){
        ratonX = pointer.x;
        ratonY = pointer.y;
        if (!flagFirstMouseDown) {
            flagFirstMouseDown=true;
            moluscoTween.play();
        }
       
        if(endGame)
        {   endGame=false;
            diamantesPillados=0;
            alerta=0;
            orientacion=0;
            iniciaMolusco=true;
            inicio=1;
            escenaActual.scene.restart();
        }
    });
    bg.on('pointermove',function(pointer){
        ratonX = pointer.x;
        ratonY = pointer.y;
    });
    
    currentScore = 0; 
} 

function update(){
    if ((flagFirstMouseDown)&&(!endGame))
    { for(var i=0; i<CANTIDAD_BURBUJAS; i++)
        {   var booble = this.boobleArray[i];
            
            if (inicio==1){ booble.setVelocityY(-Phaser.Math.Between(10,50));}
                      
            if(booble.y<-50)
            {   booble.y =  altoJuego+50;
                booble.x =  Phaser.Math.Between(1,anchoJuego);
            }
        } 
        inicio=0;
  
    if (iniciaMolusco){ 
            moluscoTween.play();
        }
        //Movemos el tiburon1
        var escalado=1.5;
        if (orientacion==0)
            tiburon.x=tiburon.x-4;
        else
            tiburon.x=tiburon.x+4;
   
        if ((tiburon.x<-500) ||(tiburon.x>anchoJuego+1000))
        {
            tiburon.y=Phaser.Math.Between(80,altoJuego-200); 
            
            if (tiburon.y<150){escalado=0.6;}
                else if (tiburon.y<200){escalado=0.8;}
                    else if (tiburon.y<300){escalado=1}
                        else if (tiburon.y<400){escalado=1.5}
                            else {escalado=2}             
            
            orientacion=1;//Phaser.Math.Between(0,1);
            
            if (orientacion==0)
                {   
                    tiburon.x=anchoJuego+500;
                    tiburon.scale=escalado;
                }
            else
                {
                    tiburon.scaleX=-escalado;
                    tiburon.scaleY=escalado;
                    tiburon.x=-200;
                } 
        };
        
        pescado.x=pescado.x+0.6;
        if (pescado.x>(anchoJuego+300)) pescado.x=-200;

        //ver la distancia entre el mouse y el caballo
        var distX=ratonX-caballo.x;
        var distY=ratonY-caballo.y;
      
        //PONER LA ORIENTACION DEL CABALLO
        if (distX>0)
            {//EL RATON ESTA A LA DERECHA
                caballo.flipX=false; 
               //caballo.scaleX=1;
            }
            else
            {//EL RATON ESTA A LA IZQUIERDA
                caballo.flipX=true; 
                //caballo.scaleX=1;
            }
        //Falta mover el caballo hacia el MOUSE
        caballo.x+=distX*0.02;
        caballo.y+=distY*0.02;
    }
}
function chocan2Rectangulos (r1, r2) {
    if ((r2.x>r1.x+r1.width)||(r1.x>r2.x+r2.width)) 
        return false
    if ((r2.y>r1.y+r1.height)||(r1.y>r2.y+r2.height)) 
        return false
    return true;
}
function chocanDiamantesEntreSi(rect2,index)
{   if (index==0)
        return false;
    for(j=0; j<index; j++)
         {if(chocan2Rectangulos(diamantesGroup[j].getBounds(), rect2))
            return true;
         }
    return false;
}
function updateCounter()
{   if (flagFirstMouseDown==true)
    {   totalTime--;
        timerText.text='TIEMPO RESTANTE: '+totalTime+'';
        if (totalTime<=0)
          {   endGame=true;
              showFinalMensaje('GAME OVER');
              caballo.setTint(0xff0000);
              contadorTimer.remove();
          }
    }
}
function colisionDiamantes(caballo,diamante)
{   currentScore+=100;
    diamante.disableBody(true,true);
    caballo.anims.play('ojos');
    scoreText.setText('PUNTUACION: '+currentScore);
    diamantesPillados++;
    
    if (diamantesPillados>=AMOUNT_DIAMONTS)
    {   endGame=true;
        showFinalMensaje('FELICIDADES');
        contadorTimer.remove();;
    }
}
function showFinalMensaje(p_texto)
{   rectangulo.fillAlpha=0.5;
    finText.text=p_texto;
    finText.alpha=1;
    moluscoTween.stop();
}
