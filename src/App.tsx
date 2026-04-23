/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Menu, Settings, ArrowLeft, LogIn, User, Smartphone, AtSign, ShieldCheck, CheckCircle2, AlertCircle, Trash2, Camera, Image, Lock, Plus, Download, LogOut, FileText, Zap, Car, Gamepad2, FileUser, RefreshCcw } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import ResumeBuilder from "./components/ResumeBuilder";
import IcebreakerWheel from "./components/IcebreakerWheel";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

// ─── DRIVING ENDLESS GAME CONSTANTS ───
const CW = 390, CH = 844;
const ROAD_L = 68, ROAD_R = 322, ROAD_W = ROAD_R - ROAD_L;
const PW = 36, PH = 68;
const WR = 52; // wheel radius
const WHEEL_X = CW / 2, WHEEL_Y = CH - 52;

const PRESETS = [
  { label:"RED",  c1:"#cc1111", c2:null,     accent:"#ff4444" },
  { label:"YLW",  c1:"#e8c200", c2:null,     accent:"#ffe033" },
  { label:"GRN",  c1:"#0ea832", c2:null,     accent:"#2ecc71" },
  { label:"R+Y",  c1:"#cc1111", c2:"#e8c200",accent:"#ff6622" },
  { label:"Y+G",  c1:"#e8c200", c2:"#0ea832",accent:"#88cc00" },
  { label:"R+G",  c1:"#cc1111", c2:"#0ea832",accent:"#ff44aa" },
];
const ECOLS = [["#1a6bb5","#0d3d6e"],["#8e24aa","#4a0072"],["#e65100","#7a2900"],["#00838f","#004d54"],["#ad1457","#6a0032"]];
const BCOLS = [["#c62828","#7a0000"],["#f57f17","#7a4100"],["#1565c0","#003083"],["#2e7d32","#004d00"]];

// ─── HELPERS ───
function lighten(hex: string, amt: number) {
  const n=parseInt(hex.slice(1),16);
  const r=Math.min(255,((n>>16)&0xff)+Math.round(amt*255));
  const g=Math.min(255,((n>>8)&0xff)+Math.round(amt*255));
  const b=Math.min(255,(n&0xff)+Math.round(amt*255));
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number) {
  const n=parseInt(hex.slice(1),16);
  const r=Math.max(0,((n>>16)&0xff)-Math.round(amt*255));
  const g=Math.max(0,((n>>8)&0xff)-Math.round(amt*255));
  const b=Math.max(0,(n&0xff)-Math.round(amt*255));
  return `rgb(${r},${g},${b})`;
}

