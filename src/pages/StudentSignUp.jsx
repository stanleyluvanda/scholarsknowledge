// src/pages/StudentSignUp.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getContinents,
  getCountries,
  getUniversities,
  getFaculties,
  getPrograms,
  YEARS,
} from "../data/eduData.js";

/* ================= Global country data (by continent) ================= */
const CONTINENT_COUNTRIES = {
  Africa: [
    { name: "Algeria", code: "DZ" },
    { name: "Angola", code: "AO" },
    { name: "Benin", code: "BJ" },
    { name: "Botswana", code: "BW" },
    { name: "Burkina Faso", code: "BF" },
    { name: "Burundi", code: "BI" },
    { name: "Cabo Verde", code: "CV", alt: ["Cape Verde"] },
    { name: "Cameroon", code: "CM" },
    { name: "Central African Republic", code: "CF" },
    { name: "Chad", code: "TD" },
    { name: "Comoros", code: "KM" },
    { name: "Congo", code: "CG", alt: ["Republic of the Congo"] },
    { name: "Democratic Republic of the Congo", code: "CD", alt: ["DR Congo", "Congo DR", "D.R. Congo"] },
    { name: "Djibouti", code: "DJ" },
    { name: "Egypt", code: "EG" },
    { name: "Equatorial Guinea", code: "GQ" },
    { name: "Eritrea", code: "ER" },
    { name: "Eswatini", code: "SZ", alt: ["Swaziland", "Eswatini (Swaziland)"] },
    { name: "Ethiopia", code: "ET" },
    { name: "Gabon", code: "GA" },
    { name: "Gambia", code: "GM" },
    { name: "Ghana", code: "GH" },
    { name: "Guinea", code: "GN" },
    { name: "Guinea-Bissau", code: "GW" },
    { name: "Côte d’Ivoire", code: "CI", alt: ["Ivory Coast", "Cote d'Ivoire", "Cote d Ivoire"] },
    { name: "Kenya", code: "KE" },
    { name: "Lesotho", code: "LS" },
    { name: "Liberia", code: "LR" },
    { name: "Libya", code: "LY" },
    { name: "Madagascar", code: "MG" },
    { name: "Malawi", code: "MW" },
    { name: "Mali", code: "ML" },
    { name: "Mauritania", code: "MR" },
    { name: "Mauritius", code: "MU" },
    { name: "Morocco", code: "MA" },
    { name: "Mozambique", code: "MZ" },
    { name: "Namibia", code: "NA" },
    { name: "Niger", code: "NE" },
    { name: "Nigeria", code: "NG" },
    { name: "Rwanda", code: "RW" },
    { name: "Sao Tome and Principe", code: "ST" },
    { name: "Senegal", code: "SN" },
    { name: "Seychelles", code: "SC" },
    { name: "Sierra Leone", code: "SL" },
    { name: "Somalia", code: "SO" },
    { name: "South Africa", code: "ZA" },
    { name: "South Sudan", code: "SS" },
    { name: "Sudan", code: "SD" },
    { name: "Tanzania", code: "TZ", alt: ["United Republic of Tanzania"] },
    { name: "Togo", code: "TG" },
    { name: "Tunisia", code: "TN" },
    { name: "Uganda", code: "UG" },
    { name: "Zambia", code: "ZM" },
    { name: "Zimbabwe", code: "ZW" },
    { name: "Reunion", code: "RE" },
    { name: "Mayotte", code: "YT" },
    { name: "Western Sahara", code: "EH" },
  ],

  Asia: [
    { name: "Afghanistan", code: "AF" },
    { name: "Armenia", code: "AM" },
    { name: "Azerbaijan", code: "AZ" },
    { name: "Bahrain", code: "BH" },
    { name: "Bangladesh", code: "BD" },
    { name: "Bhutan", code: "BT" },
    { name: "Brunei", code: "BN" },
    { name: "Cambodia", code: "KH" },
    { name: "China", code: "CN" },
    { name: "Cyprus", code: "CY" },
    { name: "Georgia", code: "GE" },
    { name: "India", code: "IN" },
    { name: "Indonesia", code: "ID" },
    { name: "Iran", code: "IR", alt: ["Iran, Islamic Republic of"] },
    { name: "Iraq", code: "IQ" },
    { name: "Israel", code: "IL" },
    { name: "Japan", code: "JP" },
    { name: "Jordan", code: "JO" },
    { name: "Kazakhstan", code: "KZ" },
    { name: "Kuwait", code: "KW" },
    { name: "Kyrgyzstan", code: "KG" },
    { name: "Laos", code: "LA", alt: ["Lao PDR", "Lao People's Democratic Republic"] },
    { name: "Lebanon", code: "LB" },
    { name: "Malaysia", code: "MY" },
    { name: "Maldives", code: "MV" },
    { name: "Mongolia", code: "MN" },
    { name: "Myanmar", code: "MM", alt: ["Burma"] },
    { name: "Nepal", code: "NP" },
    { name: "North Korea", code: "KP", alt: ["Korea, Democratic People's Republic of"] },
    { name: "Oman", code: "OM" },
    { name: "Pakistan", code: "PK" },
    { name: "Palestine", code: "PS", alt: ["State of Palestine", "Palestinian Territories", "Palestinian Authority"] },
    { name: "Philippines", code: "PH" },
    { name: "Qatar", code: "QA" },
    { name: "Saudi Arabia", code: "SA" },
    { name: "Singapore", code: "SG" },
    { name: "South Korea", code: "KR", alt: ["Korea, Republic of"] },
    { name: "Sri Lanka", code: "LK" },
    { name: "Syria", code: "SY", alt: ["Syrian Arab Republic"] },
    { name: "Taiwan", code: "TW" },
    { name: "Tajikistan", code: "TJ" },
    { name: "Thailand", code: "TH" },
    { name: "Timor-Leste", code: "TL", alt: ["East Timor"] },
    { name: "Turkey", code: "TR", alt: ["Türkiye", "Turkiye"] },
    { name: "Turkmenistan", code: "TM" },
    { name: "United Arab Emirates", code: "AE" },
    { name: "Uzbekistan", code: "UZ" },
    { name: "Vietnam", code: "VN" },
    { name: "Yemen", code: "YE" },
    { name: "Hong Kong", code: "HK" },
    { name: "Macau", code: "MO", alt: ["Macao"] },
  ],

  Europe: [
    { name: "Albania", code: "AL" },
    { name: "Andorra", code: "AD" },
    { name: "Austria", code: "AT" },
    { name: "Belarus", code: "BY" },
    { name: "Belgium", code: "BE" },
    { name: "Bosnia and Herzegovina", code: "BA" },
    { name: "Bulgaria", code: "BG" },
    { name: "Croatia", code: "HR" },
    { name: "Czechia", code: "CZ", alt: ["Czech Republic"] },
    { name: "Denmark", code: "DK" },
    { name: "Estonia", code: "EE" },
    { name: "Finland", code: "FI" },
    { name: "France", code: "FR" },
    { name: "Germany", code: "DE" },
    { name: "Greece", code: "GR" },
    { name: "Hungary", code: "HU" },
    { name: "Iceland", code: "IS" },
    { name: "Ireland", code: "IE" },
    { name: "Italy", code: "IT" },
    { name: "Kosovo", code: "XK" },
    { name: "Latvia", code: "LV" },
    { name: "Liechtenstein", code: "LI" },
    { name: "Lithuania", code: "LT" },
    { name: "Luxembourg", code: "LU" },
    { name: "Malta", code: "MT" },
    { name: "Moldova", code: "MD", alt: ["Republic of Moldova"] },
    { name: "Monaco", code: "MC" },
    { name: "Montenegro", code: "ME" },
    { name: "Netherlands", code: "NL" },
    { name: "North Macedonia", code: "MK", alt: ["Macedonia"] },
    { name: "Norway", code: "NO" },
    { name: "Poland", code: "PL" },
    { name: "Portugal", code: "PT" },
    { name: "Romania", code: "RO" },
    { name: "Russia", code: "RU", alt: ["Russian Federation"] },
    { name: "San Marino", code: "SM" },
    { name: "Serbia", code: "RS" },
    { name: "Slovakia", code: "SK" },
    { name: "Slovenia", code: "SI" },
    { name: "Spain", code: "ES" },
    { name: "Sweden", code: "SE" },
    { name: "Switzerland", code: "CH" },
    { name: "Ukraine", code: "UA" },
    { name: "United Kingdom", code: "GB", alt: ["UK", "Great Britain", "Britain"] },
    { name: "Vatican City", code: "VA", alt: ["Holy See"] },
    { name: "Guernsey", code: "GG" },
    { name: "Jersey", code: "JE" },
    { name: "Isle of Man", code: "IM" },
    { name: "Gibraltar", code: "GI" },
    { name: "Faroe Islands", code: "FO" },
  ],

  LatinAmerica: [
    { name: "Antigua and Barbuda", code: "AG" },
    { name: "Argentina", code: "AR" },
    { name: "Bahamas", code: "BS" },
    { name: "Barbados", code: "BB" },
    { name: "Belize", code: "BZ" },
    { name: "Bolivia", code: "BO", alt: ["Bolivia (Plurinational State of)"] },
    { name: "Brazil", code: "BR" },
    { name: "Chile", code: "CL" },
    { name: "Colombia", code: "CO" },
    { name: "Costa Rica", code: "CR" },
    { name: "Cuba", code: "CU" },
    { name: "Dominica", code: "DM" },
    { name: "Dominican Republic", code: "DO" },
    { name: "Ecuador", code: "EC" },
    { name: "El Salvador", code: "SV" },
    { name: "Grenada", code: "GD" },
    { name: "Guatemala", code: "GT" },
    { name: "Guyana", code: "GY" },
    { name: "Haiti", code: "HT" },
    { name: "Honduras", code: "HN" },
    { name: "Jamaica", code: "JM" },
    { name: "Mexico", code: "MX" },
    { name: "Nicaragua", code: "NI" },
    { name: "Panama", code: "PA" },
    { name: "Paraguay", code: "PY" },
    { name: "Peru", code: "PE" },
    { name: "Saint Kitts and Nevis", code: "KN" },
    { name: "Saint Lucia", code: "LC" },
    { name: "Saint Vincent and the Grenadines", code: "VC" },
    { name: "Suriname", code: "SR" },
    { name: "Trinidad and Tobago", code: "TT" },
    { name: "Uruguay", code: "UY" },
    { name: "Venezuela", code: "VE", alt: ["Venezuela (Bolivarian Republic of)"] },
    { name: "Puerto Rico", code: "PR" },
    { name: "Curaçao", code: "CW", alt: ["Curacao"] },
    { name: "Aruba", code: "AW" },
    { name: "Bonaire, Sint Eustatius and Saba", code: "BQ", alt: ["Bonaire", "Saba", "Sint Eustatius"] },
    { name: "Sint Maarten", code: "SX" },
    { name: "Saint Martin", code: "MF" },
    { name: "Saint Barthélemy", code: "BL", alt: ["Saint Barthelemy"] },
    { name: "Guadeloupe", code: "GP" },
    { name: "Martinique", code: "MQ" },
    { name: "French Guiana", code: "GF" },
    { name: "Bermuda", code: "BM" },
    { name: "Cayman Islands", code: "KY" },
    { name: "Turks and Caicos Islands", code: "TC" },
    { name: "Montserrat", code: "MS" },
    { name: "British Virgin Islands", code: "VG" },
    { name: "U.S. Virgin Islands", code: "VI" },
    { name: "Anguilla", code: "AI" },
    { name: "Saint Pierre and Miquelon", code: "PM" },
  ],

  NorthAmerica: [
    { name: "Canada", code: "CA" },
    { name: "United States", code: "US", alt: ["USA", "U.S.A.", "U.S.", "US of A", "America", "United States of America"] },
    { name: "Greenland", code: "GL" },
    { name: "Bermuda", code: "BM" },
  ],

  Oceania: [
    { name: "Australia", code: "AU" },
    { name: "New Zealand", code: "NZ" },
    { name: "Fiji", code: "FJ" },
    { name: "Papua New Guinea", code: "PG" },
    { name: "Solomon Islands", code: "SB" },
    { name: "Vanuatu", code: "VU" },
    { name: "Samoa", code: "WS" },
    { name: "Tonga", code: "TO" },
    { name: "Kiribati", code: "KI" },
    { name: "Tuvalu", code: "TV" },
    { name: "Nauru", code: "NR" },
    { name: "Palau", code: "PW" },
    { name: "Micronesia", code: "FM", alt: ["Federated States of Micronesia"] },
    { name: "Marshall Islands", code: "MH" },
    { name: "New Caledonia", code: "NC" },
    { name: "French Polynesia", code: "PF" },
    { name: "Wallis and Futuna", code: "WF" },
    { name: "Guam", code: "GU" },
    { name: "American Samoa", code: "AS" },
    { name: "Northern Mariana Islands", code: "MP" },
    { name: "Cook Islands", code: "CK" },
    { name: "Niue", code: "NU" },
    { name: "Tokelau", code: "TK" },
    { name: "Pitcairn", code: "PN" },
    { name: "Norfolk Island", code: "NF" },
    { name: "Christmas Island", code: "CX" },
    { name: "Cocos (Keeling) Islands", code: "CC" },
  ],
};

