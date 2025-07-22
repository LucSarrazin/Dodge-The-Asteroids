import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import Stats from 'stats.js'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)
stats.dom.style.position = 'absolute';
stats.dom.style.left = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.top = 'auto'; // désactive le top si défini par défaut
stats.dom.style.zIndex = '1000';
// Scene and camera setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);
const loader = new GLTFLoader();

const listener = new THREE.AudioListener();
camera.add( listener );


const audioLoader = new THREE.AudioLoader();

const Ambiance = new THREE.Audio( listener );
audioLoader.load( 'sounds/space-ambiance.wav', function( buffer ) {
	Ambiance.setBuffer( buffer );
	Ambiance.setLoop( true );
	Ambiance.setVolume( 0.5 );
	Ambiance.play();
});

const Explosion = new THREE.Audio( listener );
audioLoader.load( 'sounds/explosion.mp3', function( buffer ) {
	Explosion.setBuffer( buffer );
	Explosion.setLoop( false );
	Explosion.setVolume( 1 );
});

const gas = new THREE.Audio( listener );
audioLoader.load( 'sounds/item.mp3', function( buffer ) {
	gas.setBuffer( buffer );
	gas.setLoop( false );
	gas.setVolume( 1 );
});

const RocketEngine = new THREE.Audio( listener );
audioLoader.load( 'sounds/rocketEngine.wav', function( buffer ) {
	RocketEngine.setBuffer( buffer );
	RocketEngine.setLoop( true );
	RocketEngine.setVolume( 0.6 );
});

const FuelAlert = new THREE.Audio( listener );
audioLoader.load( 'sounds/fuelAlarm.wav', function( buffer ) {
	FuelAlert.setBuffer( buffer );
	FuelAlert.setLoop( true );
	FuelAlert.setVolume( 0.6 );
});

//bloom renderer
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 2; //intensity of glow
bloomPass.radius = 0;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

//Textures loader
const textureLoader = new THREE.TextureLoader();
const SaturnRingTexture = textureLoader.load('saturnRing.png');
const MoonTexture = textureLoader.load('MoonTexture.jpg');
const starsTextureUrl = '/stars.jpg';

//Background texture
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
  starsTextureUrl,
]);

