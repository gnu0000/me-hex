"use strict";

// hexTiler.js
//
// Generate image of random hexagonal tilings
// This class handles drawing, saving, loading, drag/drop
//
// Craig Fitzgerald 2023

import PngMeta from './pngMetadata.js'

// constructor params:
//    canvas  - either a css selector or a jquery obj for a canvas
//    options - todo
//
export default class HexTiler {
   constructor(canvas, options) {
      this.version  = "1.0.0";
      this.$canvas  = canvas instanceof jQuery ? canvas : $(canvas);
      this.canvas   = this.$canvas.get(0);
      this.ctx      = this.canvas.getContext("2d");
      this.elements = [];
      this.scale    = 1.0;
      this.buttonSpacing = 20;
      this.stateChangeEvent = new Event("stateChange");

      this.$canvas.on("dragover" , (e)=>this.DragOverHandler(e));
      this.$canvas.on("drop"     , (e)=>this.DropHandler(e));
   }

   InitState() {
      // hex size
      this.radius = this.R(150, 30);
      this.dx  = this.radius * 2;
      this.dy  = this.radius * 2 * 0.86602;
      this.xGrid = Math.floor(this.canvas.width  / this.dx) + 1;
      this.yGrid = Math.floor(this.canvas.height / this.dy) + 1;

      // colors
      let h = this.R(360);
      this.styles = [
         this.HSL (h,             this.RI(90, 10), this.RI(60, 29)),
         this.HSL ((h+180) % 360, this.RI(90, 10), this.RI(90, 10)),
         this.HSL ((h+120) % 360, this.RI(90, 10), this.RI(90, 10)),
         this.HSL ((h+240) % 360, this.RI(90, 10), this.RI(90, 10)),
      ];

      // elements
      this.elements = [];
      let count =this.RI(8,2);
      for (let i=0; i<10; i++) {
         let element = this.CreateElement();
         element.index  = i; // can be derived...
         element.chosen = i < count;
         this.elements.push(element);
      }
      document.dispatchEvent(this.stateChangeEvent);
   }

   SetState(params) {
      this.elements = params.elements;
      this.styles   = params.styles;
      this.radius   = params.radius;
      this.dx  = this.radius * 2;
      this.dy  = this.radius * 2 * 0.86602;
      this.xGrid = Math.floor(this.canvas.width  / this.dx) + 1;
      this.yGrid = Math.floor(this.canvas.height / this.dy) + 1;
      document.dispatchEvent(this.stateChangeEvent);
   }

   SetScale(scale) {
      this.scale = scale;
   }

   GetScale(scale) {
      return this.scale;
   }

   Resize() {
      this.canvas.width  = this.$canvas.width()  / this.scale;
      this.canvas.height = this.$canvas.height() / this.scale;
      this.xGrid = Math.floor(this.canvas.width  / this.dx) + 1;
      this.yGrid = Math.floor(this.canvas.height / this.dy) + 1;
      return this;
   }

   GetState() {
      let elements = this.elements.slice(0);
      elements.forEach(e => delete e.button);

      return {
         elements,
         styles: this.styles,
         radius: this.radius
      };
   }

   CreateElement() {
     let r =this.RI(3);
      switch (r) {
         case 0: return this.CreateCircle();
         case 1: return this.CreateRect();
         case 2: return this.CreateLine();
      }
   }

   CreateCircle() {
      let rand = this.RI(10);
      let sym = rand==0 ? 1 : rand<5 ? 3 : 6;
      let center = sym==1 ? [0,0] : this.RList(2, this.radius, 0);
      let rad = this.R(this.radius);
      let color = this.RI(3, 1);
      rand = this.RI(13,1);
      let width = rand>10 ? 0 : rand;

      return {t:"c", sym, color, p:[...center, rad, width]};
   }

