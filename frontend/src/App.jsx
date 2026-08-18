import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShoppingBag, Plus, Minus, X, Trash2, Settings, Store as StoreIcon,
  Check, Loader2, Package, ArrowLeft, Pencil, ImageOff, ReceiptText,
  Lock, AlertCircle, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, ChevronDown, UploadCloud,
} from "lucide-react";
import * as api from "./api.js";

// The store's password check now happens server-side (see Django's
// AdminLoginView) — the browser only ever holds the signed token it gets
// back, not the password itself.
const ADMIN_TOKEN_STORAGE_KEY = "seyon_admin_token";

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
    /* Stand-in for TT Drugs (paid font, not embeddable here). If you own a TT Drugs
       license, replace the @import above with your own @font-face block pointing at
       your hosted .woff2 files, and change 'Bricolage Grotesque' below to 'TT Drugs'. */
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-body: 'Space Grotesk', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;

    background-color: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
    min-height: 100%;
    width: 100%;
    position: relative;
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

  .gs-main { max-width: 1180px; margin: 0 auto; padding: 40px 28px 100px; }

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

  .gs-card-img-wrap { position: relative; aspect-ratio: 1/1; background: #ddd6c4; overflow: hidden; }
  .gs-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gs-card-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #a89f88; }

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
  .gs-card-name { font-family: var(--font-display); font-size: 18px; font-weight: 600; line-height: 1.2; }
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

const LOGO_URI = "data:image/webp;base64,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";
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
  return { id: "", name: "", category: CATEGORIES[0], price: "", stock: "", sku: "", image: "", description: "", listingType: "sale", rentPrice: "" };
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
        id: i.id, name: i.name, price: i.unitPrice, qty: i.qty, mode: i.mode, days: i.days,
      })),
      total: subtotal,
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
                total={subtotal}
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
    bg: 'url("https://user23766.na.imgto.link/public/20260815/dark-grey-and-red-modern-manager-linkedin-career-page-background-3.avif")',
  },
  {
    eyebrow: "Handpicked quality",
    title: "Each piece, checked twice.",
    text: "Every product is inspected before it's listed, so what you see in the shop is exactly what arrives.",
    bg: 'url("https://user23766.na.imgto.link/public/20260815/chatgpt-image-aug-14-2026-05-00-17-pm-1.avif")',
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
// change that tile's photo. If a category has no entry here (or the file
// fails to load), the tile falls back to a photo from that category's own
// products, and finally to a plain icon.
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

function CategoryTile({ label, image, active, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button className={`gs-catcard ${active ? "active" : ""}`} onClick={onClick}>
      <div className="gs-catcard-ring">
        <div className="gs-catcard-img">
          {image && !imgError ? (
            <img src={image} alt="" onError={() => setImgError(true)} />
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
            image={CATEGORY_IMAGES["All"]}
            active={category === "All"}
            onClick={() => { setCategory("All"); setPage(1); }}
          />
          {categoriesInTab.map((c) => {
            const thumb = CATEGORY_IMAGES[c] || modeFiltered.find((p) => p.category === c)?.image;
            return (
              <CategoryTile
                key={c}
                label={c}
                image={thumb}
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
              <ProductCard key={p.id + "-" + shopTab} product={p} onAdd={onAdd} mode={shopTab} />
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
    </>
  );
}

const RENT_DURATIONS = [1, 3, 7];

function ProductCard({ product, onAdd, mode }) {
  const [imgError, setImgError] = useState(false);
  const [rentDays, setRentDays] = useState(3);
  const outOfStock = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 5;
  const isRentMode = mode === "rent";

  function confirmRent() {
    onAdd(product, { mode: "rent", days: rentDays });
  }

  return (
    <div className="gs-card">
      <div className="gs-card-img-wrap">
        {!imgError ? (
          <img src={product.image} alt={product.name} onError={() => setImgError(true)} />
        ) : (
          <div className="gs-card-noimg"><ImageOff size={28} /></div>
        )}
        <div className="gs-tag">
          {isRentMode ? `${inr(product.rentPrice)}/day` : inr(product.price)}
        </div>
        {isRentMode && <div className="gs-rentbadge">Rental</div>}
      </div>
      <div className="gs-card-body">
        <div className="gs-card-cat">{product.category}</div>
        <div className="gs-card-name">{product.name}</div>
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
              <div className="gs-stock">
                <span className="gs-stockdot" style={{ background: outOfStock ? "#c0392b" : low ? "#E0654F" : "#6B8F71" }} />
                {outOfStock ? "Out of stock" : low ? `${product.stock} left` : "In stock"}
              </div>
              <button className="gs-rentconfirm compact" disabled={outOfStock} onClick={confirmRent}>
                <CalendarDays size={13} /> Rent · {inr(product.rentPrice * rentDays)}
              </button>
            </div>
          </>
        ) : (
          <div className="gs-card-foot">
            <div className="gs-stock">
              <span className="gs-stockdot" style={{ background: outOfStock ? "#c0392b" : low ? "#E0654F" : "#6B8F71" }} />
              {outOfStock ? "Out of stock" : low ? `${product.stock} left` : "In stock"}
            </div>
            <button className="gs-addbtn" disabled={outOfStock} onClick={() => onAdd(product, { mode: "sale" })}>
              <Plus size={13} /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- CART DRAWER ---------------- */
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
          <div className="gs-totalrow"><span>Shipping</span><span>Free</span></div>
          <div className="gs-totalrow grand"><span>Total</span><span>{inr(subtotal)}</span></div>
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
function AdminView({ products, orders, adminTab, setAdminTab, onAdd, onEdit, onLogout, onReset, onMarkPaid }) {
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
      ) : (
        <div className="gs-table-wrap">
          {orders.length === 0 ? (
            <div className="gs-emptystate">
              <ReceiptText size={26} style={{ opacity: 0.4, marginBottom: 10 }} />
              <div>No orders yet — checkout from the Shop tab to create one.</div>
            </div>
          ) : (
            orders.map((o) => (
              <OrderRow key={o.id} order={o} expanded={expandedOrder === o.id} onToggle={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} onMarkPaid={onMarkPaid} />
            ))
          )}
        </div>
      )}
    </>
  );
}

function OrderRow({ order, expanded, onToggle, onMarkPaid }) {
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
              <div className="gs-orderdetail-line" key={i}>
                {it.name} × {it.qty}
                {it.mode === "rent" && ` (${it.days}-day rental)`}
                {" — "}{inr(it.price * it.qty)}
              </div>
            ))}
          </div>
          <div className="gs-orderdetail-col">
            <div className="gs-orderdetail-label">Payment</div>
            <div className="gs-orderdetail-line">
              {order.paymentId ? `Razorpay payment: ${order.paymentId}` : order.utr ? `UTR: ${order.utr}` : "Not yet paid"}
            </div>
            {!paid && (
              <button
                className="gs-addproductbtn"
                style={{ marginTop: 8 }}
                onClick={() => onMarkPaid(order.id)}
              >
                Mark as paid
              </button>
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
