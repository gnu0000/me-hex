"use strict";

// hex.js
//
// Generate image of random hexagonal tilings
// In this demo you can:
//    regenerate the random image
//    enable/disable layers by clicking the layer buttons
//    re-order layers by dragging the layer buttons left/right
//    save as an image (the whole canvas)
//    save as a tileable image (both x and y direction)
//    drag a tile and drop on the canvas to allow further editing
//
// This demonstrates
//    simple canvas drawing
//    constrained button draggging
//    drag/drop an image onto canvas
//    saving an image
//    putting metadata into a png file
//    extracting metadata from a png file
//    module imports including import-for-effect
//    restoring state from a url param
//    updating url with state
//
// This particular file manages resizing and the UI elements on the page
// and relies on HexTiler for the rest
//
// Craig Fitzgerald 2023

import HexTiler from './hexTiler.js'

 
class PageHandler {
   constructor() {
      this.hex = new HexTiler("#canvas", {})
      this.$canvas = $("#canvas");
      this.canvas  = this.$canvas.get(0);
      this.buttonSpacing = 20;

      $(window           ).on("resize"     , ()=>this.ResizeHandler());
      $("#regenerate"    ).on("click"      , ()=>this.RegenHandler());
      $("#download-image").on("click"      , ()=>this.DownloadImageHandler());
      $("#download-tile" ).on("click"      , ()=>this.DownloadTileHandler());
      $("#d1 button, svg").on("click"      , (e)=>this.ToggleElementHandler(e));
      $("#d1 button, svg").on("mousedown"  , (e)=>this.StartDragHandler(e));
      $(document         ).on("stateChange", (e)=>this.StateChangedHandler(e));

      this.Resize();
      this.InitState();
   }

   ResizeHandler() {
      this.Resize();
      this.hex.Draw();
   }

   Resize() {
      let x = $(window).width();
      let y = $(window).height();
      this.$canvas.width (x);
      this.$canvas.height(y);
      //this.canvas.width  = x;
      //this.canvas.height = y;
      this.hex.Resize();
   }

   InitState() {
      let jsonParams = this.URLParam("params", false);
      if (jsonParams) {
         this.hex.SetState(JSON.parse(jsonParams));
      } else {
         this.hex.InitState();
      }
      this.hex.Draw();
   }

   StateChangedHandler(e) {
      this.AttachButtons();
   }

   AttachButtons() {
      this.hex.elements.forEach((element, i) => {
         let button = $(`#d1 button:nth-child(${i+1})`);
         this.StyleButton(button, element);
         element.chosen ? button.addClass("chosen") : button.removeClass("chosen");
         element.button = button;
         button.data("element", element);
      });
      this.PlaceButtons();
   }

   RegenHandler() {
      this.hex.InitState();
      this.hex.Draw();
      this.AttachButtons();

      this.UpdateUrl();
   }

   PlaceButtons(ignoreElement = 0) {
      this.hex.elements.forEach((element, i) => {
         if (element != ignoreElement)
            element.button.css("left", `${i * this.buttonSpacing}px`);
      });
   }

   ToggleElementHandler(e) {
      let button = $(e.currentTarget);
      if (e.currentTarget.tagName != "BUTTON") button = button.find("button");
      let element = button.data("element");

      element.chosen = !element.chosen;
      element.chosen ? button.addClass("chosen") : button.removeClass("chosen");

      this.hex.Draw();
   }

   StartDragHandler(e) {
      let button = $(e.currentTarget);
      if (e.currentTarget.tagName != "BUTTON") button = button.find("button");
      let element = button.data("element");

      this.dInfo = {
         element: element,
         clientX: e.clientX,
         clientY: e.clientY,
         offsetX: button.get(0).offsetLeft,
         offsetY: button.get(0).offsetTop,
      }   
      $(document).on("mousemove", (e)=>this.ButtonDraggingHandler(e));
      $(document).on("mouseup"  , (e)=>this.ButtonDragEndHandler(e));
   }

   ButtonDraggingHandler(e) {
      let nfo     = this.dInfo;
      let element = nfo.element;

      let button  = element.button;
      let node    = element.button.get(0);
      let tpos    = nfo.offsetX + e.clientX - nfo.clientX;

      let newIndex = (node.offsetLeft / this.buttonSpacing).toFixed();
      if (newIndex != element.index) {
         this.hex.elements.splice(newIndex, 0, this.hex.elements.splice(element.index, 1)[0]);
         this.hex.elements.forEach((e,i) => e.index = i);
         this.hex.Draw();
      }
      this.PlaceButtons(nfo.element);
      button.css('left', `${tpos}px`);
      button.css('top' , `${nfo.offsetY - 3}px`);
   }

   ButtonDragEndHandler(e) {
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

   DownloadImageHandler() {
      this.hex.DownloadImage();
   }

   DownloadTileHandler() {
      this.hex.DownloadTile();
   }

   StyleButton(button, element) {
      let ns = 'http://www.w3.org/2000/svg';
      let svg = $(document.createElementNS(ns,'svg')).attr({height:12, width:12, viewBox:"0 0 12 12"});
      let stroke = this.hex.styles[element.color];
      let node = 
         element.t == "c" ? $(document.createElementNS(ns,'circle')).attr({cx:"6", cy:"6", r:"5", stroke, "stroke-width":"3", fill:"none"}) :
         element.t == "r" ? $(document.createElementNS(ns,'rect')).attr({width:"12", height:"12", stroke, "stroke-width":"6", fill:"none"}) :
         element.t == "l" ? $(document.createElementNS(ns,'line')).attr({x1:"0", y1:"0", x2:"12", y2:"12", stroke, "stroke-width":"3"})     :
         "";
      svg.append(node);
      button.empty().append(svg);
   }

   URLParam(name, defaultVal) {
      var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if(results){
         return decodeURIComponent(results[1]);
      }
      return defaultVal;
   }

   UpdateUrl() {
      let url = new URL(document.location);
      url.searchParams.set("params", JSON.stringify(this.hex.GetState()));
      history.replaceState(null, "", url);
   }
}

$(function() {
   let p = new PageHandler("#canvas", {});
});

