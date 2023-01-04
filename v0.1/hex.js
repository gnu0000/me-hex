"use strict";
// hex.js
// Generate image of random hexagonal tilings
// This is also an example of saving a canvas as a png
//
// Craig Fitzgerald 2022
 
class HexTiler {
   constructor() {
      this.$canvas = $("#canvas");
      this.canvas  = this.$canvas.get(0);
      this.ctx     = this.canvas.getContext("2d");
      this.radius  = 100;
      this.dx  = this.radius * 2;
      this.dy  = this.radius * 2 * Math.cos(Math.PI * 30/180);

      $(window           ).on("resize",()=>this.Resize());
      $("#regenerate"    ).on("click", ()=>this.Regen());
      $("#download-image").on("click", ()=>this.DownloadImage());
      $("#download-tile" ).on("click", ()=>this.DownloadTile());
      $(".e"             ).on("click", (e)=>this.ElementToggle(e));
      this.InitState();
      this.Resize();
   }

   Resize() {
      let x = $(window).width();
      let y = $(window).height();
      this.$canvas.width (x);
      this.$canvas.height(y);
      this.canvas.width  = x;
      this.canvas.height = y;
      this.xGrid = Math.floor(x / this.dx) + 1;
      this.yGrid = Math.floor(y / this.dy) + 1;

      this.Draw();
   }

   Regen() {
      this.InitState();
      this.Draw();
   }

   InitState() {
      // hex size
      this.radius = this.R(150, 30);
      this.dx  = this.radius * 2;
      this.dy  = this.radius * 2 * 0.86602;
      this.xGrid = Math.floor($(window).width()  / this.dx) + 1;
      this.yGrid = Math.floor($(window).height() / this.dy) + 1;

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
      for (let i=0; i<count; i++) {
         this.elements.push(this.CreateElement());
      }
      //this.elements = [{sym:1, f:this.Circle, p:[0,0, this.radius, 3, "blue"]}]; //testing

      this.InitButtons();
   }

   InitButtons() {
      $(".e").prop("disabled",true);
      this.elements.forEach((e, i) => {
         $(`.e:[data-id="${i}"]`).prop("disabled",false).addClass("chosen");
      });
   }

   ElementToggle(e) {
      let el = $(e.currentTarget);
      el.toggleClass("chosen");
      //let test1 = el.hasClass("chosen");      
      //let test2 = el.data("id");      
      //console.log(test1, test2);
      this.elements[el.data("id")].c = el.hasClass("chosen");      
      this.Draw();
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

      return {sym, c:true, f:this.Circle, p:[...center, rad, width, color]};
   }

   CreateRect() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2.5, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {sym, c:true, f:this.Rect, p:[...pos, width, color]};
   }

   CreateLine() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {sym, c:true, f:this.Line, p:[...pos, width, color]};
   }

   Draw() {
      this.DrawBackground();
      this.elements.forEach((e) => {
         if (!e.c) return;
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
      e.f.call(this,...e.p);
      this.ctx.restore();
   }

   Circle(x, y, rad, width, style) {
      this.ctx.beginPath()
      this.ctx.arc(x,y,rad,0,Math.PI * 2);
      this.ctx.strokeStyle = this.styles[style];
      this.ctx.fillStyle = this.styles[style];
      this.ctx.lineWidth = width;
      if (width) this.ctx.stroke();
      if (!width) this.ctx.fill();
   }

   Rect(x, y, width, height, lineWidth, style) {
      this.ctx.strokeStyle = this.styles[style];
      this.ctx.fillStyle = this.styles[style];
      this.ctx.lineWidth = lineWidth;
      if (lineWidth) this.ctx.strokeRect(x, y, width, height);
      if (!lineWidth)this.ctx.fillRect(x, y, width, height);
   }

   Line(x0, y0, x1, y1, lineWidth, style) {
      this.ctx.strokeStyle = this.styles[style];
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

   Download(canvas, name) {
      let link = document.createElement('a');
      link.setAttribute('download', name);
      canvas.toBlob((blob) => {
         let url = URL.createObjectURL(blob);
         link.setAttribute('href', url);
         link.click();
      });
   }
}


$(function() {
   let p = new HexTiler({});
});

