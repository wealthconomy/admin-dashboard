"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Wallet, Target, Crosshair, Users, Activity,
  Briefcase, TrendingUp, Minus, Calendar, FileText, FileSpreadsheet,
  ShieldCheck, ChevronDown, ChevronUp, Leaf, BarChart2, Blend,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<
  string,
  { label: string; description: string; color: string; accent: string; icon: any }
> = {
  wealthflex:  { label:"WealthFlex",  description:"Flexible savings plan with variable interest rates",        color:"text-red-500",    accent:"bg-red-50 border-red-100",     icon:Wallet    },
  wealthgoal:  { label:"WealthGoal",  description:"Goal-based savings plan to achieve personal targets",       color:"text-pink-500",   accent:"bg-pink-50 border-pink-100",   icon:Target    },
  wealthfix:   { label:"WealthFix",   description:"Fixed-term savings with a guaranteed maturity date",        color:"text-orange-500", accent:"bg-orange-50 border-orange-100",icon:Crosshair },
  wealthfam:   { label:"WealthFam",   description:"Family-oriented group savings plan",                        color:"text-purple-500", accent:"bg-purple-50 border-purple-100",icon:Users     },
  wealthflow:  { label:"WealthFlow",  description:"Automated recurring savings and investment plan",           color:"text-blue-500",   accent:"bg-blue-50 border-blue-100",   icon:Activity  },
  wealthgroup: { label:"WealthGroup", description:"Cooperative group savings and contributions",               color:"text-gray-600",   accent:"bg-gray-50 border-gray-200",   icon:Briefcase },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SavingType = "interest" | "impact" | "mixed";

type PlanUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  balance: number;
  savingType: SavingType;
  hasInterest: boolean;       // true for interest / mixed types
  interestRate?: number;      // annual % rate
  interestAmount?: number;    // actual ₦ earned = balance × rate / 100
  wealthPactAmount?: number;  // interest accrued to wealthpact for impact savers
  // WealthFix
  maturityDate?: string;
  fixStartDate?: string;
  // WealthGoal
  goalName?: string;
  goalTarget?: number;
  goalDeadline?: string;
  goalStartDate?: string;
};

type GroupMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  contribution: number;
  savingType: SavingType;
  interestRate?: number;
  interestAmount?: number;
  wealthPactAmount?: number;
  isAdmin: boolean;
};

type WealthGroupData = {
  id: string;
  groupName: string;
  groupTarget: number;   // total savings goal for the group
  startDate: string;
  endDate: string;
  members: GroupMember[];
};

// ─── Mock data — flat plans ───────────────────────────────────────────────────

const SAVING_TYPES: SavingType[] = ["interest","impact","mixed","interest","mixed","impact","interest","mixed","interest","impact","mixed","interest"];

function calcInterest(balance: number, savingType: SavingType, rate: number): number {
  if (savingType === "impact") return 0;
  return parseFloat((balance * rate / 100).toFixed(2));
}

