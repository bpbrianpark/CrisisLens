// src/constants/crisisTypes.js

export const CATEGORY_ORDER = [
    "Natural Hazard",
    "Fire",
    "Utilities & Infrastructure",
    "Transport",
    "Public Safety",
    "Health",
    "Environmental / HazMat",
    "Civil / Political Events",
    "Other"
];

export const CRISIS_TYPES = [
    // --- Natural Hazard ---
    {
        id: "wildfire",
        label: "Wildfire",
        icon: "🔥",
        iconUrl: "/icons/openmoji/wildfire.svg",
        color: "#E25822",
        category: "Fire",
        aliases: [
            "wildfire", "forest fire", "bushfire", "brush fire", "grass fire",
            "wild land fire", "crown fire", "wild fire", "forest blaze", "wildfire smoke",
        ],
    },
    {
        id: "flood",
        label: "Flood",
        icon: "🌊",
        iconUrl: "/icons/openmoji/flood.svg",
        color: "#1F7A8C",
        category: "Natural Hazard",
        aliases: [
            "flood", "flash flood", "river flood", "storm surge", "inundation",
            "overflowing river", "urban flooding", "coastal flooding", "floodwaters",
        ],
    },
    {
        id: "earthquake",
        label: "Earthquake",
        icon: "🌎",
        iconUrl: "/icons/openmoji/earthquake.svg",
        color: "#8D6E63",
        category: "Natural Hazard",
        aliases: [
            "earthquake", "seismic", "tremor", "aftershock", "foreshock",
            "magnitude [0-9]\\.?[0-9]?", "quake", "epicenter", "richter",
        ],
    },
    {
        id: "storm",
        label: "Severe Weather",
        icon: "⛈️",
        iconUrl: "/icons/openmoji/storm.svg",
        color: "#546E7A",
        category: "Natural Hazard",
        aliases: [
            "severe weather", "thunderstorm", "lightning storm", "windstorm",
            "hailstorm", "tornado", "twister", "hurricane", "cyclone", "typhoon",
            "nor'easter", "derecho", "microburst", "wind warning", "gale", "blizzard",
        ],
    },
    {
        id: "heat",
        label: "Heatwave",
        icon: "🌡️",
        iconUrl: "/icons/openmoji/heat.svg",
        color: "#D84315",
        category: "Natural Hazard",
        aliases: [
            "heatwave", "heat wave", "extreme heat", "heat advisory", "record heat",
            "hot spell", "temperature record",
        ],
    },
    {
        id: "cold",
        label: "Cold Snap",
        icon: "❄️",
        iconUrl: "/icons/openmoji/cold.svg",
        color: "#1976D2",
        category: "Natural Hazard",
        aliases: [
            "cold snap", "cold wave", "arctic blast", "polar vortex", "freeze warning",
            "hard freeze", "wind chill", "blizzard", "snowstorm",
        ],
    },
    {
        id: "landslide",
        label: "Landslide",
        icon: "⛰️",
        iconUrl: "/icons/openmoji/landslide.svg",
        color: "#6D4C41",
        category: "Natural Hazard",
        aliases: [
            "landslide", "mudslide", "debris flow", "slope failure", "rockslide", "earth movement",
        ],
    },
    {
        id: "avalanche",
        label: "Avalanche",
        icon: "🏔️",
        iconUrl: "/icons/openmoji/avalanche.svg",
        color: "#90A4AE",
        category: "Natural Hazard",
        aliases: [
            "avalanche", "snow slide", "slab release", "avalanche bulletin",
        ],
    },
    {
        id: "tsunami",
        label: "Tsunami",
        icon: "🌊",
        iconUrl: "/icons/openmoji/tsunami.svg",
        color: "#01579B",
        category: "Natural Hazard",
        aliases: [
            "tsunami", "tsunami warning", "seiche", "tsunami advisory", "tidal wave",
        ],
    },
    {
        id: "volcano",
        label: "Volcano",
        icon: "🌋",
        iconUrl: "/icons/openmoji/volcano.svg",
        color: "#C62828",
        category: "Natural Hazard",
        aliases: [
            "volcano", "eruption", "lava flow", "pyroclastic", "ash plume",
            "lahar", "volcanic activity",
        ],
    },

    // --- Fire (non-wildland) ---
    {
        id: "structure_fire",
        label: "Structure Fire",
        icon: "🚒",
        iconUrl: "/icons/openmoji/structure_fire.svg",
        color: "#EF5350",
        category: "Fire",
        aliases: [
            "structure fire", "house fire", "building fire", "apartment fire",
            "warehouse fire", "alarm of fire", "residential fire", "commercial fire",
        ],
    },

    // --- Utilities & Infrastructure ---
    {
        id: "power_outage",
        label: "Power Outage",
        icon: "⚡️",
        iconUrl: "/icons/openmoji/power_outage.svg",
        color: "#FDD835",
        category: "Utilities & Infrastructure",
        aliases: [
            "power outage", "blackout", "power cut", "power failure", "electricity outage",
            "grid failure", "rolling blackout", "brownout",
        ],
    },
    {
        id: "water_main",
        label: "Water Main / Boil Water",
        icon: "🚰",
        iconUrl: "/icons/openmoji/water_main.svg",
        color: "#42A5F5",
        category: "Utilities & Infrastructure",
        aliases: [
            "water main break", "boil water", "boil-water", "water advisory",
            "water outage", "low water pressure", "pipe burst",
        ],
    },
    {
        id: "gas_leak",
        label: "Gas Leak",
        icon: "🛢️",
        iconUrl: "/icons/openmoji/gas_leak.svg",
        color: "#8E24AA",
        category: "Utilities & Infrastructure",
        aliases: [
            "gas leak", "natural gas leak", "odor of gas", "pipeline leak", "methane leak",
        ],
    },
    {
        id: "telecom",
        label: "Telecom Outage",
        icon: "📶",
        iconUrl: "/icons/openmoji/telecom.svg",
        color: "#455A64",
        category: "Utilities & Infrastructure",
        aliases: [
            "cell outage", "cellular outage", "mobile network down", "internet outage",
            "wifi outage", "telecom outage", "carrier outage", "911 outage", "service disruption",
        ],
    },

    // --- Transport ---
    {
        id: "traffic_accident",
        label: "Traffic Accident",
        icon: "🚗",
        iconUrl: "/icons/openmoji/traffic_accident.svg",
        color: "#F4511E",
        category: "Transport",
        aliases: [
            "traffic accident", "collision", "multi-vehicle crash", "pileup", "MVC",
            "car crash", "motorcycle crash", "semi crash",
        ],
    },
    {
        id: "road_closure",
        label: "Road Closure",
        icon: "🚧",
        iconUrl: "/icons/openmoji/road_closure.svg",
        color: "#FF8F00",
        category: "Transport",
        aliases: [
            "road closure", "highway closed", "lane closure", "bridge closed",
            "detour", "closed due to",
        ],
    },
    {
        id: "transit_disruption",
        label: "Transit Disruption",
        icon: "🚌",
        iconUrl: "/icons/openmoji/transit_disruption.svg",
        color: "#7CB342",
        category: "Transport",
        aliases: [
            "train delay", "subway delay", "bus delay", "service suspended",
            "service disruption", "signal problem", "overhead wire",
        ],
    },
    {
        id: "air_marine",
        label: "Air/Marine Incident",
        icon: "🛩️",
        iconUrl: "/icons/openmoji/air_marine.svg",
        color: "#26A69A",
        category: "Transport",
        aliases: [
            "plane crash", "emergency landing", "runway closed", "mayday",
            "boat capsized", "ferry delayed", "marine incident", "vessel adrift",
        ],
    },

    // --- Public Safety ---
    {
        id: "police_incident",
        label: "Police Incident",
        icon: "🚓",
        iconUrl: "/icons/openmoji/police_incident.svg",
        color: "#3949AB",
        category: "Public Safety",
        aliases: [
            "police incident", "active shooter", "shots fired", "standoff",
            "shelter in place", "lockdown", "armed suspect", "bomb threat",
        ],
    },
    {
        id: "missing_person",
        label: "Missing Person",
        icon: "🧭",
        iconUrl: "/icons/openmoji/missing_person.svg",
        color: "#5E35B1",
        category: "Public Safety",
        aliases: [
            "missing person", "amber alert", "silver alert", "endangered missing",
            "child abduction", "locate suspect",
        ],
    },
    {
        id: "evacuation",
        label: "Evacuation",
        icon: "🏃‍♂️",
        iconUrl: "/icons/openmoji/evacuation.svg",
        color: "#D32F2F",
        category: "Public Safety",
        aliases: [
            "evacuation ordered", "evacuation alert", "evacuate now",
            "mandatory evacuation", "evacuation center",
        ],
    },

    // --- Health ---
    {
        id: "medical",
        label: "Medical Emergency",
        icon: "🚑",
        iconUrl: "/icons/openmoji/medical.svg",
        color: "#C62828",
        category: "Health",
        aliases: [
            "medical emergency", "mass casualty", "MCI", "overdose surge",
            "poisoning", "EMS response",
        ],
    },
    {
        id: "outbreak",
        label: "Disease Outbreak",
        icon: "🦠",
        iconUrl: "/icons/openmoji/outbreak.svg",
        color: "#2E7D32",
        category: "Health",
        aliases: [
            "outbreak", "epidemic", "cluster of cases", "foodborne illness",
            "norovirus", "measles case", "influenza surge", "COVID outbreak",
        ],
    },
    {
        id: "air_quality",
        label: "Air Quality",
        icon: "🌫️",
        iconUrl: "/icons/openmoji/air_quality.svg",
        color: "#9E9E9E",
        category: "Health",
        aliases: [
            "air quality", "AQI", "smoke advisory", "smog", "air quality warning", "particulate matter",
        ],
    },

    // --- Environmental / HazMat ---
    {
        id: "hazmat_spill",
        label: "Hazardous Spill",
        icon: "☣️",
        iconUrl: "/icons/openmoji/hazmat_spill.svg",
        color: "#000000",
        category: "Environmental / HazMat",
        aliases: [
            "hazmat", "hazardous spill", "chemical spill", "toxic release",
            "ammonia leak", "chlorine leak", "acid spill", "HAZMAT",
        ],
    },
    {
        id: "oil_spill",
        label: "Oil Spill",
        icon: "🛢️",
        iconUrl: "/icons/openmoji/oil_spill.svg",
        color: "#263238",
        category: "Environmental / HazMat",
        aliases: [
            "oil spill", "diesel spill", "fuel spill", "pipeline rupture", "bunker fuel", "bitumen spill",
        ],
    },

    // --- Civil / Political Events ---
    {
        id: "protest",
        label: "Protest / Demonstration",
        icon: "🪧",
        iconUrl: "/icons/openmoji/protest.svg",
        color: "#FF5722",
        category: "Civil / Political Events",
        aliases: [
            "protest", "protester", "demonstration", "rally", "march", "sit-in",
            "walkout", "counter-protest", "mass protest", "activist rally",
            "civil disobedience", "student protest",
        ],
    },
    {
        id: "riot",
        label: "Riot / Civil Unrest",
        icon: "⚔️",
        iconUrl: "/icons/openmoji/riot.svg",
        color: "#BF360C",
        category: "Civil / Political Events",
        aliases: [
            "riot", "civil unrest", "clashes", "looting", "mob violence",
            "street violence", "unrest", "disturbance", "violent protest", "uprising", "turmoil",
        ],
    },
    {
        id: "strike",
        label: "Strike / Labor Action",
        icon: "✍️",
        iconUrl: "/icons/openmoji/strike.svg",
        color: "#6A1B9A",
        category: "Civil / Political Events",
        aliases: [
            "strike", "walkout", "picket", "work stoppage", "union action",
            "labor strike", "teachers strike", "rail strike", "workers protest",
        ],
    },
    {
        id: "political_crisis",
        label: "Political Crisis",
        icon: "🏛️",
        iconUrl: "/icons/openmoji/political_crisis.svg",
        color: "#283593",
        category: "Civil / Political Events",
        aliases: [
            "political turmoil", "coup", "coup d'etat", "power struggle",
            "political standoff", "constitutional crisis", "regime change", "government collapse",
        ],
    },

    // --- Criminal / Illegal Activity ---
    {
        id: "shooting",
        label: "Shooting / Gun Violence",
        icon: "🔫",
        iconUrl: "/icons/openmoji/shooting.svg",
        color: "#B71C1C",
        category: "Public Safety",
        aliases: [
            "shooting", "shots fired", "mass shooting", "gunfire", "active shooter", "drive-by", "gun violence",
        ],
    },
    {
        id: "explosion",
        label: "Explosion / Bombing",
        icon: "💥",
        iconUrl: "/icons/openmoji/explosion.svg",
        color: "#F44336",
        category: "Public Safety",
        aliases: [
            "explosion", "bomb", "IED", "blast", "detonation", "explosive device",
            "bomb scare", "car bomb", "pipe bomb",
        ],
    },
    {
        id: "terror_attack",
        label: "Terror Attack",
        icon: "🏴",
        iconUrl: "/icons/openmoji/terror_attack.svg",
        color: "#000000",
        category: "Public Safety",
        aliases: [
            "terror attack", "terrorist attack", "extremist attack", "suicide bombing",
            "militant attack", "insurgent attack", "terror plot",
        ],
    },
    {
        id: "organized_crime",
        label: "Organized Crime",
        icon: "💀",
        iconUrl: "/icons/openmoji/organized_crime.svg",
        color: "#4E342E",
        category: "Public Safety",
        aliases: [
            "gang violence", "organized crime", "drug cartel", "mafia", "gang shootout", "gang-related",
        ],
    },
    {
        id: "looting",
        label: "Looting / Vandalism",
        icon: "🪓",
        iconUrl: "/icons/openmoji/looting.svg",
        color: "#795548",
        category: "Public Safety",
        aliases: [
            "looting", "plundering", "smash-and-grab", "robbery during unrest",
            "vandalism", "destruction of property",
        ],
    },

    // --- Other ---
    {
        id: "other",
        label: "Other",
        icon: "❓",
        iconUrl: "/icons/openmoji/other.svg",
        color: "#607D8B",
        category: "Other",
        aliases: [
            "unclassified incident", "unknown incident", "incident", "emergency", "developing situation",
        ],
    },

    // --- Categories ---
    {
        id: "categories",
        label: "More Options",
        icon: "🔎",
        iconUrl: "/icons/openmoji/categories.svg",
        color: "#607D8B",
    },
];


