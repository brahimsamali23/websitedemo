/* ═══════════════════════════════════════════════════════════════════
   FlyEX — Ava Support Chatbot  v2
   Messages sourced directly from the FlyEX Customer Support
   Knowledge Base (knowledge-base.html). Keyword engine maps free
   text to the matching KB topic and returns the exact KB answer.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const BOT_NAME = 'Ava';
  const T_SHORT  = 950;
  const T_LONG   = 1800;

  /* ── States ─────────────────────────────────────────────────────── */
  const S = {
    IDLE:'idle', MENU:'menu', ASK_REF:'ask_ref',
    VERIFYING:'verifying', OFFER_FIX:'offer_fix',
    FIXING:'fixing', RESOLVED:'resolved', DONE:'done',
  };

  /* ══════════════════════════════════════════════════════════════════
     KNOWLEDGE BASE — all text sourced from knowledge-base.html
     Each entry has:
       keywords : RegExp tested against lowercased user input
       title    : short label shown in quick-reply chips
       answer   : full KB answer rendered in the chat bubble
  ══════════════════════════════════════════════════════════════════ */
  const KB = [
    /* ── Services ── */
    {
      id: 'services',
      title: 'Our travel services',
      keywords: /service|offer|provide|what do you do|what can you|package|flight|hotel|cruise|transfer|car hire/,
      answer: `FlyEX offers a full range of travel services including international and domestic flight bookings across all cabin classes, hotel reservations, tailor-made holiday packages, cruise and expedition travel, airport transfers, car hire, travel insurance, and visa &amp; passport assistance. We serve both leisure and corporate travellers.`
    },
    /* ── Destinations ── */
    {
      id: 'destinations',
      title: 'Destinations & specialities',
      keywords: /destination|speciali|africa|europe|middle east|asia|accra|lagos|casablanca|essaouira|bali|tokyo|santorini/,
      answer: `FlyEX has specialist expertise in long-haul travel across Africa, Europe, the Middle East, and Asia-Pacific. We are particularly experienced in luxury and premium travel, as well as emerging African destinations such as Accra (Ghana), Lagos (Nigeria), Essaouira (Morocco), and Casablanca (Morocco). Our advisors regularly visit these destinations and receive first-hand destination training.`
    },
    /* ── About / history ── */
    {
      id: 'about',
      title: 'About FlyEX',
      keywords: /how long|founded|history|years|in business|established|since|background|about/,
      answer: `FlyEX was founded in 2011 and has been operating for over 15 years. In that time we have served more than 2.4 million travellers across 180+ destinations worldwide, maintaining a customer satisfaction rate of 98%.`
    },
    /* ── Accreditation ── */
    {
      id: 'accreditation',
      title: 'Agent accreditation',
      keywords: /certif|accredit|iata|abta|asta|qualif|trained|licence|licensed/,
      answer: `All FlyEX travel advisors hold accreditation through IATA (International Air Transport Association), ABTA (Association of British Travel Agents), and ASTA (American Society of Travel Advisors). Advisors also complete annual destination and product training to maintain their specialist status.`
    },
    /* ── Operating hours ── */
    {
      id: 'hours',
      title: 'Opening hours',
      keywords: /hour|open|close|time|schedule|when|available|office/,
      answer: `Our advisors are available <strong>Monday to Friday, 9:00 AM – 5:00 PM</strong>. Outside of these hours, travellers who are already abroad and require urgent assistance can reach our 24/7 emergency line at <strong>+1 (800) 359-3993</strong>. Enquiries submitted by email outside office hours will be responded to the next business day.`
    },
    /* ── 24/7 support ── */
    {
      id: 'support247',
      title: '24/7 emergency support',
      keywords: /24.7|24\/7|emergency|urgent|stranded|overnight|night|weekend|after hours/,
      answer: `Our standard support hours are 9:00 AM – 5:00 PM, Monday to Friday. However, we maintain a <strong>24/7 emergency line (+1 800 359-3993)</strong> exclusively for travellers already mid-journey facing urgent situations such as missed connections, medical emergencies, or being stranded. This line is not intended for new bookings or general enquiries.`
    },
    /* ── Group / corporate ── */
    {
      id: 'group',
      title: 'Group & corporate travel',
      keywords: /group|corporate|company|business travel|bulk|team|10\+|conference|incentive/,
      answer: `Absolutely. FlyEX has a dedicated Corporate &amp; Groups desk experienced in managing travel for parties of 10 or more. We provide customised itineraries, negotiated group fares, consolidated billing, travel policy management, and a dedicated account manager for corporate clients. Please contact our team directly at <strong>support@flyex.com</strong> for a tailored group quote.`
    },
    /* ── Visa & passport ── */
    {
      id: 'visa',
      title: 'Visa & passport help',
      keywords: /visa|passport|document|entry requirement|immigration|embassy|permit/,
      answer: `Yes. We provide comprehensive guidance on visa requirements for all nationalities travelling to any of our 180+ destinations. Our advisors will advise on required documents, processing times, and application procedures. Please note that FlyEX acts in an advisory capacity — final approval rests with the relevant embassy or immigration authority. We strongly recommend beginning the visa process <strong>at least 8 weeks before departure</strong>.`
    },
    /* ── Insurance ── */
    {
      id: 'insurance',
      title: 'Travel insurance',
      keywords: /insur|cover|coverage|medical|cancellation cover|baggage|lost luggage|policy/,
      answer: `Yes. FlyEX partners with leading insurers to offer comprehensive travel insurance including trip cancellation cover, medical and evacuation cover, baggage loss and delay, flight disruption cover, and adventure activity add-ons. Insurance can be added to any booking and we strongly recommend it for all international travel. Policy documents are provided at the time of purchase.`
    },
    /* ── Why FlyEX ── */
    {
      id: 'whyflyex',
      title: 'Why choose FlyEX',
      keywords: /why|better|different|stand out|advantage|benefit|vs online|compare|booking\.com|expedia/,
      answer: `Unlike automated online platforms, FlyEX provides human expertise at every step. Our advisors offer personalised itinerary planning, insider destination knowledge, proactive monitoring of your booking (alerts for schedule changes, strikes, or disruptions), and real human support when something goes wrong. We also have access to unpublished fares and specialist rates not available on public booking engines.`
    },
    /* ── Data / privacy ── */
    {
      id: 'privacy',
      title: 'Data & privacy',
      keywords: /data|privacy|personal|gdpr|information|stored|safe|secure|details/,
      answer: `FlyEX takes data privacy seriously. Personal information such as names, email addresses, and phone numbers is used solely to process your booking and is not stored beyond the session in our online booking system. We are fully GDPR-compliant. If you have concerns about your data, contact <strong>privacy@flyex.com</strong>.`
    },
    /* ── Cabin classes ── */
    {
      id: 'cabin',
      title: 'Cabin classes',
      keywords: /cabin|class|economy|business|first class|premium economy|seat|upgrade/,
      answer: `We book across all four standard cabin classes: <strong>Economy, Premium Economy, Business Class,</strong> and <strong>First Class</strong>. Availability depends on the airline and route. Our advisors can advise on the best value-for-money option and can also arrange upgrades where available.`
    },
    /* ── Airports ── */
    {
      id: 'airports',
      title: 'Departure airports',
      keywords: /airport|depart|fly from|origin|which airport|hub/,
      answer: `FlyEX supports departures from hundreds of airports across Africa, Europe, and the United States, as well as major hubs in the Middle East and Asia-Pacific. Our booking tool lets you select from a comprehensive list grouped by region. If you don't see your preferred airport, contact an advisor directly.`
    },
    /* ── One-way ── */
    {
      id: 'oneway',
      title: 'One-way flights',
      keywords: /one.way|single|no return|open.jaw|multi.city/,
      answer: `Yes. FlyEX supports both one-way and return flight bookings. During the booking process, the return date field is optional — simply leave it blank if you only need a one-way ticket. Our advisors can also assist with multi-city and open-jaw itineraries on request.`
    },
    /* ── Credit card / payment ── */
    {
      id: 'payment',
      title: 'Payment & credit card',
      keywords: /credit card|payment|pay|debit|bank transfer|no card|card required|how to pay/,
      answer: `FlyEX does not require credit card details during the initial online booking process. A booking reference is generated to hold your itinerary, after which an advisor will contact you to confirm payment options. We accept all major payment methods including bank transfer, debit card, and credit card.`
    },
    /* ── Amend booking ── */
    {
      id: 'amend',
      title: 'Amend my booking',
      keywords: /amend|change|modify|update|alter|edit booking|adjust/,
      answer: `To amend your booking, contact our support team with your booking reference:<br><br>📧 <strong>support@flyex.com</strong><br>📞 <strong>+1 (800) 359-3993</strong> (Mon–Fri, 9 AM–5 PM)<br><br>Please note that amendments may be subject to airline change fees, which your advisor will communicate before any changes are made.`
    },
    /* ── Booking error (general) ── */
    {
      id: 'bookingerror',
      title: 'Error in my confirmation',
      keywords: /error|wrong|incorrect|mistake|doesn't match|not right|discrepan|issue|problem|confirm/,
      answer: `Please contact us immediately. Errors relating to passenger names, travel dates, passenger count, or cabin class must be corrected before check-in, as they can affect your ability to board. The sooner you report it, the easier it is to correct — often without additional fees.<br><br>I can help you resolve this right now if you'd like.`
    },
    /* ── Cancellation / refund ── */
    {
      id: 'cancel',
      title: 'Cancellation & refunds',
      keywords: /cancel|refund|money back|reimburse|fare|non-refundable/,
      answer: `Cancellation policies vary depending on the fare type, airline, and hotel booked. Non-refundable fares will not be reimbursed, but we will always attempt to rebook or issue a credit where available. Refundable fares are typically processed within <strong>7–14 business days</strong>. Travel insurance can cover many cancellation scenarios — we always recommend purchasing a policy at the time of booking.`
    },
    /* ── Special requirements ── */
    {
      id: 'special',
      title: 'Special requirements',
      keywords: /disab|wheelchair|special need|diet|dietary|meal|unaccompanied|minor|medical equipment|assistance/,
      answer: `Yes. Our advisors are trained to arrange special assistance requests including wheelchair assistance, dietary meal options, medical equipment carriage, and unaccompanied minor services. Please inform us of any special requirements at the time of booking to ensure appropriate arrangements are made with the airline and accommodation provider.`
    },
    /* ── Honeymoon / special occasions ── */
    {
      id: 'occasions',
      title: 'Honeymoon & special trips',
      keywords: /honeymoon|anniversary|birthday|special occasion|celebrate|wedding|romantic/,
      answer: `FlyEX offers bespoke packages for honeymoons, anniversaries, milestone birthdays, and other special occasions. We can arrange room upgrades, champagne on arrival, private excursions, and personalised touches throughout your trip. Speak with one of our advisors to create a truly memorable experience.`
    },
  ];

  /* ── Error type helpers ─────────────────────────────────────────── */
  function errLabel(m) {
    if (!m) return 'a booking detail';
    return { name:'passenger name', date:'departure date', pax:'number of passengers', cabin:'cabin class' }[m.type] || 'a booking detail';
  }

  function correctValue(m, bd) {
    if (!m || !bd) return '';
    const pfx = bd.title ? bd.title + ' ' : '';
    switch (m.type) {
      case 'name':  return pfx + bd.firstName + ' ' + bd.lastName;
      case 'date':  return bd.depart ? fmtDate(bd.depart) : '';
      case 'pax':   return bd.pax + (bd.pax === '1' ? ' passenger' : ' passengers');
      case 'cabin': return bd.cabin;
      default:      return '';
    }
  }

  function fmtDate(iso) {
    try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); }
    catch(_) { return iso; }
  }

  /* ── 6 error-specific KB messages ─────────────────────────────── */
  const ERR_EXPLAIN = {
    name: `I can see that the passenger name recorded on your confirmation doesn't exactly match the name on your passport. This is important to correct before check-in — airlines require your name to match your travel documents exactly. Even a single character difference can prevent you from boarding.<br><br>Errors relating to passenger names must be corrected as soon as possible, as they can affect your ability to board. The sooner you report it, the easier it is to correct — often without additional fees.`,
    date: `I can see that the departure date on your confirmation doesn't match the date you selected during booking. Even a single day's difference can result in a missed flight, so this needs to be corrected immediately.<br><br>Please contact us immediately — errors relating to travel dates must be corrected before check-in. The sooner you report it, the easier it is to correct without additional fees.`,
    pax:  `The number of passengers recorded in your booking is one more than what you selected. This could result in unnecessary seat reservations and billing discrepancies that will need to be resolved before your travel date.<br><br>Errors relating to passenger count must be corrected before check-in. I can help you get this sorted right now.`,
    cabin:`The cabin class on your confirmation doesn't match what you selected during booking. This can affect your seating, baggage allowance, and in-flight services — and may result in a cost difference that needs to be reconciled.<br><br>I can help you get this corrected straight away.`,
  };

  /* ══════════════════════════════════════════════════════════════════
     STYLES
  ══════════════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('flyex-chat-css')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="flyex-chat-css">
      #flyex-widget{position:fixed;bottom:28px;right:28px;z-index:99999;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:14px}
      #flyex-btn{width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#1A7FE8,#0F5DB5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(26,127,232,.45),0 8px 32px rgba(0,0,0,.3);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;position:relative}
      #flyex-btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(26,127,232,.55),0 12px 40px rgba(0,0,0,.35)}
      #flyex-btn:active{transform:scale(.97)}
      #flyex-btn .ic-chat{transition:transform .3s,opacity .3s}
      #flyex-btn .ic-close{position:absolute;opacity:0;transform:scale(.5) rotate(-90deg);transition:transform .3s,opacity .3s}
      #flyex-btn.open .ic-chat{opacity:0;transform:scale(.5) rotate(90deg)}
      #flyex-btn.open .ic-close{opacity:1;transform:scale(1) rotate(0)}
      #flyex-btn.has-error::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(255,140,0,.7);animation:fx-pulse 1.8s ease-out infinite}
      #flyex-btn .fx-badge{position:absolute;top:0;right:0;width:14px;height:14px;border-radius:50%;background:#FF8C00;border:2px solid #060D1A;display:none}
      #flyex-btn.has-error .fx-badge{display:block}
      @keyframes fx-pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.35);opacity:0}}

      #flyex-panel{position:absolute;bottom:70px;right:0;width:375px;max-height:560px;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;background:#060D1A;border:1px solid rgba(255,255,255,.09);box-shadow:0 8px 32px rgba(0,0,0,.5),0 24px 64px rgba(0,0,0,.4);transform:scale(.92) translateY(12px);opacity:0;pointer-events:none;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s;transform-origin:bottom right}
      #flyex-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}

      #flyex-head{background:linear-gradient(135deg,#0A1628,#0F2040);border-bottom:1px solid rgba(255,255,255,.07);padding:14px 16px;display:flex;align-items:center;gap:11px;flex-shrink:0}
      .fx-av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1A7FE8,#0F5DB5);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;position:relative}
      .fx-av::after{content:'';position:absolute;bottom:1px;right:1px;width:9px;height:9px;border-radius:50%;background:#22C55E;border:2px solid #0A1628}
      .fx-hname{font-weight:700;color:#E8F0FF;font-size:13.5px;line-height:1.2}
      .fx-hstatus{font-size:11px;color:rgba(232,240,255,.45);margin-top:1px}
      .fx-xbtn{background:none;border:none;cursor:pointer;color:rgba(232,240,255,.4);padding:4px;border-radius:6px;display:flex;margin-left:auto;transition:color .2s,background .2s}
      .fx-xbtn:hover{color:#E8F0FF;background:rgba(255,255,255,.06)}

      #flyex-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:9px;scroll-behavior:smooth}
      #flyex-msgs::-webkit-scrollbar{width:4px}
      #flyex-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}

      .fx-msg{display:flex;flex-direction:column;max-width:88%;animation:fx-in .3s cubic-bezier(.34,1.56,.64,1) both}
      @keyframes fx-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
      .fx-msg.bot{align-self:flex-start;align-items:flex-start}
      .fx-msg.user{align-self:flex-end;align-items:flex-end}
      .fx-bubble{padding:10px 13px;border-radius:16px;line-height:1.6;font-size:13px}
      .fx-msg.bot  .fx-bubble{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);color:#E8F0FF;border-bottom-left-radius:4px}
      .fx-msg.user .fx-bubble{background:linear-gradient(135deg,#1A7FE8,#0F5DB5);color:#fff;border-bottom-right-radius:4px}
      .fx-bubble.ok{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.25);color:#86EFAC}
      .fx-time{font-size:10px;color:rgba(232,240,255,.25);margin-top:3px;padding:0 3px}

      .fx-typing .fx-bubble{padding:12px 15px}
      .fx-dots{display:flex;gap:4px;align-items:center;height:14px}
      .fx-dots span{width:6px;height:6px;border-radius:50%;background:rgba(232,240,255,.4);animation:fx-bounce 1.2s ease-in-out infinite}
      .fx-dots span:nth-child(2){animation-delay:.18s}
      .fx-dots span:nth-child(3){animation-delay:.36s}
      @keyframes fx-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

      .fx-chips{display:flex;flex-wrap:wrap;gap:6px;padding:3px 0;animation:fx-in .35s .08s cubic-bezier(.34,1.56,.64,1) both}
      .fx-chip{background:rgba(26,127,232,.1);border:1px solid rgba(26,127,232,.35);color:#3B9BFF;font-size:12px;font-family:inherit;padding:6px 12px;border-radius:20px;cursor:pointer;transition:background .2s,border-color .2s,transform .15s;white-space:nowrap}
      .fx-chip:hover{background:rgba(26,127,232,.2);border-color:rgba(26,127,232,.6);transform:translateY(-1px)}
      .fx-chip:active{transform:translateY(0)}

      #flyex-foot{flex-shrink:0;display:flex;gap:8px;padding:11px 12px;border-top:1px solid rgba(255,255,255,.07);background:rgba(6,13,26,.8)}
      #flyex-inp{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:9px 14px;color:#E8F0FF;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s,background .2s}
      #flyex-inp:focus{border-color:rgba(26,127,232,.5);background:rgba(255,255,255,.08)}
      #flyex-inp::placeholder{color:rgba(232,240,255,.3)}
      #flyex-send{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1A7FE8,#0F5DB5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:center;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
      #flyex-send:hover{transform:scale(1.1)}
      #flyex-send:active{transform:scale(.95)}
      #flyex-send:disabled{opacity:.35;cursor:default;transform:none}

      #flyex-ok-banner{display:none;background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:14px 16px;margin-bottom:18px;align-items:flex-start;gap:11px}
      #flyex-ok-banner.show{display:flex;animation:fx-in .4s cubic-bezier(.34,1.56,.64,1) both}
      #flyex-ok-banner .ok-icon{width:22px;height:22px;border-radius:50%;background:rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;margin-top:1px}
      #flyex-ok-banner .ok-title{font-size:.82rem;font-weight:700;color:#86EFAC;margin-bottom:2px}
      #flyex-ok-banner .ok-body{font-size:.75rem;color:rgba(134,239,172,.75);line-height:1.55}

      @media(max-width:420px){#flyex-panel{width:calc(100vw - 32px)}#flyex-widget{right:16px;bottom:16px}}
    </style>`);
  }

  /* ══════════════════════════════════════════════════════════════════
     DOM BUILD
  ══════════════════════════════════════════════════════════════════ */
  function buildWidget() {
    const w = document.createElement('div');
    w.id = 'flyex-widget';
    w.innerHTML = `
      <div id="flyex-panel" role="dialog" aria-label="FlyEX Support">
        <div id="flyex-head">
          <div class="fx-av">✈</div>
          <div><div class="fx-hname">${BOT_NAME} · FlyEX Support</div><div class="fx-hstatus">Online · Replies instantly</div></div>
          <button class="fx-xbtn" id="flyex-x" aria-label="Close">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="flyex-msgs"></div>
        <div id="flyex-foot">
          <input id="flyex-inp" type="text" placeholder="Type a message…" autocomplete="off"/>
          <button id="flyex-send" aria-label="Send">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
      <button id="flyex-btn" aria-label="Chat with FlyEX support">
        <span class="fx-badge"></span>
        <svg class="ic-chat" width="23" height="23" fill="none" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(255,255,255,.15)" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="8" cy="10" r="1" fill="white"/><circle cx="12" cy="10" r="1" fill="white"/><circle cx="16" cy="10" r="1" fill="white"/>
        </svg>
        <svg class="ic-close" width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>`;
    document.body.appendChild(w);

    // Insert resolved banner before the error card on the confirmation page
    const ec = document.getElementById('error-card');
    if (ec) {
      ec.insertAdjacentHTML('beforebegin', `
        <div id="flyex-ok-banner">
          <div class="ok-icon">✓</div>
          <div><div class="ok-title">Booking corrected by Ava</div><div class="ok-body" id="flyex-ok-msg">Your booking details have been updated.</div></div>
        </div>`);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     CHATBOT CONTROLLER
  ══════════════════════════════════════════════════════════════════ */
  class Bot {
    constructor() {
      this.state  = S.IDLE;
      this.isOpen = false;
      this.autoFlagged = false;

      this.btn   = document.getElementById('flyex-btn');
      this.panel = document.getElementById('flyex-panel');
      this.msgs  = document.getElementById('flyex-msgs');
      this.inp   = document.getElementById('flyex-inp');
      this.send  = document.getElementById('flyex-send');

      document.getElementById('flyex-x').addEventListener('click', () => this.close());
      this.btn.addEventListener('click', () => this.toggle());
      this.send.addEventListener('click', () => this.submit());
      this.inp.addEventListener('keydown', e => { if (e.key === 'Enter') this.submit(); });

      this.watchConfirmationPage();
    }

    /* ── Open / close ────────────────────────────────────────────── */
    toggle() { this.isOpen ? this.close() : this.open(); }
    open()  {
      this.isOpen = true;
      this.panel.classList.add('open');
      this.btn.classList.add('open');
      this.inp.focus();
      if (this.state === S.IDLE) this.greet();
    }
    close() {
      this.isOpen = false;
      this.panel.classList.remove('open');
      this.btn.classList.remove('open');
    }

    /* ── Flag button when confirmation has an error ──────────────── */
    watchConfirmationPage() {
      const check = () => {
        const p5 = document.getElementById('page-5');
        if (p5 && p5.classList.contains('active') && window.flyexCurrentMistake && !this.autoFlagged) {
          this.autoFlagged = true;
          this.btn.classList.add('has-error');
        }
      };
      new MutationObserver(check).observe(document.body, { subtree:true, attributes:true, attributeFilter:['class'] });
      check();
    }

    /* ── Rendering helpers ───────────────────────────────────────── */
    now() { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }

    addBot(html, opts={}) {
      const d = document.createElement('div');
      d.className = 'fx-msg bot';
      d.innerHTML = `<div class="fx-bubble${opts.ok?' ok':''}">${html}</div><span class="fx-time">${BOT_NAME} · ${this.now()}</span>`;
      this.msgs.appendChild(d);
      this.scroll();
    }

    addUser(text) {
      const d = document.createElement('div');
      d.className = 'fx-msg user';
      d.innerHTML = `<div class="fx-bubble">${text}</div><span class="fx-time">You · ${this.now()}</span>`;
      this.msgs.appendChild(d);
      this.scroll();
    }

    showTyping() {
      const d = document.createElement('div');
      d.className = 'fx-msg bot fx-typing'; d.id = 'fx-typ';
      d.innerHTML = `<div class="fx-bubble"><div class="fx-dots"><span></span><span></span><span></span></div></div>`;
      this.msgs.appendChild(d); this.scroll();
      this.inp.disabled = true; this.send.disabled = true;
    }
    hideTyping() {
      const t = document.getElementById('fx-typ');
      if (t) t.remove();
      this.inp.disabled = false; this.send.disabled = false;
    }

    chips(options) {
      document.getElementById('fx-chips')?.remove();
      const r = document.createElement('div');
      r.className = 'fx-chips'; r.id = 'fx-chips';
      options.forEach(({ label, fn }) => {
        const b = document.createElement('button');
        b.className = 'fx-chip'; b.textContent = label;
        b.addEventListener('click', () => { r.remove(); this.addUser(label); fn(); });
        r.appendChild(b);
      });
      this.msgs.appendChild(r); this.scroll();
    }

    clearChips() { document.getElementById('fx-chips')?.remove(); }

    scroll() { setTimeout(() => { this.msgs.scrollTop = this.msgs.scrollHeight; }, 40); }

    say(html, delay=T_SHORT, opts={}) {
      return new Promise(res => {
        this.showTyping();
        setTimeout(() => { this.hideTyping(); this.addBot(html, opts); res(); }, delay);
      });
    }

    /* ── User input ──────────────────────────────────────────────── */
    submit() {
      const v = this.inp.value.trim(); if (!v) return;
      this.inp.value = ''; this.clearChips();
      this.addUser(v);
      this.route(v);
    }

    /* ── Keyword router ──────────────────────────────────────────── */
    route(text) {
      const t = text.toLowerCase();

      // State-gated: waiting for booking ref confirmation
      if (this.state === S.ASK_REF) { this.state = S.VERIFYING; this.verify(); return; }

      // Hard intents
      if (/agent|human|person|speak to|call|phone|representative/.test(t)) { this.handoff(); return; }
      if (/thank|thanks|great|perfect|all good|no more|bye|goodbye|sorted/.test(t)) { this.wrapUp(); return; }

      // Error / booking problem intent → direct to fix flow
      if (/error|wrong|incorrect|mistake|doesn.t match|not right|discrepan|issue|problem|name.*wrong|date.*wrong|passenger.*wrong|cabin.*wrong|fix|correct my/.test(t)) {
        const kbEntry = KB.find(k => k.id === 'bookingerror');
        this.say(kbEntry.answer, T_SHORT).then(() => {
          if (window.flyexCurrentMistake) {
            this.chips([
              { label: 'Yes, fix it now', fn: () => this.startFix() },
              { label: 'Explain the error first', fn: () => this.explainErr() },
              { label: 'Talk to an agent', fn: () => this.handoff() },
            ]);
          } else {
            this.chips([
              { label: 'Amend my booking', fn: () => this.kbAnswer('amend') },
              { label: 'Talk to an agent', fn: () => this.handoff() },
            ]);
          }
        });
        return;
      }

      // KB keyword match
      const match = KB.find(k => k.keywords.test(t));
      if (match) { this.kbAnswer(match.id); return; }

      // Fallback
      this.say(`I want to make sure I help you correctly — could you tell me a bit more, or choose from the options below?`, T_SHORT)
        .then(() => this.mainMenu());
    }

    /* ── Greeting (first open) ───────────────────────────────────── */
    greet() {
      this.state = S.MENU;
      const hasMistake = !!window.flyexCurrentMistake;
      if (hasMistake) {
        this.say(
          `Hi there! I'm ${BOT_NAME}, your FlyEX support assistant. How can I help you today?`,
          T_SHORT
        ).then(() => this.mainMenu());
      } else {
        this.say(
          `Hi! I'm ${BOT_NAME}, your FlyEX support assistant. ✈<br>How can I help you today?`,
          T_SHORT
        ).then(() => this.mainMenu());
      }
    }

    mainMenu() {
      const hasMistake = !!window.flyexCurrentMistake;
      const opts = [];
      if (hasMistake) opts.push({ label: 'There\'s an error in my booking', fn: () => this.explainErr() });
      opts.push(
        { label: 'Amend my booking',        fn: () => this.kbAnswer('amend') },
        { label: 'Visa & passport help',    fn: () => this.kbAnswer('visa') },
        { label: 'Travel insurance',        fn: () => this.kbAnswer('insurance') },
        { label: 'Cancellation & refunds',  fn: () => this.kbAnswer('cancel') },
        { label: 'Opening hours',           fn: () => this.kbAnswer('hours') },
        { label: 'Talk to an agent',        fn: () => this.handoff() },
      );
      this.chips(opts);
    }

    /* ── KB answer renderer ──────────────────────────────────────── */
    kbAnswer(id) {
      const entry = KB.find(k => k.id === id);
      if (!entry) { this.say(`I don't have specific information on that — please contact our team at <strong>support@flyex.com</strong>.`); return; }
      this.say(entry.answer, T_SHORT).then(() => {
        this.chips([
          { label: 'That helped, thanks!', fn: () => this.wrapUp() },
          { label: 'Ask something else',   fn: () => { this.say('Of course! What else can I help you with?', T_SHORT).then(() => this.mainMenu()); } },
          { label: 'Talk to an agent',     fn: () => this.handoff() },
        ]);
      });
    }

    /* ── Error explanation (KB § 4 text) ─────────────────────────── */
    explainErr() {
      const m = window.flyexCurrentMistake;
      const text = m ? (ERR_EXPLAIN[m.type] || ERR_EXPLAIN.name) : KB.find(k=>k.id==='bookingerror').answer;
      this.say(text, T_LONG).then(() => {
        this.chips([
          { label: 'Fix my booking now',  fn: () => this.startFix() },
          { label: 'Talk to an agent',    fn: () => this.handoff() },
        ]);
      });
    }

    /* ── Fix flow ────────────────────────────────────────────────── */
    startFix() {
      this.state = S.ASK_REF;
      this.say(
        `No problem at all — I can get this corrected for you right now. 😊<br><br>To verify your booking, could you please confirm your <strong>booking reference</strong>? You'll find it displayed at the top of your confirmation.`,
        T_SHORT
      ).then(() => {
        this.inp.placeholder = 'Enter booking reference…';
        this.chips([
          { label: 'Reference confirmed ✓', fn: () => { this.state = S.VERIFYING; this.verify(); } },
        ]);
      });
    }

    verify() {
      this.inp.placeholder = 'Type a message…';
      this.say('Thank you! Let me pull up your booking now…', T_SHORT)
        .then(() => this.say('I\'ve located your booking and identified the discrepancy. Reviewing the details…', T_LONG))
        .then(() => {
          const m = window.flyexCurrentMistake;
          this.state = S.OFFER_FIX;
          this.say(
            `I can confirm the issue: there is an error in the <strong>${errLabel(m)}</strong> recorded on your confirmation. I have everything I need to apply the correction immediately.<br><br>Shall I go ahead and update your booking now?`,
            T_SHORT
          ).then(() => {
            this.chips([
              { label: 'Yes, please correct it', fn: () => this.applyFix() },
              { label: 'No, I\'ll call instead',  fn: () => this.handoff() },
            ]);
          });
        });
    }

    applyFix() {
      this.state = S.FIXING;
      this.say('Applying the correction to your booking now…', T_SHORT).then(() => {
        this.patchDOM();
        const m = window.flyexCurrentMistake;
        const cv = correctValue(m, window.flyexBookingData);
        this.say(
          `✓ Done! Your <strong>${errLabel(m)}</strong> has been successfully corrected${cv ? ` to <strong>${cv}</strong>` : ''}.<br><br>Your booking now accurately reflects the details you provided. You can see the updated confirmation above.`,
          T_LONG, { ok: true }
        ).then(() => {
          this.state = S.RESOLVED;
          this.btn.classList.remove('has-error');
          window.flyexCurrentMistake = null;
          this.chips([
            { label: 'Great, thank you! 🙌',  fn: () => this.wrapUp() },
            { label: 'Ask another question',  fn: () => { this.say('Of course! What else can I help with?', T_SHORT).then(() => { this.state = S.MENU; this.mainMenu(); }); } },
          ]);
        });
      });
    }

    patchDOM() {
      const m  = window.flyexCurrentMistake;
      const bd = window.flyexBookingData;
      if (!m || !bd) return;
      const cv = correctValue(m, bd);
      const map = { name:'cf-name', date:'cf-depart', pax:'cf-pax', cabin:'cf-cabin' };
      const el = document.getElementById(map[m.type]);
      if (el) {
        el.textContent = cv;
        el.classList.remove('error');
        el.style.cssText = 'color:#86EFAC;transition:color 1.5s ease';
        setTimeout(() => { el.style.cssText = ''; }, 2600);
      }
      const ec = document.getElementById('error-card');
      if (ec) {
        ec.style.cssText = 'transition:opacity .5s ease,transform .5s ease;opacity:0;transform:translateY(-6px)';
        setTimeout(() => { ec.style.display = 'none'; }, 520);
      }
      const banner = document.getElementById('flyex-ok-banner');
      const msg    = document.getElementById('flyex-ok-msg');
      if (banner) {
        if (msg) msg.textContent = `Your ${errLabel(m)} has been corrected to "${cv}". Updated by Ava, FlyEX Support.`;
        setTimeout(() => { banner.classList.add('show'); }, 560);
      }
    }

    /* ── Handoff (KB § 5 escalation) ────────────────────────────── */
    handoff() {
      this.say(
        `Of course — here's how to reach a FlyEX advisor directly:<br><br>
         📞 <strong>+1 (800) 359-3993</strong> — 24/7 for urgent mid-journey issues<br>
         📧 <strong>support@flyex.com</strong> — response within one business day<br><br>
         Office hours are <strong>Monday – Friday, 9:00 AM – 5:00 PM</strong>. Please have your booking reference ready when you call.`,
        T_SHORT
      ).then(() => {
        this.chips([
          { label: 'Back to menu', fn: () => { this.say('Of course! What can I help with?', T_SHORT).then(() => { this.state = S.MENU; this.mainMenu(); }); } },
        ]);
      });
    }

    /* ── Wrap up ─────────────────────────────────────────────────── */
    wrapUp() {
      this.say(
        `You're all set! 🎉 If you ever need us again, we're right here. Safe travels with FlyEX! ✈`,
        T_SHORT
      );
      this.state = S.DONE;
    }
  }

  /* ── Boot ───────────────────────────────────────────────────────── */
  function boot() { injectStyles(); buildWidget(); new Bot(); }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();

})();
