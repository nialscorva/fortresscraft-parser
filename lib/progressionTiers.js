var oreTier={
	"Surface":0,
	"Copper":1,
	"Tin":1,
	"Laboratory":2,
	"Iron":3,
	"Lithium":4,
	"Gold":5,
	"Nickel":5,
	"Titanium":5,
	"Crystal":6,
	"Biomass":7
}

var progressionTierLabels=[
	"None", // 0
	"Coal, Copper, Tin", // 1
	"Laboratory", //2
	"Iron", // 3
	"Lithium", // 4
	"Gold, Nickel, Titanium", // 5
	"Crystal", // 6
	"Biomass" // 7
];
var	rootProgressionTiers={
	"Basic Experimental Pod":	oreTier["Copper"],
	"Simplified Experimental Pod": oreTier["Tin"],
	"Intermediate Experimental Pod": oreTier["Iron"],
	"Complex Experimental Pod":oreTier["Lithium"],
	"Advanced Experimental Pod":oreTier["Gold"],
	"Ultimate Experimental Pod":oreTier["Titanium"],
	"XL Experimental Pod":oreTier["Nickel"],

	"Coal Ore": oreTier["Copper"],
	"Crystal Deposit": oreTier["Crystal"],
	"Biomass Growth": oreTier["Biomass"],
	
	"Primary PCB": oreTier["Tin"],
	"Charged PCB": oreTier["Lithium"],
  "Hardened PCB": oreTier["Iron"],
  "Conductive PCB": oreTier["Gold"],

  "Organic Rock": oreTier["Lithium"],

  "Rough Hewn Rock": oreTier["Surface"],
  "Tree Trunk": oreTier["Surface"],
  "Leaves": oreTier["Surface"],
  "Snow": oreTier["Surface"],

  "Ruined heavy chitin": oreTier["Surface"],
  "Ruined light chitin": oreTier["Surface"],
  "Pristine faceted eye": oreTier["Surface"],
  "Pristine phosphorescent gland": oreTier["Surface"],
  "Pristine stinger": oreTier["Surface"],
  "Pristine Eye": oreTier["Surface"],
  "Perfect faceted eye": oreTier["Surface"],
  "Massive faceted eye": oreTier["Surface"],

  "Sugalite Crystal": oreTier["Gold"],

  "Diamond Crystal": oreTier["Iron"],
  "Emerald Crystal": oreTier["Iron"],
  "Ruby Crystal": oreTier["Iron"],
  "Sapphire Crystal": oreTier["Iron"],
  "Topaz Crystal": oreTier["Iron"],

  "Storage Hopper": oreTier["Iron"],
	"Chilled Cavern Stone": oreTier["Iron"],
  "Toxic Cavern Stone": oreTier["Biomass"],
	
	// Update for 1.4
	"Recombined Organic Matter": 0,
  "Rock": oreTier["Surface"],
  "Ruined Heavy Chitin": oreTier["Surface"],
  "Ruined Light Chitin": oreTier["Surface"],
  "Deep Stone": oreTier["Iron"],
  "Basic PCB": oreTier["Copper"],
  "Fortified PCB": oreTier["Iron"],
  "Iron Pipe": oreTier["Iron"],
  "Hardened Resin": oreTier["Iron"]
};

["Ore","Bar","Plate","Wire","Coil"].forEach(function(type) {
	rootProgressionTiers["Copper "+type]=oreTier["Copper"];
	rootProgressionTiers["Tin "+type]=oreTier["Tin"];
	rootProgressionTiers["Iron "+type]=oreTier["Iron"];
	rootProgressionTiers["Lithium "+type]=oreTier["Lithium"];
	rootProgressionTiers["Gold "+type]=oreTier["Gold"];
	rootProgressionTiers["Nickel "+type]=oreTier["Nickel"];
	rootProgressionTiers["Titanium "+type]=oreTier["Titanium"];
});

module.exports={
	labels: progressionTierLabels,
	rootTiers: rootProgressionTiers,
	labTier: oreTier["Laboratory"]
};