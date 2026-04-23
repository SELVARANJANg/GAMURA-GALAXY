import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Download, Plus, Trash2, ChevronDown } from "lucide-react";

interface Experience {
  position: string;
  company: string;
  period: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
}

interface CustomSection {
  title: string;
  content: string;
}

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: string[];
  hobbies: string[];
  customSections: CustomSection[];
}

const initialData: ResumeData = {
  name: "Selvaranjan",
  title: "Cybersecurity & Technology Professional",
  email: "sr@gamura.in",
  phone: "0123456789",
  location: "India",
  linkedin: "linkedin.com/in/selvaranjan",
  website: "gamura.vercel.app",
  summary: "Passionate technology professional with expertise in cybersecurity and digital innovation. Certified in Cyber Hygiene Practices under India's MeitY/ISEA initiative. Dedicated to building secure, innovative digital solutions and continuously advancing technical skills in cybersecurity, web development, prompt engineering, and emerging technologies.",
  experience: [
    {
      position: "Technology Developer & Creator",
      company: "Gamura – Personal Brand",
      period: "2022 – Present",
      description: "Building innovative web applications and digital solutions. Developing expertise in modern frameworks, UI/UX design, and full-stack web development. Managing a personal technology brand focused on creativity, problem-solving, and digital innovation."
    }
  ],
  education: [
    {
      degree: "Certification in Cyber Hygiene Practices",
      institution: "ISEA / MeitY, Government of India",
      period: "2023 – 2024",
      description: "Comprehensive training covering cybersecurity awareness, digital hygiene practices, network security fundamentals, threat identification, and modern information protection standards."
    }
  ],
  skills: ["Cybersecurity", "Cyber Hygiene", "Prompt Engineering", "Web Development", "React.js", "JavaScript", "HTML/CSS", "UI/UX Design", "Digital Security", "Problem Solving"],
  languages: ["English", "Tamil"],
  hobbies: ["Cybersecurity Research", "Prompt Engineering", "Web Development", "Technology Innovation", "Digital Learning"],
  customSections: [
    {
      title: "Achievements",
      content: "• Awarded 'Innovation Star' for web security contributions.\n• Developed 10+ open-source cybersecurity tools."
    }
  ]
};

const tplMeta = [
  { name: "Classic Split", badge: "Two Column" },
  { name: "Bold Black", badge: "Centered" },
  { name: "Nordic Line", badge: "Timeline" },
  { name: "Gold Prestige", badge: "Elegant" },
  { name: "Midnight Dark", badge: "Dark Mode" },
  { name: "Creative Coral", badge: "Vibrant" },
  { name: "Ultra Minimal", badge: "Clean" },
  { name: "Steel Blue", badge: "Corporate" },
];

function esc(s: string) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ic(em: string, label: string, val: string) {
  if (!val) return "";
  return `<div style="display:flex;gap:10px;margin-bottom:11px;align-items:flex-start;">
    <div style="width:24px;height:24px;background:#444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${em}</div>
    <div><div style="font-size:10.5px;font-weight:700;color:#fff;">${label}</div><div style="font-size:10.5px;color:#ccc;word-break:break-all;">${esc(val)}</div></div>
  </div>`;
}

function renderExtras(sections: CustomSection[], side: boolean, accentColor = "#222", dark = false) {
  if (!sections || sections.length === 0) return "";
  return sections.map(s => `
    <div style="margin-bottom:24px;width:100%;">
      <h2 style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${dark ? '#00b4d8' : (side ? '#999' : '#222')};border-bottom:${side ? 'none' : '2px solid '+accentColor};padding-bottom:6px;margin-bottom:12px;">${esc(s.title)}</h2>
      <p style="font-size:12px;line-height:1.75;color:${dark ? '#9abccc' : (side ? '#ddd' : '#555')};white-space:pre-line;">${esc(s.content)}</p>
    </div>
  `).join('');
}

