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
    AWAIT_FIX_CONFIRM:'await_fix_confirm',
    VERIFYING:'verifying', OFFER_FIX:'offer_fix',
    FIXING:'fixing', RESOLVED:'resolved', DONE:'done',
    BOOKING_HELP:'booking_help', ESCALATING:'escalating',
  };

  /* ── Cross-tab agent channel ─────────────────────────────────────── */
  const CHANNEL = (() => { try { return new BroadcastChannel('flyex-support'); } catch(_) { return null; } })();

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
      answer: `I'm sorry to hear you've spotted something unexpected — and you were absolutely right to reach out straight away. Please don't worry; this is exactly what our support team is here for.<br><br>Errors relating to passenger names, travel dates, passenger count, or cabin class must be corrected before check-in, as they can affect your ability to board. The sooner we address it, the easier it is to correct — and in most cases this can be resolved without any additional fees.<br><br>I can help you sort this out right now if you'd like.`
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

  /* ── 6 error-specific messages — exact scripts from FlyEX Knowledge Base PDF ── */
  function buildErrMsg(m, bd) {
    if (!m || !bd) return `I'm sorry to hear something doesn't look right. Please don't worry — I'm here to help and we will get this corrected for you right away.`;

    // Full correct name from booking data
    const title    = bd.title    ? bd.title + ' '    : '';
    const first    = bd.firstName || '';
    const last     = bd.lastName  || '';
    const fullName = (title + first + ' ' + last).trim() || 'there';

    // Booking reference straight from the confirmation page DOM
    const ref = document.getElementById('booking-ref')?.textContent?.trim() || 'your booking';

    // Detect first-name vs last-name misspelling:
    // If displayName starts with the correct first name → the surname was corrupted
    const isLastNameErr = m.type === 'name' && m.displayName && m.displayName.startsWith(first);

    switch (true) {

      /* ── Error 1: First name misspelling ── */
      case m.type === 'name' && !isLastNameErr:
        return `Hello ${fullName},<br><br>
          I understand how frustrating it must be to spot a mistake in your own name on your booking confirmation, and I am sorry you are dealing with this. Let us get it sorted quickly.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can see that your first name appears to contain a typo. Airlines require your name to match your passport exactly, so this needs to be corrected before you travel.<br><br>
          I already have your correct details on file — your first name should read <strong>${first}</strong>. Just confirm and I will update your booking right away. You have got a trip to look forward to, and we want to make sure nothing gets in the way of that.`;

      /* ── Error 2: Last name misspelling ── */
      case m.type === 'name' && isLastNameErr:
        return `Hello ${fullName},<br><br>
          I am sorry to see this — finding an error in your booking details is the last thing you want after planning your trip, and I completely understand the concern it brings. We will take care of it right away.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can see that your last name appears to contain a typo, while your first name <strong>${first}</strong> is showing correctly. Airlines check names against your passport at check-in, so even a small difference matters and needs to be fixed before you travel.<br><br>
          I already have your correct surname on file — it should read <strong>${last}</strong>. Just confirm and I will get this corrected immediately and send you an updated confirmation so you can travel without any worries.`;

      /* ── Error 3: Departure date off by one day ── */
      case m.type === 'date' && isOneDayOff(m.depart, bd.depart):
        return `Hello ${fullName},<br><br>
          I understand how unsettling it is to see a different date on your confirmation than the one you planned your trip around — even one day off can throw everything into question. I am sorry for the stress this has caused.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can see that it is currently showing a departure of <strong>${fmtDate(m.depart)}</strong>, whereas your intended date was <strong>${fmtDate(bd.depart)}</strong>. This needs to be corrected before travel, as an incorrect date will affect your check-in.<br><br>
          I have your correct departure date on file and can update your booking straight away. Any fees associated with this correction will be waived in full. We will make sure your confirmation reflects exactly what you planned.`;

      /* ── Error 4: Departure date off by one month ── */
      case m.type === 'date' && !isOneDayOff(m.depart, bd.depart):
        return `Hello ${fullName},<br><br>
          I am truly sorry — I can imagine how alarming it must be to see an entirely different month on your booking confirmation. That is a very distressing thing to discover, especially after all the planning that goes into a trip, and I want you to know we are treating this as our top priority.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can confirm it is currently showing a departure in <strong>${monthName(m.depart)}</strong>, whereas your intended travel is in <strong>${monthName(bd.depart)}</strong>. This is urgent, as it affects your flights, accommodation, and any other arrangements tied to your travel dates.<br><br>
          I have your correct departure date on file — <strong>${fmtDate(bd.depart)}</strong> — and will correct everything without delay. We are very sorry for this, and we will do whatever it takes to put your plans back on track.`;

      /* ── Error 5: Passenger count inflated by one ── */
      case m.type === 'pax': {
        const intended  = bd.pax === '5+' ? 5 : parseInt(bd.pax);
        const displayed = m.pax;
        return `Hello ${fullName},<br><br>
          I understand how confusing and disappointing it is to see the wrong number of travellers on your booking — especially when you have planned this trip around a specific group of people. I am sorry for the added worry, and we will fix this for you right away.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can see it is currently showing <strong>${displayed} passengers</strong>, whereas your intended group size is <strong>${intended} ${intended === 1 ? 'passenger' : 'passengers'}</strong>. This affects your seat allocation and the fare on your booking, so it is important to correct before you travel.<br><br>
          I have your correct group size on file and will update the booking immediately. We want to make sure everything is exactly right for you and your travel companions.`;
      }

      /* ── Error 6: Cabin class wrong tier ── */
      case m.type === 'cabin':
        return `Hello ${fullName},<br><br>
          I understand how disappointing it is to see the wrong cabin class on your confirmation — that is not the experience you chose and you deserve to have your booking reflect exactly what you selected. I am sorry for the confusion, and we will sort this out for you.<br><br>
          I have reviewed your booking (Ref: <strong>${ref}</strong>) and can confirm it is currently showing <strong>${m.cabin}</strong>, whereas you originally booked <strong>${bd.cabin}</strong>. We need to correct this to ensure you have the right seating and service on your journey.<br><br>
          I have your correct cabin class on file — <strong>${bd.cabin}</strong> — and will update your booking straight away. If your selected class is no longer available, I will reach out personally with the best alternatives we can offer.`;

      default:
        return `Hello ${fullName},<br><br>I'm sorry to see there's a discrepancy in your booking (Ref: <strong>${ref}</strong>). Please don't worry — I'm here to help and will get this corrected for you straight away.`;
    }
  }

  /* Helper: true if the two ISO date strings differ by roughly one day (not one month) */
  function isOneDayOff(wrongIso, correctIso) {
    try {
      const diff = Math.abs(new Date(wrongIso + 'T12:00:00') - new Date(correctIso + 'T12:00:00'));
      return diff <= 2 * 24 * 60 * 60 * 1000; // ≤ 2 days → one-day error
    } catch(_) { return true; }
  }

  /* Helper: month name from ISO date string */
  function monthName(iso) {
    try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
    catch(_) { return iso; }
  }

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

      .fx-bubble.agent{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.22);color:#86EFAC}
      .fx-msg.fx-agent-msg .fx-time{color:rgba(134,239,172,.35)}
      #flyex-head.agent-mode{background:linear-gradient(135deg,rgba(16,64,32,.6),rgba(15,40,25,.5))}
      #flyex-head.agent-mode .fx-av{background:linear-gradient(135deg,#16A34A,#15803D)}
      #flyex-head.agent-mode .fx-hstatus{color:rgba(134,239,172,.55)}
      .fx-connect-wrap{display:flex;align-items:center;gap:10px;padding:10px 13px;background:rgba(26,127,232,.07);border:1px solid rgba(26,127,232,.18);border-radius:16px;border-bottom-left-radius:4px;color:rgba(232,240,255,.55);font-size:13px}
      .fx-connect-ring{width:15px;height:15px;border-radius:50%;border:2px solid rgba(26,127,232,.2);border-top-color:#1A7FE8;animation:fx-spin .9s linear infinite;flex-shrink:0}
      @keyframes fx-spin{to{transform:rotate(360deg)}}
      .fx-system-msg{align-self:center;font-size:10.5px;color:rgba(232,240,255,.22);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);padding:3px 10px;border-radius:20px;margin:2px 0}
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
      this.state          = S.IDLE;
      this.isOpen         = false;
      this.autoFlagged    = false;
      this.chatHistory    = [];
      this.agentConnected = false;
      this.escalationTimeout = null;

      this.btn   = document.getElementById('flyex-btn');
      this.panel = document.getElementById('flyex-panel');
      this.msgs  = document.getElementById('flyex-msgs');
      this.inp   = document.getElementById('flyex-inp');
      this.send  = document.getElementById('flyex-send');

      document.getElementById('flyex-x').addEventListener('click', () => this.close());
      this.btn.addEventListener('click', () => this.toggle());
      this.send.addEventListener('click', () => this.submit());
      this.inp.addEventListener('keydown', e => { if (e.key === 'Enter') this.submit(); });

      if (CHANNEL) CHANNEL.onmessage = (e) => this.handleChannelMsg(e.data);

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
      this.chatHistory.push({ role:'bot', text:html, time:this.now() });
    }

    addUser(text) {
      const d = document.createElement('div');
      d.className = 'fx-msg user';
      d.innerHTML = `<div class="fx-bubble">${text}</div><span class="fx-time">You · ${this.now()}</span>`;
      this.msgs.appendChild(d);
      this.scroll();
      this.chatHistory.push({ role:'user', text, time:this.now() });
      if (this.agentConnected && CHANNEL) {
        CHANNEL.postMessage({ type:'CUSTOMER_MSG', text, time:this.now() });
      }
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
      // When agent is live or connecting, messages go to the agent — don't route through bot
      if (this.agentConnected || this.state === S.ESCALATING) return;
      this.route(v);
    }

    /* ── Keyword router ──────────────────────────────────────────── */
    route(text) {
      const t = text.toLowerCase();

      // State-gated: waiting for fix confirmation (typed "yes" instead of clicking chip)
      const affirmative = /^(yes|yeah|yep|yup|sure|ok|okay|go ahead|please|confirm|confirmed|do it|fix it|sounds good|absolutely|correct|that.s right|please fix|fix my booking|fix it please)[\s!.]*$/.test(t);
      if (this.state === S.AWAIT_FIX_CONFIRM) {
        if (affirmative || /fix|yes|correct|sort|sure/.test(t)) { this.startFix(); return; }
        if (/agent|call|human|person/.test(t)) { this.handoff(); return; }
      }

      // State-gated: waiting for booking ref confirmation (any text counts as the ref)
      if (this.state === S.ASK_REF) { this.state = S.VERIFYING; this.verify(); return; }

      // Hard intents
      if (/agent|human|person|speak to|call|phone|representative/.test(t)) { this.handoff(); return; }
      if (/thank|thanks|great|perfect|all good|no more|bye|goodbye|sorted|no that.s|that.s all|nothing else/.test(t)) { this.wrapUp(); return; }

      // ── Social / small talk ──────────────────────────────────────
      if (/^(hi+|hey+|hello+|howdy|hiya|yo|sup|greetings|good (morning|afternoon|evening|day))[\s!?.]*$/.test(t)) { this.smallTalk('greeting', t); return; }
      if (/how (are|r) (you|u)\??|how.s it going|you doing\??|you alright\??|how are things/.test(t)) { this.smallTalk('howAreYou', t); return; }
      if (/who are you|what are you|are you (a |an )?(bot|robot|ai|human|real|person|chatbot)|are you real|are you human/.test(t)) { this.smallTalk('whoAreYou', t); return; }
      if (/(what.?s your name|your name|what should i call you|what do i call you)/.test(t)) { this.smallTalk('yourName', t); return; }
      if (/i.m (good|great|fine|well|doing well|not bad|alright|okay|not too bad|doing great|fantastic|wonderful)/.test(t)) { this.smallTalk('userGood', t); return; }
      if (/i.m (not great|not good|struggling|having a (rough|bad) day|a bit stressed|a bit worried|tired|exhausted|stressed out|overwhelmed)/.test(t)) { this.smallTalk('userBad', t); return; }
      if (/i.m (excited|so excited|thrilled|pumped|over the moon)|can.t wait (for|to) (my trip|fly|travel|go)|really looking forward/.test(t)) { this.smallTalk('tripExcited', t); return; }
      if (/i.m (nervous|anxious|a bit worried|not sure) (about )?(my trip|flying|the flight|travelling)/.test(t)) { this.smallTalk('tripNervous', t); return; }
      if (/(going to|travelling to|flying to|heading to|off to|trip to|visiting) [a-z]/.test(t)) { this.smallTalk('destination', t); return; }
      if (/you.?re (great|amazing|helpful|wonderful|lovely|brilliant|fantastic|the best|so kind)|you.?ve been (so |really )?helpful|(thank you so much|you.?re awesome)/.test(t)) { this.smallTalk('compliment', t); return; }
      if (/do you (like|love|enjoy|have a favou?rite|travel)|what.s your favou?rite|have you (been|visited)|do you ever/.test(t)) { this.smallTalk('personal', t); return; }
      if (/tell me (about yourself|a joke|something interesting|a fun fact)|can you (joke|tell a joke)/.test(t)) { this.smallTalk('fun', t); return; }

      // ── Booking guidance intent ──────────────────────────────────
      if (/how (do|can|to) (i |we |you )?book|how (do|can) (i|we) (fly|travel|get there)|want to book|make a booking|book a (flight|ticket|trip)|i.?d like to (book|fly|travel)|step.?by.?step|walk me through|guide me|getting started|ready to book|start(ing)? (a |my |the )?booking|new booking|place a booking|how (does|do) (booking|it) work|how (do i|to) (start|begin|make|complete)|i want to (book|fly|travel)/.test(t)) {
        this.bookingGuide(text); return;
      }

      // ── Booking step queries — typed or chip, any state ──────────
      if (/\bstep (1|one|1st|first)\b|(^|\s)(your|my) details(\s|$)|personal (info|details|information)|(what('s| is)|tell me about|help (with|on)) (step (1|one)|my details|the (first|1st) step)|name.*form|form.*name/.test(t)) { this.bookingStepDetail(1); return; }
      if (/\bstep (2|two|2nd|second)\b|(^|\s)flight (details|info|information)(\s|$)|(what('s| is)|tell me about|help (with|on)) (step (2|two)|flight (details|info)|the (second|2nd) step)|departure airport|which (cabin|class)|number of passengers|flying from|flying to/.test(t)) { this.bookingStepDetail(2); return; }
      if (/\bstep (3|three|3rd|third)\b|(what('s| is)|tell me about|help (with|on)) (step (3|three)|the (third|3rd|final|last) step|review|confirm)|review (my )?(booking|details)|how (do i|to) confirm|final step|last step/.test(t)) { this.bookingStepDetail(3); return; }

      // Error / booking problem intent → direct to fix flow
      if (/error|wrong|incorrect|mistake|doesn.t match|not right|discrepan|issue|problem|name.*wrong|date.*wrong|passenger.*wrong|cabin.*wrong|fix|correct my/.test(t)) {
        if (window.flyexCurrentMistake) {
          // Go straight to the personalised PDF script for this error type
          this.explainErr();
        } else {
          const kbEntry = KB.find(k => k.id === 'bookingerror');
          this.say(kbEntry.answer, T_SHORT).then(() => {
            this.chips([
              { label: 'Amend my booking', fn: () => this.kbAnswer('amend') },
              { label: 'Talk to an agent', fn: () => this.handoff() },
            ]);
          });
        }
        return;
      }

      // KB keyword match
      const match = KB.find(k => k.keywords.test(t));
      if (match) { this.kbAnswer(match.id); return; }

      // Fallback
      this.say(`I want to make sure I give you exactly the right help — could you tell me a little more about what you need? Or feel free to choose from the options below and I'll take it from there.`, T_SHORT)
        .then(() => this.mainMenu());
    }

    /* ── Greeting (first open) ───────────────────────────────────── */
    greet() {
      this.state = S.MENU;
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const hasMistake = !!window.flyexCurrentMistake;
      if (hasMistake) {
        this.say(pick([
          `Hi there! I'm ${BOT_NAME}, your FlyEX support assistant — and I'm already on it. 😊 Whatever's on your mind, you've come to the right place. How can I help you today?`,
          `Hey! I'm ${BOT_NAME} from FlyEX. I notice you might have a question about your booking — I'm here and happy to help. What's going on?`,
        ]), T_SHORT).then(() => this.mainMenu());
      } else {
        this.say(pick([
          `Hi there! I'm ${BOT_NAME}, your FlyEX support assistant. ✈<br><br>Booking questions, travel advice, visa info, or just a chat about where you're headed — I'm here for all of it. What can I do for you today?`,
          `Hey! Welcome to FlyEX — I'm ${BOT_NAME}, your virtual travel companion. 😊<br><br>Whether you need help with a booking or just want to know more about what we offer, fire away. What's on your mind?`,
          `Hi! Great to have you here. I'm ${BOT_NAME} — FlyEX's support assistant and, unofficially, a travel enthusiast. ✈<br><br>What can I help you with today?`,
        ]), T_SHORT).then(() => this.mainMenu());
      }
    }

    mainMenu() {
      const hasMistake = !!window.flyexCurrentMistake;
      const opts = [];
      if (hasMistake) opts.push({ label: 'There\'s an error in my booking', fn: () => this.explainErr() });
      else opts.push({ label: 'I have a booking issue', fn: () => this.kbAnswer('bookingerror') });
      opts.push(
        { label: 'How do I book a flight?', fn: () => this.bookingGuide() },
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
          { label: 'That helped, thank you!', fn: () => this.wrapUp() },
          { label: 'I have another question', fn: () => { this.say('Of course — I\'m happy to help. What else is on your mind?', T_SHORT).then(() => this.mainMenu()); } },
          { label: 'Talk to an agent',        fn: () => this.handoff() },
        ]);
      });
    }

    /* ── Error explanation — exact KB PDF scripts per error type ─── */
    explainErr() {
      const m  = window.flyexCurrentMistake;
      const bd = window.flyexBookingData;
      const text = m ? buildErrMsg(m, bd) : KB.find(k => k.id === 'bookingerror').answer;
      this.say(text, T_LONG).then(() => {
        this.state = S.AWAIT_FIX_CONFIRM;
        this.chips([
          { label: 'Yes, please fix my booking', fn: () => this.startFix() },
          { label: 'Talk to an agent instead',   fn: () => this.handoff() },
        ]);
      });
    }

    /* ── Fix flow ────────────────────────────────────────────────── */
    startFix() {
      this.state = S.ASK_REF;
      this.say(
        `Not to worry — you've done exactly the right thing by reaching out, and I'm going to take care of this for you right now. 😊<br><br>To verify your booking, could you please confirm your <strong>booking reference</strong>? You'll find it at the top of your confirmation page.`,
        T_SHORT
      ).then(() => {
        this.inp.placeholder = 'Enter booking reference…';
        this.chips([
          { label: 'I can see it — confirmed ✓', fn: () => { this.state = S.VERIFYING; this.verify(); } },
        ]);
      });
    }

    verify() {
      this.inp.placeholder = 'Type a message…';
      this.say('Thank you — I really appreciate your patience. Let me locate your booking now…', T_SHORT)
        .then(() => this.say('I\'ve found your booking. Give me just a moment while I review the confirmation details carefully…', T_LONG))
        .then(() => {
          const m = window.flyexCurrentMistake;
          return this.say(
            `I\'ve identified the discrepancy — there is an error in the <strong>${errLabel(m)}</strong> on your confirmation. Applying the correction for you right now…`,
            T_SHORT
          );
        })
        .then(() => this.applyFix());
    }

    applyFix() {
      this.state = S.FIXING;
      this.say('Wonderful — leave it with me. Applying the correction to your booking right now…', T_SHORT).then(() => {
        this.patchDOM();
        const m = window.flyexCurrentMistake;
        const cv = correctValue(m, window.flyexBookingData);
        this.say(
          `✓ All done! I\'m pleased to confirm that your <strong>${errLabel(m)}</strong> has been successfully corrected${cv ? ` to <strong>${cv}</strong>` : ''}.<br><br>Your booking now fully reflects the details you provided. You can see the updated confirmation above — please do take a moment to review it. We\'re sorry for any concern this may have caused, and thank you for bringing it to our attention so promptly.`,
          T_LONG, { ok: true }
        ).then(() => {
          this.state = S.RESOLVED;
          this.btn.classList.remove('has-error');
          window.flyexCurrentMistake = null;
          this.chips([
            { label: 'Great, thank you! 🙌',  fn: () => this.wrapUp() },
            { label: 'I have another question', fn: () => { this.say('Of course — I\'m happy to help with anything else. What\'s on your mind?', T_SHORT).then(() => { this.state = S.MENU; this.mainMenu(); }); } },
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

    /* ── Handoff — offer live agent first, contact details as fallback ── */
    handoff() {
      this.say(
        `Absolutely — let me get you connected with one of our advisors. We want to make sure you get the best possible support.`,
        T_SHORT
      ).then(() => {
        this.chips([
          { label: '💬 Connect with an agent now', fn: () => this.escalateToAgent() },
          { label: '📞 Call or email instead',     fn: () => this.showContactInfo() },
        ]);
      });
    }

    showContactInfo() {
      this.say(
        `Here's how to reach us directly:<br><br>` +
        `📞 <strong>+1 (800) 359-3993</strong><br>Available 24/7 for urgent mid-journey situations<br><br>` +
        `📧 <strong>support@flyex.com</strong><br>We respond within one business day<br><br>` +
        `Our office hours are <strong>Monday – Friday, 9:00 AM – 5:00 PM</strong>. Please have your booking reference ready — it helps us locate your details quickly.`,
        T_SHORT
      ).then(() => {
        this.chips([
          { label: '💬 Connect with an agent instead', fn: () => this.escalateToAgent() },
          { label: 'Back to menu', fn: () => { this.state = S.MENU; this.mainMenu(); } },
        ]);
      });
    }

    /* ── Live agent escalation ───────────────────────────────────── */
    escalateToAgent() {
      this.state = S.ESCALATING;
      this.clearChips();
      this.say(`Perfect — give me just a moment while I connect you with one of our advisors. 😊`, T_SHORT)
        .then(() => {
          this.showConnecting();
          const ref = document.getElementById('booking-ref')?.textContent?.trim() || null;
          const payload = {
            type: 'SESSION_DATA',
            bookingData: window.flyexBookingData ? { ...window.flyexBookingData, bookingRef: ref } : null,
            mistakeData: window.flyexCurrentMistake || null,
            chatHistory: this.chatHistory,
          };
          if (CHANNEL) CHANNEL.postMessage(payload);
          try { localStorage.setItem('flyex_session', JSON.stringify({ ...payload, timestamp: Date.now() })); } catch(_) {}

          this.escalationTimeout = setTimeout(() => {
            if (!this.agentConnected) {
              this.hideConnecting();
              this.state = S.MENU;
              this.say(`I'm sorry — all our advisors are currently with other customers. Here's how to reach us in the meantime:`, T_SHORT)
                .then(() => this.showContactInfo());
            }
          }, 45000);
        });
    }

    /* ── Channel message handler ─────────────────────────────────── */
    handleChannelMsg(data) {
      switch (data.type) {
        case 'AGENT_JOINED':
          clearTimeout(this.escalationTimeout);
          this.hideConnecting();
          this.agentConnected = true;
          this.inp.placeholder = 'Reply to your advisor…';
          this.updateHeaderForAgent(data.agentName || 'Support Agent');
          this.addSystemMsg(`${data.agentName || 'A FlyEX advisor'} has joined`);
          this.say(
            `You're now connected with <strong>${data.agentName || 'a FlyEX advisor'}</strong>. They have your full booking details and chat history — please go ahead. 🙏`,
            T_SHORT
          );
          break;
        case 'AGENT_MSG':
          this.hideAgentTyping();
          this.showAgentMessage(data.text, data.agentName, data.time);
          break;
        case 'AGENT_TYPING':
          if (data.isTyping) this.showAgentTyping(data.agentName);
          else this.hideAgentTyping();
          break;
        case 'AGENT_LEFT':
          this.agentConnected = false;
          this.restoreHeader();
          this.inp.placeholder = 'Type a message…';
          this.hideAgentTyping();
          this.addSystemMsg('Session ended by advisor');
          this.say(
            `Your advisor has ended this session. I'm still here if you need anything else — don't hesitate to ask. 😊`,
            T_SHORT
          ).then(() => {
            this.state = S.MENU;
            this.chips([{ label: 'Back to main menu', fn: () => this.mainMenu() }]);
          });
          break;
        case 'APPLY_FIX':
          this.patchDOM();
          if (CHANNEL) CHANNEL.postMessage({ type: 'FIX_APPLIED' });
          break;
      }
    }

    /* ── Agent message bubble ────────────────────────────────────── */
    showAgentMessage(text, agentName, time) {
      const d = document.createElement('div');
      d.className = 'fx-msg bot fx-agent-msg';
      const label = agentName || 'Agent';
      d.innerHTML = `<div class="fx-bubble agent">${text}</div><span class="fx-time">${label} · ${time || this.now()}</span>`;
      this.msgs.appendChild(d);
      this.chatHistory.push({ role:'agent', text, time: this.now() });
      this.scroll();
    }

    /* ── Connecting / typing states ──────────────────────────────── */
    showConnecting() {
      if (document.getElementById('fx-connecting')) return;
      const d = document.createElement('div');
      d.className = 'fx-msg bot'; d.id = 'fx-connecting';
      d.innerHTML = `<div class="fx-connect-wrap"><div class="fx-connect-ring"></div><span>Connecting you with an advisor…</span></div>`;
      this.msgs.appendChild(d); this.scroll();
    }
    hideConnecting() { document.getElementById('fx-connecting')?.remove(); }

    showAgentTyping(name) {
      if (document.getElementById('fx-agent-typ')) return;
      const d = document.createElement('div');
      d.className = 'fx-msg bot fx-typing'; d.id = 'fx-agent-typ';
      d.innerHTML = `<div class="fx-bubble agent"><div class="fx-dots"><span></span><span></span><span></span></div></div><span class="fx-time">${name || 'Agent'} is typing…</span>`;
      this.msgs.appendChild(d); this.scroll();
    }
    hideAgentTyping() { document.getElementById('fx-agent-typ')?.remove(); }

    addSystemMsg(text) {
      const d = document.createElement('div');
      d.className = 'fx-system-msg';
      d.textContent = text;
      this.msgs.appendChild(d); this.scroll();
    }

    /* ── Header swap ─────────────────────────────────────────────── */
    updateHeaderForAgent(name) {
      const head = document.getElementById('flyex-head');
      if (head) head.classList.add('agent-mode');
      const n = head?.querySelector('.fx-hname');
      if (n) n.textContent = `${name} · FlyEX Support`;
      const s = head?.querySelector('.fx-hstatus');
      if (s) s.textContent = 'Agent connected';
    }
    restoreHeader() {
      const head = document.getElementById('flyex-head');
      if (head) head.classList.remove('agent-mode');
      const n = head?.querySelector('.fx-hname');
      if (n) n.textContent = `${BOT_NAME} · FlyEX Support`;
      const s = head?.querySelector('.fx-hstatus');
      if (s) s.textContent = 'Online · Replies instantly';
    }

    /* ── Wrap up ─────────────────────────────────────────────────── */
    wrapUp() {
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      this.say(pick([
        `It's been a genuine pleasure helping you today. 🎉 You're all set — and if anything else comes up before or during your trip, we're always here. Safe and wonderful travels with FlyEX! ✈`,
        `Always a pleasure! 😊 You're in great hands — safe travels, and don't hesitate to come back if you need anything at all. FlyEX is rooting for an amazing trip for you. ✈`,
        `So glad I could help! Have an absolutely wonderful journey — and remember, we're here 24/7 if anything ever comes up mid-trip. Safe travels! ✈🌍`,
      ]), T_SHORT);
      this.state = S.DONE;
    }

    /* ── Booking guide ───────────────────────────────────────────── */
    bookingGuide(rawText = '') {
      // Try to pull a destination name out of what the user said
      const destMatch = rawText.match(
        /(?:to|for|visiting?|flying to|heading to|going to|travel(?:ling)? to|book(?:ing)?(?: a (?:flight|ticket))?(?: to)?)\s+([A-Z][a-z]+(?:[\s,]+[A-Za-z]+)*)/
      );
      const dest = destMatch ? destMatch[1].replace(/[.,!?]+$/, '').trim() : null;

      const onBookingPage = !!document.getElementById('page-1');

      const intro = dest
        ? `${dest} — what a great choice! ✈ Let me walk you through exactly how to book your flight with FlyEX. It takes just a few minutes and I'll be here the whole time if anything comes up.`
        : `Of course — happy to walk you through it! Booking with FlyEX is quick and straightforward. Here's exactly how it works, step by step:`;

      const guide =
        `<strong>Step 1 — Your Details</strong><br>` +
        `Enter your name <em>exactly</em> as it appears on your passport — this is important for check-in. Add your email address (your confirmation will be sent there), phone number, nationality, and date of birth, then click <em>Continue to Flight Info</em>.<br><br>` +

        `<strong>Step 2 — Flight Details</strong><br>` +
        `• <strong>Flying from:</strong> choose your departure airport — we cover hundreds across Africa, Europe, and the US<br>` +
        (dest ? `• <strong>Flying to:</strong> select <em>${dest}</em> from the destination list<br>` : `• <strong>Flying to:</strong> pick your destination from the list<br>`) +
        `• <strong>Departure date:</strong> use the calendar to select your travel date<br>` +
        `• <strong>Return date:</strong> optional — leave it blank for a one-way ticket<br>` +
        `• <strong>Passengers & cabin class:</strong> choose how many are travelling and your preferred cabin (Economy through to First Class)<br>` +
        `• <strong>Special requests:</strong> add anything you need — dietary requirements, wheelchair assistance, seat preferences<br>` +
        `Then click <em>Review booking</em>.<br><br>` +

        `<strong>Step 3 — Review & Confirm</strong><br>` +
        `Take a moment to check every detail matches your passport exactly. When you're happy, hit <em>Confirm booking</em> — you'll get a booking reference instantly. One of our advisors will then be in touch to finalise payment. That's it! 🎉`;

      this.say(intro, T_SHORT)
        .then(() => this.say(guide, T_LONG))
        .then(() => {
          this.state = S.BOOKING_HELP;
          const chips = [];
          if (!onBookingPage) {
            chips.push({ label: '✈ Take me to Book Now', fn: () => { window.location.href = 'booking.html'; } });
          }
          chips.push(
            { label: 'Step 1 — Your details',    fn: () => this.bookingStepDetail(1) },
            { label: 'Step 2 — Flight details',  fn: () => this.bookingStepDetail(2) },
            { label: 'Step 3 — Review & confirm',fn: () => this.bookingStepDetail(3) },
            { label: 'Back to main menu',        fn: () => this.mainMenu() },
          );
          this.chips(chips);
        });
    }

    /* Step detail — called from chips AND from typed input */
    bookingStepDetail(n) {
      const content = {
        1:
          `<strong>Step 1 — Your Details</strong><br><br>` +
          `• <strong>Title, First name, Last name</strong> — enter exactly as on your passport; airlines check this at check-in<br>` +
          `• <strong>Email address</strong> — your booking confirmation is sent here, so double-check it<br>` +
          `• <strong>Phone number</strong> — optional, but useful if we need to reach you urgently<br>` +
          `• <strong>Nationality</strong> — start typing to search; used for visa checks<br>` +
          `• <strong>Date of birth</strong> — select from the calendar that appears<br><br>` +
          `Once everything's filled in, click <em>Continue to Flight Info</em> to move on.`,
        2:
          `<strong>Step 2 — Flight Details</strong><br><br>` +
          `• <strong>Flying from</strong> — choose your departure airport from our list covering Africa, Europe, and the US<br>` +
          `• <strong>Flying to</strong> — select your destination (Tokyo, Paris, Lagos, Bali, and more)<br>` +
          `• <strong>Departure date</strong> — required; tap the calendar to pick your travel date<br>` +
          `• <strong>Return date</strong> — optional; leave it blank if you only need a one-way ticket<br>` +
          `• <strong>Passengers</strong> — select how many people are travelling (1 to 5+)<br>` +
          `• <strong>Cabin class</strong> — Economy, Premium Economy, Business Class, or First Class<br>` +
          `• <strong>Special requests</strong> — dietary requirements, wheelchair assistance, seat preferences, etc. (all optional)<br><br>` +
          `Click <em>Review booking</em> when you're happy with everything.`,
        3:
          `<strong>Step 3 — Review & Confirm</strong><br><br>` +
          `This is your final check before the booking is placed:<br><br>` +
          `• Review your <strong>passenger details</strong> — name, email, nationality, date of birth<br>` +
          `• Review your <strong>flight details</strong> — route, dates, number of passengers, cabin class<br>` +
          `• Make sure everything matches your passport exactly — even a small typo in your name can cause issues at check-in<br><br>` +
          `Happy with everything? Hit <em>Confirm booking</em>. You'll receive a <strong>booking reference</strong> on screen immediately, and a FlyEX advisor will be in touch to finalise payment. 🎉`,
      };

      this.state = S.BOOKING_HELP;
      this.say(content[n], T_SHORT).then(() => {
        const other = [1, 2, 3].filter(i => i !== n);
        this.chips([
          { label: `Step ${other[0]} — ${['Your details','Flight details','Review & confirm'][other[0]-1]}`, fn: () => this.bookingStepDetail(other[0]) },
          { label: `Step ${other[1]} — ${['Your details','Flight details','Review & confirm'][other[1]-1]}`, fn: () => this.bookingStepDetail(other[1]) },
          { label: 'Back to full guide', fn: () => this.bookingGuide() },
          { label: 'Something else',    fn: () => { this.state = S.MENU; this.mainMenu(); } },
        ]);
      });
    }

    /* ── Small talk / social ─────────────────────────────────────── */
    smallTalk(type, t = '') {
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];

      const responses = {
        greeting: pick([
          `Hey there! Great to see you — I'm ${BOT_NAME}, your FlyEX support sidekick. What can I do for you today?`,
          `Hello! 👋 Lovely to have you here. I'm ${BOT_NAME} — whether it's a quick question or something more involved, I've got you. What's on your mind?`,
          `Hi! Happy you stopped by. I'm ${BOT_NAME}, and helping people with their travel is genuinely my favourite thing. How can I assist?`,
          `Hey! Welcome to FlyEX — I'm ${BOT_NAME}. Ready to help with bookings, travel questions, or just a good chat. What can I do for you?`,
        ]),
        howAreYou: pick([
          `Doing really well, thanks for asking! Honestly, there's nothing I enjoy more than a good conversation and knowing someone's trip is going to go smoothly. 😄 How about you — all good your end?`,
          `Brilliant, thanks! Every chat is its own little adventure for me. Are you gearing up for a trip, or is there something I can help you sort out?`,
          `Great, thank you! I'd be lying if I said I don't love these conversations. How are things with you today?`,
          `Honestly? Wonderful. I get to talk about travel all day — that's basically a dream. 😄 How are you doing?`,
        ]),
        whoAreYou: pick([
          `I'm ${BOT_NAME} — a virtual support assistant for FlyEX. So yes, I'm an AI, but I promise I'm one of the friendly ones. 😊 I know everything there is to know about our services, and I'm here for bookings, travel questions, or just a chat while you plan your next adventure.`,
          `Good question! I'm ${BOT_NAME}, FlyEX's support assistant. AI-powered, travel-obsessed, and entirely here for you. What can I help with?`,
          `I'm ${BOT_NAME} — think of me as your very enthusiastic travel companion who also happens to know all the logistics. AI through and through, but I like to think I've got a human touch. 😊 What brings you here today?`,
        ]),
        yourName: pick([
          `I'm ${BOT_NAME}! Short for… well, just ${BOT_NAME}. 😄 FlyEX's support assistant and unofficial travel enthusiast. What can I do for you?`,
          `${BOT_NAME} — nice to officially meet you! Your FlyEX virtual support assistant, at your service. How can I help today?`,
          `${BOT_NAME}. I was going to pick something more dramatic, but it suits me. 😄 What can I help you with?`,
        ]),
        userGood: pick([
          `That's great to hear! 😊 Ready to help with anything travel-related whenever you need — just say the word.`,
          `Glad to hear it! Nothing beats having a trip to look forward to, right? What can I do for you today?`,
          `Love to hear it! 😄 So, what brings you to FlyEX today?`,
        ]),
        userBad: pick([
          `I'm really sorry to hear that — I hope I can at least take the travel side of things off your plate. Tell me what's going on and we'll sort it together.`,
          `Oh no — I'm sorry you're having a tough time. If there's anything with your booking that's adding to the stress, let's deal with that first. What's the situation?`,
          `I'm sorry to hear that. Let's see if I can make at least one thing a little easier for you today. What do you need?`,
        ]),
        tripExcited: pick([
          `Oh, that's wonderful — I love hearing that! There's something genuinely magical about the lead-up to a trip. Where are you headed?`,
          `That excitement is completely contagious! ✈ I hope I can help make sure everything goes perfectly for your journey. Is there anything I can look into for you?`,
          `Now that's what I like to hear! A trip on the horizon is the best kind of news. Is everything looking good with your booking?`,
          `Oh I love this energy! ✈🌍 Safe to say you've come to the right place. What can I help you with?`,
        ]),
        tripNervous: pick([
          `That's completely understandable — travel can feel like a lot, especially if something's come up with your booking. But you're in exactly the right place, and we'll sort it together. What's going on?`,
          `I hear you, and I'm really glad you reached out. Tell me what's on your mind and we'll take it one step at a time — that's what I'm here for.`,
          `Totally normal to feel that way, and honestly the fact you're asking questions in advance puts you well ahead. What's worrying you?`,
        ]),
        destination: (() => {
          const dest = t.match(/(?:going to|travelling to|flying to|heading to|off to|trip to|visiting) ([a-z ]+?)(?:\s|$|[.,!?])/);
          const place = dest ? dest[1].trim() : null;
          return pick([
            place
              ? `Oh, ${place} — fantastic choice! ✈ Is there anything I can help you with for your journey?`
              : `Oh, how exciting — there's nothing quite like having a trip to look forward to! Is there anything I can help with?`,
            `Wonderful! ✈ I hope it's going to be an amazing experience. Is everything looking good with your booking, or is there something you'd like me to check?`,
            `Lucky you! 🌍 Is there anything I can help you with — visa requirements, travel insurance, or your booking details?`,
          ]);
        })(),
        compliment: pick([
          `Oh, that genuinely makes my day — thank you so much! It's exactly what I'm here for. 😊 Is there anything else I can help with?`,
          `You're too kind! It's been a pleasure. Anything else on your mind, or are you all set?`,
          `That means a lot, truly. I hope your travels are every bit as smooth. Anything else I can do for you?`,
          `Ha, now you're going to make me blush. 😄 Always happy to help — anything else?`,
        ]),
        personal: pick([
          `Ha — I wish I could say I've been everywhere myself! I don't travel (the perks of being an AI 😄), but I've helped plan enough trips that I feel like I've seen the world vicariously. Do you have somewhere exciting in mind?`,
          `I'd love to, but airports don't have AI check-in lanes just yet. 😄 I do live for the travel stories though — what's yours?`,
          `Honestly, my favourite destination is whichever one my travellers are most excited about — it's infectious! Is there a trip you're planning?`,
        ]),
        fun: pick([
          `Oh, you want a fun fact? Here's one: the world's shortest commercial flight is in Scotland — just 1.7 miles, under 2 minutes in the air. You spend more time boarding than flying. 😄 Anything else I can help with?`,
          `A travel joke? Okay: why don't scientists trust atoms? Because they make up everything — kind of like a budget airline's "included" fees. 😄 What can I actually help you with today?`,
          `Did you know Heathrow Airport alone handles around 1,300 flights every single day? That's a lot of people trying to find their gate. 😄 What can I do for you?`,
        ]),
      };

      const msg = responses[type];
      if (!msg) return;

      this.say(msg, T_SHORT).then(() => {
        if (!['compliment'].includes(type)) {
          this.chips([
            { label: 'View all options', fn: () => this.mainMenu() },
            { label: 'Talk to an agent', fn: () => this.handoff() },
          ]);
        }
      });
    }
  }

  /* ── Boot ───────────────────────────────────────────────────────── */
  function boot() { injectStyles(); buildWidget(); new Bot(); }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();

})();