// ─── DRAWING FUNCTIONS (from user) ───
function drawRealisticCar(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, isPlayer: boolean, c1: string, c2: string | null, flashHorn: boolean, type: "normal"|"sports"|"truck"|"van" = "normal") {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  
  let w = isPlayer ? PW : 30, h = isPlayer ? PH : 62;
  if (type === "sports") { w = 32; h = 58; }
  else if (type === "truck") { w = 42; h = 110; }
  else if (type === "van") { w = 36; h = 78; }

  const bodyColor = c1;

  ctx.save(); ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(3, h/2+6, w*0.55, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  const bodyGrad = isPlayer && c2
    ? (() => { const g = ctx.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; })()
    : (() => { const g = ctx.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0, lighten(bodyColor,0.25)); g.addColorStop(0.45, bodyColor); g.addColorStop(1, darken(bodyColor,0.3)); return g; })();

  ctx.fillStyle = bodyGrad;
  
  if (type === "truck") {
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 4);
    ctx.fill();
    // Cab detail
    ctx.fillStyle = darken(bodyColor, 0.2);
    ctx.fillRect(-w/2+2, -h/2+2, w-4, 25);
    ctx.fillStyle = "rgba(100,200,255,0.7)";
    ctx.fillRect(-w/2+6, -h/2+5, w-12, 10);
  } else {
    ctx.beginPath();
    ctx.moveTo(-w/2+5, h/2);
    ctx.lineTo(-w/2+2, h/2-12);
    ctx.lineTo(-w/2, h/2-28);
    ctx.lineTo(-w/2+2, -h/2+20);
    ctx.lineTo(-w/2+7, -h/2+6);
    ctx.lineTo(-w/2+10, -h/2);
    ctx.lineTo(w/2-10, -h/2);
    ctx.lineTo(w/2-7, -h/2+6);
    ctx.lineTo(w/2-2, -h/2+20);
    ctx.lineTo(w/2, h/2-28);
    ctx.lineTo(w/2-2, h/2-12);
    ctx.lineTo(w/2-5, h/2);
    ctx.closePath(); ctx.fill();
  }

  const cabinGrad = ctx.createLinearGradient(-w/2+8,-h/2+5,w/2-8,-h/2+5+h*0.28);
  cabinGrad.addColorStop(0, darken(bodyColor, 0.15));
  cabinGrad.addColorStop(1, darken(bodyColor, 0.4));
  ctx.fillStyle = cabinGrad;
  ctx.beginPath();
  ctx.moveTo(-w/2+8, -h/2+5);
  ctx.lineTo(-w/2+6, -h/2+h*0.18);
  ctx.lineTo(w/2-6, -h/2+h*0.18);
  ctx.lineTo(w/2-8, -h/2+5);
  ctx.closePath(); ctx.fill();

  const windGrad = ctx.createLinearGradient(0,-h/2+8,0,-h/2+h*0.22);
  windGrad.addColorStop(0,"rgba(180,230,255,0.85)");
  windGrad.addColorStop(0.5,"rgba(100,180,230,0.6)");
  windGrad.addColorStop(1,"rgba(50,120,180,0.4)");
  ctx.fillStyle = windGrad;
  ctx.beginPath();
  ctx.moveTo(-w/2+10,-h/2+8);
  ctx.lineTo(-w/2+8,-h/2+h*0.21);
  ctx.lineTo(w/2-8,-h/2+h*0.21);
  ctx.lineTo(w/2-10,-h/2+8);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath(); ctx.moveTo(-w/2+11,-h/2+9); ctx.lineTo(-w/2+9,-h/2+h*0.16); ctx.lineTo(-w/2+18,-h/2+h*0.16); ctx.lineTo(-w/2+16,-h/2+9); ctx.closePath(); ctx.fill();

  if(!isPlayer) {
    ctx.fillStyle = "rgba(100,170,220,0.55)";
    ctx.beginPath();
    ctx.moveTo(-w/2+10,h/2-8);
    ctx.lineTo(-w/2+8,h/2-h*0.21);
    ctx.lineTo(w/2-8,h/2-h*0.21);
    ctx.lineTo(w/2-10,h/2-8);
    ctx.closePath(); ctx.fill();
  }

  ctx.fillStyle = "rgba(100,180,230,0.45)";
  ctx.beginPath(); ctx.moveTo(-w/2+2,-h/2+22); ctx.lineTo(-w/2+2,-h/2+h*0.18); ctx.lineTo(-w/2+7,-h/2+h*0.18); ctx.lineTo(-w/2+6,-h/2+22); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w/2-2,-h/2+22); ctx.lineTo(w/2-2,-h/2+h*0.18); ctx.lineTo(w/2-7,-h/2+h*0.18); ctx.lineTo(w/2-6,-h/2+22); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = darken(bodyColor, 0.45);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w/2+5,h/2); ctx.lineTo(-w/2+2,h/2-12); ctx.lineTo(-w/2,h/2-28);
  ctx.lineTo(-w/2+2,-h/2+20); ctx.lineTo(-w/2+10,-h/2); ctx.lineTo(w/2-10,-h/2);
  ctx.lineTo(w/2-2,-h/2+20); ctx.lineTo(w/2,h/2-28); ctx.lineTo(w/2-2,h/2-12);
  ctx.lineTo(w/2-5,h/2); ctx.closePath(); ctx.stroke();

  ctx.strokeStyle = darken(bodyColor, 0.3); ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.moveTo(-w/2+3,h/2-10); ctx.lineTo(-w/2+3,-h/2+28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2-3,h/2-10); ctx.lineTo(w/2-3,-h/2+28); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(-w/2+4, -2, 6, 3); ctx.fillRect(w/2-10, -2, 6, 3);

  const wheelPos = [[-w/2-1,-h/2+14],[w/2-3,-h/2+14],[-w/2-1,h/2-18],[w/2-3,h/2-18]];
  wheelPos.forEach(([wx,wy]) => {
    ctx.fillStyle = "#111"; ctx.beginPath(); (ctx as any).roundRect(wx,wy,7,16,2); ctx.fill();
    ctx.fillStyle = "#333"; ctx.beginPath(); (ctx as any).roundRect(wx+1.5,wy+2,4,12,1); ctx.fill();
    ctx.fillStyle = "rgba(200,200,200,0.4)"; ctx.beginPath(); ctx.arc(wx+3.5,wy+8,2,0,Math.PI*2); ctx.fill();
  });

  if(isPlayer) {
    ctx.fillStyle = flashHorn ? "#ffffff" : "#fffde0";
    ctx.beginPath(); (ctx as any).roundRect(-w/2+3,-h/2+1,10,5,2); ctx.fill();
    ctx.beginPath(); (ctx as any).roundRect(w/2-13,-h/2+1,10,5,2); ctx.fill();
    ctx.fillStyle = "rgba(200,230,80,0.7)"; 
    ctx.fillRect(-w/2+4,-h/2,8,2); ctx.fillRect(w/2-12,-h/2,8,2);
    ctx.save(); ctx.globalAlpha=0.18;
    const hg1 = ctx.createRadialGradient(-w/2+8,-h/2-15,0,-w/2+8,-h/2-15,55);
    hg1.addColorStop(0,"#fffde0"); hg1.addColorStop(1,"transparent");
    ctx.fillStyle=hg1; ctx.beginPath(); ctx.arc(-w/2+8,-h/2-15,55,0,Math.PI*2); ctx.fill();
    const hg2 = ctx.createRadialGradient(w/2-8,-h/2-15,0,w/2-8,-h/2-15,55);
    hg2.addColorStop(0,"#fffde0"); hg2.addColorStop(1,"transparent");
    ctx.fillStyle=hg2; ctx.beginPath(); ctx.arc(w/2-8,-h/2-15,55,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ff1100";
    ctx.beginPath(); (ctx as any).roundRect(-w/2+3,h/2-6,9,5,1.5); ctx.fill();
    ctx.beginPath(); (ctx as any).roundRect(w/2-12,h/2-6,9,5,1.5); ctx.fill();
    ctx.fillStyle="rgba(255,50,0,0.3)";
    ctx.beginPath(); ctx.ellipse(-w/2+7,h/2+4,10,5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w/2-8,h/2+4,10,5,0,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,200,120,0.8)";
    ctx.beginPath(); (ctx as any).roundRect(-14,-h/2,10,4,1); ctx.fill();
    ctx.beginPath(); (ctx as any).roundRect(4,-h/2,10,4,1); ctx.fill();
    ctx.fillStyle = "#cc1100";
    ctx.beginPath(); (ctx as any).roundRect(-w/2+3,h/2-5,9,4,1); ctx.fill();
    ctx.beginPath(); (ctx as any).roundRect(w/2-12,h/2-5,9,4,1); ctx.fill();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth=0.6;
  ctx.beginPath(); ctx.moveTo(0,-h/2); ctx.lineTo(0,-h/2+h*0.22); ctx.stroke();

  if(isPlayer) {
    ctx.fillStyle = darken(bodyColor,0.5);
    ctx.fillRect(-w/2+10,-h/2+2,w-20,3);
    ctx.fillRect(-w/2+10,-h/2+4,3,h*0.14);
    ctx.fillRect(w/2-13,-h/2+4,3,h*0.14);
  }
  ctx.restore();
}

function drawRealisticBike(ctx: CanvasRenderingContext2D, x: number, y: number, c1: string, honked: boolean, wobble: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(wobble);
  const bw = 14, bh = 52;

  ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle="#000"; ctx.beginPath(); ctx.ellipse(2,bh/2+5,9,4,0,0,Math.PI*2); ctx.fill(); ctx.restore();

  ctx.fillStyle="#111"; ctx.beginPath(); ctx.ellipse(0,bh/2-5,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#2a2a2a"; ctx.beginPath(); ctx.ellipse(0,bh/2-5,5,3,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(160,160,160,0.5)"; ctx.beginPath(); ctx.arc(0,bh/2-5,1.5,0,Math.PI*2); ctx.fill();

  ctx.fillStyle="#111"; ctx.beginPath(); ctx.ellipse(0,-bh/2+7,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#2a2a2a"; ctx.beginPath(); ctx.ellipse(0,-bh/2+7,5,3,0,0,Math.PI*2); ctx.fill();

  const frameG = ctx.createLinearGradient(-bw/2,-bh/2,bw/2,bh/2);
  frameG.addColorStop(0, lighten(c1,0.2)); frameG.addColorStop(0.5,c1); frameG.addColorStop(1,darken(c1,0.35));
  ctx.fillStyle=frameG;
  ctx.beginPath(); (ctx as any).roundRect(-bw/2,-bh/2+9,bw,bh-16,4); ctx.fill();

  ctx.fillStyle=lighten(c1,0.1);
  ctx.beginPath(); (ctx as any).roundRect(-bw/2,-bh/2+16,bw,18,3); ctx.fill();
  ctx.strokeStyle=darken(c1,0.3); ctx.lineWidth=0.8; ctx.strokeRect(-bw/2,-bh/2+16,bw,18);

  ctx.fillStyle="#2a2a2a"; ctx.beginPath(); (ctx as any).roundRect(-bw/2+2,-bh/2+35,bw-4,14,2); ctx.fill();
  ctx.fillStyle="#444"; ctx.fillRect(-bw/2+3,-bh/2+37,bw-6,3);
  ctx.fillRect(-bw/2+3,-bh/2+41,bw-6,3);

  ctx.fillStyle="#666"; ctx.beginPath(); (ctx as any).roundRect(bw/2-2,bh/2-18,5,16,2); ctx.fill();
  ctx.fillStyle="#888"; ctx.beginPath(); (ctx as any).roundRect(bw/2-2,bh/2-4,5,6,1); ctx.fill();

  ctx.fillStyle="rgba(255,245,180,0.9)"; ctx.beginPath(); (ctx as any).roundRect(-5,-bh/2+7,10,6,2); ctx.fill();
  ctx.fillStyle="rgba(255,255,200,0.25)"; ctx.beginPath(); ctx.ellipse(0,-bh/2+2,12,8,0,0,Math.PI*2); ctx.fill();

  ctx.fillStyle="#cc1100"; ctx.beginPath(); (ctx as any).roundRect(-4,bh/2-9,8,4,1); ctx.fill();

  ctx.strokeStyle="#555"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-12,-bh/2+12); ctx.lineTo(12,-bh/2+12); ctx.stroke();
  ctx.strokeStyle="#777"; ctx.lineWidth=1.5; ctx.stroke();

  ctx.fillStyle="#aaa"; ctx.fillRect(-14,-bh/2+10,5,3); ctx.fillRect(9,-bh/2+10,5,3);

  const helmetG = ctx.createRadialGradient(-2,-bh/2-8,1,0,-bh/2-6,10);
  helmetG.addColorStop(0,"#666"); helmetG.addColorStop(1,"#222");
  ctx.fillStyle=helmetG; ctx.beginPath(); ctx.ellipse(0,-bh/2-6,8,9,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(120,200,255,0.45)"; ctx.beginPath(); ctx.ellipse(2,-bh/2-8,4,3,0.3,0,Math.PI*2); ctx.fill();
  
  ctx.strokeStyle="rgba(100,180,255,0.6)"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(0,-bh/2-6,7,Math.PI*0.3,Math.PI*0.7); ctx.stroke();
  
  ctx.fillStyle="#1a1a1a"; ctx.beginPath();
  ctx.moveTo(-5,-bh/2+3); ctx.lineTo(-7,-bh/2+14); ctx.lineTo(7,-bh/2+14); ctx.lineTo(5,-bh/2+3); ctx.closePath(); ctx.fill();
  
  ctx.strokeStyle="#1a1a1a"; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(-5,-bh/2+6); ctx.lineTo(-11,-bh/2+12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5,-bh/2+6); ctx.lineTo(11,-bh/2+12); ctx.stroke();

  if(honked) {
    ctx.save(); ctx.globalAlpha=0.9;
    ctx.fillStyle="#ffe000"; ctx.font="bold 18px sans-serif"; ctx.textAlign="center";
    ctx.fillText("←", -22, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D,x: number,y: number,s: number,v: number){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle="#3d2008";ctx.fillRect(-4,0,8,22);
  if(v===0){
    [[0,-8,24],[0,-22,18],[0,-34,13]].forEach(([ox,oy,w],i)=>{
      ctx.fillStyle=["#145214","#1a6b1a","#228b22"][i];
      ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox-w/2,oy+16);ctx.lineTo(ox+w/2,oy+16);ctx.fill();
    });
  } else if(v===1){
    ctx.fillStyle="#145214";ctx.beginPath();ctx.arc(0,-18,17,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#1a8c1a";ctx.beginPath();ctx.arc(-6,-24,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#228b22";ctx.beginPath();ctx.arc(5,-26,9,0,Math.PI*2);ctx.fill();
  } else {
    ctx.fillStyle="#6b4a1a";ctx.fillRect(-3,-12,6,28);
    [[-22,-34],[22,-32],[-10,-44],[12,-42],[0,-48]].forEach(([lx,ly])=>{
      ctx.strokeStyle="#1a6b1a";ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,-12);ctx.quadraticCurveTo(lx*.5,ly+14,lx,ly);ctx.stroke();
    });
  }
  ctx.restore();
}
function drawHouse(ctx: CanvasRenderingContext2D,x: number,y: number,s: number,v: number){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const w=38,h=32;
  ctx.fillStyle=["#c9a96e","#d4b483","#b8935a","#e2c47a","#c4a060"][v%5];
  ctx.fillRect(-w/2,-h,w,h);
  ctx.strokeStyle="rgba(0,0,0,0.08)";ctx.lineWidth=1;
  for(let r=0;r<4;r++){ctx.beginPath();ctx.moveTo(-w/2,-h+r*8);ctx.lineTo(w/2,-h+r*8);ctx.stroke();}
  ctx.fillStyle=["#8B2020","#A0522D","#7B1515","#B03020","#6B4226"][v%5];
  ctx.beginPath();ctx.moveTo(-w/2-5,-h);ctx.lineTo(0,-h-24);ctx.lineTo(w/2+5,-h);ctx.closePath();ctx.fill();
  ctx.fillStyle="#888";ctx.fillRect(8,-h-28,7,18);ctx.fillStyle="#999";ctx.fillRect(6,-h-30,11,4);
  ctx.fillStyle="#5c3d11";ctx.fillRect(-7,-14,14,14);
  ctx.fillStyle="rgba(180,220,255,0.75)";ctx.fillRect(-w/2+5,-h+5,11,9);ctx.fillRect(w/2-16,-h+5,11,9);
  ctx.strokeStyle="#5c3d11";ctx.lineWidth=1.5;ctx.strokeRect(-w/2+5,-h+5,11,9);ctx.strokeRect(w/2-16,-h+5,11,9);
  ctx.restore();
}
function drawBuilding(ctx: CanvasRenderingContext2D,x: number,y: number,s: number,v: number,bx: number,by: number){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const conf=[[28,72],[22,90],[34,55],[26,80]][v%4];
  const[bw,bh]=conf;
  ctx.fillStyle=["#7a6548","#8b7355","#6b5540","#9e8b72"][v%4];
  ctx.fillRect(-bw/2,-bh,bw,bh);
  ctx.strokeStyle="rgba(0,0,0,0.1)";ctx.lineWidth=1;
  for(let r=0;r<Math.floor(bh/8);r++){ctx.beginPath();ctx.moveTo(-bw/2,-bh+r*8);ctx.lineTo(bw/2,-bh+r*8);ctx.stroke();}
  for(let r=0;r<Math.floor(bh/18);r++)
    for(let c=0;c<Math.floor(bw/13);c++){
      const on=((bx+c)*7+(by+r)*13)%7>1;
      ctx.fillStyle=on?"rgba(255,240,140,0.7)":"rgba(30,30,50,0.6)";
      ctx.fillRect(-bw/2+4+c*13,-bh+7+r*17,8,9);
    }
  ctx.fillStyle="rgba(0,0,0,0.28)";ctx.fillRect(-bw/2,-bh,bw,4);
  ctx.restore();
}
function drawBush(ctx: CanvasRenderingContext2D,x: number,y: number,s: number){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  [[0,-4,14],[-11,1,11],[11,1,11],[0,3,10]].forEach(([bx,by,r],i)=>{
    ctx.fillStyle=["#145214","#1a6b1a","#1a5c14","#228b22"][i];
    ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();
}
function drawLamp(ctx: CanvasRenderingContext2D,x: number,y: number,s: number){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.strokeStyle="#666";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-44);ctx.lineTo(16,-44);ctx.stroke();
  ctx.fillStyle="#aaa";ctx.fillRect(12,-48,11,5);
  ctx.fillStyle="#ffffaa";ctx.beginPath();ctx.arc(17,-45,4,0,Math.PI*2);ctx.fill();
  const g=ctx.createRadialGradient(17,-45,0,17,-45,24);
  g.addColorStop(0,"rgba(255,255,150,0.38)");g.addColorStop(1,"rgba(255,255,150,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(17,-45,24,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawBarrier(ctx: CanvasRenderingContext2D,y: number,gapX: number,gapW: number){
  const bh=28;
  for(let sx=ROAD_L,i=0;sx<ROAD_R;sx+=20,i++){
    ctx.fillStyle=i%2===0?"#ff4400":"#ffffff";
    ctx.fillRect(sx,y-bh/2,Math.min(20,ROAD_R-sx),bh);
  }
  ctx.fillStyle="#1c1c1c";ctx.fillRect(gapX-gapW/2,y-bh/2-1,gapW,bh+2);
  ctx.strokeStyle="#cc2200";ctx.lineWidth=2;ctx.strokeRect(ROAD_L,y-bh/2,ROAD_W,bh);
  [-1,1].forEach(side=>{
    const cx=gapX+side*(gapW/2+12);
    ctx.fillStyle="#ff6600";ctx.beginPath();ctx.moveTo(cx-8,y+bh/2);ctx.lineTo(cx+8,y+bh/2);ctx.lineTo(cx,y-bh/2-14);ctx.fill();
    ctx.fillStyle="white";ctx.fillRect(cx-5,y-1,10,5);
  });
}

function drawRoundWheel(ctx: CanvasRenderingContext2D, angle: number, hornPressed: boolean) {
  ctx.save(); ctx.translate(WHEEL_X, WHEEL_Y); ctx.rotate(angle * Math.PI/180);

  ctx.save(); ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=18; ctx.shadowOffsetY=6;
  ctx.beginPath(); ctx.arc(0,0,WR+2,0,Math.PI*2);
  ctx.strokeStyle="transparent"; ctx.lineWidth=22; ctx.stroke();
  ctx.restore();

  ctx.beginPath(); ctx.arc(0,0,WR,0,Math.PI*2);
  ctx.strokeStyle="#0c0400"; ctx.lineWidth=22; ctx.stroke();

  ctx.beginPath(); ctx.arc(0,0,WR,0,Math.PI*2);
  ctx.strokeStyle="#3e1800"; ctx.lineWidth=18; ctx.stroke();

  const rimGrad = ctx.createConicGradient(0, 0, 0);
  rimGrad.addColorStop(0.00,"#c07830"); rimGrad.addColorStop(0.12,"#8B4A18");
  rimGrad.addColorStop(0.25,"#6a2d0a"); rimGrad.addColorStop(0.40,"#4a1a05");
  rimGrad.addColorStop(0.52,"#9B4513"); rimGrad.addColorStop(0.65,"#c07830");
  rimGrad.addColorStop(0.78,"#6a2d0a"); rimGrad.addColorStop(0.90,"#4a1a05");
  rimGrad.addColorStop(1.00,"#c07830");
  ctx.beginPath(); ctx.arc(0,0,WR,0,Math.PI*2);
  ctx.strokeStyle=rimGrad; ctx.lineWidth=14; ctx.stroke();

  ctx.save();
  ctx.beginPath(); ctx.arc(0,0,WR+7,0,Math.PI*2); ctx.arc(0,0,WR-7,0,Math.PI*2,true);
  ctx.clip();
  const sheen=ctx.createLinearGradient(-WR,-WR,WR,WR);
  sheen.addColorStop(0,"rgba(255,200,110,0.45)"); sheen.addColorStop(0.45,"rgba(255,200,110,0)");
  sheen.addColorStop(0.55,"rgba(0,0,0,0.0)"); sheen.addColorStop(1,"rgba(0,0,0,0.38)");
  ctx.fillStyle=sheen; ctx.fillRect(-WR-8,-WR-8,(WR+8)*2,(WR+8)*2);
  ctx.restore();

  ctx.beginPath(); ctx.arc(0,0,WR+3,0,Math.PI*2);
  ctx.strokeStyle="rgba(200,145,55,0.55)"; ctx.lineWidth=2.5; ctx.stroke();

  ctx.beginPath(); ctx.arc(0,0,WR-8,0,Math.PI*2);
  ctx.strokeStyle="rgba(120,70,20,0.5)"; ctx.lineWidth=1.5; ctx.stroke();

  ctx.save();
  for(let i=0;i<36;i++){
    const a=i/36*Math.PI*2, b=(i+0.5)/36*Math.PI*2;
    ctx.strokeStyle="rgba(220,160,70,0.35)"; ctx.lineWidth=1.2; ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.arc(0,0,WR-2,a,b); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();

  ctx.lineCap="round";
  [90, 210, 330].forEach(deg => {
    const rad=deg*Math.PI/180;
    const ex=Math.cos(rad)*(WR-10), ey=Math.sin(rad)*(WR-10);
    ctx.beginPath(); ctx.moveTo(Math.cos(rad)*12+4,Math.sin(rad)*12+5); ctx.lineTo(ex+4,ey+5);
    ctx.strokeStyle="rgba(0,0,0,0.55)"; ctx.lineWidth=14; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(rad)*12,Math.sin(rad)*12); ctx.lineTo(ex,ey);
    ctx.strokeStyle="#2a0e00"; ctx.lineWidth=13; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(rad)*12,Math.sin(rad)*12); ctx.lineTo(ex,ey);
    ctx.strokeStyle="#7a3510"; ctx.lineWidth=9; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(rad)*13,Math.sin(rad)*13-1); ctx.lineTo(ex*.88,ey*.88-1);
    ctx.strokeStyle="rgba(210,130,60,0.6)"; ctx.lineWidth=4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(rad)*13,Math.sin(rad)*13-1.5); ctx.lineTo(ex*.5,ey*.5-1.5);
    ctx.strokeStyle="rgba(255,190,100,0.25)"; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(rad)*16,Math.sin(rad)*16,4,0,Math.PI*2);
    ctx.fillStyle="rgba(180,100,30,0.4)"; ctx.fill();
  });
  ctx.lineCap="butt";

  const hubG=ctx.createRadialGradient(-7,-8,1,0,0,20);
  hubG.addColorStop(0,"#f0d888"); hubG.addColorStop(0.25,"#d4920a");
  hubG.addColorStop(0.6,"#8B5010"); hubG.addColorStop(1,"#2a0e00");
  ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fillStyle=hubG; ctx.fill();
  ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.strokeStyle="#1a0800"; ctx.lineWidth=1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.strokeStyle="rgba(200,140,30,0.6)"; ctx.lineWidth=2; ctx.stroke();

  // ── HORN BUTTON (center) ──
  ctx.save(); ctx.rotate(-angle*Math.PI/180); 
  ctx.fillStyle = hornPressed ? "#3a1a08" : "#2a0e00";
  ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.arc(-3,-3,4,0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.sin(spin), 1);
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#d97706"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("$", 0, 0);
  ctx.restore();
}

function drawNitro(ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) {
  ctx.save(); ctx.translate(x, y);
  const s = 1 + Math.sin(pulse) * 0.1;
  ctx.scale(s, s);
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath(); ctx.roundRect(-8, -12, 16, 24, 4); ctx.fill();
  ctx.fillStyle = "#60a5fa"; ctx.fillRect(-6, -10, 12, 5);
  ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.strokeRect(-8, -12, 16, 24);
  ctx.restore();
}

// ─── GAME COMPONENT ───
const DrivingEndlessGame = ({ onUpdateBest, bestScore: remoteBest }: { onUpdateBest: (score: number) => void, bestScore: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(remoteBest || 0);
  const [carColor] = useState(PRESETS[0]);
  const [dimensions, setDimensions] = useState({ w: CW, h: CH });

  // Game internal state caches for performance
  const mouseRef = useRef({ x: CW/2, down: false });
  const playerRef = useRef({ x: CW/2, y: CH-180, tilt: 0, flashHorn: false, life: 100, nitro: 0 });
  const offsetRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const decorRef = useRef<any[]>([]);
  const itemsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const cloudsRef = useRef<any[]>([]);
  const lastTimeRef = useRef(0);
  const shakeRef = useRef(0);

  // Responsive logic
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ w: width, h: height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const spawnInitialDecor = useCallback(() => {
    // Fill clouds
    cloudsRef.current = Array.from({ length: 6 }).map(() => ({
      x: Math.random() * CW,
      y: Math.random() * CH,
      s: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.2,
      speed: 0.2 + Math.random() * 0.5
    }));
  }, []);

  const initGame = useCallback(() => {
    playerRef.current = { x: CW/2, y: CH-180, tilt: 0, flashHorn: false, life: 100, nitro: 0 };
    obstaclesRef.current = [];
    decorRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    spawnInitialDecor();
    offsetRef.current = 0;
    setScore(0);
    setGameState("playing");
    shakeRef.current = 0;
    lastTimeRef.current = performance.now();
  }, [spawnInitialDecor]);

  useEffect(() => {
    const handleTouch = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
        // Adjust for the scale of the canvas
        const scale = CW / rect.width;
        const x = (clientX - rect.left) * scale;
        mouseRef.current.x = x;
        mouseRef.current.down = true;
      }
    };
    const handleEnd = () => { mouseRef.current.down = false; };
    
    // Bind to the container specifically for better control
    const cont = containerRef.current;
    if(!cont) return;

    cont.addEventListener('mousedown', handleTouch as any);
    cont.addEventListener('mousemove', handleTouch as any);
    cont.addEventListener('mouseup', handleEnd);
    cont.addEventListener('touchstart', handleTouch as any, { passive: false });
    cont.addEventListener('touchmove', handleTouch as any, { passive: false });
    cont.addEventListener('touchend', handleEnd);
    
    return () => {
      cont.removeEventListener('mousedown', handleTouch as any);
      cont.removeEventListener('mousemove', handleTouch as any);
      cont.removeEventListener('mouseup', handleEnd);
      cont.removeEventListener('touchstart', handleTouch as any);
      cont.removeEventListener('touchmove', handleTouch as any);
      cont.removeEventListener('touchend', handleEnd);
    };
  }, [dimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let frameId: number;

    const loop = (t: number) => {
      const dt = Math.min(t - lastTimeRef.current, 100);
      lastTimeRef.current = t;

      // Update
      if(gameState === "playing") {
        const speedMultiplier = 1 + (score * 0.0001); // Slowly increase speed
        let speed = 8 * speedMultiplier;
        
        if (playerRef.current.nitro > 0) {
          speed *= 1.8;
          playerRef.current.nitro -= 1;
          // Spawn nitro particles
          particlesRef.current.push({
            x: playerRef.current.x + (Math.random()-0.5)*10,
            y: playerRef.current.y + 34,
            vx: (Math.random()-0.5)*2,
            vy: 2 + Math.random()*4,
            life: 1,
            color: "#60a5fa"
          });
        }

        offsetRef.current += speed;
        setScore(s => s + 1);

        // Player movement
        const targetX = Math.max(ROAD_L + PW/2, Math.min(ROAD_R - PW/2, mouseRef.current.x));
        playerRef.current.tilt = (targetX - playerRef.current.x) * 0.12;
        playerRef.current.x += (targetX - playerRef.current.x) * 0.2;
        playerRef.current.flashHorn = mouseRef.current.down;

        // Particles decay
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Shake decay
        if(shakeRef.current > 0) shakeRef.current *= 0.9;

        // Spawn obstacles
        if(Math.random() < 0.02 + (score * 0.00001)) {
          const rand = Math.random();
          const type = rand > 0.8 ? "truck" : rand > 0.6 ? "van" : rand > 0.2 ? "car" : "bike";
          const laneChoices = [ROAD_L + 40, ROAD_L + ROAD_W/2, ROAD_R - 40];
          const x = laneChoices[Math.floor(Math.random() * laneChoices.length)];
          
          const tooClose = obstaclesRef.current.some(o => o.y < 150 && Math.abs(o.x - x) < 40);
          if(!tooClose) {
            obstaclesRef.current.push({
              id: Math.random(),
              x,
              y: -150,
              type,
              color: type === "truck" ? "#444" : type === "car" ? ECOLS[Math.floor(Math.random() * ECOLS.length)][0] : BCOLS[Math.floor(Math.random() * BCOLS.length)][0],
              speed: type === "truck" ? 1 : type === "van" ? 2 : Math.random() * 1.5 + 3
            });
          }
        }

        // Spawn adventure items
        if(Math.random() < 0.01) {
          itemsRef.current.push({
            id: Math.random(),
            x: ROAD_L + 20 + Math.random() * (ROAD_W - 40),
            y: -50,
            type: Math.random() > 0.8 ? "nitro" : "coin",
            spin: 0
          });
        }

        // Spawn decor (Ultra High Density & Variety)
        if(Math.random() < 0.22) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const rand = Math.random();
          const type = rand > 0.7 ? "tree" : rand > 0.45 ? "bush" : rand > 0.25 ? "house" : rand > 0.1 ? "building" : "lamp";
          
          decorRef.current.push({
            id: Math.random(),
            x: side === 1 ? ROAD_R + 35 + Math.random() * 110 : ROAD_L - 35 - Math.random() * 110,
            y: -150,
            type,
            v: Math.floor(Math.random() * 5),
            s: 0.6 + Math.random() * 0.9,
            bx: Math.random() * 100,
            by: Math.random() * 100
          });
        }

        // Move clouds (parallax)
        cloudsRef.current.forEach(c => {
          c.y += c.speed * (speed * 0.2);
          if(c.y > CH) {
            c.y = -100;
            c.x = Math.random() * CW;
          }
        });

        // Move items
        obstaclesRef.current.forEach(o => o.y += (speed * 0.4) + o.speed);
        decorRef.current.forEach(d => d.y += speed);
        itemsRef.current.forEach(i => {
           i.y += speed;
           i.spin += 0.1;
        });

        // Cleanup
        obstaclesRef.current = obstaclesRef.current.filter(o => o.y < CH + 150);
        decorRef.current = decorRef.current.filter(d => d.y < CH + 150);
        itemsRef.current = itemsRef.current.filter(i => i.y < CH + 100);

        // Item collision
        itemsRef.current.forEach((item, idx) => {
          const dx = Math.abs(item.x - playerRef.current.x);
          const dy = Math.abs(item.y - playerRef.current.y);
          if(dx < 30 && dy < 40) {
            if(item.type === "nitro") playerRef.current.nitro = 120;
            else setScore(s => s + 500);
            itemsRef.current.splice(idx, 1);
          }
        });

        // Collision
        if (playerRef.current.nitro <= 0) {
          obstaclesRef.current.forEach(o => {
            const collisionW = o.type === "truck" ? 38 : 26;
            const collisionH = o.type === "truck" ? 100 : 55;
            const dx = Math.abs(o.x - playerRef.current.x);
            const dy = Math.abs(o.y - playerRef.current.y);
            if(dx < collisionW && dy < collisionH) {
              shakeRef.current = 15;
              setGameState("over");
              const finalScore = Math.floor(score/10);
              if(finalScore > bestScore) {
                setBestScore(finalScore);
                onUpdateBest(finalScore);
              }
              
              // Spawn crash particles
              for(let i=0; i<20; i++) {
                particlesRef.current.push({
                  x: playerRef.current.x, y: playerRef.current.y,
                  vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                  life: 1, color: "#ffaa00"
                });
              }
            }
          });
        } else {
            // Blow away obstacles if in nitro mode
            obstaclesRef.current.forEach((o, idx) => {
                const dx = Math.abs(o.x - playerRef.current.x);
                const dy = Math.abs(o.y - playerRef.current.y);
                if (dx < 50 && dy < 100) {
                    obstaclesRef.current.splice(idx, 1);
                    shakeRef.current = 5;
                    for(let i=0; i<5; i++) {
                        particlesRef.current.push({
                            x: o.x, y: o.y,
                            vx: (Math.random()-0.5)*15, vy: -5-Math.random()*10,
                            life: 1, color: "#fff"
                        });
                    }
                }
            });
        }
      }

      // Draw
      ctx.save();
      // Apply Screen Shake
      if(shakeRef.current > 0.1) {
        ctx.translate((Math.random()-0.5)*shakeRef.current, (Math.random()-0.5)*shakeRef.current);
      }

      ctx.clearRect(0,0,CW,CH);
      
      // Grass (Ambient ground)
      ctx.fillStyle = "#1e4d2b";
      ctx.fillRect(0,0,CW,CH);

      // Distant "clouds/mist" (Parallax)
      cloudsRef.current.forEach(c => {
        ctx.fillStyle = `rgba(255,255,255,${c.opacity})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 40 * c.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // Road
      ctx.fillStyle = "#2c2c2c";
      ctx.fillRect(ROAD_L, 0, ROAD_W, CH);
      
      // Road lines
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.setLineDash([60, 60]);
      ctx.lineDashOffset = -offsetRef.current;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(CW/2, 0); ctx.lineTo(CW/2, CH); ctx.stroke();
      ctx.setLineDash([]);

      // Road edges (vibrant white lines)
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(ROAD_L - 4, 0, 4, CH);
      ctx.fillRect(ROAD_R, 0, 4, CH);

      // Decor (Layers)
      decorRef.current.forEach(d => {
        if(d.type === "tree") drawTree(ctx, d.x, d.y, d.s, d.v);
        else if(d.type === "house") drawHouse(ctx, d.x, d.y, d.s, d.v);
        else if(d.type === "building") drawBuilding(ctx, d.x, d.y, d.s, d.v, d.bx, d.by);
        else if(d.type === "bush") drawBush(ctx, d.x, d.y, d.s);
        else if(d.type === "lamp") drawLamp(ctx, d.x, d.y, d.s);
      });

      // Items
      itemsRef.current.forEach(i => {
        if(i.type === "coin") drawCoin(ctx, i.x, i.y, i.spin);
        else drawNitro(ctx, i.x, i.y, i.spin);
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Obstacles
      obstaclesRef.current.forEach(o => {
        if(o.type === "car") drawRealisticCar(ctx, o.x, o.y, 0, false, o.color, null, false);
        else if (o.type === "truck" || o.type === "van") drawRealisticCar(ctx, o.x, o.y, 0, false, o.color, null, false, o.type as any);
        else drawRealisticBike(ctx, o.x, o.y, o.color, false, Math.sin(t/200)*0.08);
      });

      // Player
      drawRealisticCar(ctx, playerRef.current.x, playerRef.current.y, playerRef.current.tilt, true, carColor.c1, carColor.c2, playerRef.current.flashHorn);

      if (playerRef.current.nitro > 0) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.ellipse(playerRef.current.x, playerRef.current.y, 40, 70, playerRef.current.tilt, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
      }

      // Wheel (Always visible at bottom)
      // Visual rotation logic: blend the tilt with a direct steering angle
      const steeringAngle = (playerRef.current.x - CW/2) * 0.15;
      const finalWheelRotation = (playerRef.current.tilt * 280) + steeringAngle; 
      drawRoundWheel(ctx, finalWheelRotation, playerRef.current.flashHorn);

      ctx.restore();

      // HUD Overlay (Drawn outside shake)
      if(gameState === "playing") {
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "900 16px Inter";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(`${Math.floor(score/10)}`, CW/2, 60);
        
        if (playerRef.current.nitro > 0) {
            ctx.fillStyle = "#60a5fa";
            ctx.fillRect(CW/2 - 60, 80, playerRef.current.nitro, 6);
            ctx.strokeStyle = "white";
            ctx.strokeRect(CW/2 - 60, 80, 120, 6);
        }
        ctx.shadowBlur = 0;
      }

      if(gameState === "ready") {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0,0,CW,CH);
        
        ctx.fillStyle = "#10b981"; // Emerald
        ctx.beginPath();
        ctx.roundRect(CW/2 - 120, CH/2 - 100, 240, 200, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "900 24px Inter";
        ctx.fillText("DRIVING", CW/2, CH/2 - 40);
        ctx.fillText("ENDLESS", CW/2, CH/2 - 10);
        
        ctx.font = "800 10px Inter";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("HIGH SCORE: " + bestScore, CW/2, CH/2 + 25);
        
        ctx.font = "900 12px Inter";
        ctx.fillStyle = "white";
        ctx.fillText("TAP OR CLICK TO START", CW/2, CH/2 + 65);
      }

      if(gameState === "over") {
        ctx.fillStyle = "rgba(0,0,0,0.92)";
        ctx.fillRect(0,0,CW,CH);
        
        ctx.fillStyle = "#ef4444"; // Red
        ctx.textAlign = "center";
        ctx.font = "900 42px Inter";
        ctx.fillText("CRASHED", CW/2, CH/2 - 50);
        
        ctx.fillStyle = "white";
        ctx.font = "800 16px Inter";
        ctx.fillText(`SCORE: ${Math.floor(score/10)}`, CW/2, CH/2 + 10);
        
        if(Math.floor(score/10) >= bestScore && score > 0) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "900 12px Inter";
          ctx.fillText(" NEW RECORD! ", CW/2, CH/2 + 40);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "700 12px Inter";
          ctx.fillText(`BEST: ${bestScore}`, CW/2, CH/2 + 40);
        }
        
        ctx.fillStyle = "white";
        ctx.font = "900 11px Inter";
        ctx.fillText("TAP TO REFRESH PROTOCOL", CW/2, CH/2 + 120);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, score, carColor, bestScore, initGame, onUpdateBest]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none touch-none"
      onClick={() => {
        if(gameState !== "playing") initGame();
      }}
    >
      <canvas 
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        className="max-h-full max-w-full drop-shadow-[0_0_50px_rgba(16,185,129,0.2)]"
      />
    </div>
  );
};

// ─── GAME 2 COMPONENT (The Sequel) ───
const DrivingEndlessGame2 = ({ onUpdateBest, bestScore: remoteBest }: { onUpdateBest: (score: number) => void, bestScore: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(remoteBest || 0);
  const [carColor] = useState(PRESETS[3]); 
  const [dimensions, setDimensions] = useState({ w: CW, h: CH });
  const [showLevelUp, setShowLevelUp] = useState(false);

  const mouseRef = useRef({ x: CW/2, down: false });
  const playerRef = useRef({ x: CW/2, y: CH-180, tilt: 0, flashHorn: false, life: 100, nitro: 0 });
  const offsetRef = useRef(0);
  const obstaclesRef = useRef<any[]>([]);
  const decorRef = useRef<any[]>([]);
  const itemsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const cloudsRef = useRef<any[]>([]);
  const barriersRef = useRef<any[]>([]);
  const lastTimeRef = useRef(0);
  const levelStartTimeRef = useRef(0);
  const shakeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ w: width, h: height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const spawnInitialDecor = useCallback(() => {
    cloudsRef.current = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * CW,
      y: Math.random() * CH,
      s: 0.8 + Math.random() * 2.0,
      opacity: 0.15 + Math.random() * 0.25,
      speed: 0.4 + Math.random() * 0.8
    }));
  }, []);

  const initGame = useCallback(() => {
    playerRef.current = { x: CW/2, y: CH-180, tilt: 0, flashHorn: false, life: 100, nitro: 0 };
    obstaclesRef.current = [];
    decorRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    barriersRef.current = [];
    spawnInitialDecor();
    offsetRef.current = 0;
    setScore(0);
    setLevel(1);
    setGameState("playing");
    shakeRef.current = 0;
    lastTimeRef.current = performance.now();
    levelStartTimeRef.current = performance.now();
    setShowLevelUp(false);
  }, [spawnInitialDecor]);

  useEffect(() => {
    const handleInput = (e: TouchEvent | MouseEvent) => {
      if ('preventDefault' in e && gameState === "playing") e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
        const scaleX = CW / rect.width;
        const x = (clientX - rect.left) * scaleX;
        mouseRef.current.x = x;
        mouseRef.current.down = true;
      }
    };
    const handleEnd = () => { mouseRef.current.down = false; };
    const cont = containerRef.current;
    if(!cont) return;
    
    const options = { passive: false };
    cont.addEventListener('mousedown', handleInput as any);
    cont.addEventListener('mousemove', handleInput as any);
    cont.addEventListener('mouseup', handleEnd);
    cont.addEventListener('touchstart', handleInput as any, options);
    cont.addEventListener('touchmove', handleInput as any, options);
    cont.addEventListener('touchend', handleEnd);
    
    return () => {
      cont.removeEventListener('mousedown', handleInput as any);
      cont.removeEventListener('mousemove', handleInput as any);
      cont.removeEventListener('mouseup', handleEnd);
      cont.removeEventListener('touchstart', handleInput as any);
      cont.removeEventListener('touchmove', handleInput as any);
      cont.removeEventListener('touchend', handleEnd);
    };
  }, [dimensions, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    let frameId: number;

    const loop = (t: number) => {
      const dt = Math.min(t - lastTimeRef.current, 100);
      lastTimeRef.current = t;
      const elapsedSinceLevel = t - levelStartTimeRef.current;

      if(gameState === "playing") {
        // Level Logic: Advance every 30 seconds
        if (elapsedSinceLevel > 30000) {
          setLevel(l => l + 1);
          levelStartTimeRef.current = t;
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 2000);
          shakeRef.current = 5;
        }

        // Slower initial speed logic
        const speedMultiplier = 1.0 + (level - 1) * 0.15 + (score * 0.00008); 
        let speed = 6.5 * speedMultiplier; 
        
        if (playerRef.current.nitro > 0) {
          speed *= 1.8;
          playerRef.current.nitro -= 1;
          particlesRef.current.push({
            x: playerRef.current.x + (Math.random()-0.5)*12,
            y: playerRef.current.y + 36,
            vx: (Math.random()-0.5)*3, vy: 3 + Math.random()*5,
            life: 1, color: "#a855f7" 
          });
        }

        offsetRef.current += speed;
        setScore(s => s + 1);

        const targetX = Math.max(ROAD_L + PW/2 + 5, Math.min(ROAD_R - PW/2 - 5, mouseRef.current.x));
        playerRef.current.tilt = (targetX - playerRef.current.x) * 0.10;
        playerRef.current.x += (targetX - playerRef.current.x) * 0.18;
        playerRef.current.flashHorn = mouseRef.current.down;

        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.035; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        if(shakeRef.current > 0) shakeRef.current *= 0.90;

        // Balanced Spawning based on Level
        if(Math.random() < 0.02 + (level * 0.005) + (score * 0.00001)) {
          const rand = Math.random();
          const type = rand > 0.85 ? "truck" : rand > 0.65 ? "van" : rand > 0.25 ? "car" : "bike";
          const laneChoices = [ROAD_L + 50, ROAD_L + ROAD_W/2, ROAD_R - 50];
          const x = laneChoices[Math.floor(Math.random() * laneChoices.length)];
          if(!obstaclesRef.current.some(o => o.y < 220 && Math.abs(o.x - x) < 60)) {
            obstaclesRef.current.push({
              id: Math.random(), x, y: -220, type,
              color: ECOLS[Math.floor(Math.random() * ECOLS.length)][0],
              speed: (type === "truck" ? 0.8 : type === "van" ? 1.5 : Math.random() * 1.5 + 3.5) * speedMultiplier,
              drift: type === "bike" ? (Math.random() > 0.5 ? 1 : -1) : 0
            });
          }
        }

        if(Math.random() < 0.003 + (level * 0.001)) {
          const gapW = Math.max(75, 95 - level * 3);
          barriersRef.current.push({
            id: Math.random(), y: -250, gapX: ROAD_L + gapW/2 + Math.random() * (ROAD_W - gapW), gapW
          });
        }

        if(Math.random() < 0.015) {
          itemsRef.current.push({
            id: Math.random(), x: ROAD_L + 30 + Math.random() * (ROAD_W - 60), y: -60, type: Math.random() > 0.85 ? "nitro" : "coin", spin: 0
          });
        }

        if(Math.random() < 0.28) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const rand = Math.random();
          const type = rand > 0.6 ? "tree" : rand > 0.4 ? "house" : rand > 0.15 ? "building" : "lamp";
          decorRef.current.push({
            id: Math.random(), x: side === 1 ? ROAD_R + 35 + Math.random() * 130 : ROAD_L - 35 - Math.random() * 130,
            y: -180, type, v: Math.floor(Math.random() * 5), s: 0.75 + Math.random() * 1.1, bx: Math.random() * 100, by: Math.random() * 100
          });
        }

        cloudsRef.current.forEach(c => {
          c.y += c.speed * (speed * 0.2);
          if(c.y > CH + 100) { c.y = -150; c.x = Math.random() * CW; }
        });

        obstaclesRef.current.forEach(o => {
          o.y += (speed * 0.4) + o.speed;
          if (o.type === "bike") {
            o.x += o.drift * 1.5;
            if (o.x < ROAD_L + 25 || o.x > ROAD_R - 25) o.drift *= -1;
          }
        });
        decorRef.current.forEach(d => d.y += speed);
        itemsRef.current.forEach(i => { i.y += speed; i.spin += 0.25; });
        barriersRef.current.forEach(b => b.y += speed);

        obstaclesRef.current = obstaclesRef.current.filter(o => o.y < CH + 250);
        decorRef.current = decorRef.current.filter(d => d.y < CH + 250);
        itemsRef.current = itemsRef.current.filter(i => i.y < CH + 180);
        barriersRef.current = barriersRef.current.filter(b => b.y < CH + 120);

        itemsRef.current.forEach((item, idx) => {
          if(Math.abs(item.x - playerRef.current.x) < 42 && Math.abs(item.y - playerRef.current.y) < 55) {
            if(item.type === "nitro") playerRef.current.nitro = 180;
            else setScore(s => s + 1200);
            itemsRef.current.splice(idx, 1);
          }
        });

        if (playerRef.current.nitro <= 0) {
          obstaclesRef.current.forEach(o => {
            const collisionW = o.type === "truck" ? 38 : 28;
            const collisionH = o.type === "truck" ? 105 : 60;
            if(Math.abs(o.x - playerRef.current.x) < collisionW && Math.abs(o.y - playerRef.current.y) < collisionH) {
              setGameState("over");
              const finalScore = Math.floor(score/10);
              if(finalScore > bestScore) { setBestScore(finalScore); onUpdateBest(finalScore); }
            }
          });
          barriersRef.current.forEach(b => {
            if(Math.abs(b.y - playerRef.current.y) < 28) {
              if(Math.abs(playerRef.current.x - b.gapX) > (b.gapW/2 - 8)) {
                setGameState("over");
                const finalScore = Math.floor(score/10);
                if(finalScore > bestScore) { setBestScore(finalScore); onUpdateBest(finalScore); }
              }
            }
          });
        } else {
            obstaclesRef.current.forEach((o, idx) => {
                if (Math.abs(o.x - playerRef.current.x) < 58 && Math.abs(o.y - playerRef.current.y) < 115) {
                    obstaclesRef.current.splice(idx, 1);
                    shakeRef.current = 8;
                    for(let k=0; k<10; k++) {
                      particlesRef.current.push({
                        x: o.x, y: o.y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1, color: o.color
                      });
                    }
                }
            });
        }
      }

      ctx.save();
      if(shakeRef.current > 0.1) ctx.translate((Math.random()-0.5)*shakeRef.current, (Math.random()-0.5)*shakeRef.current);
      ctx.clearRect(0,0,CW,CH);
      
      // IMPROVED GRAPHICS: Side Grass + Road
      ctx.fillStyle = "#064e3b"; ctx.fillRect(0,0,CW,CH); // Dark green grass base
      
      // Grass texture
      ctx.fillStyle = "#065f46";
      for(let gy=-100; gy<CH+100; gy+=40) {
        let yOffset = (offsetRef.current % 40) + gy;
        ctx.fillRect(ROAD_L - 30, yOffset, 15, 2);
        ctx.fillRect(ROAD_R + 15, yOffset, 15, 2);
      }

      cloudsRef.current.forEach(c => {
        ctx.fillStyle = `rgba(255,255,255,${c.opacity})`;
        ctx.beginPath(); ctx.arc(c.x, c.y, 60 * c.s, 0, Math.PI * 2); ctx.fill();
      });

      // IMPROVED ROAD
      ctx.fillStyle = "#111827"; ctx.fillRect(ROAD_L, 0, ROAD_W, CH); 
      
      // Neon Bloom Effect for Road Lines
      ctx.shadowBlur = 10; ctx.shadowColor = "rgba(168,85,247,0.8)";
      ctx.strokeStyle = "rgba(168,85,247,0.5)"; 
      ctx.setLineDash([100, 50]); ctx.lineDashOffset = -offsetRef.current; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CW/2, 0); ctx.lineTo(CW/2, CH); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;

      // Neon Edges
      const edgeG = ctx.createLinearGradient(ROAD_L-4, 0, ROAD_L, 0);
      edgeG.addColorStop(0, "rgba(168,85,247,0)"); edgeG.addColorStop(1, "#a855f7");
      ctx.fillStyle = edgeG; ctx.fillRect(ROAD_L - 6, 0, 6, CH);
      ctx.fillStyle = "#a855f7"; ctx.fillRect(ROAD_R, 0, 6, CH);

      decorRef.current.forEach(d => {
        if(d.type === "tree") drawTree(ctx, d.x, d.y, d.s, d.v);
        else if(d.type === "house") drawHouse(ctx, d.x, d.y, d.s, d.v);
        else if(d.type === "building") drawBuilding(ctx, d.x, d.y, d.s, d.v, d.bx, d.by);
        else if(d.type === "bush") drawBush(ctx, d.x, d.y, d.s);
        else if(d.type === "lamp") drawLamp(ctx, d.x, d.y, d.s);
      });

      barriersRef.current.forEach(b => drawBarrier(ctx, b.y, b.gapX, b.gapW));

      itemsRef.current.forEach(i => {
        if(i.type === "coin") drawCoin(ctx, i.x, i.y, i.spin);
        else drawNitro(ctx, i.x, i.y, i.spin);
      });

      particlesRef.current.forEach(p => { 
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life; 
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Obstacles with Glow
      obstaclesRef.current.forEach(o => {
        if(o.type === "car") drawRealisticCar(ctx, o.x, o.y, 0, false, o.color, null, false);
        else if (o.type === "truck" || o.type === "van") drawRealisticCar(ctx, o.x, o.y, 0, false, o.color, null, false, o.type as any);
        else drawRealisticBike(ctx, o.x, o.y, o.color, false, Math.sin(t/100)*0.15);
      });

      // Player Car Glow
      if (playerRef.current.nitro > 0) {
          ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = "#a855f7";
          drawRealisticCar(ctx, playerRef.current.x, playerRef.current.y, playerRef.current.tilt, true, carColor.c1, carColor.c2, playerRef.current.flashHorn);
          ctx.globalAlpha = 0.45; ctx.fillStyle = "#a855f7";
          ctx.beginPath(); ctx.ellipse(playerRef.current.x, playerRef.current.y, 52, 82, playerRef.current.tilt, 0, Math.PI*2); ctx.fill();
          ctx.restore();
      } else {
          drawRealisticCar(ctx, playerRef.current.x, playerRef.current.y, playerRef.current.tilt, true, carColor.c1, carColor.c2, playerRef.current.flashHorn);
      }

      const steeringAngle = (playerRef.current.x - CW/2) * 0.22;
      const finalWheelRotation = (playerRef.current.tilt * 340) + steeringAngle; 
      drawRoundWheel(ctx, finalWheelRotation, playerRef.current.flashHorn);
      ctx.restore();

      // UI Overlay
      if(gameState === "playing") {
        ctx.fillStyle = "white"; ctx.textAlign = "left"; ctx.font = "900 14px Inter";
        ctx.fillText(`LVL ${level}`, 20, 50);
        ctx.textAlign = "right";
        ctx.fillText(`SCORE ${Math.floor(score/10)}`, CW - 20, 50);
        
        // Progress bar to next level
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(20, 65, CW - 40, 4);
        ctx.fillStyle = "#a855f7"; ctx.fillRect(20, 65, (CW - 40) * (elapsedSinceLevel / 30000), 4);

        if (playerRef.current.nitro > 0) {
            ctx.fillStyle = "rgba(168,85,247,0.3)"; ctx.fillRect(CW/2 - 85, CH - 150, 170, 8);
            ctx.fillStyle = "#a855f7"; ctx.fillRect(CW/2 - 85, CH - 150, (playerRef.current.nitro / 180) * 170, 8);
            ctx.strokeStyle = "white"; ctx.lineWidth = 0.5; ctx.strokeRect(CW/2 - 85, CH - 150, 170, 8);
        }

        if (showLevelUp) {
          ctx.save();
          ctx.fillStyle = "rgba(168,85,247,0.95)"; ctx.font = "900 42px Inter"; ctx.textAlign = "center";
          ctx.shadowBlur = 20; ctx.shadowColor = "white";
          ctx.fillText(`LEVEL ${level}`, CW/2, CH/2);
          ctx.restore();
        }
      }

      if(gameState === "ready") {
        ctx.fillStyle = "rgba(2,6,23,0.92)"; ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle = "#a855f7"; ctx.beginPath(); ctx.roundRect(CW/2 - 140, CH/2 - 130, 280, 260, 40); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "900 28px Inter";
        ctx.fillText("DRIVING", CW/2, CH/2 - 55);
        ctx.fillText("ENDLESS 2", CW/2, CH/2 - 20);
        ctx.font = "800 11px Inter"; ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(`MAX LEVEL ARCHIVED: ${Math.floor(bestScore/1000) || 1}`, CW/2, CH/2 + 25);
        ctx.fillText(`RECORD: ${bestScore}`, CW/2, CH/2 + 45);
        ctx.font = "900 13px Inter"; ctx.fillStyle = "white";
        ctx.fillText("INITIATE PROTOCOL V2", CW/2, CH/2 + 95);
      }

      if(gameState === "over") {
        ctx.fillStyle = "rgba(2,6,23,0.97)"; ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle = "#f43f5e"; ctx.textAlign = "center"; ctx.font = "900 52px Inter";
        ctx.fillText("OUT", CW/2, CH/2 - 60);
        ctx.fillStyle = "white"; ctx.font = "800 20px Inter";
        ctx.fillText(`LVL ${level} • SCORE ${Math.floor(score/10)}`, CW/2, CH/2 + 10);
        ctx.font = "900 13px Inter"; ctx.fillStyle = "#f43f5e";
        ctx.fillText("TAP OR CLICK TO RELOAD", CW/2, CH/2 + 140);
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "700 10px Inter";
        ctx.fillText("RELOADING TO LEVEL 1...", CW/2, CH/2 + 165);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, score, level, showLevelUp, carColor, bestScore, initGame, onUpdateBest]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none touch-none" onClick={() => { if(gameState !== "playing") initGame(); }}>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="max-h-full max-w-full shadow-[0_0_150px_rgba(168,85,247,0.25)]" />
    </div>
  );
};

// ─── DRIVING ENDLESS 3 (MOTO RUSH EVOLVED) ───
const DrivingEndlessGame3 = ({ onUpdateBest, bestScore: remoteBest }: { onUpdateBest: (score: number) => void, bestScore: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(remoteBest || 0);

  const GW = 400, GH = 800;
  const RL = 70, RR = 330, RW = RR - RL;
  const BW = 40, BH = 72;

  const playerRef = useRef({ x: GW / 2 - BW / 2, y: GH - 140, tilt: 0, lives: 3, speed: 6, inv: 0, slide: 0 });
  const mouseRef = useRef({ x: GW / 2, down: false });
  const offsetRef = useRef(0);
  const objectsRef = useRef<{ cars: any[], side: any[], parts: any[], traps: any[] }>({ cars: [], side: [], parts: [], traps: [] });
  const dashLinesRef = useRef(Array.from({ length: 22 }).map((_, i) => ({ y: i * 40 })));
  const lastTimeRef = useRef(0);
  const frameRef = useRef(0);
  const shakeRef = useRef(0);

  const initGame = useCallback(() => {
    playerRef.current = { x: GW / 2 - BW / 2, y: GH - 140, tilt: 0, lives: 3, speed: 6, inv: 0, slide: 0 };
    objectsRef.current = { cars: [], side: [], parts: [], traps: [] };
    offsetRef.current = 0;
    setScore(0);
    setGameState("playing");
    shakeRef.current = 0;
    lastTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    const handleInput = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
        const scale = GW / rect.width;
        mouseRef.current.x = (clientX - rect.left) * scale;
        mouseRef.current.down = true;
      }
    };
    const c = containerRef.current;
    if(!c) return;
    const end = () => mouseRef.current.down = false;
    c.addEventListener('mousedown', handleInput as any); c.addEventListener('mousemove', handleInput as any); c.addEventListener('mouseup', end);
    c.addEventListener('touchstart', handleInput as any, { passive: false }); c.addEventListener('touchmove', handleInput as any, { passive: false }); c.addEventListener('touchend', end);
    return () => {
      c.removeEventListener('mousedown', handleInput as any); c.removeEventListener('mousemove', handleInput as any); c.removeEventListener('mouseup', end);
      c.removeEventListener('touchstart', handleInput as any); c.removeEventListener('touchmove', handleInput as any); c.removeEventListener('touchend', end);
    };
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if(!ctx) return;
    let frameId: number;

    const loop = (t: number) => {
      frameRef.current++;
      const dt = Math.min(t - lastTimeRef.current, 100);
      lastTimeRef.current = t;

      if(gameState === "playing") {
        const p = playerRef.current;
        p.speed = 6 + (score * 0.00012);
        offsetRef.current += p.speed;
        setScore(s => s + 1);

        if(p.inv > 0) p.inv--;
        if(p.slide > 0) p.slide--;

        // Input & Physics
        const targetX = Math.max(RL, Math.min(RR - BW, mouseRef.current.x - BW/2));
        const lerp = p.slide > 0 ? 0.05 : 0.18;
        p.tilt = (targetX - p.x) * 0.12;
        p.x += (targetX - p.x) * lerp;

        // Dash Lines
        dashLinesRef.current.forEach(d => {
          d.y += p.speed;
          if(d.y > GH) d.y -= (22 * 40);
        });

        // Spawn Mechanics
        if(Math.random() < 0.025) { // Side objects
            const side = Math.random() < 0.5;
            objectsRef.current.side.push({
                x: side ? RL/2 : RR + (GW-RR)/2, y: -100,
                type: Math.random() < 0.6 ? 'tree' : 'bldg',
                h: Math.random()*80+60, w: Math.random()*30+20,
                col: Math.random() < 0.3 ? '#ff00ff' : '#00ffff'
            });
        }
        if(Math.random() < 0.015 + (score * 0.000005)) { // Cars
            const laneX = [RL + 15, RL + RW/2 - 20, RR - 55];
            objectsRef.current.cars.push({
                x: laneX[Math.floor(Math.random()*3)], y: -100,
                col: ["#ff0066", "#00ffff", "#ffcc00"][Math.floor(Math.random()*3)],
                spd: p.speed * (0.4 + Math.random() * 0.3)
            });
        }
        if(Math.random() < 0.006) { // TRAPS: Oil spill or Spike
            objectsRef.current.traps.push({
                x: RL + Math.random() * (RW - 40), y: -100,
                type: Math.random() < 0.6 ? 'oil' : 'spikes',
                size: 40 + Math.random() * 30
            });
        }

        // Update objects
        objectsRef.current.side.forEach(s => s.y += p.speed);
        objectsRef.current.cars.forEach(c => c.y += (p.speed * 0.4) + c.spd);
        objectsRef.current.traps.forEach(tr => tr.y += p.speed);
        objectsRef.current.parts.forEach(pa => { pa.x += pa.vx; pa.y += pa.vy; pa.life -= 0.02; });

        objectsRef.current.side = objectsRef.current.side.filter(s => s.y < GH + 200);
        objectsRef.current.cars = objectsRef.current.cars.filter(c => c.y < GH + 100);
        objectsRef.current.traps = objectsRef.current.traps.filter(tr => tr.y < GH + 100);
        objectsRef.current.parts = objectsRef.current.parts.filter(pa => pa.life > 0);

        // Collisions
        if(p.inv <= 0) {
            objectsRef.current.cars.forEach(c => {
                if(Math.abs(c.x + 21 - (p.x + BW/2)) < 30 && Math.abs(c.y + 36 - (p.y + BH/2)) < 55) {
                    p.lives--;
                    p.inv = 100;
                    shakeRef.current = 15;
                    if(p.lives <= 0) {
                        setGameState("over");
                        const fs = Math.floor(score/10);
                        if(fs > bestScore) { setBestScore(fs); onUpdateBest(fs); }
                    }
                }
            });
            objectsRef.current.traps.forEach(tr => {
                const dx = (tr.x + tr.size/2) - (p.x + BW/2);
                const dy = (tr.y + tr.size/2) - (p.y + BH/2);
                if(Math.sqrt(dx*dx + dy*dy) < tr.size/2 + 15) {
                    if(tr.type === 'oil') { p.slide = 120; }
                    else if(tr.type === 'spikes') {
                        p.lives--; p.inv = 120; shakeRef.current = 10;
                        if(p.lives <= 0) { setGameState("over"); onUpdateBest(Math.floor(score/10)); }
                    }
                }
            });
        }
      }

      // Drawing
      ctx.save();
      if(shakeRef.current > 0.1) {
          ctx.translate((Math.random()-0.5)*shakeRef.current, (Math.random()-0.5)*shakeRef.current);
          shakeRef.current *= 0.9;
      }
      ctx.clearRect(0,0,GW,GH);
      
      // Sky/Stars
      const skyG = ctx.createLinearGradient(0,0,0,GH*0.6);
      skyG.addColorStop(0, "#020617"); skyG.addColorStop(1, "#0f172a");
      ctx.fillStyle = skyG; ctx.fillRect(0,0,GW,GH);
      ctx.fillStyle = "white";
      for(let i=0; i<40; i++) {
          const sx = (i * 123) % GW, sy = (i * 77) % (GH*0.5);
          ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(frameRef.current * 0.02 + i));
          ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // Road Area
      ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,RL,GH); ctx.fillRect(RR,0,GW-RR,GH);
      ctx.fillStyle = "#020617"; ctx.fillRect(RL,0,RW,GH);
      ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = "#00ffff";
      ctx.beginPath(); ctx.moveTo(RL,0); ctx.lineTo(RL,GH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(RR,0); ctx.lineTo(RR,GH); ctx.stroke();
      ctx.shadowBlur = 0;

      dashLinesRef.current.forEach(d => {
        ctx.fillStyle = "rgba(0,255,255,0.15)";
        ctx.fillRect(RL + RW * 0.33, d.y, 3, 20);
        ctx.fillRect(RL + RW * 0.66, d.y, 3, 20);
      });

      // Side Objects
      objectsRef.current.side.forEach(s => {
          if(s.type === 'tree') drawTree(ctx, s.x, s.y, 0.8, 1);
          else drawBuilding(ctx, s.x, s.y, 0.7, 0, s.x, s.y);
      });

      // Traps
      objectsRef.current.traps.forEach(tr => {
          ctx.save();
          if(tr.type === 'oil') {
              ctx.fillStyle = "rgba(0,0,0,0.6)"; 
              ctx.beginPath(); ctx.ellipse(tr.x + tr.size/2, tr.y + tr.size/2, tr.size/2, tr.size/2 * 0.6, 0, 0, Math.PI*2); ctx.fill();
              ctx.strokeStyle = "rgba(100,100,100,0.3)"; ctx.stroke();
          } else {
              ctx.fillStyle = "#4a5568"; ctx.beginPath(); ctx.moveTo(tr.x, tr.y + tr.size); ctx.lineTo(tr.x + tr.size/2, tr.y); ctx.lineTo(tr.x + tr.size, tr.y + tr.size); ctx.fill();
              ctx.fillStyle = "#f87171"; ctx.beginPath(); ctx.moveTo(tr.x + 5, tr.y + tr.size - 5); ctx.lineTo(tr.x + tr.size/2, tr.y + 10); ctx.lineTo(tr.x + tr.size - 5, tr.y + tr.size - 5); ctx.fill();
          }
          ctx.restore();
      });

      // Cars
      objectsRef.current.cars.forEach(c => {
          drawRealisticCar(ctx, c.x + 21, c.y + 36, 0, false, c.col, null, false);
      });

      // Player Bike
      const p = playerRef.current;
      if(!(p.inv > 0 && Math.floor(frameRef.current/5)%2 === 0)) {
          drawRealisticBike(ctx, p.x + BW/2, p.y + BH/2, "#f43f5e", false, p.tilt * 0.15);
      }

      // HUD
      if(gameState === "playing") {
          ctx.fillStyle = "white"; ctx.textAlign = "left"; ctx.font = "900 13px Inter";
          ctx.fillText(`SCORE ${Math.floor(score/10)}`, 20, 40);
          ctx.textAlign = "right"; ctx.fillText(`LIVES ${p.lives}`, GW-20, 40);
          if(p.slide > 0) {
              ctx.fillStyle = "#60a5fa"; ctx.textAlign = "center"; ctx.fillText("OIL SLIDE!", GW/2, 60);
          }
      }

      if(gameState === "ready") {
          ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,GW,GH);
          ctx.fillStyle = "#6366f1"; ctx.textAlign = "center"; ctx.font = "900 32px Inter";
          ctx.fillText("MOTO RUSH", GW/2, GH/2 - 40);
          ctx.font = "700 12px Inter"; ctx.fillStyle = "white";
          ctx.fillText("AVOID CARS & TRAPS ON THE ROAD", GW/2, GH/2 + 10);
          ctx.font = "900 14px Inter"; ctx.fillText("CLICK TO START NEW ADVENTURE", GW/2, GH/2 + 80);
      }

      if(gameState === "over") {
          ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0,GW,GH);
          ctx.fillStyle = "#ef4444"; ctx.textAlign = "center"; ctx.font = "900 48px Inter";
          ctx.fillText("OUT", GW/2, GH/2 - 40);
          ctx.font = "700 16px Inter"; ctx.fillStyle = "white";
          ctx.fillText(`FINAL SCORE: ${Math.floor(score/10)}`, GW/2, GH/2 + 15);
          ctx.font = "900 14px Inter"; ctx.fillStyle = "#ef4444";
          ctx.fillText("CLICK TO RELOAD", GW/2, GH/2 + 100);
      }

      ctx.restore();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, score, bestScore, onUpdateBest]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none touch-none" onClick={() => { if(gameState !== "playing") initGame(); }}>
      <canvas ref={canvasRef} width={GW} height={GH} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="max-h-full max-w-full" />
    </div>
  );
};

type ViewState = "wheel" | "about" | "main" | "home" | "menu" | "settings" | "login" | "signup" | "gallery" | "forgot-password" | "reset-password" | "notes" | "gen" | "gen-password" | "gen-nickname" | "gen-list" | "del" | "del-2" | "del-3" | "rb";

interface UserProfile {
  uid?: string;
  nickname: string;
  username: string;
  password?: string; // Only for local transfer during signup
  phone?: string;
  dob?: string;
  profilePic?: string;
  profileZoom?: number;
  galleryPhotos?: string[];
  notes?: { id: string; title: string; content: string; createdAt: number }[];
  savedGen?: { id: string; type: "password" | "nickname"; value: string; createdAt: number }[];
  drivingBest?: number;
  drivingBest2?: number;
  drivingBest3?: number;
  sessionId?: string;
}

const SubPage = ({ 
  title, 
  onBack, 
  children, 
  action, 
  profilePic,
  profileZoom
}: { 
  title: string; 
  onBack: () => void; 
  children?: ReactNode; 
  key?: string; 
  action?: { label: string; onClick: () => void };
  profilePic?: string;
  profileZoom?: number;
}) => (
  <motion.div
    key={title}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="fixed inset-0 bg-white z-[100] flex flex-col"
  >
    <header className="p-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center flex-1">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="ml-4 text-xl font-bold text-gray-900 capitalize leading-tight">{title.replace("-", " ")}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-1.5 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
          >
            {action.label}
          </button>
        )}
        {profilePic && profilePic.trim() !== "" && title === "home" && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
            <img 
              src={profilePic || undefined} 
              alt="Avatar" 
              style={{ transform: `scale(${profileZoom || 1})` }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </header>
    <div className="flex-1 overflow-y-auto">
      {children || (
        <div className="h-full flex items-center justify-center p-8 text-center text-gray-400">
          <p>This is the {title} page.</p>
        </div>
      )}
    </div>
  </motion.div>
);

export default function App() {
  const [view, setView] = useState<ViewState>("main");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [localSessionId, setLocalSessionId] = useState<string | null>(localStorage.getItem('gamura_session_id'));
  const [users, setUsers] = useState<UserProfile[]>([]); // This will now act as a cache of accounts on this device
  
  const [signupForm, setSignupForm] = useState<UserProfile>({ 
    nickname: "", 
    username: "", 
    password: "", 
    phone: "", 
    dob: "",
    profilePic: "https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x",
    profileZoom: 1,
    galleryPhotos: []
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "", dob: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: "", profilePic: "", zoom: 1 });
  const [forgotForm, setForgotForm] = useState({ 
    identifier: "", 
    phone: "",
    dob: "",
    step: 0, // 0: search, 1: permissions, 2: reset
    newPassword: "", 
    confirmPassword: "", 
    targetUser: null as UserProfile | null,
    permissions: {
      biometric: false,
      neural: false,
      owner: false
    }
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Notes State
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Generator State
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedNickname, setGeneratedNickname] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth & Session Listener
  useEffect(() => {
    const checkDecentralizedSession = async () => {
      const localSid = localStorage.getItem('gamura_session_id');
      const savedUid = localStorage.getItem('gamura_uid');
      if (localSid && savedUid) {
        try {
          const userSnap = await getDoc(doc(db, "users", savedUid));
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            if (userData.sessionId === localSid) {
              setCurrentUser({ ...userData, uid: savedUid });
              setLocalSessionId(localSid);
            }
          }
        } catch (e) {
          console.error("Session sync failed", e);
        }
      }
      setIsLoading(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          setCurrentUser({ ...userData, uid: firebaseUser.uid });
          
          // One-device session check logic
          const unsubscribeDoc = onSnapshot(userRef, (doc) => {
            const data = doc.data();
            const storedSid = localStorage.getItem('gamura_session_id');
            if (data && data.sessionId && storedSid && data.sessionId !== storedSid) {
              handleLogout("Logged out: Your identity was accessed on another device.");
            }
          });
          setIsLoading(false);
          return () => unsubscribeDoc();
        }
      } else {
        // If no regular firebaseUser, check for decentralized backup session
        checkDecentralizedSession();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async (customMessage?: string) => {
    await signOut(auth);
    localStorage.removeItem('gamura_session_id');
    localStorage.removeItem('gamura_uid');
    setCurrentUser(null);
    setLocalSessionId(null);
    if (customMessage) {
      setMessage({ text: customMessage, type: "error" });
    } else {
      setMessage({ text: "Logged Out", type: "success" });
    }
    setView("login");
    setTimeout(() => setMessage(null), 3000);
  };

  const changeView = (newView: ViewState) => {
    if (newView === "gallery" && !currentUser) {
      setMessage({ text: "Coordinate Lock: Access Denied", type: "error" });
      setView("login");
      return;
    }
    setMessage(null);
    setIsEditingProfile(false);
    setView(newView);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, target: 'signup' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        setMessage({ text: "Error: Image too large (Max 2MB)", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'edit') {
          setEditForm(prev => ({ ...prev, profilePic: reader.result as string, zoom: 1 }));
        } else {
          setSignupForm(prev => ({ ...prev, profilePic: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (currentUser?.uid) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, "users", currentUser.uid));
        // In a real app we'd delete the Auth user too, but it requires re-auth usually
        await auth.currentUser?.delete().catch(() => {
          console.warn("Auth user deletion requires recent login");
        });
        await handleLogout("Identity Purged Permanently");
      } catch (err) {
        setMessage({ text: "Purge failed: Access Denied", type: "error" });
      }
      setIsLoading(false);
    }
  };

  const formatDob = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}-${v.slice(2)}`;
    return `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4)}`;
  };

  const handleSignup = async () => {
    if (!signupForm.nickname || !signupForm.username || !signupForm.password || !signupForm.dob) {
      setMessage({ text: "Incomplete Coords: Nickname, Username, Password, and DOB are mandatory", type: "error" });
      return;
    }

    if (signupForm.dob.length !== 10) {
      setMessage({ text: "DOB Format Refused: Use DD-MM-YYYY", type: "error" });
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(signupForm.username)) {
      setMessage({ text: "Invalid Signature: Username must be alphanumeric", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check if identity taken
      const q = query(collection(db, "users"), where("username", "==", signupForm.username));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        setMessage({ text: "Conflict: That identity is already claimed", type: "error" });
        setIsLoading(false);
        return;
      }

      const sid = Math.random().toString(36).substring(2);
      const newUser: UserProfile = {
        nickname: signupForm.nickname,
        username: signupForm.username,
        phone: signupForm.phone || "",
        dob: signupForm.dob,
        password: signupForm.password,
        profilePic: signupForm.profilePic || "https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x",
        profileZoom: 1,
        galleryPhotos: [],
        sessionId: sid
      };

      try {
        // Attempt Centralized Auth
        const email = `${signupForm.username}@gamuragalaxy.io`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, signupForm.password);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, "users", uid), newUser);
        setCurrentUser({ ...newUser, uid });
        localStorage.setItem('gamura_uid', uid);
      } catch (authErr: any) {
        // Fallback to Decentralized Mode (bypasses "Operation not allowed")
        const fallbackUid = `fs_${Date.now()}_${signupForm.username}`;
        await setDoc(doc(db, "users", fallbackUid), newUser);
        setCurrentUser({ ...newUser, uid: fallbackUid });
        localStorage.setItem('gamura_uid', fallbackUid);
      }
      
      localStorage.setItem('gamura_session_id', sid);
      setLocalSessionId(sid);
      setMessage({ text: "Identity Crystalized: Access Authorized", type: "success" });
      setView("home");
    } catch (err: any) {
      console.error("Signup Protocol Error:", err);
      setMessage({ text: `Protocol Error: ${err.message}`, type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogin = async () => {
    if (!loginForm.identifier || !loginForm.password || !loginForm.dob) {
      setMessage({ text: "Missing Coords: Identifier, Password, and DOB required", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      // Query by ID only to avoid composite index error (perfect for any device)
      const q = query(collection(db, "users"), where("username", "==", loginForm.identifier));
      const pQ = query(collection(db, "users"), where("phone", "==", loginForm.identifier));
      
      let userData: UserProfile | null = null;
      let targetUid = "";
      
      let snap = await getDocs(q);
      if (snap.empty) snap = await getDocs(pQ);

      if (snap.empty) {
        setMessage({ text: "Identification Error: Identity not recognized", type: "error" });
        setIsLoading(false);
        return;
      }

      userData = snap.docs[0].data() as UserProfile;
      targetUid = snap.docs[0].id;

      // Manual coordinate verification (bypasses Firestore index needs)
      if (userData.dob !== loginForm.dob) {
        setMessage({ text: "Access Refused: DOB coordinates mismatch", type: "error" });
        setIsLoading(false);
        return;
      }

      if (userData.password && userData.password !== loginForm.password) {
        setMessage({ text: "Verification Failed: Access code incorrect", type: "error" });
        setIsLoading(false);
        return;
      }

      // Sync Session
      const sid = Math.random().toString(36).substring(2);
      localStorage.setItem('gamura_session_id', sid);
      localStorage.setItem('gamura_uid', targetUid);
      setLocalSessionId(sid);
      
      // Update session in DB
      await updateDoc(doc(db, "users", targetUid), { sessionId: sid });
      
      // Attempt auth login quietly for features that might need it
      try {
        const email = `${userData.username}@gamuragalaxy.io`;
        await signInWithEmailAndPassword(auth, email, loginForm.password);
      } catch (e) { /* Fallback handled */ }

      setCurrentUser({ ...userData, uid: targetUid });
      setMessage({ text: "Welcome back, Traveler", type: "success" });
      setView("home");
    } catch (err: any) {
      console.error("Login Protocol Error:", err);
      setMessage({ text: "System Error: Check network coordinates", type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const saveProfile = async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      const updateData = {
        nickname: editForm.nickname,
        profilePic: editForm.profilePic,
        profileZoom: editForm.zoom
      };
      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      
      setCurrentUser({ ...currentUser, ...updateData });
      setIsEditingProfile(false);
      setMessage({ text: "Profile Updated", type: "success" });
    } catch (err) {
      setMessage({ text: "Update failed", type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!currentUser?.uid) return;
    
    const photos = currentUser.galleryPhotos || [];
    if (photos.length >= 10) {
      setMessage({ text: "Your secret saving limit is over", type: "error" });
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: "Error: Image too large (Max 2MB)", type: "error" });
        return;
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img64 = reader.result as string;
        try {
          const updatedPhotos = [...photos, img64];
          await updateDoc(doc(db, "users", currentUser.uid!), { galleryPhotos: updatedPhotos });
          setCurrentUser({ ...currentUser, galleryPhotos: updatedPhotos });
          setMessage({ text: "Secret Saved Successfully", type: "success" });
        } catch (err) {
          setMessage({ text: "Save failed", type: "error" });
        }
        setIsLoading(false);
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteGalleryPhoto = async (index: number) => {
    if (!currentUser?.uid) return;
    const photos = [...(currentUser.galleryPhotos || [])];
    photos.splice(index, 1);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { galleryPhotos: photos });
      setCurrentUser({ ...currentUser, galleryPhotos: photos });
    } catch (err) {
      setMessage({ text: "Delete failed", type: "error" });
    }
  };

  const downloadPhoto = (url: string, filename: string = "galactic-secret.png") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ text: "Downloaded Successfully", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const saveNote = async () => {
    if (!currentUser?.uid) return;
    if (!noteForm.title.trim() && !noteForm.content.trim()) return;

    setIsLoading(true);
    try {
      const currentNotes = currentUser.notes || [];
      let updatedNotes;

      if (activeNoteId) {
        updatedNotes = currentNotes.map(n => 
          n.id === activeNoteId 
            ? { ...n, title: noteForm.title, content: noteForm.content } 
            : n
        );
      } else {
        const newNote = {
          id: Math.random().toString(36).substring(2, 11),
          title: noteForm.title || "Untitled Note",
          content: noteForm.content,
          createdAt: Date.now()
        };
        updatedNotes = [newNote, ...currentNotes];
      }

      await updateDoc(doc(db, "users", currentUser.uid), { notes: updatedNotes });
      setCurrentUser({ ...currentUser, notes: updatedNotes });
      setIsAddingNote(false);
      setActiveNoteId(null);
      setNoteForm({ title: "", content: "" });
      setMessage({ text: "Note Crystalized", type: "success" });
    } catch (err) {
      setMessage({ text: "Protocol Failed: Save Error", type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 2000);
  };

  const deleteNote = async (id: string) => {
    if (!currentUser?.uid) return;
    try {
      const updatedNotes = (currentUser.notes || []).filter(n => n.id !== id);
      await updateDoc(doc(db, "users", currentUser.uid), { notes: updatedNotes });
      setCurrentUser({ ...currentUser, notes: updatedNotes });
    } catch (err) {
      setMessage({ text: "Purge Failed", type: "error" });
    }
  };

  const generateSecurePassword = () => {
    const length = 16;
    const charset = {
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower: "abcdefghijklmnopqrstuvwxyz",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+~`|}{[]:;?><,./-="
    };
    
    let password = "";
    // Ensure at least one of each for "every symbols" requirement
    password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
    password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    const allChars = Object.values(charset).join("");
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the result
    const shuffled = password.split('').sort(() => 0.5 - Math.random()).join('');
    setGeneratedPassword(shuffled);
  };

  const generateUniqueNickname = () => {
    const prefixes = ["Neo", "Star", "Void", "Zen", "Sky", "Nova", "Luna", "Astro", "Cyber", "Mega", "Iron", "Shadow", "Thunder", "Ice", "Flame", "Storm", "Elite", "Prime", "Apex", "Soul", "Mystic", "Turbo", "Ghost", "Titan"];
    const middles = ["Blade", "Walker", "Runner", "Hunter", "Lord", "Knight", "Seeker", "Guard", "Watcher", "Core", "Flux", "Pulse", "Warp", "Drift", "Ghost", "Reaper", "Pilot", "Slayer", "Master"];
    const suffixes = ["X", "Zero", "Prime", "One", "Omega", "Alpha", "Neo", "Flux", "99", "Z", "V", "Eon", "Nova", "Force", "Strike"];

    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const m = middles[Math.floor(Math.random() * middles.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];

    // Randomly choose a structure: [P]+[M], [M]+[S], or [P]+[S]
    const structures = [
      `${p}${m}`,
      `${m}${s}`,
      `${p}${s}`,
      `${p}_${m}`,
      `${m}.${s}`,
      `${p}${m}${s}`
    ];

    const result = structures[Math.floor(Math.random() * structures.length)];
    setGeneratedNickname(result);
  };

  const saveToGenList = async (type: "password" | "nickname", value: string) => {
    if (!currentUser?.uid || !value) return;
    setIsLoading(true);
    try {
      const currentList = currentUser.savedGen || [];
      const newItem = {
        id: Math.random().toString(36).substring(2, 11),
        type,
        value,
        createdAt: Date.now()
      };
      const updatedList = [newItem, ...currentList];
      await updateDoc(doc(db, "users", currentUser.uid), { savedGen: updatedList });
      setCurrentUser({ ...currentUser, savedGen: updatedList });
      setMessage({ text: `${type === 'password' ? 'Key' : 'Identity'} Archived`, type: "success" });
    } catch (err) {
      setMessage({ text: "Archive Protocol Failed", type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 2000);
  };

  const deleteFromGenList = async (id: string) => {
    if (!currentUser?.uid) return;
    try {
      const updatedList = (currentUser.savedGen || []).filter(item => item.id !== id);
      await updateDoc(doc(db, "users", currentUser.uid), { savedGen: updatedList });
      setCurrentUser({ ...currentUser, savedGen: updatedList });
    } catch (err) {
      setMessage({ text: "Purge Failed", type: "error" });
    }
  };

  const updateDrivingBest = async (newBest: number) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { drivingBest: newBest });
      setCurrentUser({ ...currentUser, drivingBest: newBest });
    } catch (err) {
      console.error("High Score Protocol Failed");
    }
  };

  const updateDrivingBest2 = async (newBest: number) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { drivingBest2: newBest });
      setCurrentUser({ ...currentUser, drivingBest2: newBest });
    } catch (err) {
      console.error("High Score 2 Protocol Failed");
    }
  };

  const updateDrivingBest3 = async (newBest: number) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { drivingBest3: newBest });
      setCurrentUser({ ...currentUser, drivingBest3: newBest });
    } catch (err) {
      console.error("High Score 3 Protocol Failed");
    }
  };

  const handleForgotStep = async () => {
    if (!forgotForm.identifier || !forgotForm.phone || !forgotForm.dob) {
      setMessage({ text: "Username, Phone, and DOB required", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      // Strict matching for recovery
      const q = query(
        collection(db, "users"), 
        where("username", "==", forgotForm.identifier),
        where("phone", "==", forgotForm.phone),
        where("dob", "==", forgotForm.dob)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        setForgotForm(prev => ({ 
          ...prev, 
          step: 2, // Skip permissions, go direct to reset as identity is verified by 3-keys
          targetUser: { ...userDoc.data(), uid: userDoc.id } as UserProfile 
        }));
        setView("reset-password");
        setMessage({ text: "Identity Correct. Reset Authorized.", type: "success" });
      } else {
        setMessage({ text: "Error: Identity coordinates do not match", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Verification protocol failed", type: "error" });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const finalizeReset = async () => {
    if (!forgotForm.targetUser?.uid) return;
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (forgotForm.newPassword.length < 8) {
      setMessage({ text: "Security risk: Min. 8 characters", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // Update Firestore password for fallback system
      await updateDoc(doc(db, "users", forgotForm.targetUser.uid), {
        password: forgotForm.newPassword,
        recoveryStatus: "Authorized for override",
        lastReset: new Date()
      });

      // Attempt to update Firebase Auth password if the user is currently signed in or supported
      // (Usually requires re-auth, so we primarily rely on the Firestore update for the demo)

      setMessage({ text: "Protocol Complete. Coordinates Updated.", type: "success" });
      setTimeout(() => setView("login"), 2500);
    } catch (err) {
      setMessage({ text: "Reset process failed", type: "error" });
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center relative overflow-hidden">
      {/* Top Bar / Logo Area */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full py-4 flex justify-center sticky top-0 bg-white/80 backdrop-blur-sm z-50"
      >
        <img
          src="https://lh3.googleusercontent.com/d/1P4pxiMtacL6-8EJwnhsPW7XNbR1_K4Oa"
          alt="Gamura Galaxy Logo"
          className="w-48 md:w-64 h-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Center Main Image Content Area */}
      <div className="flex-1 w-full flex items-center justify-center p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-2xl"
        >
          <img
            src="https://lh3.googleusercontent.com/d/1TqxgExM7o866SAgpNri0R-mx0sZtCtc3"
            alt="Gamura Galaxy Display"
            className="w-full h-auto object-contain rounded-lg shadow-sm"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-2 flex justify-around items-center z-50 shadow-lg">
        {/* Red Style: Home */}
        <button
          onClick={() => changeView("home")}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="p-1.5 bg-red-50 text-red-600 rounded-full group-hover:bg-red-100 transition-all scale-90 group-hover:scale-100 border border-red-100">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[9px] uppercase tracking-tighter font-bold text-red-500 group-hover:text-red-700">Home</span>
        </button>

        {/* Yellow Style: Menu */}
        <button
          onClick={() => changeView("menu")}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-all scale-90 group-hover:scale-100 border border-yellow-200">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[9px] uppercase tracking-tighter font-bold text-yellow-600 group-hover:text-yellow-700">Menu</span>
        </button>

        {/* Green Style: Settings */}
        <button
          onClick={() => changeView("settings")}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="p-1.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-all scale-90 group-hover:scale-100 border border-green-100 shadow-sm">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[9px] uppercase tracking-tighter font-bold text-green-500 group-hover:text-green-700">Settings</span>
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {view === "home" && (
          <SubPage 
            key="home" 
            title="home" 
            onBack={() => changeView("main")} 
            profilePic={currentUser?.profilePic}
            profileZoom={currentUser?.profileZoom}
          >
            <div className="p-4 space-y-6">
              <div className="max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 px-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("gallery")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-cyan-600 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-all">
                        <Image className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Secrets</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("notes")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-orange-600 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Notes</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("gen")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-lime-600 shadow-sm hover:shadow-md hover:border-lime-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-lime-50 text-lime-600 rounded-xl group-hover:bg-lime-600 group-hover:text-white transition-all">
                        <Zap className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Gen</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("del")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-fuchsia-600 shadow-sm hover:shadow-md hover:border-fuchsia-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-fuchsia-50 text-fuchsia-600 rounded-xl group-hover:bg-fuchsia-600 group-hover:text-white transition-all">
                        <Car className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Del</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("del-2")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-amber-500 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Del 2</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("del-3")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-teal-600 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Del 3</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("rb")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-rose-600 shadow-sm hover:shadow-md hover:border-rose-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <FileUser className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">RB</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => changeView("wheel")}
                      className="w-14 h-14 bg-white border border-gray-100 rounded-[1.2rem] flex items-center justify-center text-indigo-600 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group active:scale-90"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <RefreshCcw className="w-5 h-5" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Wheel</span>
                  </div>
                </div>
              </div>
            </div>
          </SubPage>
        )}
        {view === "menu" && (
          <SubPage key="menu" title="menu" onBack={() => changeView("main")}>
            <div className="p-6 space-y-6">
              {/* Galactic Menu Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Galactic Menu</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => changeView("gallery")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-cyan-500 hover:text-cyan-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                        <Image className="w-5 h-5" />
                      </div>
                      <span className="font-bold tracking-widest text-[10px] uppercase">My Secrets</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => changeView("about")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-gray-900 hover:text-black transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span className="font-bold tracking-widest text-[10px] uppercase">About</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Game Menu Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Game Archive</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => changeView("del")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-fuchsia-500 hover:text-fuchsia-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg group-hover:bg-fuchsia-600 group-hover:text-white transition-all shadow-sm">
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold tracking-widest text-[10px] uppercase">Driving Endless</span>
                        <span className="block text-[8px] text-gray-400 uppercase tracking-tighter">The Classic Run</span>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => changeView("del-2")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold tracking-widest text-[10px] uppercase">Driving Endless 2</span>
                        <span className="block text-[8px] text-gray-400 uppercase tracking-tighter">Cyber Expansion</span>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => changeView("del-3")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold tracking-widest text-[10px] uppercase">Driving Endless 3</span>
                        <span className="block text-[8px] text-gray-400 uppercase tracking-tighter">Moto Rush Traps</span>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => changeView("rb")}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-rose-500 hover:text-rose-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                        <FileUser className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold tracking-widest text-[10px] uppercase">G. Resume Builder</span>
                        <span className="block text-[8px] text-gray-400 uppercase tracking-tighter">Identity Architect</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </SubPage>
        )}

        {view === "about" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center p-8 text-center"
          >
            <button 
              onClick={() => changeView("menu")}
              className="absolute top-8 left-8 p-3 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-900 transition-all border border-gray-100 shadow-sm"
              aria-label="Back to Menu"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="space-y-10 flex flex-col items-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">®GAMURA</h1>
                <div className="w-20 h-1 bg-gray-900 mx-auto" />
              </div>

              <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
                <img 
                  src="https://lh3.googleusercontent.com/d/1TqxgExM7o866SAgpNri0R-mx0sZtCtc3" 
                  alt="GAMURA About"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gray-100 -rotate-1 rounded-2xl" />
                <div className="relative px-10 py-8 border-4 border-gray-950 rounded-2xl bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3">The Founder of Gamura</p>
                  <h2 className="text-3xl font-black text-black uppercase tracking-tighter italic">SELVARANJAN GANTHI</h2>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === "wheel" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[999] flex flex-col pt-safe"
          >
            <header className="p-4 flex items-center justify-between border-b border-gray-100">
              <button 
                onClick={() => changeView("home")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="flex-1 text-center font-black text-gray-900 uppercase tracking-widest text-xs pr-9">SPIN THE WHEEL</h1>
            </header>
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <IcebreakerWheel />
            </div>
          </motion.div>
        )}
        
        {/* Gallery View */}
        {view === "gallery" && (
          <SubPage 
            key="gallery" 
            title="MY SECRETS" 
            onBack={() => changeView("main")}
            action={{ 
              label: "ADD SECRETS", 
              onClick: () => document.getElementById('gallery-upload')?.click() 
            }}
          >
            <div className="p-6 space-y-6 flex flex-col min-h-full">
              <input 
                id="gallery-upload"
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleGalleryUpload} 
              />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Secret Vault</h2>
                  <p className="text-[11px] text-gray-500 italic">Saved: {currentUser?.galleryPhotos?.length || 0}/10</p>
                </div>
              </div>

              {message && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[10px] font-bold uppercase text-center p-2 rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-700 border-red-200'}`}
                >
                  {message.text}
                </motion.p>
              )}

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 gap-3 pb-8">
                {(currentUser?.galleryPhotos || []).map((photo, idx) => (
                  <motion.div 
                    key={idx}
                    layoutId={`photo-${idx}`}
                    className="aspect-square relative group bg-gray-100 rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                  >
                    {photo && (
                      <img 
                        src={photo || undefined} 
                        alt={`Secret ${idx + 1}`} 
                        onClick={() => setSelectedPhoto(photo)}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadPhoto(photo, `secret-${idx + 1}.png`); }}
                        className="p-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-black/80 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteGalleryPhoto(idx); }}
                        className="p-1.5 bg-red-600/90 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {(!currentUser?.galleryPhotos || currentUser.galleryPhotos.length === 0) && (
                  <div className="col-span-2 py-12 flex flex-col items-center justify-center text-gray-300 gap-4">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Image className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">No secrets saved yet</p>
                  </div>
                )}
              </div>

              {/* Fullscreen Preview Modal */}
              <AnimatePresence>
                {selectedPhoto && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedPhoto(null)}
                    className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
                  >
                    <button 
                      className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      onClick={() => setSelectedPhoto(null)}
                    >
                      <ArrowLeft className="w-6 h-6 rotate-90" />
                    </button>

                    <div className="absolute top-6 left-6 flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadPhoto(selectedPhoto, "galactic-secret.png"); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                      >
                        <Download className="w-4 h-4" />
                        Download Photo
                      </button>
                    </div>

                    {selectedPhoto && (
                      <motion.img 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        src={selectedPhoto || undefined} 
                        alt="Full Preview"
                        className="w-full max-w-lg h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <p className="mt-8 text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium">Identity Secret View</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SubPage>
        )}
        {/* Settings View */}
        {view === "settings" && (
          <SubPage key="settings" title="settings" onBack={() => changeView("main")}>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Account Management</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => changeView("login")}
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl text-gray-900 font-medium hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors overflow-hidden">
                        <img
                          src={currentUser?.profilePic || "https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x"}
                          alt="Gamura Icon"
                          style={{ scale: currentUser?.profileZoom || 1 }}
                          className="w-5 h-5 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span>{currentUser ? "MY CURRENT PROFILE" : "GAMURA LOGIN"}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setCurrentUser(null); changeView("signup"); }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-indigo-50 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all shadow-sm border-dashed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-indigo-600 rounded-lg border border-indigo-100">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest">Add Another Account</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Session Protocol Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Identity Security</h2>
                <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Session Protocol</p>
                    <p className="text-sm font-black text-gray-900 uppercase">Single Device Active</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </SubPage>
        )}

        {/* Signup View */}
        {view === "signup" && (
          <SubPage key="signup" title="SIGN-IN PAGE" onBack={() => changeView("login")}>
            <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 font-mono tracking-widest uppercase">SIGN-UP</h2>
                <p className="text-gray-500 text-sm italic">Create your Gamura identity</p>
              </div>
              <div className="w-full max-w-sm space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname</label>
                  <input 
                    type="text" 
                    value={signupForm.nickname}
                    onChange={(e) => setSignupForm({...signupForm, nickname: e.target.value})}
                    placeholder="Enter your nickname" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</label>
                  <input 
                    type="text" 
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({...signupForm, username: e.target.value})}
                    placeholder="Choose a unique username" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
                  <input 
                    type="password" 
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                    placeholder="Min. 8 characters" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number (Mandatory)</label>
                  <div className="phone-input-container">
                    <PhoneInput
                      placeholder="Enter mobile coordinates"
                      value={signupForm.phone}
                      onChange={(val) => setSignupForm({...signupForm, phone: val || ""})}
                      defaultCountry="US"
                      className="international-phone-field font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date of Birth (Compulsory)</label>
                  <div className="relative">
                    <CheckCircle2 className={`absolute right-4 top-3.5 w-4 h-4 transition-colors ${signupForm.dob?.length === 10 ? 'text-green-500' : 'text-gray-200'}`} />
                    <input 
                      type="text" 
                      value={signupForm.dob}
                      onChange={(e) => setSignupForm({...signupForm, dob: formatDob(e.target.value)})}
                      placeholder="DD-MM-YYYY (e.g. 21-10-2007)" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold tracking-[0.1em]" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-100 bg-indigo-50 flex-shrink-0 shadow-inner">
                      {signupForm.profilePic && (
                        <img 
                          src={signupForm.profilePic || undefined} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('signup-file-input')?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-indigo-300 transition-all text-sm font-bold shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Pick Photo
                    </button>
                    <input 
                      id="signup-file-input"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'signup')} 
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={handleSignup}
                  className="w-full py-4 mt-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </SubPage>
        )}

        {/* Login View */}
        {view === "login" && (
          <SubPage 
            key="login" 
            title={currentUser ? (isEditingProfile ? "EDIT PROFILE" : "MY PROFILE") : "GAMURA LOGIN"} 
            onBack={() => {
              if (isEditingProfile) setIsEditingProfile(false);
              else changeView("settings");
            }}
            action={!currentUser ? { label: "SKIP", onClick: () => changeView("main") } : (isEditingProfile ? { label: "SAVE", onClick: saveProfile } : { label: "EDIT", onClick: () => setIsEditingProfile(true) })}
          >
            {currentUser ? (
              /* USER PROFILE VIEW or EDIT MODE */
              <div className="min-h-full p-6 space-y-8 flex flex-col items-center pt-8">
                <div className="relative group">
                  <div className={`w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center border-2 ${isEditingProfile ? 'border-indigo-500 shadow-indigo-100' : 'border-gray-100'} overflow-hidden shadow-lg transition-all relative`}>
                    {(isEditingProfile ? editForm.profilePic : currentUser?.profilePic) && (
                      <motion.img
                        src={(isEditingProfile ? editForm.profilePic : currentUser?.profilePic) || undefined}
                        alt="Profile"
                        style={{ scale: isEditingProfile ? editForm.zoom : (currentUser?.profileZoom || 1) }}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {isEditingProfile && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Update</span>
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, 'edit')} 
                  />
                </div>

                {isEditingProfile ? (
                  /* EDITING FORM */
                  <div className="w-full max-w-sm space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname</label>
                      <input 
                        type="text" 
                        value={editForm.nickname}
                        onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        placeholder="New Nickname"
                      />
                    </div>
                    
                    <div className="space-y-1 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Minimize / Zoom</label>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{Math.round(editForm.zoom * 100)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.01"
                        value={editForm.zoom}
                        onChange={(e) => setEditForm({...editForm, zoom: parseFloat(e.target.value)})}
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between mt-1 px-1">
                         <span className="text-[8px] font-bold text-gray-400">MIN</span>
                         <span className="text-[8px] font-bold text-gray-400">ORIGINAL</span>
                         <span className="text-[8px] font-bold text-gray-400">MAX</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Photo</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md font-bold text-sm"
                      >
                        <Camera className="w-4 h-4" />
                        Pick from Gallery
                      </button>
                    </div>
                    {message && (
                       <p className={`text-center text-[10px] font-bold uppercase tracking-widest ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{message.text}</p>
                    )}
                  </div>
                ) : (
                  /* PROFILE DISPLAY */
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{currentUser.nickname}</h2>
                      <p className="text-indigo-500 font-mono text-xs font-bold tracking-widest">@{currentUser.username}</p>
                    </div>

                    <div className="w-full max-w-sm space-y-2.5">
                       <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md"><AtSign className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</p>
                            <p className="text-sm text-gray-900 font-bold">{currentUser.username}</p>
                          </div>
                       </div>

                       {currentUser.phone && (
                         <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                            <div className="p-2 bg-green-50 text-green-600 rounded-md"><Smartphone className="w-5 h-5" /></div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                              <p className="text-sm text-gray-900 font-bold">{currentUser.phone}</p>
                            </div>
                         </div>
                       )}

                       <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                          <div className="p-2 bg-slate-100 text-slate-600 rounded-md"><User className="w-5 h-5" /></div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <div className="flex items-center justify-between">
                               <p className="text-sm text-gray-900 font-bold">Verified User</p>
                               <div className="flex items-center gap-1 text-green-600">
                                 <CheckCircle2 className="w-4 h-4" />
                                 <span className="text-[8px] font-black uppercase">ACTIVE</span>
                               </div>
                            </div>
                          </div>
                       </div>

                       {/* MANAGE MULTIPLE ACCOUNTS SECTION (Now only Logout since sessions are enforced) */}
                       <div className="pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleLogout()}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-[10px] uppercase tracking-widest">Sign Out All Devices</span>
                          </button>
                       </div>
                    </div>

                    {message && message.type === 'success' && (
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest animate-pulse">{message.text}</p>
                    )}
                  </>
                )}

                {!isEditingProfile && (
                  <div className="mt-auto mb-8 w-full max-w-sm flex flex-col gap-2">
                    {showDeleteConfirm ? (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-[10px] font-bold text-red-600 text-center uppercase tracking-widest leading-relaxed">
                          Are you sure you want to permanently delete your galactic identity?
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleDeleteAccount}
                            className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-200 border-2 border-red-500 active:scale-95 transition-all outline outline-offset-4 outline-red-100"
                          >
                            YES, PERMANENTLY PURGE
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-400 font-bold rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setCurrentUser(null); setView("login"); }}
                          className="w-full py-4 bg-white border border-gray-100 text-gray-400 font-bold rounded-xl hover:text-gray-900 hover:border-gray-300 transition-all uppercase tracking-widest text-[10px]"
                        >
                          Sign Out
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full py-5 text-white bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 font-black rounded-2xl transition-all shadow-2xl shadow-red-200 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] border-b-4 border-red-900/20 active:translate-y-1 active:border-b-0"
                        >
                          <Trash2 className="w-5 h-5" />
                          DELETE IDENTITY
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* LOGIN FORM VIEW */
              <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-gray-50 p-2">
                  <img
                    src="https://lh3.googleusercontent.com/d/1K0M7bYtdycSjgmTQoUH3NLkT1zxisZ6x"
                    alt="Gamura Galaxy logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight transition-all">Welcome Back</h2>
                  <p className="text-gray-500 italic">Enter your details to enter space</p>
                </div>
                <div className="w-full max-w-sm space-y-4 pt-4 text-left">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username or Phone</label>
                    <input 
                      type="text" 
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm({...loginForm, identifier: e.target.value})}
                      placeholder="Username or phone number" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
                    <input 
                      type="password" 
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="Enter your password" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date of Birth</label>
                    <input 
                      type="text" 
                      value={loginForm.dob}
                      onChange={(e) => setLoginForm({...loginForm, dob: formatDob(e.target.value)})}
                      placeholder="DD-MM-YYYY (e.g. 21-10-2007)" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold tracking-[0.1em]" 
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => changeView("forgot-password")}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <AnimatePresence>
                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                      >
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={handleLogin}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    Login to Galaxy
                  </button>
                  <div className="pt-6 border-t border-gray-50 flex flex-col items-center gap-3">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest text-center">New to the Galaxy?</p>
                    <button 
                      onClick={() => changeView("signup")}
                      className="w-full py-3 bg-white border border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm uppercase tracking-widest"
                    >
                      Create Galactic Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </SubPage>
        )}

        {/* Forgot Password View */}
        {view === "forgot-password" && (
          <SubPage key="forgot" title="LOCATE IDENTITY" onBack={() => changeView("login")}>
            <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-8">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 shadow-inner">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase tracking-[0.1em]">Identity Recovery</h2>
                <p className="text-gray-500 text-[11px] uppercase tracking-widest font-black opacity-60 italic">Initiating Galactic Scan...</p>
              </div>
              
              <div className="w-full max-w-sm space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={forgotForm.identifier}
                      onChange={(e) => setForgotForm({ ...forgotForm, identifier: e.target.value })}
                      placeholder="Enter username" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                  <div className="phone-input-container">
                    <PhoneInput
                      placeholder="Enter mobile coordinates"
                      value={forgotForm.phone}
                      onChange={(val) => setForgotForm({...forgotForm, phone: val || ""})}
                      defaultCountry="US"
                      className="international-phone-field font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date of Birth</label>
                  <div className="relative">
                    <Plus className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={forgotForm.dob}
                      onChange={(e) => setForgotForm({ ...forgotForm, dob: formatDob(e.target.value) })}
                      placeholder="DD-MM-YYYY" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold tracking-[0.1em]" 
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div 
                      key="msg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100' : 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100'}`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={handleForgotStep}
                  disabled={isLoading}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "VERIFY IDENTITY"}
                  {!isLoading && <ArrowLeft className="w-4 h-4 rotate-180" />}
                </button>
                
                <button 
                  onClick={() => changeView("login")}
                  className="w-full py-4 text-gray-400 font-bold rounded-xl hover:text-gray-600 transition-all uppercase tracking-widest text-[9px]"
                >
                  ABORT RECOVERY
                </button>
              </div>
            </div>
          </SubPage>
        )}

        {/* Reset Password Step-by-Step View (New Page as requested) */}
        {view === "reset-password" && (
          <SubPage 
            key="reset" 
            title="RECOVERY PROTOCOL" 
            onBack={() => {
              if (forgotForm.step > 1) setForgotForm(f => ({ ...f, step: f.step - 1 }));
              else setView("forgot-password");
            }}
          >
            <div className="p-6 space-y-8 flex flex-col min-h-full">
              {/* Step indicator */}
              <div className="flex items-center gap-2 justify-center pt-4">
                {[1, 2].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1.5 w-16 rounded-full transition-all duration-700 ${forgotForm.step >= s ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-100'}`} 
                  />
                ))}
              </div>

              {forgotForm.step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Sector Verification</h2>
                    <p className="text-[10px] text-gray-400 italic max-w-xs mx-auto leading-relaxed uppercase tracking-tighter">Grant the necessary galactic permissions to authorize identity override.</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setForgotForm(f => ({ ...f, permissions: { ...f.permissions, biometric: !f.permissions.biometric }}))}
                      className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${forgotForm.permissions.biometric ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <Smartphone className={`w-6 h-6 transition-colors ${forgotForm.permissions.biometric ? 'text-indigo-600' : 'text-gray-300'}`} />
                        <div className="text-left">
                          <span className="text-[11px] font-black uppercase tracking-widest block">Biometric Sync</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-70">Authorize coordinate match</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${forgotForm.permissions.biometric ? 'border-indigo-600 bg-indigo-600 shadow-sm' : 'border-gray-100'}`}>
                        {forgotForm.permissions.biometric && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    <button 
                      onClick={() => setForgotForm(f => ({ ...f, permissions: { ...f.permissions, neural: !f.permissions.neural }}))}
                      className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${forgotForm.permissions.neural ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <AtSign className={`w-6 h-6 transition-colors ${forgotForm.permissions.neural ? 'text-indigo-600' : 'text-gray-300'}`} />
                        <div className="text-left">
                          <span className="text-[11px] font-black uppercase tracking-widest block">Neural Link</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-70">Establish memory bridge</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${forgotForm.permissions.neural ? 'border-indigo-600 bg-indigo-600 shadow-sm' : 'border-gray-100'}`}>
                        {forgotForm.permissions.neural && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    <button 
                      onClick={() => setForgotForm(f => ({ ...f, permissions: { ...f.permissions, owner: !f.permissions.owner }}))}
                      className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${forgotForm.permissions.owner ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <User className={`w-6 h-6 transition-colors ${forgotForm.permissions.owner ? 'text-indigo-600' : 'text-gray-300'}`} />
                        <div className="text-left">
                          <span className="text-[11px] font-black uppercase tracking-widest block">Core Ownership</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-70">Verify identity center</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${forgotForm.permissions.owner ? 'border-indigo-600 bg-indigo-600 shadow-sm' : 'border-gray-100'}`}>
                        {forgotForm.permissions.owner && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={!forgotForm.permissions.biometric || !forgotForm.permissions.neural || !forgotForm.permissions.owner}
                      onClick={() => setForgotForm(f => ({ ...f, step: 2 }))}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-[11px]"
                    >
                      Authorize Overwrite
                    </button>
                  </div>
                </div>
              )}

              {forgotForm.step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">New Encryption</h2>
                    <p className="text-[11px] text-gray-400 italic font-medium uppercase tracking-tighter">Set your new galactic access code.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                        {forgotForm.targetUser?.profilePic && (
                          <img 
                            src={forgotForm.targetUser.profilePic || undefined} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" alt="Target"
                          />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Recovering Account</p>
                        <p className="text-xs font-bold text-gray-900 tracking-tight">{forgotForm.targetUser?.nickname}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">New Access Code</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                          type="password"
                          value={forgotForm.newPassword}
                          onChange={(e) => setForgotForm(f => ({ ...f, newPassword: e.target.value }))}
                          placeholder="Min. 8 characters" 
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirm Access Code</label>
                      <div className="relative">
                        <ShieldCheck className={`absolute left-4 top-3.5 w-5 h-5 ${forgotForm.newPassword && forgotForm.newPassword === forgotForm.confirmPassword ? 'text-green-500' : 'text-gray-400'}`} />
                        <input 
                          type="password"
                          value={forgotForm.confirmPassword}
                          onChange={(e) => setForgotForm(f => ({ ...f, confirmPassword: e.target.value }))}
                          placeholder="Verify access code" 
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {message && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={finalizeReset}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 uppercase tracking-[0.2em] text-[11px] active:scale-95 border-b-4 border-indigo-900/20"
                  >
                    SYNC PROTOCOL
                  </button>
                </div>
              )}
            </div>
          </SubPage>
        )}
        {view === "notes" && (
          <SubPage 
            key="notes" 
            title={isAddingNote ? (activeNoteId ? "Edit Note" : "New Note") : "Gamura Notes"} 
            onBack={() => {
              if (isAddingNote) {
                setIsAddingNote(false);
                setActiveNoteId(null);
                setNoteForm({ title: "", content: "" });
              } else {
                changeView("home");
              }
            }}
            action={isAddingNote ? { label: "SAVE", onClick: saveNote } : { label: "CREATE", onClick: () => setIsAddingNote(true) }}
          >
            <div className="w-full h-full bg-white flex flex-col">
              {isAddingNote ? (
                <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4">
                  <input 
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Coordinate Title..."
                    className="text-2xl font-black text-gray-900 placeholder:text-gray-200 border-none focus:ring-0 px-0 mb-4 uppercase tracking-tight"
                  />
                  <textarea 
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Establish neural data..."
                    className="flex-1 resize-none text-gray-700 placeholder:text-gray-200 border-none focus:ring-0 px-0 text-lg leading-relaxed font-medium"
                  />
                  
                  {activeNoteId && (
                    <button 
                      onClick={() => {
                        deleteNote(activeNoteId);
                        setIsAddingNote(false);
                        setActiveNoteId(null);
                        setNoteForm({ title: "", content: "" });
                        setMessage({ text: "Note Purged", type: "success" });
                        setTimeout(() => setMessage(null), 2000);
                      }}
                      className="mt-6 flex items-center justify-center gap-2 p-4 text-red-500 bg-red-50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      Purge Note
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(!currentUser?.notes || currentUser.notes.length === 0) ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-200 gap-3 mt-12">
                      <FileText className="w-16 h-16 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Cache Empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {currentUser.notes.map(note => (
                        <div 
                          key={note.id}
                          className="group bg-gray-50 border border-gray-100 p-5 rounded-2xl hover:border-blue-200 hover:bg-white transition-all shadow-sm relative"
                        >
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              setActiveNoteId(note.id);
                              setNoteForm({ title: note.title, content: note.content });
                              setIsAddingNote(true);
                            }}
                          >
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-1 line-clamp-1">{note.title}</h3>
                            <p className="text-gray-500 text-[11px] line-clamp-3 leading-relaxed font-medium">{note.content}</p>
                            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-3 block">
                              {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button 
                            onClick={() => deleteNote(note.id)}
                            className="absolute top-4 right-4 p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SubPage>
        )}
        {view === "gen" && (
          <SubPage key="gen" title="GEN" onBack={() => changeView("home")}>
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 space-y-6">
              <button 
                onClick={() => changeView("gen-password")}
                className="w-full max-w-xs py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95"
              >
                Password Generator
              </button>
              
              <button 
                onClick={() => changeView("gen-nickname")}
                className="w-full max-w-xs py-4 bg-yellow-400 text-gray-900 font-black rounded-2xl shadow-xl shadow-yellow-100 hover:bg-yellow-500 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95"
              >
                Nickname Generator
              </button>
              
              <button 
                onClick={() => changeView("gen-list")}
                className="w-full max-w-xs py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95"
              >
                Save List
              </button>
            </div>
          </SubPage>
        )}
        {view === "gen-password" && (
          <SubPage 
            key="gen-password" 
            title="Password Generator" 
            onBack={() => {
              setGeneratedPassword("");
              changeView("gen");
            }}
          >
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-300">
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl min-h-[80px] flex items-center justify-center break-all shadow-inner relative group">
                  {generatedPassword ? (
                    <span className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                      {generatedPassword}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Ready for Generation</span>
                  )}
                  
                  {generatedPassword && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        setMessage({ text: "Access Code Copied", type: "success" });
                        setTimeout(() => setMessage(null), 2000);
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Entropy Protocol</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Generates a 16-character secure access key utilizing lowercase, uppercase, numbers, and special symbols.
                  </p>
                </div>
              </div>

              <button 
                onClick={generateSecurePassword}
                className="w-full max-w-xs py-5 bg-red-600 text-white font-black rounded-2xl shadow-2xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95 border-b-4 border-red-900/20"
              >
                GENERATE ACCESS KEY
              </button>

              {generatedPassword && (
                <button 
                  onClick={() => saveToGenList("password", generatedPassword)}
                  className="w-full max-w-xs flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em] text-[10px] active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Save to Archive
                </button>
              )}

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="p-3 px-6 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SubPage>
        )}
        {view === "gen-nickname" && (
          <SubPage 
            key="gen-nickname" 
            title="Nickname Generator" 
            onBack={() => {
              setGeneratedNickname("");
              changeView("gen");
            }}
          >
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-300">
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl min-h-[80px] flex items-center justify-center shadow-inner relative group">
                  {generatedNickname ? (
                    <span className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                      {generatedNickname}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Ready for Assignment</span>
                  )}
                  
                  {generatedNickname && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedNickname);
                        setMessage({ text: "Identity Copied", type: "success" });
                        setTimeout(() => setMessage(null), 2000);
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomenclature Algorithm</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Utilizes deep space linguistic combinations to forge unique, safe, and powerful nicknames for your galactic identity.
                  </p>
                </div>
              </div>

              <button 
                onClick={generateUniqueNickname}
                className="w-full max-w-xs py-5 bg-yellow-400 text-gray-900 font-black rounded-2xl shadow-2xl shadow-yellow-100 hover:bg-yellow-500 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95 border-b-4 border-yellow-600/20"
              >
                GENERATE NICKNAME
              </button>

              {generatedNickname && (
                <button 
                  onClick={() => saveToGenList("nickname", generatedNickname)}
                  className="w-full max-w-xs flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em] text-[10px] active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Save to Archive
                </button>
              )}

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="p-3 px-6 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SubPage>
        )}
        {view === "gen-list" && (
          <SubPage key="gen-list" title="Save List" onBack={() => changeView("gen")}>
            <div className="w-full h-full bg-white flex flex-col p-4 space-y-4">
              {(!currentUser?.savedGen || currentUser.savedGen.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-200 gap-3">
                  <ShieldCheck className="w-16 h-16 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Archive Empty</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {currentUser.savedGen.map(item => (
                    <div 
                      key={item.id}
                      className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:border-green-200 transition-all"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.type === 'password' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.type}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`font-mono font-bold text-gray-900 ${item.type === 'password' ? 'text-sm' : 'text-base'}`}>
                          {item.value}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.value);
                            setMessage({ text: "Copied to Clipboard", type: "success" });
                            setTimeout(() => setMessage(null), 2000);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteFromGenList(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SubPage>
        )}
        {view === "del" && (
          <SubPage key="del" title="DRIVING ENDLESS" onBack={() => changeView("home")}>
            <div className="w-full h-full bg-white animate-in fade-in duration-300">
              <DrivingEndlessGame 
                bestScore={currentUser?.drivingBest || 0} 
                onUpdateBest={updateDrivingBest}
              />
            </div>
          </SubPage>
        )}
        {view === "del-2" && (
          <SubPage key="del-2" title="DRIVING ENDLESS 2" onBack={() => changeView("home")}>
            <div className="w-full h-full bg-slate-900 animate-in fade-in duration-300">
              <DrivingEndlessGame2 
                bestScore={currentUser?.drivingBest2 || 0} 
                onUpdateBest={updateDrivingBest2}
              />
            </div>
          </SubPage>
        )}
        {view === "del-3" && (
          <SubPage key="del-3" title="DRIVING ENDLESS 3" onBack={() => changeView("home")}>
            <div className="w-full h-full bg-slate-950 animate-in fade-in duration-300">
              <DrivingEndlessGame3 
                bestScore={currentUser?.drivingBest3 || 0} 
                onUpdateBest={updateDrivingBest3}
              />
            </div>
          </SubPage>
        )}
        {view === "rb" && (
          <SubPage key="rb" title="GAMURA RESUME BUILDER" onBack={() => changeView("home")}>
            <div className="w-full h-full bg-[#08080f]">
              <ResumeBuilder />
            </div>
          </SubPage>
        )}
      </AnimatePresence>
    </main>
  );
}
