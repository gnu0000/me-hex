"use strict";
// hex.js
// Generate image of random hexagonal tilings
// This is also an example of saving a canvas as a png
//
// NOTE:
//   this is a wip version which will  support re-arranging the 
//   element layers via dragging the buttons right or left
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
      this.buttonSpacing = 20;
      this.elements = [];

      $(window           ).on("resize"   , ()=>this.Resize());
      $("#regenerate"    ).on("click"    , ()=>this.Regen());
      $("#download-image").on("click"    , ()=>this.DownloadImage());
      $("#download-tile" ).on("click"    , ()=>this.DownloadTile());
      $("#d1 button, svg").on("click"    , (e)=>this.ElementToggle(e));
      $("#d1 button, svg").on("mousedown", (e)=>this.ButtonDragStart(e));
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
      for (let i=0; i<10; i++) {
         let element = this.CreateElement();
         element.index  = i; // can be derived...
         element.chosen = i < count;

         let button = $(`#d1 button:nth-child(${i+1})`);
         this.StyleButton(button, element);

         element.chosen ? button.addClass("chosen") : button.removeClass("chosen");
         element.button = button;
         button.data("element", element);
         this.elements.push(element);
      }
      this.PlaceButtons();
   }

   PlaceButtons(ignoreElement = 0) {
      this.elements.forEach((element, i) => {
         if (element != ignoreElement)
            element.button.css("left", `${i * this.buttonSpacing}px`);
      });
   }

   ElementToggle(e) {
      let button = $(e.currentTarget);
      if (e.currentTarget.tagName != "BUTTON") button = button.find("button");
      let element = button.data("element");

      element.chosen = !element.chosen;
      element.chosen ? button.addClass("chosen") : button.removeClass("chosen");

      this.Draw();
   }

   ButtonDragStart(e) {
      let button = $(e.currentTarget);
      if (e.currentTarget.tagName != "BUTTON") button = button.find("button");
      let element = button.data("element");

if (!element) {
   console.log("aagh!", this.dInfo, e);
   debugger;
}

      this.dInfo = {
         element: element,
         clientX: e.clientX,
         clientY: e.clientY,
         offsetX: button.get(0).offsetLeft,
         offsetY: button.get(0).offsetTop,
      }   
      $(document).on("mousemove", (e)=>this.ButtonDragging(e));
      $(document).on("mouseup"  , (e)=>this.ButtonDragEnd(e));
   }

   ButtonDragging(e) {
      let nfo     = this.dInfo;
      let element = nfo.element;

if (!element || !element.button) {
   console.log("aagh!", this.dInfo, e);
   debugger;
}

      let button  = element.button;
      let node    = element.button.get(0);
      let tpos    = nfo.offsetX + e.clientX - nfo.clientX;

      let newIndex = (node.offsetLeft / this.buttonSpacing).toFixed();
      if (newIndex != element.index) {
         this.elements.splice(newIndex, 0, this.elements.splice(element.index, 1)[0]);
         this.elements.forEach((e,i) => e.index = i);
         this.Draw();
      }
      this.PlaceButtons(nfo.element);
      button.css('left', `${tpos}px`);
      button.css('top' , `${nfo.offsetY - 3}px`);

      console.log(`${tpos}px,${nfo.offsetY - 3}px`, button, nfo);
   }

   ButtonDragEnd(e) {
      let nfo     = this.dInfo;
      let button = nfo.element.button;
      button.css('left', `${nfo.element.index * this.buttonSpacing}px`);
      button.css('top' , `${nfo.offsetY}px`);

      $(document).off("mousemove");
      $(document).off("mouseup"  );

      //for (let i=0; i<this.elements.length; i++) {
      //   console.log(`element order ${i}: ${this.elements[i].origin}`);
      //}
   }

////////////////////////////////////////////////////////

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

      return {t:"c", f:this.Circle, sym, color, p:[...center, rad, width]};
   }

   CreateRect() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2.5, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {t:"r", f:this.Rect, sym, color, p:[...pos, width]};
   }

   CreateLine() {
      let rad  = this.radius;
      let pos = this.RList(4, rad * 2, -rad);
      let sym = this.RI(2)==0 ? 3 : 6;
      let rand = this.RI(19,1);
      let width = rand>10 ? 0 : rand;
      let color = this.RI(3, 1);

      return {t:"l", f:this.Line, sym, color, p:[...pos, width]};
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
      e.f.call(this, ...e.p, e.color);
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

   Download(canvas, name) {
      let link = document.createElement('a');
      link.setAttribute('download', name);
      canvas.toBlob((blob) => {
         let url = URL.createObjectURL(blob);
         link.setAttribute('href', url);
         link.click();
      });
   }

   StyleButton(button, element) {
      let ns = 'http://www.w3.org/2000/svg';
      let svg = $(document.createElementNS(ns,'svg')).attr({height:12, width:12, viewBox:"0 0 12 12"});
      let stroke = this.styles[element.color];
      let node = 
         element.t == "c" ? $(document.createElementNS(ns,'circle')).attr({cx:"6", cy:"6", r:"5", stroke, "stroke-width":"1", fill:"none"}) :
         element.t == "r" ? $(document.createElementNS(ns,'rect')).attr({width:"12", height:"12", stroke, "stroke-width":"2", fill:"none"}) :
         element.t == "l" ? $(document.createElementNS(ns,'line')).attr({x1:"0", y1:"0", x2:"12", y2:"12", stroke, "stroke-width":"1"})     :
         "";
      svg.append(node);

      button.empty().append(svg);
   }
}

$(function() {
   let p = new HexTiler({});
});