/* ================= Helpers ================= */
function safeParse(json) {
  try {
    return JSON.parse(json || "");
  } catch {
    return null;
  }
}

/** Read file as DataURL */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Downscale image to fit within maxDim x maxDim and compress to JPEG */
async function downscaleImageToDataURL(file, maxDim = 320, quality = 0.82) {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = blobUrl;
    });

    const { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    // Keep under ~400KB if possible
    let q = quality;
    let dataURL = canvas.toDataURL("image/jpeg", q);
    const TARGET_BYTES = 400 * 1024;
    while (dataURL.length * 0.75 > TARGET_BYTES && q > 0.5) {
      q -= 0.06;
      dataURL = canvas.toDataURL("image/jpeg", q);
    }
    return dataURL;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/* ---- Country-name -> ISO2 resolution (robust / alias tolerant) ---- */
const canon = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const NAME_TO_ISO_CANON = (() => {
  const map = {};
  for (const list of Object.values(CONTINENT_COUNTRIES)) {
    for (const c of list) {
      map[canon(c.name)] = c.code;
      if (Array.isArray(c.alt)) {
        for (const alt of c.alt) map[canon(alt)] = c.code;
      }
    }
  }
  return map;
})();

const isoFromCountryName = (country = "") => NAME_TO_ISO_CANON[canon(country)] || "";

/* Try a safe localStorage set, with clear message on quota errors */
function trySetItem(k, v) {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch (err) {
    console.warn("localStorage.setItem failed for key:", k, err);
    return false;
  }
}

/* ================= Component ================= */
export default function StudentSignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    continent: "",
    country: "",
    countryCode: "",
    university: "",
    faculty: "",
    program: "",
    year: "",
  });
  const [error, setError] = useState("");

  // Profile photo state
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const onBasic = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Cascading resets
  const onContinent = (e) =>
    setForm({
      ...form,
      continent: e.target.value,
      country: "",
      countryCode: "",
      university: "",
      faculty: "",
      program: "",
      year: "",
    });

  const onCountry = (e) => {
    const country = e.target.value;
    setForm({
      ...form,
      country,
      countryCode: isoFromCountryName(country),
      university: "",
      faculty: "",
      program: "",
      year: "",
    });
  };

  const onUniversity = (e) =>
    setForm({
      ...form,
      university: e.target.value,
      faculty: "",
      program: "",
      year: "",
    });

  const onFaculty = (e) =>
    setForm({
      ...form,
      faculty: e.target.value,
      program: "",
      year: "",
    });

  const onProgram = (e) =>
    setForm({
      ...form,
      program: e.target.value,
      year: "",
    });

  const onYear = (e) => setForm({ ...form, year: e.target.value });

  // Photo selection
  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError("");
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(null);
    setPhotoUrl("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = [
      "name",
      "email",
      "password",
      "confirmPassword",
      "continent",
      "country",
      "university",
      "faculty",
      "program",
      "year",
    ];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) {
      setError("Please complete all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      let photoDataUrl = "";
      if (photo) {
        photoDataUrl = await downscaleImageToDataURL(photo, 320, 0.82);
      }

      const countryCode =
        isoFromCountryName(form.country) ||
        (form.countryCode ? String(form.countryCode).toUpperCase() : "");

      const newUser = {
        id: `u_${Date.now()}`,
        name: form.name,
        email: form.email,
        continent: form.continent,
        country: form.country,
        countryCode,
        university: form.university,
        faculty: form.faculty,
        program: form.program,
        year: form.year,
        photoUrl: photoDataUrl,
        bannerUrl: "",
        createdAt: new Date().toISOString(),
        role: "student",
        active: true,
      };

      sessionStorage.setItem("currentUser", JSON.stringify(newUser));
      sessionStorage.setItem("authUserId", newUser.id);
      sessionStorage.setItem("activeUserId", newUser.id);
      sessionStorage.setItem("currentUserId", newUser.id);
      sessionStorage.setItem("loggedInUserId", newUser.id);

      trySetItem("authUserId", newUser.id);
      trySetItem("activeUserId", newUser.id);
      trySetItem("currentUserId", newUser.id);
      trySetItem("loggedInUserId", newUser.id);

      let savedFully = trySetItem("currentUser", JSON.stringify(newUser));
      if (!savedFully) {
        const trimmed = { ...newUser, photoUrl: "" };
        trySetItem("currentUser", JSON.stringify(trimmed));
      }

      const usersArr = safeParse(localStorage.getItem("users")) || [];
      const usersArrNext = [
        ...usersArr,
        savedFully ? newUser : { ...newUser, photoUrl: "" },
      ];
      savedFully = trySetItem("users", JSON.stringify(usersArrNext)) && savedFully;

      const usersById = safeParse(localStorage.getItem("usersById")) || {};
      usersById[newUser.id] = savedFully ? newUser : { ...newUser, photoUrl: "" };
      trySetItem("usersById", JSON.stringify(usersById));

      navigate("/student-dashboard");
    } catch (err) {
      console.error(err);
      setError(
        "Registration failed. Likely due to browser storage limits (large photo). Please try again with a smaller image or remove the photo."
      );
    }
  };

  /* ------- Options (with safe fallbacks to this file’s lists) ------- */
  const continentsFromData = getContinents() || [];
  const continents =
    continentsFromData.length > 0
      ? continentsFromData
      : Object.keys(CONTINENT_COUNTRIES);

  const countriesFromData = getCountries(form.continent) || [];
  const countries =
    countriesFromData.length > 0
      ? countriesFromData
      : (CONTINENT_COUNTRIES[form.continent] || []).map((c) => c.name);

  const universities = getUniversities(form.continent, form.country) || [];
  const faculties = getFaculties(form.continent, form.country, form.university) || [];
  const programs = getPrograms(form.continent, form.country, form.university, form.faculty) || [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0f6ff] via-white to-[#eef2ff]">
      <main className="flex-1">
        <section className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <img src="images/logo.jpeg" alt="ScholarsKnowledge Logo" className="mx-auto h-14 w-14 object-contain" />
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">Student Sign Up</h1>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white/70 rounded-2xl p-6 border">
            {error && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}

            {/* Profile Photo Uploader */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-500" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M4.5 19.5a7.5 7.5 0 0115 0M12 3.75v0" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-block">
                  <span className="sr-only">Upload profile photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhoto}
                    className="block w-full text-sm text-slate-600
                               file:mr-3 file:py-2 file:px-4
                               file:rounded file:border-0
                               file:text-sm file:font-semibold
                               file:bg-blue-600 file:text-white
                               hover:file:bg-blue-700"
                  />
                </label>
                {photo && (
                  <button type="button" onClick={clearPhoto} className="text-sm text-slate-600 underline self-start">
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-slate-500">Large images will be resized to fit limits.</p>
              </div>
            </div>

            {/* Basic fields with labels + placeholders */}
            <label className="block">
              <span className="block text-sm text-slate-600 mb-1">Full name</span>
              <input
                name="name"
                type="text"
                className="w-full border rounded px-3 py-2 bg-white"
                placeholder="Full name"
                autoComplete="name"
                value={form.name}
                onChange={onBasic}
              />
            </label>

            <label className="block">
              <span className="block text-sm text-slate-600 mb-1">Email</span>
              <input
                name="email"
                type="email"
                className="w-full border rounded px-3 py-2 bg-white"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={onBasic}
              />
            </label>

            {/* Password + Confirm Password */}
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">Password</span>
                <input
                  name="password"
                  type="password"
                  className="w-full border rounded px-3 py-2 bg-white"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onBasic}
                />
              </label>

              <label className="block">
                <span className="block text-sm text-slate-600 mb-1">Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  className="w-full border rounded px-3 py-2 bg-white"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={onBasic}
                />
              </label>
            </div>

            {/* Cascading selects */}
            <Select
              label="Continent"
              value={form.continent}
              onChange={onContinent}
              options={continents}
              placeholder="Select Continent"
            />
            <Select
              label="Country"
              value={form.country}
              onChange={onCountry}
              options={countries}
              placeholder="Select Country"
              disabled={!form.continent}
            />
            <Select
              label="University"
              value={form.university}
              onChange={onUniversity}
              options={universities}
              placeholder="Select University"
              disabled={!form.country}
            />
            <Select
              label="College/School/Faculty/Department"
              value={form.faculty}
              onChange={onFaculty}
              options={faculties}
              placeholder="Select Faculty/School"
              disabled={!form.university}
            />
            <Select
              label="Academic Program"
              value={form.program}
              onChange={onProgram}
              options={programs}
              placeholder="Select Program"
              disabled={!form.faculty}
            />
            <Select
              label="Year of Study"
              value={form.year}
              onChange={onYear}
              options={YEARS}
              placeholder="Select Year"
              disabled={!form.program}
            />

            <button type="submit" className="w-full bg-[#1a73e8] text-white py-2 rounded font-semibold hover:opacity-90">
              Submit
            </button>

            <p className="text-sm text-slate-600 text-center">
              Already have an account?{" "}
              <a href="/login?role=student" className="text-[#1a73e8] underline">
                Log in
              </a>
            </p>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} ScholarsKnowledge ·{" "}
        <a href="/login" className="underline">Contact Sales</a>
      </footer>
    </div>
  );
}

/* Reusable select */
function Select({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-600 mb-1">{label}</span>
      <select
        className="w-full border rounded px-3 py-2 disabled:bg-slate-50 bg-white"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}