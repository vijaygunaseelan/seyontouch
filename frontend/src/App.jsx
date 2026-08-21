import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShoppingBag, Plus, Minus, X, Trash2, Settings, Store as StoreIcon,
  Check, Loader2, Package, ArrowLeft, Pencil, ImageOff, ReceiptText,
  Lock, AlertCircle, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, ChevronDown, UploadCloud,
  Eye, ZoomIn, Phone, Mail, Instagram,
} from "lucide-react";
import * as api from "./api.js";
import instagramQR from "./assets/instagram-qr.png";
import footerBadge from './assets/footer_img.jpeg';

// The store's password check now happens server-side (see Django's
// AdminLoginView) — the browser only ever holds the signed token it gets
// back, not the password itself.
const ADMIN_TOKEN_STORAGE_KEY = "seyon_admin_token";

// Flat shipping fee (₹) added on top of the cart subtotal at checkout.
// Keep this in sync with SHIPPING_FEE_RUPEES in backend/store/pricing.py —
// that's the value actually charged; this one is just what's displayed
// before the order is created.
const SHIPPING_FEE = 60;

// Store contact details shown in the site footer.
const STORE_PHONE = "9611975252";
const STORE_EMAIL = "seyontouch@gmail.com";
const STORE_INSTAGRAM_HANDLE = "seyontouch";
const STORE_INSTAGRAM_URL = "https://instagram.com/seyontouch";

