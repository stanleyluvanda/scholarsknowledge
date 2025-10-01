// src/utils/scholarshipsLocal.js
const KEYS = ["partnerScholarships", "scholarships", "postedScholarships"];

export function loadLocalScholarships() {
  const out = [];
  for (const k of KEYS) {
    try {
      const arr = JSON.parse(localStorage.getItem(k) || "[]");
      if (Array.isArray(arr)) out.push(...arr);
    } catch {}
  }
  // normalize
  return out.map((s) => ({
    id: s.id || s.scholarshipId || `sch_${Math.random().toString(36).slice(2)}`,
    title: s.title || s.name || "Untitled Scholarship",
    deadline: s.deadline || s.closeDate || s.dueDate || "",
    createdAt: s.createdAt || s.postedAt || s.created || s.timestamp || Date.now(),
    status: (s.status || "Open").toString(),
    partnerId: s.partnerId || s.ownerId || s.postedById || "",
    postedByEmail: s.postedByEmail || s.email || "",
    orgName: s.orgName || s.organization || s.university || "",
    description: s.description || s.summary || "",
    amount: s.amount || s.value || "",
    link: s.link || s.applyLink || s.url || "",
  }));
}

export function saveLocalScholarship(s, preferredKey = "partnerScholarships") {
  const item = {
    id: s.id || `sch_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    title: s.title || "Untitled Scholarship",
    deadline: s.deadline || "",
    createdAt: s.createdAt || Date.now(),
    status: s.status || "Open",
    partnerId: s.partnerId || "",
    postedByEmail: s.postedByEmail || "",
    orgName: s.orgName || "",
    description: s.description || "",
    amount: s.amount || "",
    link: s.link || "",
  };
  try {
    const arr = JSON.parse(localStorage.getItem(preferredKey) || "[]");
    arr.unshift(item);
    localStorage.setItem(preferredKey, JSON.stringify(arr));
    // notify other tabs/pages
    window.dispatchEvent(new Event("storage"));
  } catch {}
  return item;
}