   CreateRect() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2.5, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {t:"r", sym, color, p:[...pos, width]};
   }

   CreateLine() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {t:"l", sym, color, p:[...pos, width]};
   }

   Draw() {
      this.DrawBackground();
      this.elements.forEach((e) => {
         if (!e.chosen) return;
         for (let y = -1; y <= this.yGrid; y++) {
            for (let x = -1; x <= this.xGrid; x++) {
               let xOffset = y % 2 ? 0 : this.radius;
               this.DrawHex(e, x*this.dx + xOffset, y*this.dy + this.radius);
            }
         }
      });
   }

   DrawBackground() {
      this.ctx.fillStyle = this.styles[0];
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
   }

   DrawHex(e, x, y) {
      this.ctx.save();
      this.ctx.translate(x, y);

      for (let i=0; i<e.sym; i++) {
         this.DrawElement(e, i*(e.sym==3 ? 2 : 1));
      }
      this.ctx.restore();
   }

   DrawElement(e, rot) {
      this.ctx.save();
      if (rot) this.ctx.rotate(rot * Math.PI / 3);
      //e.f.call(this, ...e.p, e.color);
      e.t == "c" ? this.Circle(...e.p, e.color) :
      e.t == "r" ? this.Rect(...e.p, e.color)   :
      e.t == "l" ? this.Line(...e.p, e.color)   :
      "";

      this.ctx.restore();
   }

   Circle(x, y, rad, width, color) {
      this.ctx.beginPath()
      this.ctx.arc(x,y,rad,0,Math.PI * 2);
      this.ctx.strokeStyle = this.styles[color];
      this.ctx.fillStyle = this.styles[color];
      this.ctx.lineWidth = width;
      if (width) this.ctx.stroke();
      if (!width) this.ctx.fill();
   }

   Rect(x, y, width, height, lineWidth, color) {
      this.ctx.strokeStyle = this.styles[color];
      this.ctx.fillStyle = this.styles[color];
      this.ctx.lineWidth = lineWidth;
      if (lineWidth) this.ctx.strokeRect(x, y, width, height);
      if (!lineWidth)this.ctx.fillRect(x, y, width, height);
   }

   Line(x0, y0, x1, y1, lineWidth, color) {
      this.ctx.strokeStyle = this.styles[color];
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x0, y1);
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();
   }

   R(max=1, offset=0) {
      return offset + Math.random() * max;
   }

   RI(max, offset=0) {
      return Math.floor(offset + Math.random() * max);
   }

   RList(count, max=1, offset=0) {
      let ret = [];
      for (let i=0; i<count; i++) {
         ret.push(Math.random() * max + offset);
      }
      return ret;
   }

   HSL(h, s, l){
      return 'hsl('+h+','+s+'%,'+l+'%)';
   }

   DownloadImage() {
      this.Download(this.canvas, "hex-image.png");
   }

   DownloadTile() {
      let scratch = document.createElement('canvas');
      scratch.width  = this.dx;
      scratch.height = this.dy * 2;
      let ctx = scratch.getContext('2d');
      ctx.drawImage(this.canvas, 0, 0);

      this.Download(scratch, "hex-tile.png");
   }

   async Download(canvas, name) {
      let link = document.createElement('a');
      link.setAttribute('download', name);
      canvas.toBlob(async (blob) => {
         let metadata = {
            "tEXt": {
               "Title": "A hex tile",
               "Software": `HexTile v${this.version}`,
               "Params": JSON.stringify(this.GetState())
            }
         };
         var newBlob = await PngMeta.writeMetadataB(blob,metadata);
         let url = URL.createObjectURL(newBlob);
         link.setAttribute('href', url);
         link.click();
      });
   }

   DragOverHandler(e) {
      e.preventDefault();
   }

   DropHandler(e) {
      e.preventDefault();
      let file = e.originalEvent.dataTransfer.files[0];
      if (!file.type.match(/\image\/png/i)) return;

      var reader = new FileReader();
      reader.onload = (e) => {   
         let buffer = new Uint8Array(e.target.result);
         let metadata = PngMeta.readMetadata(buffer);

         if (!metadata.tEXt || !metadata.tEXt.Params) return;
         console.log("png metadata:", metadata);
         let params = JSON.parse(metadata.tEXt.Params);
         this.SetState(params);
         this.Draw();

      };
      reader.readAsArrayBuffer(file);
   }
}