// Quick picks to keep the modal snappy
export const QUICK_PICK_IDS = [
    "wildfire",
    "flood",
    "storm",
    "power_outage",
    "traffic_accident",
    "police_incident",
    "medical",
    "political_crisis",
    "categories",
];

// --- Helpers ---
export const getCrisisType = (id) => CRISIS_TYPES.find((t) => t.id === id);

export const getSelectOptions = (ids = QUICK_PICK_IDS) =>
    CRISIS_TYPES.filter((t) => ids.includes(t.id)).map((t) => ({
        value: t.id,
        label: `${t.icon} ${t.label}`,
    }));

// Build a news-API-friendly OR-query per type 
export const buildNewsQueryForType = (id) => {
    const t = getCrisisType(id);
    if (!t) return "";
    const parts = [t.label, ...(t.aliases || [])]
        .map((s) => `"${s}"`)
        .join(" OR ");
    return `(${parts})`;
};

// Combine multiple types into one query
export const buildNewsQuery = (ids) =>
    ids.map(buildNewsQueryForType).filter(Boolean).join(" OR ");

// Naive headline classifier (you can upgrade to fuzzy/regex later)
export const matchHeadlineToType = (headline) => {
    const h = headline.toLowerCase();
    for (const t of CRISIS_TYPES) {
        const keys = [t.label, ...(t.aliases || [])];
        if (keys.some((k) => h.includes(k.toLowerCase()))) return t.id;
    }
    return "other";
};

// Fast lookup
export const CRISIS_BY_ID = Object.fromEntries(
    CRISIS_TYPES.map(t => [t.id, t])
);

// Helper: get objects for a list of IDs
export const getByIds = (ids) =>
    ids.map(id => CRISIS_BY_ID[id]).filter(Boolean);

// pre-materialize quick picks as objects
export const QUICK_PICKS = getByIds(QUICK_PICK_IDS);