// Stars Background
const stars = [];
function addStar() {
  const geometry = new THREE.SphereGeometry(0.05, 24, 24);
  const material = new THREE.MeshStandardMaterial({ map: SaturnRingTexture, emissive: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(
    camera.position.x + x,
    camera.position.y + y,
    camera.position.z + z
  );
  stars.push(star);
  scene.add(star);
}

Array(500).fill().forEach(addStar);

//Controls
const clock = new THREE.Clock();
//const controls = new OrbitControls( camera, renderer.domElement );
let nameTigrouto = false; // Default name


// Moon
const Moongeometry = new THREE.SphereGeometry( 500, 32, 32 );
const Moonmaterial = new THREE.MeshStandardMaterial( { map: MoonTexture } );
const sphere = new THREE.Mesh( Moongeometry, Moonmaterial );
sphere.position.set(0, 0, -10000);
scene.add( sphere );

// Rocket
const Rocket = new THREE.Object3D();
let rocketModel;


// Fire
const Fire = new THREE.Object3D();
loader.load( 'rocket/Fire.glb', function ( fire ) {
    if(nameTigrouto === false){
        fire.scene.scale.set(3, 3, 3);
        fire.scene.position.set(0, -2, 0);
        fire.scene.rotation.set(-80, 0, 0);
        Fire.add(fire.scene);
    }
    //Rocket.add(fire.scene);
    //Fire.add(localLight);
    //scene.add( Fire );
}, undefined, function ( error ) {

    console.error( error );
});


// Asteroid
const Asteroids = [];
let asteroidModel = null;

loadAsteroidModel();
loadGasCanModel();

function loadAsteroidModel() {
    loader.load('/Asteroid/Asteroid.glb', function (gltf) {
        asteroidModel = gltf.scene;
        asteroidModel.scale.set(0.1, 0.1, 0.1);
        asteroidModel.rotation.set(-80, 0, 0);
    });
}

function loadGasCanModel() {
    loader.load('/GasCan/GasCan.glb', function (gltf) {
        gasCanModel = gltf.scene;
        gasCanModel.scale.set(0.7, 0.7, 0.7)
        gasCanModel.rotation.set(0, 0, 0);
    });
}

function CreateAsteroids() {
    if (!asteroidModel) return;

    const clone = asteroidModel.clone(true);
    clone.position.set(
        THREE.MathUtils.randFloat(-6, 6),
        THREE.MathUtils.randFloat(-3, 6),
        camera.position.z - 50
    );
    const localLight = new THREE.PointLight(0xffffff, 15, 50);
    localLight.position.set(clone.position.x, 2, clone.position.z);
    scene.add(clone);
    Asteroids.push(clone);
}

// Gas Can
const GasCans = []
let gasCanModel = null;

function CreateGas() {
    if (!gasCanModel) return;

    const clone = gasCanModel.clone(true);
    clone.position.set(
        THREE.MathUtils.randFloat(-5, 5),
        THREE.MathUtils.randFloat(-2, 4),
        camera.position.z - 50
    );
    const localLight = new THREE.PointLight(0xffffff, 15, 50);
    localLight.position.set(clone.position.x, 2, clone.position.z);
    scene.add(clone);
    GasCans.push(clone);
}

setInterval(() => {
    if(gameStarted === true){
    for (let index = 0; index < THREE.MathUtils.randFloat(5,30); index++) {
        CreateAsteroids();
    }
    CreateGas();
    }
}, 2000); // toutes les 2 secondes



const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


/*const helper = new THREE.PointLightHelper(localLight, 1); // 1 = taille
scene.add(helper);*/

const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.position.set(100, 100, -100); // direction de la lumière
scene.add(sunLight);


// Camera Position
camera.position.z = 5;
let currentCarburant = 100;
const maxCarburant = 100;
let gameStarted = false;
let StopCamera = true;

function getReducedBox3(object, reductionFactor) {
    const box = new THREE.Box3().setFromObject(object);

    const size = new THREE.Vector3();
    box.getSize(size);

    const center = new THREE.Vector3();
    box.getCenter(center);

    const halfSize = size.multiplyScalar(0.5 * reductionFactor);

    box.min.copy(center).sub(halfSize);
    box.max.copy(center).add(halfSize);

    return box;
}

// void Update 
function animate() {
    
    stats.begin()
    const delta = clock.getDelta();
    const speedRocket = 5; // 5 unité/seconde
    const moveDistance = speedRocket * delta;

    let speedCamera = 33; // 33 unité/seconde

    if(gameStarted === true) {
        Rocket.add(Fire);
        if(StopCamera === false) {
            const moveCameraDistance = speedCamera * delta;
            camera.position.z -= moveCameraDistance;
            Rocket.position.z -= moveCameraDistance;
        }


        if (!rocketModel) return;

        const rocketBox = getReducedBox3(rocketModel, 0.5);
        //console.log("🚀 rocketBox:", rocketBox.min, rocketBox.max);

        // Collision avec astéroïdes
        Asteroids.forEach((asteroid) => {
            const asteroidBox = getReducedBox3(asteroid, 0.6);
            //console.log(" asteroidBox:", asteroidBox.min, asteroidBox.max);
            if (rocketBox.intersectsBox(asteroidBox)) {
                // Explosion à la position de la fusée
                const rocketPosition = new THREE.Vector3();
                rocketModel.getWorldPosition(rocketPosition);
                rocketPosition.z -= 1;
                createExplosion(rocketPosition);
                shakeCamera(0.5, 300);

                
                THREE.AudioContext.getContext().resume();
                Explosion.play();
                
                RocketEngine.stop();
                FuelAlert.stop();
                console.log(t('collidedAsteroid'));

                document.getElementById("MenuDeath").style.display = "block";
                document.getElementById("DeadBy").innerHTML = t('gameOverReasonAsteroid');
                document.getElementById("GameOver").innerHTML = t('gameOverTitle');
                gameStarted = false;
                
                speedCamera = 0;
            }
        });

        // Collision avec bidons
        GasCans.forEach((gasCan, index) => {
            const gasBox = getReducedBox3(gasCan, 1);  
            //console.log(" gasBox:", gasBox.min, gasBox.max);
            if (rocketBox.intersectsBox(gasBox)) {
                console.log(t('fuelCollected'));
                THREE.AudioContext.getContext().resume();
                gas.play();
                currentCarburant = Math.min(currentCarburant + 20, maxCarburant);
                scene.remove(gasCan);
                GasCans.splice(index, 1);
            }
        });

        GasCans.forEach((element) => {
            if(element.position )
            if(element.position.z > camera.position.z + 10){
                scene.remove(element);
                //console.log("Supprimer !");
                //console.log(GasCans);
                return false;
            }
            //console.log(GasCans);
            return true;
        });

        Asteroids.forEach((element) => {
            if(element.position.z > camera.position.z + 10){
                scene.remove(element);
                //console.log("Supprimer !");
                //console.log(Asteroids);
                return false;
            }
            //console.log(Asteroids);
            return true;
        });

        // Mettre à jour la distance affichée
        const distanceValue = document.getElementById('distanceValue');
        distanceValue.textContent = Math.abs(Math.floor((-9450) - camera.position.z));
        const progressBar = document.getElementById('progressBar');
        const maxDistance = 10000;
        const currentDistance = Math.abs(Math.floor((-9450)- camera.position.z));
        progressBar.value = Math.min(currentDistance, maxDistance);

        const carburantBar = document.getElementById('carburantBar');
        const carburantValue = document.getElementById('carburantValue');
        currentCarburant -= 5 * delta;
        carburantValue.textContent = Math.floor(currentCarburant);

        carburantBar.value = currentCarburant;
        // Si le carburant est épuisé, on arrête le jeu
        if (currentCarburant <= 0) {
            //alert('Game Over! You have run out of fuel.');
            RocketEngine.stop();
            FuelAlert.stop();
            currentCarburant = 0;
            document.getElementById("MenuDeath").style.display = "block";
            document.getElementById("DeadBy").innerHTML = t('outOfFuel');
            document.getElementById("GameOver").innerHTML = t('gameOverTitle');
            renderer.setAnimationLoop(null); // Stop the animation loop
            return;
        }
        if (currentCarburant <= 30) {
            FuelAlert.play();
        }else if(currentCarburant > 30){
            FuelAlert.stop();
        }

        if (Rocket.position.z <= (-9450)) {
            //alert('You Win ! Boom.');
            // Explosion à la position de la fusée
            const rocketPosition = new THREE.Vector3();
            rocketModel.getWorldPosition(rocketPosition);
            rocketPosition.z -= 1;
            createExplosion(rocketPosition);
            
            THREE.AudioContext.getContext().resume();
            Explosion.play();
            
            RocketEngine.stop();
            FuelAlert.stop();
            document.getElementById("MenuDeath").style.display = "block";
            document.getElementById("GameOver").innerHTML = t('winTitle');
            document.getElementById("DeadBy").innerHTML = t('winMessage');
            StopCamera = true;
            speedCamera = 0.5;
            gameStarted = false;
            
            //renderer.setAnimationLoop(null); // Stop the animation loop
            //return;
        }

        // Boucle sur les étoiles existantes
        stars.forEach(star => {
          // Déplacer la star vers l’arrière
          star.position.z += (speedCamera - 25) * delta * 10;

          // Si l’étoile est trop loin derrière la caméra, on la replace devant
          if (star.position.z > camera.position.z + 50) {
            // Repositionne autour de la caméra, devant
            const [x, y, z] = Array(3)
              .fill()
              .map(() => THREE.MathUtils.randFloatSpread(100));
            star.position.set(
              camera.position.x + x,
              camera.position.y + y,
              camera.position.z - 50 + z  // Toujours devant la caméra
            );
          }
        });

        if (keysPressed.ArrowUp && Rocket.position.y <= 5) {
            Rocket.position.y += moveDistance;
        }
        if (keysPressed.ArrowDown && Rocket.position.y >= -1) {
            Rocket.position.y -= moveDistance;
        }
        if (keysPressed.ArrowRight && Rocket.position.x <= 5) {
            Rocket.position.x += moveDistance;
        }
        if (keysPressed.ArrowLeft && Rocket.position.x >= -5) {
            Rocket.position.x -= moveDistance;
        }
    }
    if(gameStarted === false) {
        
        // Boucle sur les étoiles existantes
        stars.forEach(star => {
          // Déplacer la star vers l’arrière
          star.position.z += (speedCamera - 32.5) * delta * 10;

          // Si l’étoile est trop loin derrière la caméra, on la replace devant
          if (star.position.z > camera.position.z + 50) {
            // Repositionne autour de la caméra, devant
            const [x, y, z] = Array(3)
              .fill()
              .map(() => THREE.MathUtils.randFloatSpread(100));
            star.position.set(
              camera.position.x + x,
              camera.position.y + y,
              camera.position.z - 50 + z  // Toujours devant la caméra
            );
          }
        });
    }


    sphere.rotation.y += 0.3 * delta;

    bloomComposer.render();
    
    stats.end()
}

function shakeCamera(intensity = 0.5, duration = 300) {
    const originalPos = camera.position.clone();
    const interval = setInterval(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
    }, 16);

    setTimeout(() => {
        clearInterval(interval);
        camera.position.x = originalPos.x;
        camera.position.y = originalPos.y;
    }, duration);
}


// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});
const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};


