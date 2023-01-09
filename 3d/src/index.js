"use strict";
//
// Craig Fitzgerald

import $ from "jquery";
import * as THREE from 'three';
import {TrackballControls} from 'three/examples/jsm/controls/TrackballControls.js';
import PngMeta from './pngMetadata.js'

class PageHandler {
   constructor() {
      this.cubeCt = 0;
      this.cubeInfos = [];
      this.lastRotateTime = Date.now();
      this.lastLifeTime   = Date.now();

      this.geometry = new THREE.BoxGeometry( 100, 100, 100);
      this.loader = new THREE.TextureLoader();

      $(window).on("resize", () => this.Resize());
      $(window).keydown((e) => this.KeyDown(e));
      $(document).click((e) => this.ClickHandler(e));

      this.SetupThree();
   }

   SetupThree() {
      this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);
      this.camera.position.z = 1650;

      this.scene = new THREE.Scene();

      let dim = 4;
      let spacing = 300;
      for (let z=0; z<dim; z++) {
         for (let y=0; y<dim; y++) {
            for (let x=0; x<dim; x++) {
               let cubeInfo = this.CreateCube();
               this.cubeInfos.push(cubeInfo);
               let obj = cubeInfo.obj;
               obj.nfo = cubeInfo;
               this.scene.add(obj);
               obj.position.x = (x-(dim-1)/2) * spacing;
               obj.position.y = (y-(dim-1)/2) * spacing;
               obj.position.z = (z-(dim-1)/2) * spacing;
            }
         }
      }

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(this.renderer.domElement);

      this.controls = new TrackballControls(this.camera, this.renderer.domElement);
      }


   CreateCube() {
      let MAXROT = 0.0008;
      let filename = 'textures/hex-tile-'+ (1000 + this.cubeCt++) +'.png';
      let texture = this.loader.load(filename);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3,2);
      let material = new THREE.MeshBasicMaterial({color: 0xFF8844, map: texture});

      return {
         filename,
         obj: new THREE.Mesh(this.geometry, material),
         dx: Math.random() * MAXROT - MAXROT/2,
         dy: Math.random() * MAXROT - MAXROT/2,
         dz: Math.random() * MAXROT - MAXROT/2,
      }
   }

   Animate() {
      requestAnimationFrame(() => this.Animate());
      this.Render();
   }

   Render() {
      let time = Date.now();
      let lDelta = (time - this.lastLifeTime);

      if (lDelta > 20)
         {
         this.lastLifeTime = time;
         }
      this.controls.update();
      let tDelta = (time - this.lastRotateTime);
      this.lastRotateTime = time;

      this.cubeInfos.forEach((cubeInfo) => {
         cubeInfo.obj.rotation.x += tDelta * cubeInfo.dx;
         cubeInfo.obj.rotation.y += tDelta * cubeInfo.dy;
         cubeInfo.obj.rotation.z += tDelta * cubeInfo.dz;
      })

      this.renderer.render(this.scene, this.camera);
   }

   Resize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.updateProjectionMatrix();

      this.Render();
   }

   KeyDown(e) {
      if (e.originalEvent.which == 32) {
         this.lifeRunner.Reset(); 
      }
   }

   async ClickHandler(e){
      console.log("click!")

      let event = e.originalEvent;
   	event.preventDefault();

      let mouse = new THREE.Vector2() 
      let raycaster = new THREE.Raycaster();

      let objects = this.cubeInfos.map((ci)=>ci.obj);

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( mouse, this.camera );
		const intersections = raycaster.intersectObjects( objects, true );

		if ( intersections.length > 0 ) {
		   const object = intersections[ 0 ].object;
         console.log("found!", object, object.nfo.filename);
         let params = await this.TextureParams(object.nfo.filename);
         console.log(params, params);

      }
   }

   async TextureParams(filename) {
      let myRequest = new Request(filename);
      let response = await fetch(myRequest);
      let buffer0 = await response.arrayBuffer();
      let buffer = new Uint8Array(buffer0);
      let metadata = PngMeta.readMetadata(buffer);
      console.log("metadata", metadata.tEXt.Params);

//now build a link like so....
      let url = new URL("/toys/hex/index.html", window.location.href);
      url.searchParams.set("params", metadata.tEXt.Params);
      let link = document.createElement('a');
      link.setAttribute('target', "_blank");
      link.setAttribute('href', url);
      link.click();
   }

}

$(function() {
   let p = new PageHandler();
   p.Animate();
});
