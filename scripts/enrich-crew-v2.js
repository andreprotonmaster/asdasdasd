/**
 * Crew enrichment script v2
 * Adds dateOfBirth, birthPlace, education, militaryService,
 * timeInSpace, twitter, and selection fields for all 30 crew members.
 * Data sourced from Wikipedia infoboxes and NASA bios.
 */

const fs = require('fs');
const path = require('path');

const crewPath = path.join(__dirname, '..', 'public', 'data', 'crew.json');
const crew = JSON.parse(fs.readFileSync(crewPath, 'utf-8'));

const enrichmentData = {
  "Robert Behnken": {
    dateOfBirth: "1970-07-28",
    birthPlace: "St. Ann, Missouri, U.S.",
    education: ["BS Mechanical Engineering & Physics, Washington University in St. Louis", "MS & PhD Mechanical Engineering, California Institute of Technology"],
    militaryService: "Colonel, U.S. Air Force",
    timeInSpace: "93d 11h 42m",
    twitter: "AstroBehnken",
    selection: "NASA Group 18 (2000)"
  },
  "Douglas Hurley": {
    dateOfBirth: "1966-10-21",
    birthPlace: "Endicott, New York, U.S.",
    education: ["BS Civil Engineering, Tulane University"],
    militaryService: "Colonel, U.S. Marine Corps",
    timeInSpace: "92d 10h 38m",
    twitter: null,
    selection: "NASA Group 18 (2000)"
  },
  "Shannon Walker": {
    dateOfBirth: "1965-06-04",
    birthPlace: "Houston, Texas, U.S.",
    education: ["BA Physics, Rice University", "MS & PhD Space Physics, Rice University"],
    militaryService: null,
    timeInSpace: "330d 13h 40m",
    twitter: null,
    selection: "NASA Group 19 (2004)"
  },
  "Soichi Noguchi": {
    dateOfBirth: "1965-04-15",
    birthPlace: "Yokohama, Japan",
    education: ["BS & MS Aeronautical Engineering, University of Tokyo", "PhD Advanced Interdisciplinary Studies, University of Tokyo"],
    militaryService: null,
    timeInSpace: "344d 9h 33m",
    twitter: "Astro_Soichi",
    selection: "NASDA Group (1996)"
  },
  "Victor J. Glover": {
    dateOfBirth: "1976-04-30",
    birthPlace: "Pomona, California, U.S.",
    education: ["BS General Engineering, Cal Poly San Luis Obispo", "MS Flight Test Engineering, Air University", "MS Systems Engineering, Naval Postgraduate School", "MMAS, Air University"],
    militaryService: "Captain, U.S. Navy",
    timeInSpace: "167d 6h 29m",
    twitter: "AstroVicGlover",
    selection: "NASA Group 21 (2013)"
  },
  "Michael S. Hopkins": {
    dateOfBirth: "1968-12-28",
    birthPlace: "Lebanon, Missouri, U.S.",
    education: ["BS Aerospace Engineering, University of Illinois Urbana-Champaign", "MS Aerospace Engineering, Stanford University"],
    militaryService: "Colonel, U.S. Space Force",
    timeInSpace: "340d 9h 33m",
    twitter: "Astro_Hoppy",
    selection: "NASA Group 20 (2009)"
  },
  "Shane Kimbrough": {
    dateOfBirth: "1967-06-04",
    birthPlace: "Killeen, Texas, U.S.",
    education: ["BS Aerospace Engineering, West Point", "MS Operations Research, Georgia Institute of Technology"],
    militaryService: "Colonel, U.S. Army (Ret.)",
    timeInSpace: "388d 15h 32m",
    twitter: "astro_kimbrough",
    selection: "NASA Group 19 (2004)"
  },
  "K. Megan McArthur": {
    dateOfBirth: "1971-08-30",
    birthPlace: "Honolulu, Hawaii, U.S.",
    education: ["BS Aerospace Engineering, UCLA", "PhD Oceanography, UC San Diego / Scripps Institution"],
    militaryService: null,
    timeInSpace: "203d 15h 20m",
    twitter: "Astro_Megan",
    selection: "NASA Group 18 (2000)"
  },
  "Thomas Pesquet": {
    dateOfBirth: "1978-02-27",
    birthPlace: "Rouen, Normandy, France",
    education: ["MS Space Systems, ISAE-SUPAERO, Toulouse", "Airline Transport Pilot License, Air France"],
    militaryService: null,
    timeInSpace: "396d 11h 34m",
    twitter: "Thom_astro",
    selection: "ESA Group (2009)"
  },
  "Akihiko Hoshide": {
    dateOfBirth: "1968-12-28",
    birthPlace: "Tokyo, Japan",
    education: ["BS Mechanical Engineering, Keio University", "MS Aerospace Engineering, University of Houston"],
    militaryService: null,
    timeInSpace: "340d 12h 52m",
    twitter: "Aki_Hoshide",
    selection: "NASDA Group (1999)"
  },
  "Raja Chari": {
    dateOfBirth: "1977-06-24",
    birthPlace: "Milwaukee, Wisconsin, U.S.",
    education: ["BS Astronautical Engineering, U.S. Air Force Academy", "MS Aeronautics & Astronautics, MIT"],
    militaryService: "Colonel, U.S. Air Force",
    timeInSpace: "176d 2h 39m",
    twitter: "Astro_Raja",
    selection: "NASA Group 22 (2017)"
  },
  "Thomas Marshburn": {
    dateOfBirth: "1960-08-29",
    birthPlace: "Statesville, North Carolina, U.S.",
    education: ["BS Physics, Davidson College", "MS Engineering Physics, University of Virginia", "MD, Wake Forest University"],
    militaryService: null,
    timeInSpace: "305d 1h 10m",
    twitter: "AstroMarshburn",
    selection: "NASA Group 19 (2004)"
  },
  "Matthias Maurer": {
    dateOfBirth: "1970-03-18",
    birthPlace: "St. Wendel, Saarland, Germany",
    education: ["Diploma Material Science, University of Saarland", "PhD Material Science, RWTH Aachen University"],
    militaryService: null,
    timeInSpace: "176d 2h 39m",
    twitter: "astro_matthias",
    selection: "ESA Group (2015)"
  },
  "Jared Isaacman": {
    dateOfBirth: "1983-02-11",
    birthPlace: "Summit, New Jersey, U.S.",
    education: ["BS Professional Aeronautics, Embry-Riddle Aeronautical University"],
    militaryService: null,
    timeInSpace: "8d 21h 17m",
    twitter: "rookisaacman",
    selection: "Private (Inspiration4, 2021)"
  },
  "Hayley Arceneaux": {
    dateOfBirth: "1991-12-04",
    birthPlace: "Baton Rouge, Louisiana, U.S.",
    education: ["BS Biology, St. Mary's University", "MS Physician Assistant Studies, Nova Southeastern University"],
    militaryService: null,
    timeInSpace: "2d 23h 55m",
    twitter: "ArceneauxHayley",
    selection: "Private (Inspiration4, 2021)"
  },
  "Sian Proctor": {
    dateOfBirth: "1970-03-28",
    birthPlace: "Guam, U.S.",
    education: ["BS Environmental Science, Syracuse University", "MS Geology, Arizona State University", "PhD Curriculum & Instruction (Geology), Arizona State University"],
    militaryService: null,
    timeInSpace: "2d 23h 55m",
    twitter: "DrSianProctor",
    selection: "Private (Inspiration4, 2021)"
  },
  "Christopher Sembroski": {
    dateOfBirth: "1979-08-28",
    birthPlace: "Elyria, Ohio, U.S.",
    education: ["BS Professional Aeronautics, Embry-Riddle Aeronautical University"],
    militaryService: "Veteran, U.S. Air Force",
    timeInSpace: "2d 23h 55m",
    twitter: "csaborsky",
    selection: "Private (Inspiration4, 2021)"
  },
  "Kayla Barron": {
    dateOfBirth: "1987-09-19",
    birthPlace: "Pocatello, Idaho, U.S.",
    education: ["BS Systems Engineering, U.S. Naval Academy", "MS Nuclear Engineering, University of Cambridge"],
    militaryService: "Lieutenant Commander, U.S. Navy",
    timeInSpace: "176d 2h 39m",
    twitter: "Astro_Kayla",
    selection: "NASA Group 22 (2017)"
  },
  "Michael López-Alegría": {
    dateOfBirth: "1958-05-30",
    birthPlace: "Madrid, Spain",
    education: ["BS Systems Engineering, U.S. Naval Academy", "MS Aeronautical Engineering, Naval Postgraduate School"],
    militaryService: "Captain, U.S. Navy (Ret.)",
    timeInSpace: "257d 22h 45m",
    twitter: "CommanderMLA",
    selection: "NASA Group 14 (1992)"
  },
  "Larry Connor": {
    dateOfBirth: "1950-01-01",
    birthPlace: "Dayton, Ohio, U.S.",
    education: ["MBA, Vanderbilt University"],
    militaryService: null,
    timeInSpace: "17d 1h 49m",
    twitter: null,
    selection: "Private (Axiom Ax-1, 2022)"
  },
  "Mark Pathy": {
    dateOfBirth: "1967-03-26",
    birthPlace: "Montreal, Quebec, Canada",
    education: ["BA Economics, McGill University", "MBA, INSEAD"],
    militaryService: null,
    timeInSpace: "17d 1h 49m",
    twitter: "mark_pathy",
    selection: "Private (Axiom Ax-1, 2022)"
  },
  "Eytan Stibbe": {
    dateOfBirth: "1958-11-12",
    birthPlace: "Haifa, Israel",
    education: ["BA Faculty of Humanities, Tel Aviv University"],
    militaryService: "Colonel, Israeli Air Force (Ret.)",
    timeInSpace: "17d 1h 49m",
    twitter: null,
    selection: "Private (Axiom Ax-1, 2022)"
  },
  "Kjell Lindgren": {
    dateOfBirth: "1973-01-23",
    birthPlace: "Taipei, Taiwan",
    education: ["BS Biology, U.S. Air Force Academy", "MD, University of Colorado", "MS Human Biology, University of Colorado"],
    militaryService: null,
    timeInSpace: "305d 7h 48m",
    twitter: "astro_kjell",
    selection: "NASA Group 20 (2009)"
  },
  "Robert Hines": {
    dateOfBirth: "1975-01-11",
    birthPlace: "Harrisburg, Pennsylvania, U.S.",
    education: ["BS Aerospace Engineering, Boston University", "MS Aerospace Engineering, University of Texas"],
    militaryService: "Colonel, U.S. Army",
    timeInSpace: "170d 21h 20m",
    twitter: "Astro_FarmerBob",
    selection: "NASA Group 22 (2017)"
  },
  "Samantha Cristoforetti": {
    dateOfBirth: "1977-04-26",
    birthPlace: "Milan, Italy",
    education: ["BS Aerospace Engineering, Technical University of Munich", "MS Mechanical Engineering, École supérieure de mécanique et d'aérotechnique"],
    militaryService: "Captain, Italian Air Force",
    timeInSpace: "369d 20h 36m",
    twitter: "AstroSamantha",
    selection: "ESA Group (2009)"
  },
  "Jessica Watkins": {
    dateOfBirth: "1988-05-14",
    birthPlace: "Gaithersburg, Maryland, U.S.",
    education: ["BS Geological & Environmental Sciences, Stanford University", "PhD Geology, UCLA"],
    militaryService: null,
    timeInSpace: "170d 21h 20m",
    twitter: "astro_watkins",
    selection: "NASA Group 22 (2017)"
  },
  "Nicole Aunapu Mann": {
    dateOfBirth: "1977-06-27",
    birthPlace: "Petaluma, California, U.S.",
    education: ["BS Mechanical Engineering, U.S. Naval Academy", "MS Mechanical Engineering, Stanford University"],
    militaryService: "Colonel, U.S. Marine Corps",
    timeInSpace: "157d 10h 1m",
    twitter: "AstroAnapu",
    selection: "NASA Group 21 (2013)"
  },
  "Josh A. Cassada": {
    dateOfBirth: "1973-07-18",
    birthPlace: "San Diego, California, U.S.",
    education: ["BS Physics, Albion College", "PhD High-Energy Particle Physics, University of Rochester"],
    militaryService: "Captain, U.S. Navy",
    timeInSpace: "157d 10h 1m",
    twitter: "Astro_Josh",
    selection: "NASA Group 21 (2013)"
  },
  "Koichi Wakata": {
    dateOfBirth: "1963-08-01",
    birthPlace: "Omiya, Saitama, Japan",
    education: ["BS Aeronautical Engineering, Kyushu University", "MS Applied Mechanics, Kyushu University", "PhD Aerospace Engineering, University of Colorado Boulder"],
    militaryService: null,
    timeInSpace: "504d 18h 35m",
    twitter: "Astro_Wakata",
    selection: "NASDA Group (1992)"
  },
  "Anna Kikina": {
    dateOfBirth: "1984-08-27",
    birthPlace: "Novosibirsk, Russia",
    education: ["Diploma Engineering, Siberian State University of Water Transport", "Degree in Economics & Management"],
    militaryService: null,
    timeInSpace: "157d 10h 1m",
    twitter: null,
    selection: "TsPK Cosmonaut Group (2012)"
  }
};

let enrichedCount = 0;

crew.forEach(member => {
  const data = enrichmentData[member.name];
  if (data) {
    member.dateOfBirth = data.dateOfBirth;
    member.birthPlace = data.birthPlace;
    member.education = data.education;
    member.militaryService = data.militaryService;
    member.timeInSpace = data.timeInSpace;
    member.twitter = data.twitter;
    member.selection = data.selection;
    enrichedCount++;
  } else {
    console.warn(`⚠️  No enrichment data for: ${member.name}`);
  }
});

fs.writeFileSync(crewPath, JSON.stringify(crew, null, 2));
console.log(`\n✅ Enriched ${enrichedCount}/${crew.length} crew members with:`);
console.log(`   - dateOfBirth`);
console.log(`   - birthPlace`);
console.log(`   - education (array)`);
console.log(`   - militaryService`);
console.log(`   - timeInSpace`);
console.log(`   - twitter`);
console.log(`   - selection`);