function generateUsers(plan: string): PlanUser[] {
  const seed = plan.length;
  const names: [string, string, string, number][] = [
    ["Chisom Nwosu",     "chisom.n@gmail.com",     "08031234567", 3],
    ["Fatima Bello",     "fatima.b@outlook.com",   "08121450923", 7],
    ["Adewale Ogunyemi","adewale.o@yahoo.com",     "07012345678", 2],
    ["Blessing Eze",    "blessing.e@gmail.com",    "09056781234", 5],
    ["Emeka Chukwu",    "emeka.c@hotmail.com",     "08033456789", 8],
    ["Ngozi Obi",       "ngozi.o@gmail.com",       "07087654321", 1],
    ["Segun Adebayo",   "segun.a@wealthco.ng",     "08099887766", 6],
    ["Amina Suleiman",  "amina.s@gmail.com",       "08155667788", 4],
    ["Tunde Lawanson",  "tunde.l@icloud.com",      "08166778899", 9],
    ["Obiageli Nwofor", "obiageli.n@gmail.com",    "07099001122", 3],
    ["David Okonkwo",   "david.ok@outlook.com",    "08011223344", 7],
    ["Kemi Adesanya",   "kemi.a@gmail.com",        "07033445566", 2],
  ];

  const maturityDates  = ["2025-03-15","2025-06-30","2025-09-10","2026-01-01","2026-04-22","2026-07-14","2026-12-31","2027-02-28","2025-11-20","2026-08-05","2027-06-15","2025-05-01"];
  const fixStartDates  = ["2024-03-15","2024-06-30","2023-09-10","2024-01-01","2024-04-22","2024-07-14","2023-12-31","2024-02-28","2024-11-20","2023-08-05","2024-06-15","2024-05-01"];
  const goalNames      = ["New Car","House Rent","Wedding Fund","Emergency Reserve","Business Capital","School Fees","Travel & Vacation","Laptop & Gadgets","Land Purchase","Medical Fund","Investment Seed","Family Home"];
  const goalTargets    = [2500000,450000,1800000,750000,5000000,380000,620000,280000,12000000,500000,3000000,8500000];
  const goalDeadlines  = ["2026-12-01","2026-09-30","2027-03-15","2026-07-01","2027-06-30","2026-10-01","2026-11-20","2026-08-15","2028-01-01","2026-09-01","2027-01-15","2029-06-01"];
  const goalStartDates = ["2025-01-01","2025-06-01","2024-09-15","2025-03-01","2024-06-30","2025-07-01","2025-05-20","2025-09-15","2023-01-01","2025-04-01","2025-10-15","2024-06-01"];

  return names.map(([name, email, phone, avatarId], idx) => {
    const balanceSeed    = (seed * (idx + 1) * 17) % 100;
    const balance        = 15000 + balanceSeed * 4800 + idx * 12350;
    const savingType     = SAVING_TYPES[idx];
    const hasInterest    = savingType !== "impact";
    const baseRate       = 3.5 + ((seed + idx) % 10) * 0.5;
    const interestRate   = hasInterest ? baseRate : 0;
    const interestAmount = calcInterest(balance, savingType, interestRate);
    const wealthPactAmount = savingType === "impact" ? parseFloat((balance * baseRate / 100).toFixed(2)) : 0;

    return {
      id: `user-${plan}-${idx}`,
      name, email, phone,
      avatar: `https://i.pravatar.cc/80?u=${plan}-${avatarId}`,
      balance, savingType, hasInterest, interestRate, interestAmount, wealthPactAmount,
      ...(plan === "wealthfix"  && { maturityDate:maturityDates[idx],  fixStartDate:fixStartDates[idx] }),
      ...(plan === "wealthgoal" && { goalName:goalNames[idx], goalTarget:goalTargets[idx], goalDeadline:goalDeadlines[idx], goalStartDate:goalStartDates[idx] }),
    };
  });
}

// ─── Mock data — WealthGroup ──────────────────────────────────────────────────

const GROUP_SAVING_TYPES: SavingType[] = ["interest","impact","mixed","interest","mixed","impact","interest","mixed","interest","impact","mixed","interest","impact","mixed","interest","impact","mixed","interest","impact","mixed","interest","impact","mixed","interest"];

