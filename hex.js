"use strict";

// hex.js
//
// Generate random image of hexagonal tilings
// This is also an example of saving a canvas as a png
//
// todo: create some good tile generators
//
// Craig Fitzgerald 2022

 
class HexTiler {
   constructor() {
      this.$canvas = $("#canvas");
      this.canvas  = this.$canvas.get(0);
      this.ctx     = this.canvas.getContext("2d");
      this.radius  = 100;
      this.dx  = this.radius * 2;
      this.dy  = this.radius * 2 * 0.86602;

      $(window       ).on("resize",()=>this.Resize());
      $("#regenerate").on("click", ()=>this.Regen());
      $("#download"  ).on("click", ()=>this.Download());
      this.InitStyles();
      this.InitElements();
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
      this.InitStyles();
      this.InitElements();
      this.Draw();
   }

   InitStyles() {
      let h = Math.random() * 360;
      this.styles = [
         this.HSL (h,     "35%", "55%"),
         this.HSL ((h+180) % 360, "95%", "35%"),
         this.HSL ((h+120) % 360, "95%", "35%"),
         this.HSL ((h+240) % 360, "95%", "35%"),
      ];
   }

   InitElements() {
      let r  = this.radius;
      let r0 = this.Rand(4, r, 0);
      let r1 = this.Rand(4, r * 1.5,  - r/2);
      let r2 = this.Rand(4, r * 1.25, - r/2);
      let r3 = this.Rand(4, r, - r/2);

      this.elements = [
         {s: 1, f: () => this.Circle(0   , 0 , r0[0], 5, 1,0)},
         {s: 6, f: () => this.Circle(r0[1], r0[2], r0[3]/4, 5, 0, 2)},
         {s: 6, f: () => this.Rect  (-10 , 10, 100, 5, 2)},
         {s: 6, f: () => this.Rect  (r * 0.8, -r * 0.4, 10, r * 0.8, 3)},
         {s: 6, f: () => this.Circle(r * 0.8, 0, 10, 5, 0, 3)},
      ];
      // todo... flesh out some good generators
      this.elements.push({s: 6, f: () => this.Rect (...r1, 2)});
      this.elements.push({s: 6, f: () => this.Rect (...r2, 3)});
      this.elements.push({s: 6, f: () => this.Rect (...r3, 1)});
   }

   Draw() {
      this.DrawBackground();

      // account for elements possibly exceeding the boundry of a hex
      for (let y = -1; y <= this.yGrid; y++) {
         for (let x = -1; x <= this.xGrid; x++) {
            let xOffset = y % 2 ? 0 : this.radius;
            let c = {x: x*this.dx + xOffset, y: y*this.dy + this.radius};
            this.DrawHex(c);
         }
      }
   }

   DrawBackground() {
      this.ctx.fillStyle = this.styles[0];
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
   }

   DrawHex(c) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);

      this.elements.forEach((e) => {
         if (e.s == 1) {
            e.f();
         }
         if (e.s == 6) {
            for (let i=0; i<6; i++) {
               this.DrawSliver(e, i);
            }
         }
      });
      this.ctx.restore();
   }

   DrawSliver(e, i) {
      this.ctx.save();
      this.ctx.rotate(i * Math.PI / 3);
      e.f();
      this.ctx.restore();
   }

   Circle (x, y, r, w, ss, fs) {
      this.ctx.beginPath()
      this.ctx.arc(x,y,r,0,Math.PI * 2);
      this.ctx.strokeStyle = this.styles[ss];
      this.ctx.fillStyle = this.styles[fs];
      this.ctx.lineWidth = w;
      if (ss) this.ctx.stroke();
      if (fs) this.ctx.fill();
   }

   Rect (x, y, w, h, c) {
      this.ctx.fillStyle = this.styles[c];
      this.ctx.fillRect(x, y, w, h);
   }

   Rand(count, size, offset) {
      let ret = [];
      for (let i=0; i<count; i++) {
         ret.push(Math.random() * size + offset);
      }
      return ret;
   }

   HSL(h, s, l){
      return 'hsl('+h+','+s+','+l+')';
   }

   Download() {
      let link = document.createElement('a');
      link.setAttribute('download', 'hex.png');
      this.canvas.toBlob((blob) => {
         let url = URL.createObjectURL(blob);
         link.setAttribute('href', url);
         link.click();
      });
   }
}


$(function() {
   let p = new HexTiler({});
});