const templates = [
  // 0: Classic Split
  (d: ResumeData) => `<div style="display:flex;width:794px;min-height:1123px;font-family:Arial,Helvetica,sans-serif;color:#333;">
<div style="width:238px;background:#2b2b2b;color:#fff;padding:30px 20px;flex-shrink:0;">
  <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,.15);">
    <h1 style="font-size:21px;font-weight:700;line-height:1.25;word-break:break-word;">${esc(d.name)}</h1>
    <p style="font-size:11px;color:#bbb;margin-top:5px;line-height:1.4;">${esc(d.title)}</p>
  </div>
  <h3 style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:13px;">Profile</h3>
  ${ic('📍', 'Location', d.location)}${ic('✉', 'Email', d.email)}${ic('📱', 'Mobile', d.phone)}${ic('🌐', 'Website', d.website)}${ic('💼', 'LinkedIn', d.linkedin)}
  <div style="border-top:1px solid rgba(255,255,255,.12);margin:18px 0;"></div>
  <h3 style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:11px;">Skills</h3>
  ${d.skills.map(s => `<div style="font-size:11.5px;color:#ddd;margin-bottom:5px;">– ${esc(s)}</div>`).join('')}
  <div style="border-top:1px solid rgba(255,255,255,.12);margin:18px 0;"></div>
  <h3 style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:11px;">Languages</h3>
  ${d.languages.map(l => `<div style="font-size:11.5px;color:#ddd;margin-bottom:5px;">– ${esc(l)}</div>`).join('')}
  <div style="border-top:1px solid rgba(255,255,255,.12);margin:18px 0;"></div>
  <h3 style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:11px;">Hobbies</h3>
  ${d.hobbies.map(h => `<div style="font-size:11.5px;color:#ddd;margin-bottom:5px;">– ${esc(h)}</div>`).join('')}
</div>
<div style="flex:1;background:#fff;padding:34px 28px;">
  <div style="margin-bottom:24px;">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#222;border-bottom:2px solid #222;padding-bottom:6px;margin-bottom:12px;">About Me</h2>
    <p style="font-size:12px;line-height:1.75;color:#555;">${esc(d.summary)}</p>
  </div>
  <div style="margin-bottom:24px;">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#222;border-bottom:2px solid #222;padding-bottom:6px;margin-bottom:14px;">Professional Experience</h2>
    ${d.experience.map(e => `<div style="display:flex;gap:14px;margin-bottom:16px;">
      <div style="width:98px;flex-shrink:0;">
        <div style="font-size:10.5px;color:#888;line-height:1.5;">${esc(e.position)}</div>
        <div style="font-size:10.5px;color:#888;">${esc(e.company)}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:#222;margin-bottom:4px;">${esc(e.period)}</div>
        <p style="font-size:11.5px;line-height:1.65;color:#555;">${esc(e.description)}</p>
      </div>
    </div>`).join('')}
  </div>
  <div style="margin-bottom:24px;">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#222;border-bottom:2px solid #222;padding-bottom:6px;margin-bottom:14px;">Education</h2>
    ${d.education.map(e => `<div style="display:flex;gap:14px;margin-bottom:16px;">
      <div style="width:98px;flex-shrink:0;font-size:10.5px;color:#888;">${esc(e.period)}</div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:#222;margin-bottom:3px;">${esc(e.degree)}</div>
        <div style="font-size:10.5px;color:#888;margin-bottom:5px;">${esc(e.institution)}</div>
        <p style="font-size:11.5px;line-height:1.65;color:#555;">${esc(e.description)}</p>
      </div>
    </div>`).join('')}
  </div>
  ${renderExtras(d.customSections, false)}
</div></div>`,

  // 1: Bold Black
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#fff;font-family:Arial,Helvetica,sans-serif;padding:48px 56px;color:#111;">
  <div style="text-align:center;margin-bottom:26px;">
    <h1 style="font-size:40px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#111;margin-bottom:7px;">${esc(d.name)}</h1>
    <p style="font-size:13px;color:#666;letter-spacing:1px;">${esc(d.title)}</p>
    <div style="border-bottom:1px solid #ddd;margin:15px 0 13px;"></div>
    <div style="display:flex;justify-content:center;gap:24px;font-size:11.5px;color:#666;flex-wrap:wrap;">
      <span>📞 ${esc(d.phone)}</span><span>✉ ${esc(d.email)}</span><span>📍 ${esc(d.location)}</span>
    </div>
  </div>
  <div style="margin-bottom:26px;">
    <h2 style="font-size:13px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;border-bottom:2.5px solid #111;padding-bottom:6px;margin-bottom:12px;">About Me</h2>
    <p style="font-size:12.5px;line-height:1.8;color:#444;">${esc(d.summary)}</p>
  </div>
  <div style="border-bottom:1px solid #eee;margin-bottom:26px;"></div>
  <div style="margin-bottom:26px;">
    <h2 style="font-size:13px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;border-bottom:2.5px solid #111;padding-bottom:6px;margin-bottom:15px;">Education</h2>
    ${d.education.map(e => `<div style="margin-bottom:17px;">
      <div style="font-size:11px;color:#999;margin-bottom:3px;">${esc(e.institution)} | ${esc(e.period)}</div>
      <div style="font-size:13.5px;font-weight:700;color:#111;margin-bottom:6px;">${esc(e.degree)}</div>
      <p style="font-size:12px;line-height:1.72;color:#555;">${esc(e.description)}</p>
    </div>`).join('')}
  </div>
  <div style="border-bottom:1px solid #eee;margin-bottom:26px;"></div>
  <div style="margin-bottom:26px;">
    <h2 style="font-size:13px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;border-bottom:2.5px solid #111;padding-bottom:6px;margin-bottom:15px;">Work Experience</h2>
    ${d.experience.map(e => `<div style="margin-bottom:18px;">
      <div style="font-size:11px;color:#999;margin-bottom:3px;">${esc(e.company)} | ${esc(e.period)}</div>
      <div style="font-size:13.5px;font-weight:700;color:#111;margin-bottom:6px;">${esc(e.position)}</div>
      <p style="font-size:12px;line-height:1.72;color:#555;">${esc(e.description)}</p>
    </div>`).join('')}
  </div>
  <div style="margin-bottom:26px;">
    ${renderExtras(d.customSections, false, "#111")}
  </div>
  <div>
    <h2 style="font-size:13px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;border-bottom:2.5px solid #111;padding-bottom:6px;margin-bottom:13px;">Skills</h2>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${d.skills.map(s => `<span style="font-size:12px;padding:5px 13px;border:1px solid #ddd;border-radius:20px;color:#444;">• ${esc(s)}</span>`).join('')}
    </div>
  </div>
</div>`,

  // 2: Nordic Line
  (d: ResumeData) => {
    const parts = d.name.split(' ');
    const fn = parts[0] || d.name;
    const ln = parts.slice(1).join(' ') || '';
    return `<div style="width:794px;min-height:1123px;background:#f7f7f7;font-family:'Trebuchet MS',Arial,sans-serif;color:#222;padding:50px 48px 40px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;">
        <div>
          <div style="font-size:48px;font-weight:900;letter-spacing:9px;line-height:1;text-transform:uppercase;color:#111;">${esc(fn)}</div>
          <div style="font-size:38px;font-weight:200;letter-spacing:9px;line-height:1.15;text-transform:uppercase;color:#666;">${esc(ln)}</div>
          <div style="font-size:9.5px;letter-spacing:5px;text-transform:uppercase;color:#999;margin-top:10px;">${esc(d.title)}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#666;line-height:2.1;margin-top:6px;">
          <div>${esc(d.phone)}</div><div>${esc(d.email)}</div><div>${esc(d.location)}</div><div>${esc(d.website)}</div>
        </div>
      </div>
      <div style="border-top:1px solid #ccc;margin-bottom:22px;"></div>
      <p style="font-size:12.5px;line-height:1.8;color:#555;margin-bottom:22px;">${esc(d.summary)}</p>
      <div style="border-top:1px solid #ccc;margin-bottom:28px;"></div>
      <div style="display:flex;">
        <div style="width:256px;flex-shrink:0;padding-right:28px;border-right:1px solid #ccc;">
          <h3 style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#aaa;margin-bottom:15px;">Skills</h3>
          ${d.skills.map(s => `<div style="font-size:12px;color:#444;margin-bottom:7px;">• ${esc(s)}</div>`).join('')}
          <div style="margin-top:20px;">
            <h3 style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#aaa;margin-bottom:15px;">Education</h3>
            ${d.education.map(e => `<div style="margin-bottom:15px;">
              <div style="font-size:12px;font-weight:700;">${esc(e.degree)}</div>
              <div style="font-size:11px;color:#666;">${esc(e.institution)}</div>
              <div style="font-size:10px;color:#999;">${esc(e.period)}</div>
              <div style="font-size:10.5px;color:#777;margin-top:3px;line-height:1.4;">${esc(e.description)}</div>
            </div>`).join('')}
          </div>
        </div>
        <div style="flex:1;padding-left:28px;">
           <h3 style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#aaa;margin-bottom:15px;">Experience</h3>
           ${d.experience.map(e => `<div style="margin-bottom:20px;">
             <div style="font-size:14px;font-weight:700;">${esc(e.position)}</div>
             <div style="font-size:11px;color:#e76f51;margin-bottom:5px;">${esc(e.company)} | ${esc(e.period)}</div>
             <p style="font-size:12px;line-height:1.6;color:#555;">${esc(e.description)}</p>
           </div>`).join('')}
           ${renderExtras(d.customSections, false, "#ccc")}
        </div>
      </div>
    </div>`;
  },

  // 3: Gold Prestige
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#fff;font-family:Georgia,'Times New Roman',serif;padding:60px 48px;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="font-size:42px;font-weight:400;color:#c9a84c;margin-bottom:5px;letter-spacing:4px;text-transform:uppercase;">${esc(d.name)}</h1>
      <p style="font-size:12px;color:#999;letter-spacing:6px;text-transform:uppercase;margin-bottom:20px;">${esc(d.title)}</p>
      <div style="display:flex;justify-content:center;gap:30px;font-size:11px;color:#c9a84c;font-family:Arial;">
        <span>${esc(d.email)}</span><span>${esc(d.phone)}</span><span>${esc(d.location)}</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:40px;">
       <div>
         <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#c9a84c;border-bottom:1px solid #c9a84c;padding-bottom:5px;margin-bottom:15px;">Education</h3>
         ${d.education.map(e => `<div style="margin-bottom:15px;">
           <div style="font-size:12px;font-weight:700;">${esc(e.degree)}</div>
           <div style="font-size:11px;color:#666;margin-bottom:2px;">${esc(e.institution)} | ${esc(e.period)}</div>
           <p style="font-size:10.5px;color:#888;line-height:1.4;">${esc(e.description)}</p>
         </div>`).join('')}
       </div>
       <div>
         <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#c9a84c;border-bottom:1px solid #c9a84c;padding-bottom:5px;margin-bottom:15px;">Work Experience</h3>
         ${d.experience.map(e => `<div style="margin-bottom:20px;">
           <div style="font-size:14px;font-weight:700;color:#333;">${esc(e.position)}</div>
           <div style="font-size:11px;color:#c9a84c;margin-bottom:8px;">${esc(e.company)} | ${esc(e.period)}</div>
           <p style="font-size:12px;line-height:1.7;">${esc(e.description)}</p>
         </div>`).join('')}
         ${renderExtras(d.customSections, false, "#c9a84c")}
       </div>
    </div>
  </div>`,

  // 4: Midnight Dark
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#0f1923;font-family:Arial,Helvetica,sans-serif;color:#d8e8f0;padding:50px 60px;">
    <div style="border-left:4px solid #00b4d8;padding-left:20px;margin-bottom:40px;">
      <h1 style="font-size:48px;font-weight:900;color:#fff;margin:0;">${esc(d.name)}</h1>
      <p style="font-size:14px;color:#00b4d8;text-transform:uppercase;letter-spacing:4px;margin-top:5px;">${esc(d.title)}</p>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:50px;">
       <div>
         <h2 style="font-size:12px;text-transform:uppercase;color:#00b4d8;letter-spacing:3px;margin-bottom:15px;">Experience</h2>
         ${d.experience.map(e => `<div style="margin-bottom:25px;">
           <div style="font-size:16px;font-weight:700;color:#fff;">${esc(e.position)}</div>
           <div style="font-size:12px;color:#00b4d8;margin-bottom:8px;">${esc(e.company)} / ${esc(e.period)}</div>
           <p style="font-size:13px;line-height:1.7;color:#9abccc;">${esc(e.description)}</p>
         </div>`).join('')}
         <h2 style="font-size:12px;text-transform:uppercase;color:#00b4d8;letter-spacing:3px;margin-top:40px;margin-bottom:15px;">Education</h2>
         ${d.education.map(e => `<div style="margin-bottom:20px;">
           <div style="font-size:16px;font-weight:700;color:#fff;">${esc(e.degree)}</div>
           <div style="font-size:12px;color:#00b4d8;margin-bottom:4px;">${esc(e.institution)} / ${esc(e.period)}</div>
           <p style="font-size:13px;line-height:1.7;color:#9abccc;">${esc(e.description)}</p>
         </div>`).join('')}
         ${renderExtras(d.customSections, false, "#00b4d8", true)}
       </div>
       <div>
         <h2 style="font-size:12px;text-transform:uppercase;color:#00b4d8;letter-spacing:3px;margin-bottom:15px;">Contact</h2>
         <div style="font-size:13px;color:#9abccc;line-height:2.2;margin-bottom:30px;">
           <div>${esc(d.phone)}</div><div>${esc(d.email)}</div><div>${esc(d.location)}</div>
         </div>
         <h2 style="font-size:12px;text-transform:uppercase;color:#00b4d8;letter-spacing:3px;margin-bottom:15px;">Skills</h2>
         ${d.skills.map(s => `<div style="font-size:13px;color:#9abccc;margin-bottom:8px;">• ${esc(s)}</div>`).join('')}
       </div>
    </div>
  </div>`,

  // 5: Creative Coral
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#fff;font-family:'Trebuchet MS',Arial,sans-serif;display:flex;flex-direction:column;">
    <div style="background:#e76f51;color:#fff;padding:50px 60px;">
       <h1 style="font-size:42px;font-weight:900;margin-bottom:5px;">${esc(d.name)}</h1>
       <p style="font-size:14px;text-transform:uppercase;letter-spacing:3px;opacity:0.9;">${esc(d.title)}</p>
    </div>
    <div style="display:flex;flex:1;">
       <div style="width:260px;background:#fdf8f5;padding:40px 30px;border-right:1px solid #f0e8e0;">
          <h3 style="font-size:10px;text-transform:uppercase;color:#e76f51;letter-spacing:2px;margin-bottom:15px;">Education</h3>
          ${d.education.map(e => `<div style="margin-bottom:20px;">
            <div style="font-size:12px;font-weight:700;">${esc(e.degree)}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px;">${esc(e.institution)} / ${esc(e.period)}</div>
            <p style="font-size:10.5px;color:#777;line-height:1.4;">${esc(e.description)}</p>
          </div>`).join('')}
          <h3 style="font-size:10px;text-transform:uppercase;color:#e76f51;letter-spacing:2px;margin-top:30px;margin-bottom:15px;">Contact</h3>
          <div style="font-size:11px;color:#555;line-height:2;">
            <div>${esc(d.phone)}</div><div>${esc(d.email)}</div><div>${esc(d.location)}</div>
          </div>
       </div>
       <div style="flex:1;padding:40px 50px;">
          <h3 style="font-size:10px;text-transform:uppercase;color:#264653;border-bottom:2px solid #e76f51;padding-bottom:5px;margin-bottom:20px;">Experience</h3>
          ${d.experience.map(e => `<div style="margin-bottom:25px;">
            <div style="font-size:16px;font-weight:700;color:#264653;">${esc(e.position)}</div>
            <div style="font-size:12px;color:#e76f51;margin-bottom:8px;">${esc(e.company)} / ${esc(e.period)}</div>
            <p style="font-size:13px;line-height:1.7;color:#555;">${esc(e.description)}</p>
          </div>`).join('')}
          ${renderExtras(d.customSections, false, "#e76f51")}
       </div>
    </div>
  </div>`,

  // 6: Ultra Minimal
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#fff;font-family:Georgia,'Times New Roman',serif;color:#111;padding:80px 100px;">
    <h1 style="font-size:48px;font-weight:400;margin-bottom:10px;">${esc(d.name)}</h1>
    <p style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:4px;margin-bottom:40px;">${esc(d.title)}</p>
    <div style="font-size:12px;color:#666;margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;">
      <span>${esc(d.email)}</span><span>${esc(d.phone)}</span><span>${esc(d.location)}</span><span>${esc(d.linkedin || "")}${(d.linkedin && d.website) ? " | " : ""}${esc(d.website || "")}</span>
    </div>
    <div style="border-top:1px solid #111;margin-bottom:40px;"></div>
    <div style="margin-bottom:40px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:5px;color:#aaa;margin-bottom:20px;">Experience</h2>
      ${d.experience.map(e => `<div style="margin-bottom:30px;">
        <div style="font-size:16px;font-weight:700;margin-bottom:5px;">${esc(e.position)}</div>
        <div style="font-size:12px;color:#999;margin-bottom:10px;">${esc(e.company)} | ${esc(e.period)}</div>
        <p style="font-size:14px;line-height:1.8;color:#445;">${esc(e.description)}</p>
      </div>`).join('')}
    </div>
    <div style="margin-bottom:40px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:5px;color:#aaa;margin-bottom:20px;">Education</h2>
      ${d.education.map(e => `<div style="margin-bottom:30px;">
        <div style="font-size:16px;font-weight:700;margin-bottom:5px;">${esc(e.degree)}</div>
        <div style="font-size:12px;color:#999;margin-bottom:10px;">${esc(e.institution)} | ${esc(e.period)}</div>
        <p style="font-size:14px;line-height:1.8;color:#445;">${esc(e.description)}</p>
      </div>`).join('')}
    </div>
    <div style="margin-bottom:40px;">
      ${renderExtras(d.customSections, false, "#111")}
    </div>
    <div>
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:5px;color:#aaa;margin-bottom:20px;">Skills</h2>
      <p style="font-size:14px;line-height:1.8;color:#445;">${d.skills.join(' · ')}</p>
    </div>
  </div>`,

  // 7: Steel Blue
  (d: ResumeData) => `<div style="width:794px;min-height:1123px;background:#fff;font-family:Arial,Helvetica,sans-serif;display:flex;">
    <div style="width:8px;background:linear-gradient(to bottom,#1d3557,#457b9d,#a8dadc);flex-shrink:0;"></div>
    <div style="flex:1;padding:60px 50px;">
       <div style="background:#1d3557;color:#fff;padding:30px 40px;margin-bottom:40px;border-radius:0 20px 20px 0;margin-left:-50px;display:inline-block;min-width:320px;">
          <h1 style="font-size:32px;font-weight:900;margin:0;">${esc(d.name)}</h1>
          <p style="font-size:12px;color:#a8dadc;text-transform:uppercase;letter-spacing:3px;margin-top:5px;">${esc(d.title)}</p>
       </div>
       <div style="display:flex;gap:40px;margin-bottom:30px;font-size:11px;color:#666;">
          <span>📞 ${esc(d.phone)}</span><span>✉ ${esc(d.email)}</span><span>📍 ${esc(d.location)}</span>
       </div>
       <div style="display:grid;grid-template-columns:1fr;gap:40px;">
          <div>
            <h2 style="font-size:12px;text-transform:uppercase;color:#1d3557;letter-spacing:3px;border-bottom:2px solid #a8dadc;padding-bottom:5px;margin-bottom:20px;">Work Experience</h2>
            ${d.experience.map(e => `<div style="margin-bottom:25px;">
              <div style="font-size:15px;font-weight:700;color:#1d3557;">${esc(e.position)}</div>
              <div style="font-size:11px;color:#457b9d;margin-bottom:8px;">${esc(e.company)} | ${esc(e.period)}</div>
              <p style="font-size:13px;line-height:1.7;color:#445;">${esc(e.description)}</p>
            </div>`).join('')}
          </div>
          <div>
            <h2 style="font-size:12px;text-transform:uppercase;color:#1d3557;letter-spacing:3px;border-bottom:2px solid #a8dadc;padding-bottom:5px;margin-bottom:20px;">Education</h2>
            ${d.education.map(e => `<div style="margin-bottom:20px;">
              <div style="font-size:14px;font-weight:700;color:#1d3557;">${esc(e.degree)}</div>
              <div style="font-size:11px;color:#457b9d;margin-bottom:3px;">${esc(e.institution)} | ${esc(e.period)}</div>
              <p style="font-size:12px;color:#666;">${esc(e.description)}</p>
            </div>`).join('')}
          </div>
          <div>
            ${renderExtras(d.customSections, false, "#a8dadc")}
          </div>
          <div>
            <h2 style="font-size:12px;text-transform:uppercase;color:#1d3557;letter-spacing:3px;border-bottom:2px solid #a8dadc;padding-bottom:5px;margin-bottom:15px;">Skills</h2>
            <div style="display:flex;flex-wrap:wrap;gap:10px;">
              ${d.skills.map(s => `<span style="font-size:12px;color:#1d3557;background:#f0f4f8;padding:4px 12px;border-radius:4px;">${esc(s)}</span>`).join('')}
            </div>
          </div>
       </div>
    </div>
  </div>`,
];

// Helper to render correctly
const renderTemplate = (id: number, data: ResumeData) => {
  // If template is missing from array above, return a basic fallback
  if (id >= templates.length) return templates[0](data);
  return templates[id](data);
};

const ResumePreview = ({ tplId, data }: { tplId: number; data: ResumeData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const containerWidth = entry.contentRect.width - 64; // Horizontal padding
        const containerHeight = entry.contentRect.height - 64; // Vertical padding
        const targetWidth = 794;
        const targetHeight = 1123;
        
        const scaleW = Math.min(1, containerWidth / targetWidth);
        const scaleH = Math.min(1, containerHeight / targetHeight);
        
        // Prefer scaling to fit width, but ensure it's readable
        setScale(Math.max(0.3, scaleW)); 
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex-1 bg-[#d0d0d0] overflow-hidden flex justify-center items-start p-8 overscroll-contain relative">
      <div 
        className="shadow-[0_30px_100px_rgba(0,0,0,0.4)] bg-white origin-top transition-transform duration-500 ease-out" 
        style={{ 
          width: '794px', 
          minHeight: '1123px',
          transform: `scale(${scale})`,
          marginBottom: `-${(1 - scale) * 1123}px` // Compensate for scaled height in parent flow
        }}
      >
         <div dangerouslySetInnerHTML={{ __html: renderTemplate(tplId, data) }} />
      </div>
      
      {/* Zoom Indicator */}
      <div className="absolute bottom-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white tracking-widest uppercase border border-white/10 z-10">
        Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default function ResumeBuilder() {
  const [view, setView] = useState<"gallery" | "editor">("gallery");
  const [selectedTpl, setSelectedTpl] = useState(0);
  const [data, setData] = useState<ResumeData>(initialData);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Personal Info": true,
    "Summary": true,
    "Experience": true
  });

  const toggleSection = (s: string) => {
    setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));
  };

  const updateData = (key: keyof ResumeData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

   const updateList = (type: "experience" | "education" | "customSections", index: number, field: string, value: string) => {
    const list = [...data[type]];
    (list[index] as any)[field] = value;
    updateData(type, list);
  };

  const handleDownload = () => {
    const html = renderTemplate(selectedTpl, data);
    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(data.name)} – Resume</title><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:210mm;background:#fff;}@page{margin:0;size:A4 portrait;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-[#c9a84c]/20">
      <AnimatePresence mode="wait">
        {view === "gallery" ? (
          <motion.div 
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto no-scrollbar pb-20"
          >
            {/* Hero Section */}
            <div className="relative text-center py-16 px-4 overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.18)_0%,transparent_70%)] pointer-events-none" />
               <div className="relative z-10">
                 <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-12 bg-[#c9a84c] opacity-40 shrink-0" />
                    <span className="font-['Josefin_Sans'] text-[10px] tracking-[7px] uppercase text-[#c9a84c] font-bold">Gamura RB</span>
                    <div className="h-px w-12 bg-[#c9a84c] opacity-40 shrink-0" />
                 </div>
                 <h1 className="font-['Playfair_Display'] text-4xl sm:text-6xl font-black leading-[1.05] mb-6 text-[#1e293b]">
                   Your Resume,<br />
                   <span className="bg-gradient-to-br from-[#c9a84c] to-[#e8c97e] bg-clip-text text-transparent">Perfectly Designed</span>
                 </h1>
                 <p className="text-sm sm:text-base text-[#64748b] font-light max-w-lg mx-auto leading-relaxed mb-4">
                   8 professional templates pre-filled with your details. Edit in full screen and download instantly.
                 </p>
                 <span className="inline-block font-['Josefin_Sans'] text-[10px] tracking-[3px] uppercase text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/20 px-4 py-1.5 rounded-full font-bold">
                   ®GAMURA
                 </span>
               </div>
            </div>

            {/* Template Grid */}
            <div className="max-w-7xl mx-auto px-6">
               <div className="font-['Josefin_Sans'] text-[10px] tracking-[6px] uppercase text-[#64748b] text-center mb-10">— Choose Your Template —</div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {tplMeta.map((t, i) => (
                   <motion.div
                     key={i}
                     whileHover={{ y: -5 }}
                     onClick={() => { setSelectedTpl(i); setView("editor"); }}
                     className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden cursor-pointer group hover:border-[#c9a84c] transition-all shadow-sm hover:shadow-[0_24px_48px_rgba(0,0,0,0.05),0_0_0_1px_rgba(201,168,76,0.2)]"
                   >
                     <div id={`template-card-${i}`} className="h-56 bg-[#f1f5f9] relative overflow-hidden flex items-center justify-center p-4">
                        <div className="w-[794px] scale-[0.22] origin-center opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div dangerouslySetInnerHTML={{ __html: renderTemplate(i, data) }} />
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                          <button className="bg-gradient-to-br from-[#c9a84c] to-[#e8c97e] text-black px-6 py-2.5 font-['Josefin_Sans'] text-[10px] font-bold tracking-[3px] uppercase rounded shadow-lg">
                            Use Template
                          </button>
                        </div>
                     </div>
                     <div className="p-4 border-t border-[#e2e8f0] flex items-center justify-between">
                        <span className="font-['Josefin_Sans'] text-sm font-semibold tracking-wide text-[#1e293b]">{t.name}</span>
                        <span className="text-[9px] font-['Josefin_Sans'] tracking-[2px] uppercase text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/25 px-2 py-0.5 rounded-full font-bold">{t.badge}</span>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden bg-white"
          >
            {/* Editor Bar */}
            <div className="h-16 bg-white border-b border-[#e2e8f0] flex items-center px-4 gap-4 shrink-0 shadow-sm z-50">
               <button 
                 onClick={() => setView("gallery")}
                 className="flex items-center gap-2 px-3 py-1.5 border border-[#e2e8f0] rounded-lg hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors text-xs font-bold text-[#64748b] bg-[#f8fafc]"
               >
                 <ArrowLeft className="w-4 h-4" /> Templates
               </button>
               <div className="px-3 py-1 bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-full font-['Josefin_Sans'] text-[10px] tracking-[2px] uppercase text-[#c9a84c] font-bold">
                 {tplMeta[selectedTpl].name}
               </div>

               <div className="ml-auto flex items-center gap-4">
                 <button 
                  id="download-resume-pdf-btn"
                  onClick={handleDownload}
                  className="bg-[#c9a84c] text-black px-6 py-2.5 font-['Josefin_Sans'] text-[10px] font-bold tracking-[2px] uppercase rounded-xl shadow-[0_8px_24px_rgba(201,168,76,0.25)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
                 >
                   <Download className="w-4 h-4" /> Download Resume
                 </button>
               </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
               {/* Form Panel */}
               <div className="flex-1 bg-[#f8fafc] overflow-y-auto no-scrollbar p-6 lg:p-12">
                 <div className="max-w-4xl mx-auto space-y-4">
                   <Section 
                     title="Personal Information" 
                     isOpen={openSections["Personal Info"]} 
                     onToggle={() => toggleSection("Personal Info")}
                   >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                         <Input label="Name" value={data.name} onChange={v => updateData('name', v)} />
                         <Input label="Job Title" value={data.title} onChange={v => updateData('title', v)} />
                         <Input label="Email Address" value={data.email} onChange={v => updateData('email', v)} />
                         <Input label="Phone Number" value={data.phone} onChange={v => updateData('phone', v)} />
                         <Input label="Location" value={data.location} onChange={v => updateData('location', v)} />
                         <Input label="LinkedIn" value={data.linkedin} onChange={v => updateData('linkedin', v)} />
                         <div className="md:col-span-2">
                            <Input label="Website" value={data.website} onChange={v => updateData('website', v)} />
                         </div>
                        </div>
                     </Section>

                     <Section 
                        title="Professional Summary" 
                        isOpen={openSections["Summary"]} 
                        onToggle={() => toggleSection("Summary")}
                     >
                       <Textarea label="About Me" value={data.summary} onChange={v => updateData('summary', v)} />
                     </Section>

                     <Section 
                        title="Work Experience" 
                        isOpen={openSections["Experience"]} 
                        onToggle={() => toggleSection("Experience")}
                     >
                        <div className="space-y-6">
                           {data.experience.map((e, i) => (
                             <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 group relative shadow-sm">
                               <div className="flex items-center justify-between mb-5">
                                 <span className="text-[10px] text-[#c9a84c] font-black tracking-widest uppercase bg-[#c9a84c]/5 px-2 py-1 rounded">Position {i+1}</span>
                                 <button 
                                   onClick={() => {
                                     const list = [...data.experience];
                                     list.splice(i, 1);
                                     updateData('experience', list);
                                   }}
                                   className="p-1 px-3 border border-red-100 text-red-500 rounded-lg text-[10px] hover:bg-red-50 transition-colors font-bold uppercase tracking-wider shadow-sm"
                                 >
                                   <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
                                 </button>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <Input label="Job Title" value={e.position} onChange={v => updateList('experience', i, 'position', v)} />
                                 <Input label="Company Name" value={e.company} onChange={v => updateList('experience', i, 'company', v)} />
                                 <Input label="Time Period" value={e.period} onChange={v => updateList('experience', i, 'period', v)} />
                               </div>
                               <div className="h-4" />
                               <Textarea label="Responsibilities" value={e.description} onChange={v => updateList('experience', i, 'description', v)} />
                             </div>
                           ))}
                           <button 
                             onClick={() => updateData('experience', [...data.experience, { position: '', company: '', period: '', description: '' }])}
                             className="w-full py-6 border-2 border-dashed border-[#e2e8f0] text-[#64748b] rounded-2xl text-[11px] font-black uppercase tracking-[3px] hover:border-[#c9a84c] hover:text-[#c9a84c] bg-white transition-all flex items-center justify-center gap-3 group shadow-sm"
                           >
                             <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add New Position
                           </button>
                        </div>
                     </Section>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Section 
                           title="Education" 
                           isOpen={openSections["Education"]} 
                           onToggle={() => toggleSection("Education")}
                        >
                           <div className="space-y-4">
                             {data.education.map((e, i) => (
                               <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-5 group shadow-sm">
                                 <div className="flex items-center justify-between mb-4">
                                   <span className="text-[9px] text-[#c9a84c] font-black uppercase tracking-widest">Entry {i+1}</span>
                                   <Trash2 className="w-4 h-4 text-red-200 hover:text-red-500 cursor-pointer transition-colors" onClick={() => {
                                      const list = [...data.education];
                                      list.splice(i, 1);
                                      updateData('education', list);
                                   }} />
                                 </div>
                                 <Input label="Degree / Cert" value={e.degree} onChange={v => updateList('education', i, 'degree', v)} />
                                 <Input label="Institution" value={e.institution} onChange={v => updateList('education', i, 'institution', v)} />
                                 <Input label="Period" value={e.period} onChange={v => updateList('education', i, 'period', v)} />
                               </div>
                             ))}
                             <button 
                               onClick={() => updateData('education', [...data.education, { degree: '', institution: '', period: '', description: '' }])}
                               className="w-full py-4 border border-dashed border-[#e2e8f0] text-[#64748b] rounded-xl text-[10px] font-bold uppercase tracking-[2px] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all flex items-center justify-center gap-2 bg-white shadow-sm"
                             >
                               <Plus className="w-4 h-4" /> Add Education
                             </button>
                           </div>
                        </Section>

                        <Section 
                           title="Skills & Meta" 
                           isOpen={openSections["Skills"]} 
                           onToggle={() => toggleSection("Skills")}
                        >
                          <Textarea label="Relevant Skills" value={data.skills.join(', ')} onChange={v => updateData('skills', v.split(',').map(s => s.trim()).filter(Boolean))} />
                          <div className="h-4" />
                          <Input label="Languages" value={data.languages.join(', ')} onChange={v => updateData('languages', v.split(',').map(s => s.trim()).filter(Boolean))} />
                          <Input label="Hobbies" value={data.hobbies.join(', ')} onChange={v => updateData('hobbies', v.split(',').map(s => s.trim()).filter(Boolean))} />
                        </Section>
                     </div>

                     <Section 
                        title="Custom Sections" 
                        isOpen={openSections["Additional"]} 
                        onToggle={() => toggleSection("Additional")}
                     >
                        <div className="space-y-4">
                          {data.customSections.map((s, i) => (
                            <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 group relative shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] text-[#c9a84c] font-black uppercase tracking-[2px]">Custom Title {i+1}</span>
                                <button 
                                  onClick={() => {
                                    const list = [...data.customSections];
                                    list.splice(i, 1);
                                    setData({...data, customSections: list});
                                  }}
                                  className="p-1 px-3 border border-red-100 text-red-500 rounded-lg text-[10px] hover:bg-red-50 transition-colors font-bold uppercase tracking-wider shadow-sm"
                                >
                                  Delete
                                </button>
                              </div>
                              <Input label="Section Title" value={s.title} onChange={v => updateList('customSections', i, 'title', v)} />
                              <div className="h-4" />
                              <Textarea label="Content / Details" value={s.content} onChange={v => updateList('customSections', i, 'content', v)} />
                            </div>
                          ))}
                          <button 
                            onClick={() => setData({...data, customSections: [...data.customSections, { title: 'New Category', content: '' }]})}
                            className="w-full py-6 border-2 border-dashed border-[#e2e8f0] text-[#64748b] rounded-2xl text-[11px] font-black uppercase tracking-[3px] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all flex items-center justify-center gap-3 bg-white shadow-sm"
                          >
                            <Plus className="w-5 h-5" /> Add New Section
                          </button>
                        </div>
                     </Section>

                     {/* Final Action */}
                     <div className="pt-8 pb-12 flex justify-center">
                        <button 
                          onClick={handleDownload}
                          className="bg-[#c9a84c] text-black px-12 py-5 font-['Josefin_Sans'] text-xs font-black tracking-[4px] uppercase rounded-full shadow-[0_12px_40px_rgba(201,168,76,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 group"
                        >
                          <Download className="w-6 h-6 group-hover:bounce transition-all" /> 
                          Download My Resume
                        </button>
                     </div>
                   </div>
                 </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children: ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#f8fafc] transition-colors group"
      >
        <span className="font-['Josefin_Sans'] text-[11px] font-black uppercase tracking-[3.5px] text-[#1e293b] group-hover:text-[#c9a84c] transition-colors">{title}</span>
        <ChevronDown className={`w-4 h-4 text-[#94a3b8] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#fafbfd]"
          >
            <div className="px-6 pb-6 pt-2 border-t border-[#f1f5f9]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 mb-4">
      <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 outline-none transition-all shadow-sm placeholder:opacity-40"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 mb-4">
      <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest">{label}</label>
      <textarea 
        rows={4}
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 outline-none transition-all shadow-sm resize-none placeholder:opacity-40 no-scrollbar"
      />
    </div>
  );
}