function generateGroups(): WealthGroupData[] {
  const raw = [
    {
      id:"grp-1", groupName:"Adebayo Family Savings",
      groupTarget:600000, startDate:"2024-01-01", endDate:"2025-12-31",
      members:[
        {id:"g1m1",name:"Segun Adebayo",    email:"segun.a@wealthco.ng",  phone:"08099887766",avatar:"https://i.pravatar.cc/80?u=g1-1",contribution:185000,isAdmin:true },
        {id:"g1m2",name:"Kemi Adebayo",     email:"kemi.ad@gmail.com",    phone:"08077665544",avatar:"https://i.pravatar.cc/80?u=g1-2",contribution:120000,isAdmin:false},
        {id:"g1m3",name:"Rotimi Adebayo",   email:"rotimi.a@yahoo.com",   phone:"07066554433",avatar:"https://i.pravatar.cc/80?u=g1-3",contribution:95000, isAdmin:false},
        {id:"g1m4",name:"Tolu Adebayo",     email:"tolu.a@gmail.com",     phone:"08055443322",avatar:"https://i.pravatar.cc/80?u=g1-4",contribution:60000, isAdmin:false},
      ],
    },
    {
      id:"grp-2", groupName:"Eko Cooperative Savings",
      groupTarget:1200000, startDate:"2024-03-01", endDate:"2026-02-28",
      members:[
        {id:"g2m1",name:"Chidinma Okafor",  email:"chidinma.o@gmail.com", phone:"08031234567",avatar:"https://i.pravatar.cc/80?u=g2-1",contribution:250000,isAdmin:true },
        {id:"g2m2",name:"Emeka Chukwu",     email:"emeka.c@hotmail.com",  phone:"08033456789",avatar:"https://i.pravatar.cc/80?u=g2-2",contribution:210000,isAdmin:false},
        {id:"g2m3",name:"Ngozi Obi",        email:"ngozi.o@gmail.com",    phone:"07087654321",avatar:"https://i.pravatar.cc/80?u=g2-3",contribution:175000,isAdmin:false},
        {id:"g2m4",name:"Blessing Eze",     email:"blessing.e@gmail.com", phone:"09056781234",avatar:"https://i.pravatar.cc/80?u=g2-4",contribution:155000,isAdmin:false},
        {id:"g2m5",name:"David Okonkwo",    email:"david.ok@outlook.com", phone:"08011223344",avatar:"https://i.pravatar.cc/80?u=g2-5",contribution:190000,isAdmin:false},
      ],
    },
    {
      id:"grp-3", groupName:"Abuja Professional Fund",
      groupTarget:2500000, startDate:"2023-06-01", endDate:"2026-05-31",
      members:[
        {id:"g3m1",name:"Fatima Bello",     email:"fatima.b@outlook.com", phone:"08121450923",avatar:"https://i.pravatar.cc/80?u=g3-1",contribution:300000,isAdmin:true },
        {id:"g3m2",name:"Amina Suleiman",   email:"amina.s@gmail.com",    phone:"08155667788",avatar:"https://i.pravatar.cc/80?u=g3-2",contribution:280000,isAdmin:false},
        {id:"g3m3",name:"Tunde Lawanson",   email:"tunde.l@icloud.com",   phone:"08166778899",avatar:"https://i.pravatar.cc/80?u=g3-3",contribution:260000,isAdmin:false},
      ],
    },
    {
      id:"grp-4", groupName:"Lagos Tech Circle",
      groupTarget:5000000, startDate:"2024-07-01", endDate:"2027-06-30",
      members:[
        {id:"g4m1",name:"Adewale Ogunyemi", email:"adewale.o@yahoo.com",  phone:"07012345678",avatar:"https://i.pravatar.cc/80?u=g4-1",contribution:400000,isAdmin:true },
        {id:"g4m2",name:"Chisom Nwosu",     email:"chisom.n@gmail.com",   phone:"08031234567",avatar:"https://i.pravatar.cc/80?u=g4-2",contribution:370000,isAdmin:false},
        {id:"g4m3",name:"Obiageli Nwofor",  email:"obiageli.n@gmail.com", phone:"07099001122",avatar:"https://i.pravatar.cc/80?u=g4-3",contribution:310000,isAdmin:false},
        {id:"g4m4",name:"Kemi Adesanya",    email:"kemi.a@gmail.com",     phone:"07033445566",avatar:"https://i.pravatar.cc/80?u=g4-4",contribution:285000,isAdmin:false},
        {id:"g4m5",name:"Yemi Ogundele",    email:"yemi.og@gmail.com",    phone:"08022334455",avatar:"https://i.pravatar.cc/80?u=g4-5",contribution:320000,isAdmin:false},
        {id:"g4m6",name:"Sola Martins",     email:"sola.m@outlook.com",   phone:"07011223344",avatar:"https://i.pravatar.cc/80?u=g4-6",contribution:295000,isAdmin:false},
      ],
    },
    {
      id:"grp-5", groupName:"Port Harcourt Women's Savings",
      groupTarget:800000, startDate:"2025-01-01", endDate:"2026-12-31",
      members:[
        {id:"g5m1",name:"Grace Nwachukwu",  email:"grace.n@gmail.com",    phone:"08076543210",avatar:"https://i.pravatar.cc/80?u=g5-1",contribution:150000,isAdmin:true },
        {id:"g5m2",name:"Uju Eze",          email:"uju.e@yahoo.com",       phone:"07065432109",avatar:"https://i.pravatar.cc/80?u=g5-2",contribution:130000,isAdmin:false},
        {id:"g5m3",name:"Peace Okorie",     email:"peace.o@gmail.com",     phone:"08054321098",avatar:"https://i.pravatar.cc/80?u=g5-3",contribution:120000,isAdmin:false},
        {id:"g5m4",name:"Ifeoma Obi",       email:"ifeoma.ob@gmail.com",   phone:"07043210987",avatar:"https://i.pravatar.cc/80?u=g5-4",contribution:115000,isAdmin:false},
      ],
    },
  ];

  // Assign saving types + interest to each member
  let memberIdx = 0;
  return raw.map((g) => ({
    ...g,
    members: g.members.map((m) => {
      const savingType   = GROUP_SAVING_TYPES[memberIdx % GROUP_SAVING_TYPES.length];
      const baseRate     = 3.5 + (memberIdx % 10) * 0.5;
      const rate         = savingType !== "impact" ? baseRate : 0;
      const intAmt       = calcInterest(m.contribution, savingType, rate);
      const wpAmt        = savingType === "impact" ? parseFloat((m.contribution * baseRate / 100).toFixed(2)) : 0;
      memberIdx++;
      return { ...m, savingType, interestRate: rate, interestAmount: intAmt, wealthPactAmount: wpAmt };
    }),
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₦${n.toLocaleString("en-NG",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"});
}
function getDaysRemaining(d: string) {
  return Math.ceil((new Date(d).getTime()-Date.now())/86400000);
}
function daysLabel(days: number) {
  if (days < 0)  return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  return `${days} days left`;
}

// ─── Saving-type badge ────────────────────────────────────────────────────────

function SavingTypeBadge({ type }: { type: SavingType }) {
  if (type === "interest") return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
      <BarChart2 className="w-2.5 h-2.5" />Interest
    </span>
  );
  if (type === "impact") return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
      <Leaf className="w-2.5 h-2.5" />Impact
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 whitespace-nowrap">
      <Blend className="w-2.5 h-2.5" />Mixed
    </span>
  );
}

// ─── Interest-earned cell ─────────────────────────────────────────────────────

function InterestEarnedCell({ savingType, amount }: { savingType: SavingType; amount?: number }) {
  if (savingType === "impact" || !amount) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap">
        <Minus className="w-2.5 h-2.5" />N/A
      </span>
    );
  }
  return (
    <span className="text-[12px] font-black text-emerald-600 font-outfit">
      {formatCurrency(amount)}
    </span>
  );
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function buildCsvRows(plan: string, users: PlanUser[], isWealthFix: boolean, isWealthGoal: boolean) {
  const baseH  = ["Name","Email","Phone","Saving Type","Balance (₦)","Interest Rate (%)","Interest Earned (₦)"];
  const fixH   = ["Fix Start Date","Maturity Date","Days to Maturity"];
  const goalH  = ["Saving For","Goal Target (₦)","Amount Saved (₦)","Started","Deadline"];
  const headers = [...baseH,...(isWealthFix?fixH:[]),...(isWealthGoal?goalH:[])];

  const rows = users.map((u) => {
    const base = [
      u.name, u.email, u.phone,
      u.savingType.charAt(0).toUpperCase()+u.savingType.slice(1),
      u.balance.toFixed(2),
      u.hasInterest ? (u.interestRate??0).toFixed(1) : "0",
      u.hasInterest ? (u.interestAmount??0).toFixed(2) : "0",
    ];
    const fix  = isWealthFix  ? [u.fixStartDate?formatDate(u.fixStartDate):"",u.maturityDate?formatDate(u.maturityDate):"",u.maturityDate?String(getDaysRemaining(u.maturityDate)):""]:[];
    const goal = isWealthGoal ? [u.goalName??"",u.goalTarget?.toFixed(2)??"",u.balance.toFixed(2),u.goalStartDate?formatDate(u.goalStartDate):"",u.goalDeadline?formatDate(u.goalDeadline):""]:[];
    return [...base,...fix,...goal];
  });
  return [headers,...rows];
}

function buildGroupCsvRows(groups: WealthGroupData[]) {
  const headers = ["Group Name","Group Target (₦)","Start Date","End Date","Days Remaining","Role","Member Name","Email","Phone","Saving Type","Individual Contribution (₦)","Interest Rate (%)","Interest Earned (₦)","Group Total (₦)"];
  const rows: string[][] = [];
  for (const g of groups) {
    const total   = g.members.reduce((s,m)=>s+m.contribution,0);
    const daysRem = getDaysRemaining(g.endDate);
    for (const m of g.members) {
      rows.push([
        g.groupName,
        g.groupTarget.toFixed(2),
        formatDate(g.startDate),
        formatDate(g.endDate),
        daysRem < 0 ? "Ended" : String(daysRem)+" days left",
        m.isAdmin?"Admin":"Member",
        m.name, m.email, m.phone,
        m.savingType.charAt(0).toUpperCase()+m.savingType.slice(1),
        m.contribution.toFixed(2),
        m.savingType!=="impact" ? (m.interestRate??0).toFixed(1) : "0",
        m.savingType!=="impact" ? (m.interestAmount??0).toFixed(2) : "0",
        total.toFixed(2),
      ]);
    }
  }
  return [headers,...rows];
}

function downloadCSV(plan: string, users: PlanUser[], groups: WealthGroupData[], label: string, isWealthFix: boolean, isWealthGoal: boolean, isWealthGroup: boolean) {
  const rows = isWealthGroup ? buildGroupCsvRows(groups) : buildCsvRows(plan,users,isWealthFix,isWealthGoal);
  const csv  = rows.map((r)=>r.map((c)=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href=url;
  a.download = `${label.toLowerCase().replace(/\s+/g,"-")}-members.csv`;
  a.click(); URL.revokeObjectURL(url);
}

async function downloadPDF(plan: string, users: PlanUser[], groups: WealthGroupData[], label: string, isWealthFix: boolean, isWealthGoal: boolean, isWealthGroup: boolean) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text(`${label} — Member Report`,14,18);
  doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(120);
  const count = isWealthGroup ? groups.reduce((s,g)=>s+g.members.length,0) : users.length;
  doc.text(`Generated: ${new Date().toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})}  ·  ${count} members`,14,25);
  doc.setTextColor(0);
  const rows = isWealthGroup ? buildGroupCsvRows(groups) : buildCsvRows(plan,users,isWealthFix,isWealthGoal);
  const [head,...body] = rows;
  autoTable(doc,{startY:30,head:[head],body,styles:{fontSize:7.5,cellPadding:2.5},headStyles:{fillColor:[21,93,95],textColor:255,fontStyle:"bold"},alternateRowStyles:{fillColor:[248,250,252]},margin:{left:14,right:14}});
  doc.save(`${label.toLowerCase().replace(/\s+/g,"-")}-members.pdf`);
}

// ─── WealthGroup card ─────────────────────────────────────────────────────────

function GroupCard({ group }: { group: WealthGroupData }) {
  const [expanded, setExpanded] = useState(true);
  const total         = group.members.reduce((s,m)=>s+m.contribution,0);
  const totalInterest = group.members.reduce((s,m)=>s+(m.interestAmount??0),0);
  const admin         = group.members.find((m)=>m.isAdmin);

  return (
    <div className="border border-border/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-surface/60 cursor-pointer hover:bg-surface/90 transition-colors"
        onClick={()=>setExpanded((e)=>!e)}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-[14px] font-black text-dark font-outfit">{group.groupName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-[11px] text-slate/50 font-medium">
                {group.members.length} member{group.members.length!==1?"s":""}
                {admin&&<> · Admin: <span className="text-dark font-semibold">{admin.name}</span></>}
              </span>
              <span className="text-[10px] text-slate/40 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3"/>
                {formatDate(group.startDate)} → {formatDate(group.endDate)}
                <span className={`ml-1 font-bold ${
                  getDaysRemaining(group.endDate) < 0 ? "text-emerald-500" :
                  getDaysRemaining(group.endDate) <= 30 ? "text-orange-500" : "text-slate/40"
                }`}>
                  · {getDaysRemaining(group.endDate) < 0 ? "Ended" : `${getDaysRemaining(group.endDate)}d left`}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Group Target</p>
            <p className="text-[13px] font-black text-dark font-outfit">{formatCurrency(group.groupTarget)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Interest Earned</p>
            <p className="text-[13px] font-black text-emerald-600 font-outfit">{formatCurrency(totalInterest)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate/40 uppercase tracking-wide">Total Saved</p>
            <p className="text-[15px] font-black text-dark font-outfit">{formatCurrency(total)}</p>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate/40 shrink-0"/>
            : <ChevronDown className="w-4 h-4 text-slate/40 shrink-0"/>
          }
        </div>
      </div>

      {/* Members table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-border/15 bg-white">
                <th className="text-left py-2.5 px-5 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Member</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Contact</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Role</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Saving Type</th>
                <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Contribution</th>
                <th className="text-right py-2.5 px-5 text-[10px] font-bold text-slate/40 uppercase tracking-wider">Interest Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {group.members
                .slice()
                .sort((a,b)=>(b.isAdmin?1:0)-(a.isAdmin?1:0))
                .map((member)=>(
                  <tr key={member.id} className={`transition-colors ${member.isAdmin?"bg-gray-50/80":"hover:bg-surface/30"}`}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 shrink-0">
                          <Image src={member.avatar} alt={member.name} fill sizes="32px"
                            className={`rounded-full object-cover border-2 ${member.isAdmin?"border-gray-400":"border-border/30"}`}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-dark whitespace-nowrap">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-dark">{member.email}</span>
                        <span className="text-[10px] text-slate/50 font-medium">{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {member.isAdmin?(
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-white">
                          <ShieldCheck className="w-3 h-3"/>Admin
                        </span>
                      ):(
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                          <Users className="w-3 h-3"/>Member
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <SavingTypeBadge type={member.savingType}/>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[12px] font-black text-dark font-outfit">{formatCurrency(member.contribution)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <InterestEarnedCell savingType={member.savingType} amount={member.interestAmount}/>
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/20 bg-surface/40">
                <td colSpan={4} className="py-3 px-5 text-[11px] font-bold text-slate/50 uppercase tracking-wide">
                  Group Total ({group.members.length} members)
                </td>
                <td className="py-3 px-4 text-right text-[14px] font-black text-dark font-outfit">{formatCurrency(total)}</td>
                <td className="py-3 px-5 text-right text-[14px] font-black text-emerald-600 font-outfit">{formatCurrency(totalInterest)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanUsersPage() {
  const { plan }   = useParams<{ plan: string }>();
  const router     = useRouter();
  const [dateFilter, setDateFilter] = useState("Today");
  const planKey    = plan?.toLowerCase();
  const meta       = PLAN_META[planKey];

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate">
        <p className="text-lg font-bold">Plan not found</p>
        <button onClick={()=>router.back()} className="mt-4 text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  const isWealthFix   = planKey==="wealthfix";
  const isWealthGoal  = planKey==="wealthgoal";
  const isWealthGroup = planKey==="wealthgroup";

  const users  = isWealthGroup ? [] : generateUsers(planKey);
  const groups = isWealthGroup ? generateGroups() : [];

  const totalBalance  = isWealthGroup
    ? groups.reduce((s,g)=>s+g.members.reduce((ms,m)=>ms+m.contribution,0),0)
    : users.reduce((s,u)=>s+u.balance,0);

  const totalInterest = isWealthGroup
    ? groups.reduce((s,g)=>s+g.members.reduce((ms,m)=>ms+(m.interestAmount??0),0),0)
    : users.reduce((s,u)=>s+(u.interestAmount??0),0);

  const totalWealthPact = isWealthGroup
    ? groups.reduce((s,g)=>s+g.members.reduce((ms,m)=>ms+(m.wealthPactAmount??0),0),0)
    : users.reduce((s,u)=>s+(u.wealthPactAmount??0),0);

  const totalGoalTarget  = isWealthGoal ? users.reduce((s,u)=>s+(u.goalTarget??0),0) : 0;
  const totalMembers     = isWealthGroup ? groups.reduce((s,g)=>s+g.members.length,0) : users.length;

  const summaryCards = isWealthGroup ? [
    { label:"Total Groups",     value:groups.length.toLocaleString(),                              sub:"active groups"        },
    { label:"Total Members",    value:totalMembers.toLocaleString(),                               sub:"across all groups"    },
    { label:"Total Savings",    value:formatCurrency(totalBalance),                                sub:"combined contributions"},
    { label:"Total Interest",   value:formatCurrency(totalInterest),                               sub:"earned across groups" },
    { label:"Total Wealthpact", value:formatCurrency(totalWealthPact),                             sub:"impact plan accrued"  },
  ] : [
    { label:"Total Members",    value:totalMembers.toLocaleString(),                               sub:"enrolled users"       },
    { label:"Total Balance",    value:formatCurrency(totalBalance),                                sub:"combined savings"     },
    { label:"Total Interest",   value:formatCurrency(totalInterest),                               sub:"interest earned"      },
    { label:"Total Wealthpact", value:formatCurrency(totalWealthPact),                             sub:"impact plan accrued"  },
    {
      label: isWealthFix?"Avg Term":isWealthGoal?"Total Goal Target":"Avg Balance",
      value: isWealthFix?"12 months":isWealthGoal?formatCurrency(totalGoalTarget):formatCurrency(totalBalance/Math.max(1,totalMembers)),
      sub:   isWealthFix?"lock-in period":isWealthGoal?"combined targets":"per member",
    },
  ];

  const Icon = meta.icon;

  return (
    <div className="w-full max-w-[1237px] mx-auto min-h-[800px] bg-white rounded-[20px] py-10 px-6 flex flex-col gap-8 shadow-sm">

      {/* ── Header ── */}
      <div className="flex flex-col gap-5">
        <button
          onClick={()=>router.back()}
          className="flex items-center gap-2 text-slate text-sm font-medium hover:text-primary transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"/>
          Back to Overview
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${meta.accent} border`}>
              <Icon className={`w-7 h-7 ${meta.color}`}/>
            </div>
            <div>
              <h1 className="text-2xl font-black font-outfit text-dark">{meta.label}</h1>
              <p className="text-sm text-slate/60 font-medium">{meta.description}</p>
            </div>
          </div>

          {/* Filter & Download buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none h-10 pl-10 pr-8 rounded-xl bg-surface/50 hover:bg-surface border border-border/30 text-dark text-[12px] font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last week">Last week</option>
                <option value="6 months ago">6 months ago</option>
                <option value="1 year ago">1 year ago</option>
                <option value="All time">All time</option>
              </select>
              <Calendar className="w-4 h-4 text-slate/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={()=>downloadCSV(planKey,users,groups,meta.label,isWealthFix,isWealthGoal,isWealthGroup)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4"/>Export Excel
            </button>
            <button
              onClick={()=>downloadPDF(planKey,users,groups,meta.label,isWealthFix,isWealthGoal,isWealthGroup)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4"/>Export PDF
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {summaryCards.map((s,i)=>{
            const isInterest = i === 2;
            const isWealthPact = i === 3;
            let bgClass = "bg-surface/60 border-border/30";
            let textClass = "text-dark";
            
            if (isInterest) { 
              bgClass = "bg-blue-50/60 border-blue-100"; 
              textClass = "text-blue-700"; 
            }
            if (isWealthPact) { 
              bgClass = "bg-emerald-50/60 border-emerald-100"; 
              textClass = "text-emerald-700"; 
            }

            return (
              <div key={i} className={`rounded-xl p-4 border ${bgClass}`}>
                <p className="text-[11px] font-bold text-slate/50 uppercase tracking-wide">{s.label}</p>
                <p className={`text-[17px] font-black mt-1 font-outfit ${textClass}`}>{s.value}</p>
                <p className="text-[10px] text-slate/40 font-medium mt-0.5">{s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-[1px] bg-border/30"/>

      {/* ── WealthGroup: grouped layout ── */}
      {isWealthGroup ? (
        <div className="flex flex-col gap-4">
          {groups.map((group)=><GroupCard key={group.id} group={group}/>)}
        </div>
      ) : (
        /* ── All other plans: flat table ── */
        <div className="overflow-x-auto rounded-2xl border border-border/30">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface/70 border-b border-border/20">
                <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Member</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Contact</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Saving Type</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Balance</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Interest Earned</th>

                {isWealthFix&&<>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Fix Start</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Maturity Date</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Days to Maturity</th>
                </>}

                {isWealthGoal&&<>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Saving For</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Goal Target</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Started</th>
                  <th className="text-left py-3.5 px-4 text-[11px] font-bold text-slate/50 uppercase tracking-wider">Deadline</th>
                </>}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/15">
              {users.map((user)=>{
                const matDays  = user.maturityDate?getDaysRemaining(user.maturityDate):null;

                return (
                  <tr key={user.id} className="hover:bg-surface/40 transition-colors duration-150 group">
                    {/* Member */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0">
                          <Image src={user.avatar} alt={user.name} fill sizes="36px"
                            className="rounded-full object-cover border-2 border-border/30 group-hover:border-primary/20 transition-colors"
                          />
                        </div>
                        <span className="text-[13px] font-bold text-dark whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-dark">{user.email}</span>
                        <span className="text-[11px] text-slate/50 font-medium">{user.phone}</span>
                      </div>
                    </td>
                    {/* Saving type */}
                    <td className="py-4 px-4">
                      <SavingTypeBadge type={user.savingType}/>
                    </td>
                    {/* Balance */}
                    <td className="py-4 px-4 text-right">
                      <span className="text-[13px] font-black text-dark font-outfit">{formatCurrency(user.balance)}</span>
                    </td>
                    {/* Interest Earned */}
                    <td className="py-4 px-4 text-right">
                      <InterestEarnedCell savingType={user.savingType} amount={user.interestAmount}/>
                    </td>

                    {/* WealthFix extras */}
                    {isWealthFix&&<>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark">{user.fixStartDate?formatDate(user.fixStartDate):"—"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0"/>
                          {user.maturityDate?formatDate(user.maturityDate):"—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {matDays!==null?(
                          <span className={`text-[12px] font-bold ${matDays<0?"text-emerald-600":matDays<=30?"text-orange-500":"text-slate/60"}`}>
                            {matDays<0?"Matured":daysLabel(matDays)}
                          </span>
                        ):<span className="text-slate/30 text-xs">—</span>}
                      </td>
                    </>}

                    {/* WealthGoal extras */}
                    {isWealthGoal&&<>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-bold text-dark whitespace-nowrap">{user.goalName??"—"}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[12px] font-bold text-dark font-outfit">
                          {user.goalTarget!=null?formatCurrency(user.goalTarget):"—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark">{user.goalStartDate?formatDate(user.goalStartDate):"—"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[12px] font-semibold text-dark flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0"/>
                          {user.goalDeadline?formatDate(user.goalDeadline):"—"}
                        </span>
                      </td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-[11px] text-slate/30 font-medium">
        {isWealthGroup
          ?`${groups.length} groups · ${totalMembers} total members · Sample data`
          :`Showing all ${users.length} members enrolled in ${meta.label} · Sample data`
        }
      </p>
    </div>
  );
}
