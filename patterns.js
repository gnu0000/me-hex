"use strict";

import HexTiler from './hexTiler.js'

class PageHandler {
   constructor() {
      $('canvas').on("click" , (e)=>this.CanvasSelectHandler(e));
      $(window  ).on("resize", (e)=>this.ResizeHandler(e));
      $('canvas').on("resize", (e)=>this.ResizeHandler(e));

      $('canvas').each((i, e) => {
         let hex = new HexTiler(e, {});
         $(e).data("hex", hex);
         hex.SetScale(0.33);
         hex.Resize(hex, $(e));
         hex.InitState();
         hex.Draw();
      })
   }

   ResizeHandler() {
//      $(e.target).data("hex").Resize().Draw();
      
      //window.setTimeout(()=>{
      //   $('canvas').each((i, e) => $(e).data("hex").Resize().Draw()
      //)}, 150);

      //$('canvas').first().data("hex").Resize().Draw()

      let $c0 = $('canvas').first();
      let c0 = $c0.get(0);
let [nx, ny, cx, cy] = [$c0.width(), $c0.height(), c0.width, c0.height];
console.log(`[${nx}, ${ny}](${cx}, ${cy})`);

   }

   CanvasSelectHandler(e) {
      let canvas = $(e.currentTarget);
      let hex = canvas.data("hex");
      
      let url = new URL("index.html", window.location.href);
      url.searchParams.set("params", JSON.stringify(hex.GetState()));
      let link = document.createElement('a');
      link.setAttribute('target', "_blank");
      link.setAttribute('href', url);
      link.click();
   }
}

$(function() {
   let p = new PageHandler();
});