/* ---------------------------------------------------------------
   TOKENS
   bg: charcoal ledger backdrop / paper: cream card stock
   accent-gold: price-tag brass / accent-green: in-stock / accent-coral: low-stock, errors
----------------------------------------------------------------*/
const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  .gs-root {
    --bg: #FFFFFF;
    --panel: #EAF2F3;
    --panel-2: #D7E7EA;
    --paper: #FFFFFF;
    --ink: #072E4E;
    --muted: #5A7A86;
    --muted-2: #39586A;
    --line: rgba(7,46,78,0.14);
    --gold: #C3944E;
    --gold-ink: #072E4E;
    --green: #027F7B;
    --coral: #C6482F;

    @font-face {
      font-family: 'TT Drugs';
      src: url('/fonts/TTDrugs-Regular.woff2') format('woff2'),
           url('/fonts/TTDrugs-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'TT Drugs';
      src: url('/fonts/TTDrugs-Bold.woff2') format('woff2'),
           url('/fonts/TTDrugs-Bold.woff') format('woff');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    --font-display: 'TT Drugs', 'Bricolage Grotesque', sans-serif;
    --font-body: 'TT Drugs', 'Space Grotesk', sans-serif;
    --font-mono: 'TT Drugs', 'IBM Plex Mono', monospace;

    background-color: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
    min-height: 100vh;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .gs-root * { box-sizing: border-box; }
  .gs-root button { font-family: inherit; cursor: pointer; }
  .gs-root ::selection { background: var(--gold); color: var(--gold-ink); }

  .gs-eyebrow {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 11px;
    color: var(--muted);
  }

  .gs-header {
    position: sticky; top: 0; z-index: 20;
    padding: 18px 0;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
  }
  .gs-header-inner {
    max-width: 1180px; margin: 0 auto; padding: 0 28px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .gs-brand { display: flex; align-items: center; gap: 10px; }
  .gs-brand-logo { height: 46px; width: auto; object-fit: contain; flex-shrink: 0; display: block; }
  .gs-brand-name { font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -0.01em; }
  .gs-brand-sub { font-family: var(--font-mono); font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }

  .gs-nav { display: flex; align-items: center; gap: 6px; }
  .gs-navbtn {
    display: flex; align-items: center; gap: 7px;
    background: transparent; border: 1px solid transparent; color: var(--muted);
    padding: 9px 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
    transition: all .15s ease;
  }
  .gs-navbtn:hover { color: var(--ink); border-color: var(--line); }
  .gs-navbtn.active { color: var(--gold-ink); background: var(--gold); }

  .gs-cartbtn {
    position: relative; display: flex; align-items: center; gap: 8px;
    background: var(--panel-2); border: 1px solid var(--line); color: var(--ink);
    padding: 10px 16px; border-radius: 999px; font-size: 13px; font-weight: 500;
  }
  .gs-cartbtn:hover { border-color: var(--gold); }
  .gs-badge {
    position: absolute; top: -6px; right: -6px;
    background: var(--coral); color: var(--paper);
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }

  .gs-adminicon {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid transparent;
    background: transparent; color: var(--muted); display: flex; align-items: center; justify-content: center;
  }
  .gs-adminicon:hover { border-color: var(--line); color: var(--ink); }
  .gs-adminicon.active { background: var(--gold); color: var(--gold-ink); }

  .gs-main { max-width: 1180px; margin: 0 auto; padding: 40px 28px 100px; width: 100%; flex: 1; }

  .gs-hero { position: relative; margin-bottom: 40px; }
  .gs-hero-track {
    position: relative; min-height: 420px; border-radius: 16px; overflow: hidden;
    box-shadow: 0 10px 30px rgba(7,46,78,0.14);
  }
  .gs-hero-slide {
    position: absolute; inset: 0; opacity: 0; transform: translateY(8px);
    transition: opacity .45s ease, transform .45s ease; pointer-events: none;
    background-size: cover; background-position: center;
    display: flex; align-items: flex-end;
  }
  .gs-hero-slide.active { opacity: 1; transform: translateY(0); pointer-events: auto; }
  .gs-hero-slide-scrim {
    position: absolute; inset: 0;
    background: linear-gradient(0deg, rgba(3,15,26,0.82) 0%, rgba(3,15,26,0.45) 55%, rgba(3,15,26,0.1) 100%);
  }
  .gs-hero-slide-content { position: relative; padding: 40px 44px 36px; }
  .gs-hero-slide .gs-eyebrow { color: rgba(255,255,255,0.75); }
  .gs-hero h1 { font-family: var(--font-display); font-size: 40px; font-weight: 600; margin: 8px 0 10px; letter-spacing: -0.01em; color: #fff; }
  .gs-hero p { color: rgba(255,255,255,0.85); font-size: 15px; max-width: 520px; line-height: 1.5; }
  .gs-hero-controls { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
  .gs-hero-arrow {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line);
    background: var(--paper); color: var(--ink); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08); flex-shrink: 0;
  }
  .gs-hero-arrow:hover { border-color: var(--gold); color: var(--gold); }
  .gs-hero-dots { display: flex; gap: 8px; }
  .gs-hero-dot { width: 20px; height: 4px; border-radius: 999px; border: none; background: var(--line); padding: 0; }
  .gs-hero-dot.active { background: var(--gold); width: 30px; }

  .gs-shoptabs { display: flex; gap: 8px; margin-bottom: 22px; }
  .gs-shoptab {
    display: flex; align-items: center; gap: 7px;
    background: var(--paper); border: 1px solid var(--line); color: var(--muted);
    padding: 10px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 600;
  }
  .gs-shoptab:hover { border-color: var(--gold); color: var(--ink); }
  .gs-shoptab.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }

  .gs-catchips { display: flex; gap: 16px; flex-wrap: nowrap; overflow-x: auto; padding: 4px 2px 16px; margin-bottom: 20px; scrollbar-width: thin; }
  .gs-catcard {
    flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 7px;
    width: 72px; background: transparent; border: none; padding: 0;
  }
  .gs-catcard-ring {
    width: 66px; height: 66px; border-radius: 50%; padding: 2.5px;
    background: var(--line);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s ease, transform .15s ease;
  }
  .gs-catcard:hover .gs-catcard-ring { background: linear-gradient(135deg, var(--gold), var(--coral)); transform: translateY(-2px); }
  .gs-catcard.active .gs-catcard-ring { background: linear-gradient(135deg, var(--gold) 0%, var(--coral) 55%, var(--ink) 100%); }
  .gs-catcard-img {
    width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
    background: #ddd6c4; border: 2.5px solid var(--paper);
    display: flex; align-items: center; justify-content: center;
  }
  .gs-catcard-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gs-catcard-img svg { color: #a89f88; }
  .gs-catcard-label {
    font-family: var(--font-mono); font-size: 11px; font-weight: 600; text-align: center;
    color: var(--muted-2); line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 72px;
  }
  .gs-catcard.active .gs-catcard-label { color: var(--ink); font-weight: 700; }

  .gs-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 22px;
  }

  .gs-card {
    background: var(--paper); color: var(--ink); border-radius: 10px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: transform .18s ease, box-shadow .18s ease;
    border: 1px solid rgba(0,0,0,0.06);
  }
  .gs-card:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(0,0,0,0.28); }

  .gs-card-img-wrap { position: relative; aspect-ratio: 1/1; background: #ddd6c4; overflow: hidden; cursor: pointer; }
  .gs-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
  .gs-card-img-wrap:hover img { transform: scale(1.05); }
  .gs-card-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #a89f88; }

  .gs-card-img-scrim {
    position: absolute; inset: 0;
    background: rgba(7,46,78,0);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s ease;
    pointer-events: none;
  }
  .gs-card-img-wrap:hover .gs-card-img-scrim { background: rgba(7,46,78,0.28); }
  .gs-card-img-quickview {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.94); color: var(--ink);
    padding: 8px 14px; border-radius: 999px;
    font-family: var(--font-mono); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    opacity: 0; transform: translateY(6px);
    transition: opacity .2s ease, transform .2s ease;
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .gs-card-img-wrap:hover .gs-card-img-quickview { opacity: 1; transform: translateY(0); }

  .gs-tag {
    position: absolute; top: 12px; right: -6px;
    display: flex; align-items: center; gap: 5px;
    background: var(--gold); color: var(--gold-ink);
    padding: 6px 10px 6px 14px; font-family: var(--font-mono); font-weight: 600; font-size: 13px;
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
    filter: drop-shadow(0 3px 4px rgba(0,0,0,0.25));
  }
  .gs-tag::before { content: ''; position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 3px; height: 3px; border-radius: 50%; background: var(--gold-ink); opacity: .6; }

  .gs-rentbadge {
    position: absolute; bottom: 10px; left: 10px;
    background: rgba(7,46,78,0.88); color: #fff; font-family: var(--font-mono);
    font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em;
    padding: 4px 9px; border-radius: 999px;
  }
  .gs-rentnote { font-size: 11.5px; color: var(--green); font-weight: 600; }

  .gs-stockdot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }

  .gs-card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .gs-card-cat { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted-2); }
  .gs-card-name { font-family: var(--font-display); font-size: 18px; font-weight: 600; line-height: 1.2; cursor: pointer; }
  .gs-card-name:hover { color: var(--gold); }
  .gs-card-desc { font-size: 12.5px; color: #6f6a5e; line-height: 1.4; flex: 1; }
  .gs-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; gap: 8px; }
  .gs-stock { font-family: var(--font-mono); font-size: 11px; color: #6f6a5e; display: flex; align-items: center; flex-shrink: 0; }
  .gs-card-actions { display: flex; gap: 6px; }

  .gs-addbtn {
    background: var(--ink); color: var(--paper); border: none; border-radius: 7px;
    padding: 9px 14px; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 6px;
  }
  .gs-addbtn:hover { background: #3a362c; }
  .gs-addbtn:disabled { background: #cfc8b4; color: #8c8570; cursor: not-allowed; }

  .gs-rentbtn {
    background: transparent; color: var(--ink); border: 1px solid #cfc8b4; border-radius: 7px;
    padding: 9px 12px; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 6px;
  }
  .gs-rentbtn:hover { border-color: var(--green); color: var(--green); }
  .gs-rentbtn:disabled { color: #b4ac97; border-color: #e2dcc9; cursor: not-allowed; }

  .gs-rentpicker { margin-top: 4px; padding: 10px 0 4px; }
  .gs-rentpicker-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #8c8570; margin-bottom: 8px; }
  .gs-rentpicker-days { display: flex; gap: 6px; margin-bottom: 4px; }
  .gs-rentday { flex: 1; background: #f4efe4; border: 1px solid #d8d1ba; border-radius: 6px; padding: 6px 4px; font-size: 11.5px; font-weight: 600; color: #6f6a5e; }
  .gs-rentday.active { background: var(--green); border-color: var(--green); color: #fff; }
  .gs-rentpicker-total { font-family: var(--font-mono); font-size: 12.5px; color: #6f6a5e; margin-bottom: 10px; }
  .gs-rentpicker-total strong { color: var(--ink); }
  .gs-rentconfirm {
    background: var(--green); color: #fff; border: none; border-radius: 7px;
    padding: 9px 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;
    white-space: nowrap;
  }
  .gs-rentconfirm:disabled { background: #cfc8b4; color: #8c8570; cursor: not-allowed; }

  /* ---------- CART DRAWER ---------- */
  .gs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; animation: gsFade .15s ease; }
  @keyframes gsFade { from { opacity: 0 } to { opacity: 1 } }

  .gs-drawer {
    position: fixed; top: 0; right: 0; height: 100%; width: min(420px, 100%);
    background: var(--paper); color: var(--ink); z-index: 41;
    display: flex; flex-direction: column;
    box-shadow: -12px 0 32px rgba(0,0,0,0.35);
    animation: gsSlide .22s cubic-bezier(.2,.8,.2,1);
  }
  @keyframes gsSlide { from { transform: translateX(100%) } to { transform: translateX(0) } }

  .gs-drawer-head { padding: 20px 22px; border-bottom: 1px dashed #c9c1aa; display: flex; align-items: center; justify-content: space-between; }
  .gs-drawer-head h2 { font-family: var(--font-display); font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .gs-iconbtn { background: transparent; border: none; color: #6f6a5e; padding: 6px; border-radius: 6px; display: flex; }
  .gs-iconbtn:hover { background: #e9e2cf; color: var(--ink); }

  .gs-drawer-body { flex: 1; overflow-y: auto; padding: 10px 22px; }
  .gs-line { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px dashed #d8d1ba; }
  .gs-line img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .gs-line-info { flex: 1; min-width: 0; }
  .gs-line-name { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .gs-rentchip { font-family: var(--font-mono); font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; background: var(--green); color: #fff; padding: 2px 7px; border-radius: 999px; font-weight: 600; }
  .gs-line-price { font-family: var(--font-mono); font-size: 12px; color: #6f6a5e; margin-top: 2px; }
  .gs-qty { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .gs-qtybtn { width: 22px; height: 22px; border-radius: 5px; border: 1px solid #d8d1ba; background: #fff; display: flex; align-items: center; justify-content: center; }
  .gs-qtyval { font-family: var(--font-mono); font-size: 12.5px; min-width: 16px; text-align: center; }
  .gs-linetotal { font-family: var(--font-mono); font-size: 13px; font-weight: 600; white-space: nowrap; }
  .gs-removebtn { color: var(--coral); background: none; border: none; padding: 4px; }

  .gs-drawer-foot { padding: 18px 22px 22px; border-top: 1px dashed #c9c1aa; }
  .gs-totalrow { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 14px; margin-bottom: 4px; color: #6f6a5e; }
  .gs-totalrow.grand { font-size: 17px; font-weight: 700; color: var(--ink); margin-top: 8px; }
  .gs-checkoutbtn {
    width: 100%; margin-top: 14px; background: var(--ink); color: var(--paper); border: none;
    border-radius: 8px; padding: 13px; font-size: 14px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .gs-checkoutbtn:hover { background: #3a362c; }
  .gs-checkoutbtn:disabled { background: #cfc8b4; color: #8c8570; }
  .gs-empty { text-align: center; padding: 60px 10px; color: #8c8570; }

  /* ---------- MODALS (checkout) ---------- */
  .gs-modal {
    position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .gs-modalcard {
    width: 100%; max-width: 380px; background: var(--paper); color: var(--ink); border-radius: 12px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.5); animation: gsPop .18s ease;
  }
  @keyframes gsPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
  .gs-modal-head {
    background: #072E4E; color: #fff; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .gs-modal-head .gs-brandmini { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
  .gs-demo-pill {
    font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; background: var(--coral);
    color: #fff; padding: 3px 7px; border-radius: 999px;
  }
  .gs-modal-body { padding: 20px; }
  .gs-amount { font-family: var(--font-mono); font-size: 28px; font-weight: 700; margin-bottom: 2px; }
  .gs-modal-sub { font-size: 12px; color: #6f6a5e; margin-bottom: 18px; }
  .gs-field { margin-bottom: 12px; }
  .gs-field label { display: block; font-size: 11.5px; color: #6f6a5e; margin-bottom: 5px; font-weight: 500; }
  .gs-field input, .gs-field select, .gs-field textarea {
    width: 100%; border: 1px solid #d8d1ba; background: #fff; border-radius: 7px; padding: 10px 11px;
    font-size: 13.5px; font-family: var(--font-body); color: var(--ink);
  }
  .gs-field input:focus, .gs-field select:focus, .gs-field textarea:focus { outline: 2px solid var(--gold); outline-offset: 1px; border-color: var(--gold); }
  .gs-payline { display: flex; gap: 8px; }
  .gs-payline .gs-field { flex: 1; }
  .gs-upimethod {
    display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 16px;
    background: #f4efe4; border: 1px solid #d8d1ba; border-radius: 8px;
  }
  .gs-upimethod-icon {
    width: 38px; height: 38px; border-radius: 8px; background: #072E4E; color: #fff;
    display: flex; align-items: center; justify-content: center; font-family: var(--font-mono);
    font-size: 10.5px; font-weight: 700; letter-spacing: .02em; flex-shrink: 0;
  }
  .gs-upimethod-title { font-size: 13px; font-weight: 700; color: var(--ink); }
  .gs-upimethod-sub { font-size: 11.5px; color: #8c8570; margin-top: 1px; }
  .gs-paybtn {
    width: 100%; background: #072E4E; color: #fff; border: none; border-radius: 8px; padding: 13px;
    font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;
  }
  .gs-paybtn:disabled { opacity: .7; }
  .gs-lockline { display: flex; align-items: center; gap: 6px; justify-content: center; margin-top: 12px; font-size: 11px; color: #8c8570; }
  .gs-cancel { width: 100%; background: none; border: none; color: #8c8570; font-size: 12.5px; padding: 10px; margin-top: 4px; }

  .gs-success { text-align: center; padding: 8px 4px; }
  .gs-success-icon {
    width: 56px; height: 56px; border-radius: 50%; background: var(--green); color: #fff;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  }
  .gs-success h3 { font-family: var(--font-display); font-size: 22px; margin-bottom: 6px; }
  .gs-receipt { text-align: left; background: #fff; border: 1px dashed #d8d1ba; border-radius: 8px; padding: 14px; margin: 16px 0; font-family: var(--font-mono); font-size: 12px; }
  .gs-receipt-row { display: flex; justify-content: space-between; padding: 3px 0; color: #6f6a5e; }
  .gs-receipt-row.total { color: var(--ink); font-weight: 700; border-top: 1px dashed #d8d1ba; margin-top: 6px; padding-top: 8px; }

  .gs-pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 36px; flex-wrap: wrap; }
  .gs-page-num, .gs-page-arrow {
    min-width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--line);
    background: var(--paper); color: var(--ink); font-family: var(--font-mono); font-size: 12.5px;
    display: flex; align-items: center; justify-content: center; padding: 0 4px;
  }
  .gs-page-num:hover, .gs-page-arrow:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
  .gs-page-num.active { background: var(--gold); border-color: var(--gold); color: var(--gold-ink); font-weight: 700; }
  .gs-page-arrow:disabled { opacity: 0.35; }

  /* ---------- PRODUCT DETAIL / QUICK VIEW MODAL ---------- */
  .gs-detailoverlay {
    position: fixed; inset: 0; z-index: 45; display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .gs-detailcard {
    width: 100%; max-width: 760px; max-height: 88vh; background: var(--paper); color: var(--ink);
    border-radius: 14px; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.5);
    animation: gsPop .18s ease; display: flex; flex-direction: column;
  }
  .gs-detailclose {
    position: absolute; top: 14px; right: 14px; z-index: 2;
    width: 34px; height: 34px; border-radius: 50%; border: none;
    background: rgba(7,46,78,0.75); color: #fff; display: flex; align-items: center; justify-content: center;
  }
  .gs-detailclose:hover { background: rgba(7,46,78,0.92); }
  .gs-detailbody { display: grid; grid-template-columns: 1fr 1fr; overflow-y: auto; }
  .gs-detailimg-wrap { position: relative; background: #ddd6c4; min-height: 320px; }
  .gs-detailimg-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gs-detailimg-noimg { width: 100%; height: 100%; min-height: 320px; display: flex; align-items: center; justify-content: center; color: #a89f88; }
  .gs-detailtag {
    position: absolute; top: 16px; left: 16px;
    background: var(--gold); color: var(--gold-ink); font-family: var(--font-mono); font-weight: 700;
    font-size: 15px; padding: 7px 13px; border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .gs-detailinfo { padding: 30px 28px; display: flex; flex-direction: column; }
  .gs-detailcat { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted-2); margin-bottom: 6px; }
  .gs-detailname { font-family: var(--font-display); font-size: 25px; font-weight: 600; line-height: 1.15; margin-bottom: 10px; }
  .gs-detailsku { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-bottom: 16px; }
  .gs-detaildesc { font-size: 13.5px; color: #6f6a5e; line-height: 1.6; margin-bottom: 20px; }
  .gs-detailprice-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
  .gs-detailprice { font-family: var(--font-mono); font-size: 24px; font-weight: 700; color: var(--ink); }
  .gs-detailprice-alt { font-size: 12.5px; color: var(--green); font-weight: 600; }
  .gs-detailstock { font-family: var(--font-mono); font-size: 12px; color: #6f6a5e; display: flex; align-items: center; margin: 8px 0 20px; }
  .gs-detailactions { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
  .gs-detail-rentpicker-days { display: flex; gap: 8px; margin-bottom: 4px; }

  @media (max-width: 640px) {
    .gs-detailbody { grid-template-columns: 1fr; }
    .gs-detailimg-wrap, .gs-detailimg-noimg { min-height: 240px; }
    .gs-detailinfo { padding: 22px 20px 26px; }
  }

  /* ---------- ADMIN ---------- */
  .gs-admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px; flex-wrap: wrap; gap: 14px; }
  .gs-admin-head h1 { font-family: var(--font-display); font-size: 30px; font-weight: 600; }
  .gs-addproductbtn { background: var(--gold); color: var(--gold-ink); border: none; border-radius: 8px; padding: 11px 18px; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 7px; }
  .gs-logoutbtn { background: var(--panel-2); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 11px 16px; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 7px; }
  .gs-logoutbtn:hover { border-color: var(--coral); color: var(--coral); }

  .gs-tabs { display: flex; gap: 4px; margin-bottom: 22px; border-bottom: 1px solid var(--line); }
  .gs-tab { background: none; border: none; color: var(--muted); padding: 10px 4px; margin-right: 22px; font-size: 13.5px; font-weight: 500; border-bottom: 2px solid transparent; }
  .gs-tab.active { color: var(--gold); border-bottom-color: var(--gold); }

  .gs-table-wrap { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .gs-row { display: grid; grid-template-columns: 52px 1.6fr 0.9fr 0.7fr 0.9fr 84px; align-items: center; gap: 14px; padding: 12px 18px; border-bottom: 1px solid var(--line); }
  .gs-row.head { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted-2); padding-top: 14px; padding-bottom: 14px; }
  .gs-row:last-child { border-bottom: none; }
  .gs-row img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
  .gs-row-name { font-weight: 600; font-size: 13.5px; }
  .gs-row-cat { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
  .gs-row-price { font-family: var(--font-mono); font-size: 13px; }
  .gs-row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .gs-iconbtn2 { background: var(--panel-2); border: 1px solid var(--line); color: var(--ink); padding: 7px; border-radius: 6px; display: flex; }
  .gs-iconbtn2:hover { border-color: var(--gold); color: var(--gold); }
  .gs-iconbtn2.danger:hover { border-color: var(--coral); color: var(--coral); }

  .gs-emptystate { padding: 60px 20px; text-align: center; color: var(--muted); }

  .gs-orderrow { }
  .gs-order-summary { font-family: inherit; }
  .gs-order-summary:hover { background: var(--panel) !important; }
  .gs-orderdetail {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 18px;
    padding: 16px 18px 20px; background: var(--panel); border-bottom: 1px solid var(--line);
  }
  .gs-orderdetail-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted-2); margin-bottom: 6px; }
  .gs-orderdetail-line { font-size: 12.5px; color: var(--ink); line-height: 1.5; }
  .gs-orderdetail-line strong { font-weight: 700; }

  /* Product form slide-over */
  .gs-formpanel {
    position: fixed; top: 0; right: 0; height: 100%; width: min(440px, 100%);
    background: var(--panel); border-left: 1px solid var(--line); z-index: 41; overflow-y: auto;
    animation: gsSlide .2s cubic-bezier(.2,.8,.2,1);
  }
  .gs-formpanel-head { padding: 20px 24px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--panel); }
  .gs-formpanel-head h2 { font-family: var(--font-display); font-size: 19px; }
  .gs-formpanel-body { padding: 20px 24px 40px; }
  .gs-formpanel .gs-field label { color: var(--muted); }
  .gs-formpanel .gs-field input, .gs-formpanel .gs-field select, .gs-formpanel .gs-field textarea {
    background: var(--paper); border-color: var(--line); color: var(--ink);
  }
  .gs-formrow { display: flex; gap: 10px; }
  .gs-formrow .gs-field { flex: 1; }
  .gs-savebtn { width: 100%; background: var(--gold); color: var(--gold-ink); border: none; border-radius: 8px; padding: 12px; font-weight: 700; font-size: 13.5px; margin-top: 8px; }
  .gs-deletebtn { width: 100%; background: none; border: 1px solid var(--coral); color: var(--coral); border-radius: 8px; padding: 11px; font-weight: 600; font-size: 13px; margin-top: 10px; }

  .gs-imageupload { display: flex; gap: 12px; align-items: center; }
  .gs-imageupload-preview {
    width: 68px; height: 68px; border-radius: 8px; background: var(--paper); border: 1px solid var(--line);
    display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
  }
  .gs-imageupload-preview img { width: 100%; height: 100%; object-fit: cover; }
  .gs-imageupload-controls { display: flex; flex-direction: column; gap: 8px; }
  .gs-uploadbtn {
    display: inline-flex; align-items: center; gap: 7px; background: var(--paper); color: var(--ink);
    border: 1px solid var(--line); border-radius: 7px; padding: 8px 13px; font-size: 12.5px; font-weight: 600;
    cursor: pointer; width: fit-content;
  }
  .gs-uploadbtn:hover { border-color: var(--gold); color: var(--gold); }
  .gs-removeimgbtn {
    display: inline-flex; align-items: center; gap: 6px; background: none; border: none;
    color: var(--coral); font-size: 12px; padding: 0; width: fit-content;
  }
  .gs-imageupload-hint { font-size: 11px; color: var(--muted); margin-top: 8px; line-height: 1.4; }

  .gs-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 60;
    background: var(--ink); color: var(--paper); padding: 12px 18px; border-radius: 8px; font-size: 13px;
    display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 24px rgba(0,0,0,0.4);
  }

  .gs-stats-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
  }
  .gs-statcard {
    background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 16px;
  }
  .gs-statcard.highlight { border-color: var(--green); background: #eef8f0; }
  .gs-statcard-label { font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 6px; }
  .gs-statcard-value { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: var(--ink); }
  .gs-analytics-hint {
    display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; padding: 11px 13px;
    background: #fdf1e0; border: 1px solid rgba(168,106,16,0.25); border-radius: 8px;
    font-size: 12px; color: #a86a10; line-height: 1.5;
  }

  .gs-footer {
    margin-top: 40px; background: #072E4E; border-top: 1px solid rgba(255,255,255,0.12);
  }
  .gs-footer-inner {
      max-width: 1160px; margin: 0 auto; padding: 36px 24px 24px;
      display: flex; flex-wrap: wrap; gap: 32px; justify-content: space-between;
      align-items: flex-start;
    }
  .gs-footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 180px; }
  .gs-footer-col-title {
    font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.5); margin-bottom: 2px;
  }
  .gs-footer-brand { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: #FFFFFF; }
  .gs-footer-tagline { font-size: 12.5px; color: rgba(255,255,255,0.7); max-width: 220px; }
  .gs-footer-contact { gap: 9px; }
  .gs-footer-link {
    display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.85);
    text-decoration: none; width: fit-content;
  }
  .gs-footer-link:hover { color: var(--gold); }
  .gs-footer-qr { align-items: flex-start; }
  .gs-footer-qr img {
    width: 96px; height: 96px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: #fff; padding: 4px;
  }
  .gs-footer-qr span { font-size: 11px; color: rgba(255,255,255,0.6); }
  .gs-footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.12); padding: 14px 24px; text-align: center;
    font-size: 11px; color: rgba(255,255,255,0.5); font-family: var(--font-mono);
  }

  .gs-bottombar { display: none; }

  .gs-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: var(--muted); flex-direction: column; gap: 10px; }
  .gs-spin { animation: gsSpin 1s linear infinite; }
  @keyframes gsSpin { to { transform: rotate(360deg) } }

  @media (max-width: 640px) {
    .gs-header { padding: 14px 0; }
    .gs-header-inner { padding: 0 16px; }
    .gs-brand-name { font-size: 17px; }
    .gs-main { padding: 26px 16px 100px; }
    .gs-hero h1 { font-size: 28px; }
    .gs-hero-track { min-height: 360px; }
    .gs-hero-slide-content { padding: 22px 20px 20px; }
    .gs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .gs-catcard { width: 64px; }
    .gs-catcard-ring { width: 58px; height: 58px; }
    .gs-catcard-label { font-size: 10px; max-width: 64px; }
    .gs-card-name { font-size: 15px; }
    .gs-card-desc { display: none; }
    .gs-tag { font-size: 11.5px; padding: 5px 8px 5px 11px; }
    .gs-cartbtn { display: none; }
    .gs-row { grid-template-columns: 40px 1fr 70px; }
    .gs-row .gs-row-cat, .gs-row .gs-row-stock { display: none; }
    .gs-footer { margin-bottom: 58px; }
    .gs-footer-inner { flex-direction: column; align-items: center; text-align: center; gap: 24px; padding: 28px 20px 20px; }
    .gs-footer-col { align-items: center; }
    .gs-footer-tagline { max-width: none; }
    .gs-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gs-bottombar {
      display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
      background: var(--paper); border-top: 1px solid var(--line);
      padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
      box-shadow: 0 -8px 24px rgba(0,0,0,0.10);
    }
    .gs-bottombar-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: none; border: none; color: var(--muted); padding: 6px 4px; position: relative;
      font-size: 10.5px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .04em;
    }
    .gs-bottombar-btn.active { color: var(--gold); }
    .gs-bottombar-badge {
      position: absolute; top: 0; right: 22%; background: var(--coral); color: #fff;
      font-family: var(--font-mono); font-size: 9px; font-weight: 600; width: 15px; height: 15px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }
  }
`;

const LOGO_URI = "https://user23766.na.imgto.link/public/20260820/favicon-192.avif";
const CURRENCY = "₹";

const CATEGORIES = [
  "Bangles",
  "Anti-Tarnish Chains",
  "Anti-Tarnish Bracelets",
  "Hair Accessories",
  "Designer Jewelry",
  "Temple Jewels",
  "Chokers",
  "Ear Chain",
];
// The demo catalog now lives server-side (store/seed_data.py) as the
// single source of truth for both the initial migration and the admin
// panel's "Reset catalog" button.

function inr(n) {
  return CURRENCY + Number(n || 0).toLocaleString("en-IN");
}
function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

// Resizes and re-encodes an uploaded image before it's stored, since uploaded
// photos live inline (as data URIs) inside the shared product record rather
// than on a real file server — keeping them small matters here.
function fileToCompressedDataUrl(file, maxDim = 640, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function emptyProduct() {
  return { id: "", name: "", category: CATEGORIES[0], price: "", stock: "", sku: "", image: "", description: "", listingType: "sale", rentPrice: "", costPrice: "" };
}

// /admin is its own real URL (not just an in-page toggle): typing it
// directly, refreshing on it, or bookmarking it all land you back in the
// admin view. Django's catch-all route already serves the same
// index.html for any non-/api, non-/django-admin path, so this only
// needs client-side history handling — no backend routing changes.
function viewForPath(pathname) {
  return pathname.replace(/\/+$/, "") === "/admin" ? "admin" : "store";
}

export default function GeneralStoreApp() {
  const [view, setViewState] = useState(() => viewForPath(window.location.pathname));

  // Wraps setView so every view change also updates the URL/history, and
  // keeps the two in sync when the user hits back/forward.
  const setView = useCallback((next) => {
    setViewState(next);
    const path = next === "admin" ? "/admin" : "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ view: next }, "", path);
    }
  }, []);

  useEffect(() => {
    function onPopState() {
      setViewState(viewForPath(window.location.pathname));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState(null); // null | 'address' | 'payment' | 'success'
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [adminTab, setAdminTab] = useState("products");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({
    name: "", email: "", phone: "",
    address1: "", address2: "", city: "", state: "", pincode: "",
  });
  const [paying, setPaying] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState(undefined); // undefined = loading, null = not configured
  const [pendingOrder, setPendingOrder] = useState(null); // order created for the current payment attempt, so retries reuse it
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Load the catalog from the Django API on mount.
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (e) {
        showToast("Couldn't load products — is the backend running?");
        setProducts([]);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore an admin session (if any) so a page refresh doesn't log the
  // admin out. The token itself is only valid for 24h server-side.
  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (saved) {
      setAdminToken(saved);
      setIsAdmin(true);
    } else if (viewForPath(window.location.pathname) === "admin") {
      // Landed on /admin directly (bookmark, refresh, typed URL) without a
      // session — prompt for the password instead of a dead-end screen.
      setLoginOpen(true);
    }
  }, []);

  // Orders contain customer PII, so they're only fetched once logged in
  // as admin (the API also enforces this server-side).
  useEffect(() => {
    if (!isAdmin || !adminToken) return;
    (async () => {
      try {
        const data = await api.getOrders(adminToken);
        setOrders(data);
      } catch (e) {
        showToast("Couldn't load orders");
      }
    })();
  }, [isAdmin, adminToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartItems = useMemo(() => {
    if (!products) return [];
    return Object.entries(cart)
      .map(([cartKey, entry]) => {
        const product = products.find((p) => p.id === entry.productId);
        if (!product) return null;
        const unitPrice = entry.mode === "rent" ? Number(product.rentPrice || 0) * entry.days : Number(product.price);
        return { ...product, cartKey, mode: entry.mode, days: entry.days, qty: entry.qty, unitPrice };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  function cartQtyForProduct(productId) {
    return Object.values(cart)
      .filter((e) => e.productId === productId)
      .reduce((sum, e) => sum + e.qty, 0);
  }

  function addToCart(product, opts = { mode: "sale" }) {
    const mode = opts.mode || "sale";
    const days = mode === "rent" ? opts.days || 3 : undefined;
    const cartKey = mode === "rent" ? `${product.id}::rent::${days}` : product.id;
    const already = cartQtyForProduct(product.id);
    if (product.stock <= already) {
      showToast(`Only ${product.stock} left in stock`);
      return;
    }
    setCart((c) => ({
      ...c,
      [cartKey]: {
        productId: product.id,
        mode,
        days,
        qty: (c[cartKey]?.qty || 0) + 1,
      },
    }));
  }
  function changeQty(cartKey, delta) {
    setCart((c) => {
      const entry = c[cartKey];
      if (!entry) return c;
      const product = products.find((p) => p.id === entry.productId);
      const next = entry.qty + delta;
      if (next <= 0) {
        const { [cartKey]: _, ...rest } = c;
        return rest;
      }
      const otherQty = cartQtyForProduct(entry.productId) - entry.qty;
      if (product && next + otherQty > product.stock) return c;
      return { ...c, [cartKey]: { ...entry, qty: next } };
    });
  }
  function removeFromCart(cartKey) {
    setCart((c) => {
      const { [cartKey]: _, ...rest } = c;
      return rest;
    });
  }

  function openCheckout() {
    if (cartItems.length === 0) return;
    setCartOpen(false);
    setCheckoutStage("address");
  }

  function submitAddress(e) {
    e.preventDefault();
    setCheckoutStage("payment");
  }

  // Razorpay's public key loads once, the first time checkout reaches the
  // payment step — undefined means "still loading", null means it isn't
  // configured yet (set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in
  // backend/.env).
  useEffect(() => {
    if (checkoutStage !== "payment" || razorpayConfig !== undefined) return;
    api.getRazorpayConfig().then(setRazorpayConfig).catch(() => setRazorpayConfig(null));
  }, [checkoutStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opens Razorpay's Checkout modal against an already-created order, and
  // verifies the payment server-side once the customer completes it.
  function openRazorpayCheckout(order) {
    if (!window.Razorpay) {
      showToast("Payment couldn't load — check your connection and try again");
      setPaying(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: order.razorpayKeyId || razorpayConfig?.keyId,
      order_id: order.razorpayOrderId,
      amount: Math.round(order.total * 100),
      currency: "INR",
      name: "Seyon Touch",
      description: `Order ${order.id}`,
      prefill: { name: payForm.name, email: payForm.email, contact: payForm.phone },
      theme: { color: "#072E4E" },
      handler: async (response) => {
        setPaying(true);
        try {
          const verified = await api.verifyRazorpayPayment({
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          try {
            setProducts(await api.getProducts());
          } catch (e2) {
            /* stock numbers may be briefly stale; not worth blocking success on */
          }
          setOrders((prev) => [verified, ...prev.filter((o) => o.id !== verified.id)]);
          setLastOrder(verified);
          setCart({});
          setPendingOrder(null);
          setCheckoutStage("success");
        } catch (err) {
          showToast(err.message || "Couldn't confirm payment — please try again");
        }
        setPaying(false);
      },
      modal: {
        ondismiss: () => setPaying(false),
      },
    });
    rzp.on("payment.failed", () => {
      showToast("Payment failed — please try again");
      setPaying(false);
    });
    rzp.open();
  }

  async function payNow() {
    setPaying(true);
    // Reuse the order already created for this checkout attempt (if the
    // customer closed the Razorpay modal without paying and clicked "Pay"
    // again) instead of creating a duplicate order and double-reserving
    // stock.
    if (pendingOrder) {
      openRazorpayCheckout(pendingOrder);
      return;
    }
    const orderId = "GS" + Date.now().toString().slice(-8);
    const orderPayload = {
      id: orderId,
      customer: payForm,
      items: cartItems.map((i) => ({
        id: i.id, name: i.name, price: i.unitPrice, qty: i.qty, mode: i.mode, days: i.days, sku: i.sku, image: i.image,
      })),
      total: subtotal + SHIPPING_FEE,
    };
    try {
      const order = await api.createOrder(orderPayload);
      setPendingOrder(order);
      openRazorpayCheckout(order);
    } catch (err) {
      showToast(err.message || "Couldn't start payment — please try again");
      setPaying(false);
    }
  }

  function closeCheckout() {
    setCheckoutStage(null);
    setPayForm({
      name: "", email: "", phone: "",
      address1: "", address2: "", city: "", state: "", pincode: "",
    });
    setPendingOrder(null);
  }

  function backToAddress() {
    setCheckoutStage("address");
  }

  function requestAdminAccess() {
    setView("admin");
    if (!isAdmin) {
      setLoginError("");
      setLoginOpen(true);
    }
  }

  function cancelAdminLogin() {
    setLoginOpen(false);
    if (!isAdmin) setView("store");
  }

  async function submitAdminLogin(username, password) {
    setLoginError("");
    try {
      const { token } = await api.adminLogin(username, password);
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      setAdminToken(token);
      setIsAdmin(true);
      setLoginOpen(false);
      setLoginError("");
      setView("admin");
    } catch (e) {
      setLoginError(e.message || "Invalid username or password");
    }
  }

  function adminLogout() {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setAdminToken(null);
    setIsAdmin(false);
    setView("store");
    showToast("Logged out of admin");
  }

  async function markOrderPaid(orderId) {
    try {
      const updated = await api.markOrderPaid(orderId, adminToken);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast("Order marked as paid");
    } catch (e) {
      showToast(e.message || "Couldn't update order");
    }
  }

  async function deleteOrder(orderId) {
    const ok = window.confirm(`Delete order ${orderId}? This can't be undone.`);
    if (!ok) return;
    try {
      await api.deleteOrder(orderId, adminToken);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast("Order deleted");
    } catch (e) {
      showToast(e.message || "Couldn't delete order");
    }
  }

  // Analytics is fetched lazily, the first time the admin opens that tab
  // (and again any time an order changes underneath it — mark-paid or
  // delete — so the numbers don't go stale).
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await api.getAnalytics(adminToken));
    } catch (e) {
      showToast(e.message || "Couldn't load analytics");
    }
    setAnalyticsLoading(false);
  }
  useEffect(() => {
    if (isAdmin && adminTab === "analytics") loadAnalytics();
  }, [isAdmin, adminTab, orders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function resetCatalog() {
    const ok = window.confirm(
      "This will replace every current product with the demo catalog (including the jewelry rental items). This can't be undone. Continue?"
    );
    if (!ok) return;
    try {
      const data = await api.resetCatalog(adminToken);
      setProducts(data);
      showToast("Catalog reset to demo defaults");
    } catch (e) {
      showToast(e.message || "Couldn't reset catalog");
    }
  }

  function openAddForm() {
    setEditingProduct(emptyProduct());
    setFormOpen(true);
  }
  function openEditForm(product) {
    setEditingProduct({ ...product });
    setFormOpen(true);
  }
  async function saveProduct(p) {
    setSaving(true);
    const clean = {
      ...p,
      id: p.id || uid("p"),
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      listingType: p.listingType || "sale",
      rentPrice: Number(p.rentPrice) || 0,
      costPrice: Number(p.costPrice) || 0,
      sku: p.sku || "GS-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      image: p.image || `https://picsum.photos/seed/${encodeURIComponent(p.name || uid())}/500/500`,
    };
    const exists = products.some((x) => x.id === clean.id);
    try {
      const saved = exists
        ? await api.updateProduct(clean.id, clean, adminToken)
        : await api.createProduct(clean, adminToken);
      setProducts((prev) =>
        exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
      );
      showToast(exists ? "Product updated" : "Product added");
      setFormOpen(false);
    } catch (e) {
      showToast(e.message || "Couldn't save — please try again");
    }
    setSaving(false);
  }
  async function deleteProduct(id) {
    try {
      await api.deleteProduct(id, adminToken);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted");
      setFormOpen(false);
    } catch (e) {
      showToast(e.message || "Couldn't delete — please try again");
    }
  }

  if (!products) {
    return (
      <div className="gs-root">
        <style>{TOKENS}</style>
        <div className="gs-loading">
          <Loader2 size={26} className="gs-spin" />
          <span className="gs-eyebrow">Loading store…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gs-root">
      <style>{TOKENS}</style>

      <header className="gs-header">
        <div className="gs-header-inner">
          <div className="gs-brand">
            <img src={LOGO_URI} alt="Seyon Touch" className="gs-brand-logo" />
            <div className="gs-brand-name">Seyon Touch</div>
          </div>
          <div className="gs-nav">
            <button className={`gs-navbtn ${view === "store" ? "active" : ""}`} onClick={() => setView("store")}>
              <StoreIcon size={14} /> Shop
            </button>
            {view === "store" && (
              <button className="gs-cartbtn" onClick={() => setCartOpen(true)}>
                <ShoppingBag size={15} /> Cart
                {cartCount > 0 && <span className="gs-badge">{cartCount}</span>}
              </button>
            )}
            {isAdmin && (
              <button
                className={`gs-adminicon ${view === "admin" ? "active" : ""}`}
                onClick={requestAdminAccess}
                title="Admin"
                aria-label="Admin"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="gs-main">
        {view === "store" ? (
          <StoreView products={products} onAdd={addToCart} />
        ) : isAdmin ? (
          <AdminView
            products={products}
            orders={orders}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            onAdd={openAddForm}
            onEdit={openEditForm}
            onLogout={adminLogout}
            onReset={resetCatalog}
            onMarkPaid={markOrderPaid}
            onDeleteOrder={deleteOrder}
            analytics={analytics}
            analyticsLoading={analyticsLoading}
          />
        ) : (
          <div className="gs-emptystate">
            <Lock size={26} style={{ opacity: 0.4, marginBottom: 10 }} />
            <div>Admin access required.</div>
            <button
              className="gs-btn gs-btn-primary"
              style={{ marginTop: 14 }}
              onClick={() => { setLoginError(""); setLoginOpen(true); }}
            >
              Log in
            </button>
          </div>
        )}
      </main>

      {view === "store" && <StoreFooter />}

      {cartOpen && (
        <>
          <div className="gs-overlay" onClick={() => setCartOpen(false)} />
          <CartDrawer
            items={cartItems}
            subtotal={subtotal}
            onClose={() => setCartOpen(false)}
            onChangeQty={changeQty}
            onRemove={removeFromCart}
            onCheckout={openCheckout}
          />
        </>
      )}

      {checkoutStage && (
        <>
          <div className="gs-overlay" onClick={(checkoutStage === "address" || checkoutStage === "payment") ? closeCheckout : undefined} />
          <div className="gs-modal">
            {checkoutStage === "address" && (
              <AddressForm
                payForm={payForm}
                setPayForm={setPayForm}
                onSubmit={submitAddress}
                onCancel={closeCheckout}
              />
            )}
            {checkoutStage === "payment" && razorpayConfig === undefined && (
              <div className="gs-modalcard">
                <div className="gs-modal-body" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Loader2 size={26} className="gs-spin" />
                </div>
              </div>
            )}
            {checkoutStage === "payment" && razorpayConfig && (
              <RazorpayPaymentCard
                total={subtotal + SHIPPING_FEE}
                onPay={payNow}
                paying={paying}
                onBack={backToAddress}
              />
            )}
            {checkoutStage === "payment" && razorpayConfig === null && (
              <PaymentUnavailableCard onBack={backToAddress} />
            )}
            {checkoutStage === "success" && <SuccessCard order={lastOrder} onDone={closeCheckout} />}
          </div>
        </>
      )}

      
      {loginOpen && (
        <>
          <div className="gs-overlay" onClick={cancelAdminLogin} />
          <div className="gs-modal">
            <AdminLoginForm
              error={loginError}
              onSubmit={submitAdminLogin}
              onCancel={cancelAdminLogin}
            />
          </div>
        </>
      )}

      {formOpen && (
        <>
          <div className="gs-overlay" onClick={() => setFormOpen(false)} />
          <ProductForm
            product={editingProduct}
            saving={saving}
            onCancel={() => setFormOpen(false)}
            onSave={saveProduct}
            onDelete={deleteProduct}
          />
        </>
      )}

      {toast && (
        <div className="gs-toast">
          <AlertCircle size={15} />
          {toast}
        </div>
      )}

      <nav className="gs-bottombar">
        <button className={`gs-bottombar-btn ${view === "store" ? "active" : ""}`} onClick={() => setView("store")}>
          <StoreIcon size={19} />
          Shop
        </button>
        <button className="gs-bottombar-btn" onClick={() => setCartOpen(true)} style={{ position: "relative" }}>
          <ShoppingBag size={19} />
          Cart
          {cartCount > 0 && <span className="gs-bottombar-badge">{cartCount}</span>}
        </button>
        {isAdmin && (
          <button className={`gs-bottombar-btn ${view === "admin" ? "active" : ""}`} onClick={requestAdminAccess}>
            <Settings size={19} />
            Admin
          </button>
        )}
      </nav>
    </div>
  );
}

/* ---------------- STORE VIEW ---------------- */
// Hero banners point at real, hosted photos. Each entry is just an image
// URL — swap any of these to change what shows on that slide. Whatever
// size/aspect ratio the photo is, CSS `background-size: cover` on
// .gs-hero-slide crops it to fill the banner, so any resolution works.
const HERO_SLIDES = [
  {
    eyebrow: "Shop the collection",
    title: "Small, well-made things.",
    text: "Every item is stocked, priced, and tagged by hand from the admin ledger — add something to your basket to see checkout in action.",
    bg: 'url("https://user23766.na.imgto.link/public/20260814/dsc-3528.avif")',
  },
  {
    eyebrow: "Just landed",
    title: "Fresh off the shelf.",
    text: "New pieces are added to the ledger regularly — check back often to see what's new in stock.",
    bg: 'url("https://user23766.na.imgto.link/public/20260815/dsc-3279-1.avif")',
  },
  {
    eyebrow: "Handpicked quality",
    title: "Each piece, checked twice.",
    text: "Every product is inspected before it's listed, so what you see in the shop is exactly what arrives.",
    bg: 'url("https://user23766.na.imgto.link/public/20260816/dsc-3415-1.avif")',
  },
  {
    eyebrow: "Loyalty pays off",
    title: "Shop more, save more.",
    text: "Regulars get first look at new arrivals and seasonal restocks before anyone else.",
    bg: 'url("https://user23766.na.imgto.link/public/20260814/chatgpt-image-aug-14-2026-04-09-12-pm.avif")',
  },
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  function go(i) {
    setIndex((i + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  return (
    <div className="gs-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="gs-hero-track">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`gs-hero-slide ${i === index ? "active" : ""}`}
            aria-hidden={i !== index}
            style={{ backgroundImage: slide.bg }}
          >
            <div className="gs-hero-slide-scrim" />
            <div className="gs-hero-slide-content">
              <div className="gs-eyebrow">{slide.eyebrow}</div>
              <h1>{slide.title}</h1>
              <p>{slide.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="gs-hero-controls">
        <button className="gs-hero-arrow" onClick={() => go(index - 1)} aria-label="Previous slide">
          <ChevronLeft size={16} />
        </button>
        <div className="gs-hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`gs-hero-dot ${i === index ? "active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button className="gs-hero-arrow" onClick={() => go(index + 1)} aria-label="Next slide">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Fixed photo per category, used for the category picker tiles on the home
// page. Files live in frontend/public/categories/ — swap any file there to
// change that tile's photo. If a category has no entry here, or the file
// fails to load (e.g. it hasn't been added yet), the tile falls back to a
// photo from that category's own products, and finally to a plain icon.
//
// NOTE: CategoryTile below is self-healing about this — it tries each
// candidate image in order and only shows the icon once everything 404s,
// so a missing file here never silently "wins" over a real product photo.
const CATEGORY_IMAGES = {
  "Ear Chain": "/categories/ear-chain.jpg",
  "Chokers": "/categories/chokers.jpg",
  "Temple Jewels": "/categories/temple-jewels.jpg",
  "Designer Jewelry": "/categories/designer-jewelry.jpg",
  "Hair Accessories": "/categories/hair-accessories.jpg",
  "Anti-Tarnish Bracelets": "/categories/anti-tarnish-bracelets.jpg",
  "Anti-Tarnish Chains": "/categories/anti-tarnish-chains.jpg",
  "Bangles": "/categories/bangles.jpg",
};

// `sources` is an ordered list of image URLs to try for this tile (e.g. the
// curated /categories/*.jpg file first, then a fallback product photo).
// If one fails to load, it moves on to the next; once the list is
// exhausted it falls back to the generic package icon instead of just
// giving up on the first 404.
function CategoryTile({ label, sources, active, onClick }) {
  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  // Reset to the first candidate whenever the candidate list itself changes
  // (e.g. switching between Buy/Rent tabs changes which product photo is
  // available as a fallback).
  useEffect(() => {
    setIdx(0);
  }, [sources.join("|")]);

  return (
    <button className={`gs-catcard ${active ? "active" : ""}`} onClick={onClick}>
      <div className="gs-catcard-ring">
        <div className="gs-catcard-img">
          {src ? (
            <img
              key={src}
              src={src}
              alt=""
              onError={() => setIdx((i) => i + 1)}
            />
          ) : (
            <Package size={22} />
          )}
        </div>
      </div>
      <span className="gs-catcard-label">{label}</span>
    </button>
  );
}

function StoreView({ products, onAdd }) {
  const PAGE_SIZE = 12;
  const [shopTab, setShopTab] = useState("buy");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  // Product currently open in the quick-view / detail modal, or null when closed.
  const [previewProduct, setPreviewProduct] = useState(null);

  const rentableCount = products.filter((p) => p.listingType === "rent" || p.listingType === "both").length;
  const modeFiltered = products.filter((p) =>
    shopTab === "rent"
      ? p.listingType === "rent" || p.listingType === "both"
      : (p.listingType || "sale") !== "rent"
  );
  const categoriesInTab = Array.from(new Set(modeFiltered.map((p) => p.category))).filter(Boolean);
  const filtered = category === "All" ? modeFiltered : modeFiltered.filter((p) => p.category === category);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
    setCategory("All");
  }, [shopTab]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPage(p) {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <HeroCarousel />

      <div className="gs-shoptabs">
        <button className={`gs-shoptab ${shopTab === "buy" ? "active" : ""}`} onClick={() => setShopTab("buy")}>
          <ShoppingBag size={15} /> Buy
        </button>
        {rentableCount > 0 && (
          <button className={`gs-shoptab ${shopTab === "rent" ? "active" : ""}`} onClick={() => setShopTab("rent")}>
            <CalendarDays size={15} /> Rent
          </button>
        )}
      </div>

      {categoriesInTab.length > 1 && (
        <div className="gs-catchips">
          <CategoryTile
            label="All"
            sources={[]}
            active={category === "All"}
            onClick={() => { setCategory("All"); setPage(1); }}
          />
          {categoriesInTab.map((c) => {
            // Try the curated category photo first, then fall back to a
            // real product photo from this category — either can 404
            // independently and CategoryTile will move on to the next one.
            const candidates = [
              CATEGORY_IMAGES[c],
              modeFiltered.find((p) => p.category === c)?.image,
            ].filter(Boolean);
            return (
              <CategoryTile
                key={c}
                label={c}
                sources={candidates}
                active={category === c}
                onClick={() => { setCategory(c); setPage(1); }}
              />
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="gs-emptystate">
          {shopTab === "rent" ? "No rental items yet. Add some from the Admin tab." : "No products yet. Add some from the Admin tab."}
        </div>
      ) : (
        <>
          <div className="gs-grid">
            {pageProducts.map((p) => (
              <ProductCard
                key={p.id + "-" + shopTab}
                product={p}
                onAdd={onAdd}
                mode={shopTab}
                onPreview={() => setPreviewProduct(p)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="gs-pagination">
              <button className="gs-page-arrow" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`gs-page-num ${p === page ? "active" : ""}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="gs-page-arrow" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {previewProduct && (
        <>
          <div className="gs-overlay" onClick={() => setPreviewProduct(null)} />
          <ProductDetailModal
            product={previewProduct}
            initialMode={shopTab === "rent" ? "rent" : "sale"}
            onAdd={onAdd}
            onClose={() => setPreviewProduct(null)}
          />
        </>
      )}
    </>
  );
}

const RENT_DURATIONS = [1, 3, 7];

function ProductCard({ product, onAdd, mode, onPreview }) {
  const [imgError, setImgError] = useState(false);
  const [rentDays, setRentDays] = useState(3);
  const outOfStock = product.stock <= 0;
  const isRentMode = mode === "rent";

  function confirmRent() {
    onAdd(product, { mode: "rent", days: rentDays });
  }

  return (
    <div className="gs-card">
      <div
        className="gs-card-img-wrap"
        onClick={onPreview}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPreview(); } }}
      >
        {!imgError ? (
          <img src={product.image} alt={product.name} onError={() => setImgError(true)} />
        ) : (
          <div className="gs-card-noimg"><ImageOff size={28} /></div>
        )}
        <div className="gs-card-img-scrim">
          <div className="gs-card-img-quickview"><Eye size={13} /> Quick view</div>
        </div>
        <div className="gs-tag">
          {isRentMode ? `${inr(product.rentPrice)}/day` : inr(product.price)}
        </div>
        {isRentMode && <div className="gs-rentbadge">Rental</div>}
      </div>
      <div className="gs-card-body">
        <div className="gs-card-cat">{product.category}</div>
        <div className="gs-card-name" onClick={onPreview}>{product.name}</div>
        <div className="gs-card-desc">{product.description}</div>
        {!isRentMode && product.listingType === "both" && (
          <div className="gs-rentnote">or rent from {inr(product.rentPrice)}/day</div>
        )}

        {isRentMode ? (
          <>
            <div className="gs-rentpicker inline">
              <div className="gs-rentpicker-label">Rental length</div>
              <div className="gs-rentpicker-days">
                {RENT_DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={`gs-rentday ${rentDays === d ? "active" : ""}`}
                    onClick={() => setRentDays(d)}
                  >
                    {d} day{d > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>
            <div className="gs-card-foot">
              {outOfStock ? (
                <div className="gs-stock">
                  <span className="gs-stockdot" style={{ background: "#c0392b" }} />
                  Out of stock
                </div>
              ) : <span />}
              <button className="gs-rentconfirm compact" disabled={outOfStock} onClick={confirmRent}>
                <CalendarDays size={13} /> Rent · {inr(product.rentPrice * rentDays)}
              </button>
            </div>
          </>
        ) : (
          <div className="gs-card-foot">
            {outOfStock ? (
              <div className="gs-stock">
                <span className="gs-stockdot" style={{ background: "#c0392b" }} />
                Out of stock
              </div>
            ) : <span />}
            <button className="gs-addbtn" disabled={outOfStock} onClick={() => onAdd(product, { mode: "sale" })}>
              <Plus size={13} /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- PRODUCT DETAIL / QUICK VIEW MODAL ---------------- */
function ProductDetailModal({ product, initialMode, onAdd, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [detailMode, setDetailMode] = useState(
    product.listingType === "rent" ? "rent" : product.listingType === "both" ? initialMode : "sale"
  );
  const [rentDays, setRentDays] = useState(3);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const outOfStock = product.stock <= 0;
  const canRent = product.listingType === "rent" || product.listingType === "both";
  const canSell = (product.listingType || "sale") !== "rent";
  const isRentMode = detailMode === "rent";

  function handleAdd() {
    if (isRentMode) {
      onAdd(product, { mode: "rent", days: rentDays });
    } else {
      onAdd(product, { mode: "sale" });
    }
    onClose();
  }

  return (
    <div className="gs-detailoverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gs-detailcard">
        <button className="gs-detailclose" onClick={onClose} aria-label="Close"><X size={17} /></button>
        <div className="gs-detailbody">
          <div className="gs-detailimg-wrap">
            {!imgError ? (
              <img src={product.image} alt={product.name} onError={() => setImgError(true)} />
            ) : (
              <div className="gs-detailimg-noimg"><ImageOff size={40} /></div>
            )}
            <div className="gs-detailtag">
              {isRentMode ? `${inr(product.rentPrice)}/day` : inr(product.price)}
            </div>
          </div>
          <div className="gs-detailinfo">
            <div className="gs-detailcat">{product.category}</div>
            <div className="gs-detailname">{product.name}</div>
            {product.sku && <div className="gs-detailsku">SKU: {product.sku}</div>}
            <div className="gs-detaildesc">
              {product.description || "No description available for this item yet."}
            </div>

            {canSell && canRent && (
              <div className="gs-shoptabs" style={{ marginBottom: 4 }}>
                <button
                  className={`gs-shoptab ${!isRentMode ? "active" : ""}`}
                  onClick={() => setDetailMode("sale")}
                >
                  <ShoppingBag size={14} /> Buy
                </button>
                <button
                  className={`gs-shoptab ${isRentMode ? "active" : ""}`}
                  onClick={() => setDetailMode("rent")}
                >
                  <CalendarDays size={14} /> Rent
                </button>
              </div>
            )}

            <div className="gs-detailprice-row">
              <div className="gs-detailprice">
                {isRentMode ? `${inr(product.rentPrice)} / day` : inr(product.price)}
              </div>
              {!isRentMode && product.listingType === "both" && (
                <div className="gs-detailprice-alt">or rent from {inr(product.rentPrice)}/day</div>
              )}
            </div>

            {outOfStock && (
              <div className="gs-detailstock">
                <span className="gs-stockdot" style={{ background: "#c0392b" }} />
                Out of stock
              </div>
            )}

            <div className="gs-detailactions">
              {isRentMode && (
                <div className="gs-rentpicker" style={{ padding: 0 }}>
                  <div className="gs-rentpicker-label">Rental length</div>
                  <div className="gs-detail-rentpicker-days">
                    {RENT_DURATIONS.map((d) => (
                      <button
                        key={d}
                        className={`gs-rentday ${rentDays === d ? "active" : ""}`}
                        onClick={() => setRentDays(d)}
                      >
                        {d} day{d > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  <div className="gs-rentpicker-total">
                    Total: <strong>{inr(product.rentPrice * rentDays)}</strong> for {rentDays} day{rentDays > 1 ? "s" : ""}
                  </div>
                </div>
              )}
              <button className="gs-addbtn" style={{ justifyContent: "center", padding: "12px 14px" }} disabled={outOfStock} onClick={handleAdd}>
                <Plus size={14} /> {isRentMode ? `Rent · ${inr(product.rentPrice * rentDays)}` : "Add to basket"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- FOOTER ---------------- */
function StoreFooter() {
  return (
    <footer className="gs-footer">
      <div className="gs-footer-inner">
        <div className="gs-footer-col">
          <div className="gs-footer-brand">Seyon Touch</div>
          <div className="gs-footer-tagline">Designer jewelry, made to be worn.</div>
        </div>

        <div className="gs-footer-col gs-footer-contact">
          <a className="gs-footer-link" href={`tel:+91${STORE_PHONE}`}>
            <Phone size={15} /> +91 {STORE_PHONE}
          </a>
          <a className="gs-footer-link" href={`mailto:${STORE_EMAIL}`}>
            <Mail size={15} /> {STORE_EMAIL}
          </a>
          <a className="gs-footer-link" href={STORE_INSTAGRAM_URL} target="_blank" rel="noreferrer">
            <Instagram size={15} /> @{STORE_INSTAGRAM_HANDLE}
          </a>
        </div>

        <div className="gs-footer-col gs-footer-policies">
          <div className="gs-footer-col-title">Policies</div>
          <a className="gs-footer-link" href="/privacy-policy">Privacy Policy</a>
          <a className="gs-footer-link" href="/terms-and-conditions">Terms & Conditions</a>
          <a className="gs-footer-link" href="/shipping-policy">Shipping & Delivery</a>
          <a className="gs-footer-link" href="/refund-policy">Refund & Exchange</a>
        </div>

        <div className="gs-footer-col gs-footer-qr">
          <img src={instagramQR} alt="Scan to follow Seyon Touch on Instagram" />
          <span>Scan to follow us</span>
        </div>
      </div>
      <div className="gs-footer-bottom">&copy; {new Date().getFullYear()} Seyon Touch. All rights reserved.</div>
    </footer>
  );
}

/* ---------------- CART ---------------- */
function CartDrawer({ items, subtotal, onClose, onChangeQty, onRemove, onCheckout }) {
  return (
    <div className="gs-drawer">
      <div className="gs-drawer-head">
        <h2><ShoppingBag size={18} /> Your basket</h2>
        <button className="gs-iconbtn" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="gs-drawer-body">
        {items.length === 0 ? (
          <div className="gs-empty">
            <ShoppingBag size={30} style={{ opacity: 0.4, marginBottom: 10 }} />
            <div>Your basket is empty</div>
          </div>
        ) : (
          items.map((item) => (
            <div className="gs-line" key={item.cartKey}>
              <img src={item.image} alt="" />
              <div className="gs-line-info">
                <div className="gs-line-name">
                  {item.name}
                  {item.mode === "rent" && <span className="gs-rentchip">{item.days}-day rental</span>}
                </div>
                <div className="gs-line-price">
                  {inr(item.unitPrice)} {item.mode === "rent" ? `for ${item.days} day${item.days > 1 ? "s" : ""}` : "each"}
                </div>
                <div className="gs-qty">
                  <button className="gs-qtybtn" onClick={() => onChangeQty(item.cartKey, -1)}><Minus size={11} /></button>
                  <span className="gs-qtyval">{item.qty}</span>
                  <button className="gs-qtybtn" onClick={() => onChangeQty(item.cartKey, 1)}><Plus size={11} /></button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div className="gs-linetotal">{inr(item.unitPrice * item.qty)}</div>
                <button className="gs-removebtn" onClick={() => onRemove(item.cartKey)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="gs-drawer-foot">
          <div className="gs-totalrow"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="gs-totalrow"><span>Shipping</span><span>{inr(SHIPPING_FEE)}</span></div>
          <div className="gs-totalrow grand"><span>Total</span><span>{inr(subtotal + SHIPPING_FEE)}</span></div>
          <button className="gs-checkoutbtn" onClick={onCheckout}>
            Proceed to Buy
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- CHECKOUT (Razorpay) ---------------- */
function AddressForm({ payForm, setPayForm, onSubmit, onCancel }) {
  function update(field, value) {
    setPayForm({ ...payForm, [field]: value });
  }
  return (
    <div className="gs-modalcard">
      <div className="gs-modal-head">
        <div className="gs-brandmini"><ReceiptText size={14} /> Delivery details</div>
      </div>
      <div className="gs-modal-body">
        <div className="gs-modal-sub" style={{ marginBottom: 16 }}>
          Where should we deliver your order?
        </div>
        <form onSubmit={onSubmit}>
          <div className="gs-field">
            <label>Full name</label>
            <input required value={payForm.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
          </div>
          <div className="gs-payline">
            <div className="gs-field">
              <label>Phone</label>
              <input required value={payForm.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="gs-field">
              <label>Email</label>
              <input required type="email" value={payForm.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <div className="gs-field">
            <label>Address line 1</label>
            <input required value={payForm.address1} onChange={(e) => update("address1", e.target.value)} placeholder="House no., building, street" />
          </div>
          <div className="gs-field">
            <label>Address line 2 (optional)</label>
            <input value={payForm.address2} onChange={(e) => update("address2", e.target.value)} placeholder="Landmark, area" />
          </div>
          <div className="gs-payline">
            <div className="gs-field">
              <label>City</label>
              <input required value={payForm.city} onChange={(e) => update("city", e.target.value)} placeholder="Bengaluru" />
            </div>
            <div className="gs-field">
              <label>State</label>
              <input required value={payForm.state} onChange={(e) => update("state", e.target.value)} placeholder="Karnataka" />
            </div>
          </div>
          <div className="gs-field">
            <label>Pincode</label>
            <input required maxLength={6} value={payForm.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="560001" />
          </div>
          <button className="gs-paybtn" type="submit">Continue to Payment</button>
          <button type="button" className="gs-cancel" onClick={onCancel}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

function RazorpayPaymentCard({ total, onPay, paying, onBack }) {
  return (
    <div className="gs-modalcard">
      <div className="gs-modal-head">
        <div className="gs-brandmini"><Lock size={14} /> Payment</div>
      </div>
      <div className="gs-modal-body">
        <div className="gs-amount">{inr(total)}</div>
        <div className="gs-modal-sub">Seyon Touch &middot; Order payment</div>

        <div className="gs-upimethod" style={{ marginTop: 16 }}>
          <div className="gs-upimethod-icon">₹</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="gs-upimethod-title">UPI, cards, netbanking &amp; wallets</div>
            <div className="gs-upimethod-sub">Secured by Razorpay</div>
          </div>
        </div>

        <button className="gs-paybtn" type="button" onClick={onPay} disabled={paying}>
          {paying ? "Opening payment…" : `Pay ${inr(total)}`}
        </button>
        <button type="button" className="gs-cancel" onClick={onBack} disabled={paying}>
          Back to delivery details
        </button>
        <div className="gs-lockline"><Lock size={11} /> Your payment is processed securely by Razorpay — we never see your card or bank details</div>
      </div>
    </div>
  );
}

function PaymentUnavailableCard({ onBack }) {
  return (
    <div className="gs-modalcard">
      <div className="gs-modal-head">
        <div className="gs-brandmini"><Lock size={14} /> Payment unavailable</div>
      </div>
      <div className="gs-modal-body">
        <div className="gs-modal-sub" style={{ marginTop: 4, marginBottom: 20 }}>
          Online payment isn't set up yet — the store owner needs to add their
          Razorpay API keys in the backend settings before checkout can accept payment.
        </div>
        <button type="button" className="gs-cancel" onClick={onBack}>
          Back to delivery details
        </button>
      </div>
    </div>
  );
}

function AdminLoginForm({ error, onSubmit, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    await onSubmit(username.trim(), password);
    setSubmitting(false);
  }

  return (
    <div className="gs-modalcard">
      <div className="gs-modal-head">
        <div className="gs-brandmini"><Lock size={14} /> Admin login</div>
      </div>
      <div className="gs-modal-body">
        <form onSubmit={handleSubmit}>
          <div className="gs-field">
            <label>Username</label>
            <input
              autoFocus
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
            />
          </div>
          <div className="gs-field">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          {error && (
            <div style={{ color: "var(--coral)", fontSize: 12.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <button className="gs-paybtn" type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
          <button type="button" className="gs-cancel" onClick={onCancel}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

function SuccessCard({ order, onDone }) {
  if (!order) return null;
  const pending = order.status === "pending";
  return (
    <div className="gs-modalcard">
      <div className="gs-modal-body gs-success">
        <div className="gs-success-icon"><Check size={26} /></div>
        <h3>{pending ? "Order placed" : "Payment successful"}</h3>
        <div style={{ fontSize: 12.5, color: "#6f6a5e" }}>
          Order {order.id}{order.paymentId ? ` · Payment ${order.paymentId}` : ""}
        </div>
        {pending && (
          <div className="gs-modal-sub" style={{ marginTop: 4, marginBottom: 4 }}>
            We'll confirm your payment shortly and start preparing your order.
          </div>
        )}
        <div className="gs-receipt">
          {order.items.map((i) => (
            <div className="gs-receipt-row" key={i.id}>
              <span>{i.name} × {i.qty}</span>
              <span>{inr(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="gs-receipt-row total"><span>{pending ? "Total" : "Total paid"}</span><span>{inr(order.total)}</span></div>
        </div>
        <button className="gs-checkoutbtn" style={{ marginTop: 0 }} onClick={onDone}>Continue shopping</button>
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */
function AdminView({ products, orders, adminTab, setAdminTab, onAdd, onEdit, onLogout, onReset, onMarkPaid, onDeleteOrder, analytics, analyticsLoading }) {
  const [expandedOrder, setExpandedOrder] = useState(null);
  return (
    <>
      <div className="gs-admin-head">
        <h1>Store ledger</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {adminTab === "products" && (
            <button className="gs-addproductbtn" onClick={onAdd}><Plus size={15} /> Add product</button>
          )}
          <button className="gs-logoutbtn" onClick={onReset}><RotateCcw size={13} /> Reset demo catalog</button>
          <button className="gs-logoutbtn" onClick={onLogout}><Lock size={13} /> Log out</button>
        </div>
      </div>
      <div className="gs-tabs">
        <button className={`gs-tab ${adminTab === "products" ? "active" : ""}`} onClick={() => setAdminTab("products")}>
          Products ({products.length})
        </button>
        <button className={`gs-tab ${adminTab === "orders" ? "active" : ""}`} onClick={() => setAdminTab("orders")}>
          Orders ({orders.length})
        </button>
        <button className={`gs-tab ${adminTab === "analytics" ? "active" : ""}`} onClick={() => setAdminTab("analytics")}>
          Analytics
        </button>
      </div>

      {adminTab === "products" ? (
        <div className="gs-table-wrap">
          <div className="gs-row head">
            <div></div><div>Product</div><div>Category</div><div>Price</div><div>Stock</div><div></div>
          </div>
          {products.length === 0 ? (
            <div className="gs-emptystate">No products yet. Click "Add product" to create your first item.</div>
          ) : (
            products.map((p) => (
              <div className="gs-row" key={p.id}>
                <img src={p.image} alt="" onError={(e) => { e.target.style.visibility = "hidden"; }} />
                <div>
                  <div className="gs-row-name">{p.name}</div>
                  <div className="gs-row-cat">{p.sku}</div>
                </div>
                <div className="gs-row-cat">{p.category}</div>
                <div className="gs-row-price">
                  {p.listingType === "rent"
                    ? `${inr(p.rentPrice)}/day`
                    : p.listingType === "both"
                    ? `${inr(p.price)} · ${inr(p.rentPrice)}/day`
                    : inr(p.price)}
                </div>
                <div className="gs-row-price" style={{ color: p.stock === 0 ? "#E0654F" : "inherit" }}>{p.stock} in stock</div>
                <div className="gs-row-actions">
                  <button className="gs-iconbtn2" onClick={() => onEdit(p)}><Pencil size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : adminTab === "orders" ? (
        <div className="gs-table-wrap">
          {orders.length === 0 ? (
            <div className="gs-emptystate">
              <ReceiptText size={26} style={{ opacity: 0.4, marginBottom: 10 }} />
              <div>No orders yet — checkout from the Shop tab to create one.</div>
            </div>
          ) : (
            orders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                expanded={expandedOrder === o.id}
                onToggle={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                onMarkPaid={onMarkPaid}
                onDelete={onDeleteOrder}
              />
            ))
          )}
        </div>
      ) : (
        <AnalyticsPanel analytics={analytics} loading={analyticsLoading} />
      )}
    </>
  );
}

function AnalyticsPanel({ analytics, loading }) {
  if (loading && !analytics) {
    return (
      <div className="gs-emptystate">
        <Loader2 size={22} className="gs-spin" style={{ marginBottom: 10 }} />
        <div>Loading analytics…</div>
      </div>
    );
  }
  if (!analytics) return null;

  const stats = [
    { label: "Total orders", value: analytics.totalOrders },
    { label: "Paid orders", value: analytics.paidOrders },
    { label: "Pending orders", value: analytics.pendingOrders },
    { label: "Items sold", value: analytics.totalItemsSold },
    { label: "Revenue", value: inr(analytics.totalRevenue) },
    { label: "Cost", value: inr(analytics.totalCost) },
    { label: "Profit", value: inr(analytics.totalProfit), highlight: true },
    { label: "Avg. order value", value: inr(analytics.averageOrderValue) },
  ];

  return (
    <div>
      <div className="gs-stats-grid">
        {stats.map((s) => (
          <div className={`gs-statcard ${s.highlight ? "highlight" : ""}`} key={s.label}>
            <div className="gs-statcard-label">{s.label}</div>
            <div className="gs-statcard-value">{s.value}</div>
          </div>
        ))}
      </div>

      {analytics.totalCost === 0 && analytics.totalRevenue > 0 && (
        <div className="gs-analytics-hint">
          <AlertCircle size={13} /> Profit currently equals revenue because no product has a "Cost price" set yet —
          add one when editing a product to see real profit here.
        </div>
      )}

      {analytics.topProducts && analytics.topProducts.length > 0 && (
        <div className="gs-table-wrap" style={{ marginTop: 24 }}>
          <div className="gs-row head" style={{ gridTemplateColumns: "1fr 100px 120px" }}>
            <div>Top products</div><div>Sold</div><div>Revenue</div>
          </div>
          {analytics.topProducts.map((p, i) => (
            <div className="gs-row" key={i} style={{ gridTemplateColumns: "1fr 100px 120px" }}>
              <div className="gs-row-name">{p.name}</div>
              <div className="gs-row-cat">{p.qty}</div>
              <div className="gs-row-price">{inr(p.revenue)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, expanded, onToggle, onMarkPaid, onDelete }) {
  const c = order.customer || {};
  const addressLine = [c.address1, c.address2].filter(Boolean).join(", ");
  const cityLine = [c.city, c.state, c.pincode].filter(Boolean).join(", ");
  const paid = order.status === "paid";
  return (
    <div className="gs-orderrow">
      <button className="gs-row gs-order-summary" onClick={onToggle} style={{ gridTemplateColumns: "1fr 1fr 1fr 90px 70px 24px", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
        <div>
          <div className="gs-row-name">{order.id}</div>
          <div className="gs-row-cat">{c.name || "—"}</div>
        </div>
        <div className="gs-row-cat">{order.items.length} item{order.items.length > 1 ? "s" : ""}</div>
        <div className="gs-row-cat">{new Date(order.createdAt).toLocaleString("en-IN")}</div>
        <div className="gs-row-price" style={{ textAlign: "right" }}>{inr(order.total)}</div>
        <span
          style={{
            justifySelf: "end", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
            background: paid ? "#e4f3e8" : "#fdf1e0", color: paid ? "#2f7d46" : "#a86a10",
          }}
        >
          {paid ? "Paid" : "Pending"}
        </span>
        <ChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s ease", color: "var(--muted)", justifySelf: "end" }} />
      </button>
      {expanded && (
        <div className="gs-orderdetail">
          <div className="gs-orderdetail-col">
            <div className="gs-orderdetail-label">Customer</div>
            <div className="gs-orderdetail-line"><strong>{c.name || "—"}</strong></div>
            <div className="gs-orderdetail-line">{c.phone || "—"}</div>
            <div className="gs-orderdetail-line">{c.email || "—"}</div>
          </div>
          <div className="gs-orderdetail-col">
            <div className="gs-orderdetail-label">Delivery address</div>
            {addressLine || cityLine ? (
              <>
                {addressLine && <div className="gs-orderdetail-line">{addressLine}</div>}
                {cityLine && <div className="gs-orderdetail-line">{cityLine}</div>}
              </>
            ) : (
              <div className="gs-orderdetail-line">No address on file</div>
            )}
          </div>
          <div className="gs-orderdetail-col">
            <div className="gs-orderdetail-label">Items</div>
            {order.items.map((it, i) => (
              <div
                className="gs-orderdetail-line"
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {it.image && (
                  <img
                    src={it.image}
                    alt=""
                    style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 5, flexShrink: 0 }}
                  />
                )}
                <div>
                  <div>
                    {it.name}{it.sku && ` (${it.sku})`} × {it.qty}
                    {it.mode === "rent" && ` (${it.days}-day rental)`}
                    {" — "}{inr(it.price * it.qty)}
                  </div>
                  {it.id && (
                    <div style={{ fontSize: 10.5, color: "var(--muted)" }}>ID: {it.id}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="gs-orderdetail-col">
            <div className="gs-orderdetail-label">Payment</div>
            <div className="gs-orderdetail-line">
              {order.paymentId ? `Razorpay payment: ${order.paymentId}` : order.utr ? `UTR: ${order.utr}` : "Not yet paid"}
            </div>
            {!paid && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button
                  className="gs-addproductbtn"
                  onClick={() => onMarkPaid(order.id)}
                >
                  Mark as paid
                </button>
                <button
                  className="gs-deletebtn"
                  style={{ width: "auto", padding: "8px 13px", fontSize: 12, marginTop: 0 }}
                  onClick={() => onDelete(order.id)}
                >
                  <Trash2 size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Delete order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductForm({ product, saving, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(product);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isEdit = Boolean(product.id);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      update("image", dataUrl);
    } catch (err) {
      setUploadError("Couldn't process that image — try a different file");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="gs-formpanel">
      <div className="gs-formpanel-head">
        <h2>{isEdit ? "Edit product" : "Add product"}</h2>
        <button className="gs-iconbtn" onClick={onCancel}><X size={18} /></button>
      </div>
      <div className="gs-formpanel-body">
        <div className="gs-field">
          <label>Product name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Stoneware Mug" />
        </div>
        <div className="gs-formrow">
          <div className="gs-field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="gs-field">
            <label>SKU</label>
            <input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="auto-generated" />
          </div>
        </div>
        <div className="gs-field">
          <label>Listing type</label>
          <select value={form.listingType || "sale"} onChange={(e) => update("listingType", e.target.value)}>
            <option value="sale">For sale only</option>
            <option value="rent">For rent only</option>
            <option value="both">Both — sale and rent</option>
          </select>
        </div>
        <div className="gs-formrow">
          {(form.listingType || "sale") !== "rent" && (
            <div className="gs-field">
              <label>Price (INR)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" />
            </div>
          )}
          {(form.listingType === "rent" || form.listingType === "both") && (
            <div className="gs-field">
              <label>Rent price / day (INR)</label>
              <input type="number" min="0" value={form.rentPrice} onChange={(e) => update("rentPrice", e.target.value)} placeholder="0" />
            </div>
          )}
          <div className="gs-field">
            <label>Stock</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="gs-field">
          <label>Cost price (INR) <span style={{ fontWeight: 400, color: "var(--muted)" }}>— optional, not shown to customers</span></label>
          <input type="number" min="0" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} placeholder="0" />
          <div className="gs-imageupload-hint">What this item cost you to buy or make. Used to calculate profit on the Analytics tab — leave blank if you'd rather not track it.</div>
        </div>
        <div className="gs-field">
          <label>Product photo</label>
          <div className="gs-imageupload">
            <div className="gs-imageupload-preview">
              {form.image ? (
                <img src={form.image} alt="" />
              ) : (
                <ImageOff size={22} style={{ opacity: 0.4 }} />
              )}
            </div>
            <div className="gs-imageupload-controls">
              <label className="gs-uploadbtn">
                <UploadCloud size={14} />
                {uploading ? "Processing…" : form.image ? "Replace photo" : "Upload photo"}
                <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
              </label>
              {form.image && (
                <button type="button" className="gs-removeimgbtn" onClick={() => update("image", "")}>
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
          </div>
          {uploadError && (
            <div style={{ color: "var(--coral)", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={12} /> {uploadError}
            </div>
          )}
          <div className="gs-imageupload-hint">Photos are stored with the product data, so they're resized automatically. Leave blank for a placeholder image.</div>
        </div>
        <div className="gs-field">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short product description" />
        </div>
        <button className="gs-savebtn" disabled={saving || !form.name} onClick={() => onSave(form)}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
        </button>
        {isEdit && (
          <button className="gs-deletebtn" onClick={() => onDelete(form.id)}>
            <Trash2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Delete product
          </button>
        )}
      </div>
    </div>
  );
}