// Resize window
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("HelpMenu").style.display = "none";
    document.getElementById("Menu").style.display = "none";
    document.getElementById("MenuDeath").style.display = "none";
    THREE.AudioContext.getContext().resume();
    RocketEngine.play();

    gameStarted = true;
    StopCamera = false;
    currentCarburant = maxCarburant;
});
document.getElementById("startButton2").addEventListener("click", function() {
    document.getElementById("MenuDeath").style.display = "none";
    window.location.reload();
});


const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
if (name === "tigrouto") {
    console.log("Bienvenue Tigrouto !");
    nameTigrouto = true;
    console.log("Changement du model !");
    loader.load( 'rocket/scene.gltf', function ( rocket ) {
        rocket.scene.scale.set(0.3, 0.3, 0.3);
        rocket.scene.position.set(0, -2, 0);
        rocket.scene.rotation.set(0,-80,0);
        rocketModel = rocket.scene;
        Rocket.add(rocketModel);
        const localLight = new THREE.PointLight(0xffaa33, 5, 30); // couleur, intensité, portée
        localLight.position.set(0, 5, 0); // placer au centre du Rocket

        Rocket.add(localLight);
        scene.add( Rocket );
    }, undefined, function ( error ) {
        console.error( error );
    });
}   
else{
    console.log("Bienvenue inconnu !");
    loader.load( 'rocket/Rocketship.glb', function ( rocket ) {
        rocket.scene.scale.set(0.2, 0.2, 0.2);
        rocket.scene.position.set(0, -2, 0);
        rocket.scene.rotation.set(80, 0, 0);
        rocketModel = rocket.scene;
        Rocket.add(rocketModel);
        const localLight = new THREE.PointLight(0xffaa33, 5, 30); // couleur, intensité, portée
        localLight.position.set(0, 0, 0); // placer au centre du Rocket
        Rocket.add(localLight);
        scene.add( Rocket );
    }, undefined, function ( error ) {
    
        console.error( error );
    });
}

function createExplosion(position) {
    const particleCount = 30;
    const explosionGroup = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        );

        // Attache la vitesse à l’objet
        particle.userData.velocity = velocity;

        explosionGroup.add(particle);
    }
    

    scene.add(explosionGroup);

    const startTime = performance.now();
    function animateExplosion() {
        const elapsed = (performance.now() - startTime) / 1000;

        explosionGroup.children.forEach(particle => {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.1));
            particle.material.opacity = Math.max(1.0 - elapsed, 0);
        });

        if (elapsed < 1.5) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosionGroup);
        }
    }

    animateExplosion();
}

const select = document.getElementById("languageSelect");

let currentLang = select.value || "fr";

select.addEventListener("change", () => {
  currentLang = select.value;
  // Ici tu peux faire d’autres actions (rafraîchir l’UI, etc.)
});
function t(key) {
  return translations[currentLang][key] || key;
}

document.addEventListener('click', () => {
  // S'assurer que le contexte audio est bien activé (pour Chrome / mobile)
  THREE.AudioContext.getContext().resume();

  // Jouer le son s’il est prêt
  if (Ambiance.buffer && !Ambiance.isPlaying) {
    Ambiance.play();
  }
});

