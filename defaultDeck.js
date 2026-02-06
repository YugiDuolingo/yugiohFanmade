const cardData = 

[
  {
    "cn": "4 stared ladybug of doom",
    "atr": "wind",
    "tr": 3,
    "ak": 800,
    "df": 1200,
    "tp": "insect",
    "desc": "FLIP: Destroy all Level 4 monsters your opponent controls."
  },
  {
    "cn": "7 tools of the bandit",
    "atr": "trap",
    "value": "a-1000",
    "desc": "When a Trap Card is activated: Pay 1000 LP; negate the activation, and if you do, destroy it."
  },
  {
    "cn": "Alligator's Sword",
    "atr": "earth",
    "tr": 4,
    "ak": 1500,
    "df": 1200,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Alligator's Sword Dragon",
    "atr": "wind",
    "tr": 5,
    "ak": 1500,
    "df": 1200,
    "tp": "winged-beast",
    "extra": "true",
    "clr": 1,
    "desc": "If the only monsters your opponent controls are face-down, this card can attack your opponent directly."
  },
  {
    "cn": "Alpha The Magnet Warrior",
    "atr": "earth",
    "tr": 4,
    "ak": 1700,
    "df": 1500,
    "tp": "rock",
    "desc": " "
  },
  {
    "cn": "Ancient Lamp",
    "atr": "dark",
    "tr": 3,
    "ak": 900,
    "df": 1400,
    "tp": "fiend",
    "desc": "During your Main Phase: You can Special Summon \"La Jinn the Mystical Genie of the Lamp\" from your hand. This card must be face-up on the field to activate and to resolve this effect. Before damage calculation, if this card is being attacked by an opponent's monster, and was face-down at the start of the Damage Step: You can target 1 monster your opponent controls, except the attacking monster; change the attack target to that opponent's monster and perform damage calculation."
  },
  {
    "cn": "Axe Raider",
    "atr": "earth",
    "tr": 4,
    "ak": 1700,
    "df": 1000,
    "tp": "fiend",
    "desc": " "
  },
  {
    "cn": "Baby Dragon",
    "atr": "wind",
    "tr": 3,
    "ak": 1200,
    "df": 700,
    "tp": "dragon",
    "desc": " "
  },
  {
    "cn": "Battle Ox",
    "atr": "earth",
    "tr": 4,
    "ak": 1700,
    "df": 1200,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Beaver Warrior",
    "atr": "earth",
    "tr": 4,
    "ak": 1200,
    "df": 1500,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Berfomet",
    "atr": "dark",
    "tr": 4,
    "ak": 1600,
    "df": 100,
    "tp": "fiend",
    "desc": "When this card is Normal or Flip Summoned, you can add 1 \"Gazelle the King of Mythical Beasts\" from your Deck to your hand."
  },
  {
    "cn": "Beta The Magnet Warrior",
    "atr": "earth",
    "tr": 4,
    "ak": 1700,
    "df": 1600,
    "tp": "rock",
    "desc": " "
  },
  {
    "cn": "big shield guardna",
    "atr": "earth",
    "tr": 4,
    "ak": 0,
    "df": 2600,
    "tp": "warrior",
    "desc": "When a Spell Card is activated that targets this face-down card (and no other cards) (Quick Effect): Change this card to face-up Defense Position, and if you do, negate the activation. If this card is attacked, change it to Attack Position at the end of the Damage Step."
  },
  {
    "cn": "black magic ritual",
    "atr": "spell",
    "desc": "This card is used to Ritual Summon \"Magician of Black Chaos\". You must also Tribute monsters from your hand or field whose total Levels equal 8 or more."
  },
  {
    "cn": "Blue-Eyes White Dragon",
    "atr": "dark",
    "tr": 8,
    "ak": 3000,
    "df": 2500,
    "tp": "dragon",
    "desc": " "
  },
  {
    "cn": "Brain Control",
    "atr": "spell",
    "desc": "Pay 800 LP, then target 1 face-up monster your opponent controls that can be Normal Summoned/Set; take control of that target until the End Phase."
  },
  {
    "cn": "call of the hunted",
    "atr": "trap",
    "desc": "Activate this card by targeting 1 monster in your GY; Special Summon that target in Attack Position. When this card leaves the field, destroy that monster. When that monster is destroyed, destroy this card."
  },
  {
    "cn": "Card Destruction",
    "atr": "spell",
    "desc": "Each player discards their entire hand and draws the same number of cards they discarded."
  },
  {
    "cn": "card of sanctity",
    "atr": "spell",
    "desc": "Each player draws until they have 6 cards in their hand."
  },
  {
    "cn": "catapulte turtle",
    "atr": "water",
    "tr": 5,
    "ak": 1000,
    "df": 2000,
    "tp": "aqua",
    "desc": "Once per turn: You can Tribute 1 monster; inflict damage to your opponent equal to half the Tributed monster's ATK on the field."
  },
  {
    "cn": "change of heart",
    "atr": "spell"
  },
  {
    "cn": "Crush Card Virus",
    "atr": "trap",
    "desc": "Tribute 1 DARK monster with 1000 or less ATK; your opponent takes no damage until the end of the next turn after this card resolves, also, you look at your opponent's hand and all monsters they control, and if you do, destroy the monsters among them with 1500 or more ATK, then your opponent can destroy up to 3 monsters with 1500 or more ATK in their Deck"
  },
  {
    "cn": "Cyber Harpie Lady",
    "atr": "wind",
    "tr": 4,
    "ak": 1800,
    "df": 1300,
    "tp": "winged beast",
    "desc": " "
  },
  {
    "cn": "Cyber Jar",
    "atr": "dark",
    "tr": 3,
    "ak": 800,
    "df": 800,
    "tp": "machine",
    "desc": "FLIP: Destroy all monsters on the field, then both players reveal the top 5 cards from their Decks, then Special Summon all revealed Level 4 or lower monsters in face-up Attack Position or face-down Defense Position, also add any remaining cards to their hand. (If either player has less than 5 cards in their Deck, reveal as many as possible.)"
  },
  {
    "cn": "Dark Hole",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "dark magician",
    "atr": "dark",
    "tr": 7,
    "ak": 2500,
    "df": 2100,
    "tp": "fairy",
    "desc": " "
  },
  {
    "cn": "Dark Magician Girl",
    "atr": "dark",
    "tr": 6,
    "ak": 2000,
    "df": 1700,
    "tp": "Spell-caster",
    "value": "a300",
    "desc": "This card gains 300 ATK for every \"Dark Magician\" or \"Magician of Black Chaos\" in either player's Graveyard."
  },
  {
    "cn": "De-Spell",
    "atr": "spell",
    "desc": "Destroy 1 Spell Card on the field."
  },
  {
    "cn": "defusion",
    "atr": "spell",
    "desc": "You can split 1 Fusion Monster to disable an attack this turn."
  },
  {
    "cn": "emergency provision",
    "atr": "spell",
    "value": "a1000",
    "desc": "Send any number of other Spells/Traps you control to the GY; gain 1000 LP for each card sent to the GY this way."
  },
  {
    "cn": "extchange",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "feather duster",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "fissure",
    "atr": "spell",
    "desc": "Destroy the 1 face-up monster your opponent controls that has the lowest ATK (your choice, if tied)."
  },
  {
    "cn": "Gamma The Magnet Warrior",
    "atr": "earth",
    "tr": 4,
    "ak": 1500,
    "df": 1800,
    "tp": "rock",
    "desc": " "
  },
  {
    "cn": "Gazelle",
    "atr": "earth",
    "tr": 4,
    "ak": 1500,
    "df": 1200,
    "tp": "beast",
    "desc": " "
  },
  {
    "cn": "gemeni elf",
    "atr": "earth",
    "tr": 4,
    "ak": 1900,
    "df": 900,
    "tp": "fairy",
    "desc": " "
  },
  {
    "cn": "giant soldier of stone",
    "atr": "earth",
    "tr": 4,
    "ak": 1300,
    "df": 2000,
    "tp": "rock",
    "desc": " "
  },
  {
    "cn": "giant trunade",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "Graceful Charity",
    "atr": "spell",
    "desc": "Draw 3 cards, then discard 2 cards."
  },
  {
    "cn": "graceful dice",
    "atr": "spell",
    "value": "l+"
  },
  {
    "cn": "grave robber",
    "atr": "trap",
    "desc": "Steal 1 card from your opponent's Graveyard."
  },
  {
    "cn": "Headless Knight",
    "atr": "dark",
    "tr": 4,
    "ak": 1400,
    "df": 1750,
    "tp": "fiend",
    "desc": " "
  },
  {
    "cn": "Heavy Storm",
    "atr": "spell",
    "desc": "Destroy all Spell and Trap Cards on the field."
  },
  {
    "cn": "horn of the unicorn",
    "atr": "spell",
    "value": "a700",
    "desc": "+700 attacl"
  },
  {
    "cn": "Jack's knight",
    "atr": "dark",
    "tr": 4,
    "ak": 1900,
    "df": 1000,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Jinzo",
    "atr": "dark",
    "tr": 6,
    "ak": 2400,
    "df": 1600,
    "tp": "fiend",
    "desc": "As long as this card remains face-up on the field, negate the activation and effect of Trap Cards. When this is summoned, destroy all traps on your opponent’s side of the field"
  },
  {
    "cn": "King's Knight",
    "atr": "dark",
    "tr": 4,
    "ak": 1600,
    "df": 1400,
    "tp": "warrior",
    "desc": "When this card is Normal Summoned while you control \"Queen's Knight\": You can Special Summon 1 \"Jack's Knight\" from your Deck."
  },
   {
    "cn": "queen's knight",
    "atr": "earth",
    "tr": 4,
    "ak": 1500,
    "df": 1600,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Jack's knight",
    "atr": "dark",
    "tr": 4,
    "ak": 1900,
    "df": 1000,
    "tp": "warrior",
    "desc": " "
  },
  {
    "cn": "Kuriboh",
    "atr": "dark",
    "tr": 2,
    "ak": 300,
    "df": 200,
    "tp": "fiend",
    "desc": "Discard this card during either player's turn. You take no damage from a monster and 1 monster you control cannot be destroyed by the same effect or battle. When this card is targeted for an attack or effect, you can negate the event. Afterwards, destroy this card and take damage equal to this card's ATK."
  },
  {
    "cn": "La Jinn",
    "atr": "dark",
    "tr": 4,
    "ak": 1800,
    "df": 1000,
    "tp": "fiend",
    "desc": " "
  },
  {
    "cn": "magic cylinder",
    "atr": "trap",
    "desc": "Absorb a monster's attack and bounce it back to the opponent!"
  },

  
  {
    "cn": "Magical Hats",
    "atr": "trap",
    "desc": "During your opponent's Battle Phase: Choose 2 Spells/Traps from your Deck and 1 monster in your Main Monster Zone. Special Summon them as Normal Monsters (ATK 0/DEF 0) in face-down Defense Position, Set the chosen monster if it is face-up, and shuffle them on the field. The 2 cards chosen from your Deck are destroyed at the end of the Battle Phase, and cannot remain on the field except during this Battle Phase."
  },
  {
    "cn": "magician of faith",
    "atr": "dark",
    "tr": 2,
    "ak": 200,
    "df": 300,
    "tp": "fairy",
    "desc": "FLIP: Target 1 Spell in your GY; add that target to your hand."
  },
  {
    "cn": "magician's valkiria",
    "atr": "light",
    "tr": 4,
    "ak": 1600,
    "df": 1800,
    "tp": "Spell-caster",
    "desc": "Monsters your opponent controls cannot target face-up Spellcaster-Type monsters for attacks, except this one."
  },

 {
    "cn": "magician's valkiria",
    "atr": "light",
    "tr": 4,
    "ak": 1600,
    "df": 1800,
    "tp": "Spell-caster",
    "desc": "Monsters your opponent controls cannot target face-up Spellcaster-Type monsters for attacks, except this one."
  },
   {
    "cn": "magician's valkiria",
    "atr": "light",
    "tr": 4,
    "ak": 1600,
    "df": 1800,
    "tp": "Spell-caster",
    "desc": "Monsters your opponent controls cannot target face-up Spellcaster-Type monsters for attacks, except this one."
  },

  {
    "cn": "Man-Eater Bug",
    "atr": "earth",
    "tr": 2,
    "ak": 450,
    "df": 600,
    "tp": "insect",
    "desc": "FLIP: Target 1 monster on the field; destroy it."
  },
  {
    "cn": "Mirror Force",
    "atr": "trap",
    "desc": "When an opponent's monster attacks, redirect the attack to all Attack Position monsters your opponent controls"
  },
  {
    "cn": "Mirror Wall",
    "atr": "trap",
    "value": "a*0.5",
    "desc": "Halve the ATK of your opponent's attacking monsters. Once per turn, during your Standby Phase, pay 2000 LP or destroy this card."
  },
  {
    "cn": "monster reborn",
    "atr": "spell",
    "desc": "Select 1 Monster Card from either your opponent's or your own Graveyard and place it on the field under your control in Attack or Defense Position (face-up). This is considered a Special Summon."
  },
  {
    "cn": "monster reincarnation",
    "atr": "spell",
    "desc": "Discard 1 card, then target 1 monster in your GY; add it to your hand."
  },
  {
    "cn": "Morphing Jar",
    "atr": "earth",
    "tr": 2,
    "ak": 800,
    "df": 600,
    "tp": "rock",
    "desc": "FLIP: Both players discard as many cards as possible from their hands, then each player draws 5 cards."
  },
  {
    "cn": "mystical elf",
    "atr": "light",
    "tr": 4,
    "ak": 800,
    "df": 2000,
    "tp": "fairy",
    "desc": " "
  },
  {
    "cn": "mystical typhoon",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "Negate Attack",
    "atr": "trap",
    "desc": " "
  },
  {
    "cn": "obnoxious celtic gardian",
    "atr": "earth",
    "tr": 4,
    "ak": 1400,
    "df": 1200,
    "tp": "warrior",
    "desc": "Cannot be destroyed by battle with a monster that has 1900 or more ATK."
  },
  {
    "cn": "Panther Warrior",
    "atr": "earth",
    "tr": 4,
    "ak": 2000,
    "df": 1600,
    "tp": "warrior",
    "desc": "This card cannot declare an attack unless you Tribute 1 monster."
  },
  {
    "cn": "polymerisation",
    "atr": "spell",
    "desc": " "
  },
 
  {
    "cn": "Quick Attack",
    "atr": "spell",
    "desc": " "
  },
  {
    "cn": "raigeki",
    "atr": "spell"
  },
  {
    "cn": "ring of destraction",
    "atr": "trap",
    "desc": "Destroy 1 face-up monster and inflict damage to both players equal to its ATK."
  },
  {
    "cn": "Saggi the Dark Clown",
    "atr": "dark",
    "tr": 3,
    "ak": 1200,
    "df": 1500,
    "tp": "Spell-caster"
  },
  {
    "cn": "Scapegoat",
    "atr": "spell"
  },
  {
    "cn": "Shield & Sword",
    "atr": "spell",
    "desc": "Switch the original ATK and DEF of all face-up monsters currently on the field, until the end of this turn."
  },
  {
    "cn": "Shrink",
    "atr": "spell",
    "value": "a*0.5",
    "desc": "The ATK of 1 monster on the field is halved."
  },
  {
    "cn": "Skull Dice",
    "atr": "trap",
    "value": "l-"
  },
  {
    "cn": "soul extchange",
    "atr": "spell",
    "desc": "Target 1 monster your opponent controls; this turn, if you Tribute a monster, you must Tribute that target, as if you controlled it. You cannot conduct your Battle Phase the turn you activate this card."
  },
  {
    "cn": "stop attack",
    "atr": "spell"
  },
  {
    "cn": "Stop Defense",
    "atr": "spell"
  },
  {
    "cn": "Swords of Revealing Light",
    "atr": "spell",
    "desc": "Flip all monsters your opponent controls face-up. This card remains on the field for 3 of your opponent's turns. While this card is face-up on the field, monsters your opponent controls cannot declare an attack."
  },
  {
    "cn": "trap hole",
    "atr": "trap",
    "desc": "Activate only when your opponent Normal Summons or Flip Summons a monster with 1000 or more ATK. Destroy that monster."
  },
  {
    "cn": "Y-Dragon Head",
    "atr": "light",
    "tr": 4,
    "ak": 1200,
    "df": 1100,
    "tp": "machine",
    "value": "a400",
    "desc": "Once per turn, during your Main Phase, if you control this card on the field, you can equip it to your \"X-Head Cannon\" as an Equip Card, OR unequip the Union equipment and Special Summon this card in face-up Attack Position. While equipped to a monster by this card's effect, increase the ATK and DEF of the equipped monster by 400 points. (1 monster can only be equipped with 1 Union Monster at a time. If the equipped monster is destroyed as a result of battle, destroy this card instead.)"
  },
  {
    "cn": "Z-Metal Tank",
    "atr": "light",
    "tr": 4,
    "ak": 1700,
    "df": 1500,
    "tp": "machine",
    "value": "a600",
    "desc": "Once per turn, during your Main Phase, if you control this card on the field, you can equip it to your \"X-Head Cannon\" or \"Y-Dragon Head\" as an Equip Card, OR unequip the Union equipment and Special Summon this card in face-up Attack Position. While equipped to a monster by this card's effect, increase the ATK and DEF of the equipped monster by 600 points. (1 monster can only be equipped with 1 Union Monster at a time. If the equipped monster is destroyed as a result of battle, destroy this card instead.)"
  },
  {
    "cn": "zombyra the dark",
    "atr": "dark",
    "tr": 4,
    "ak": 2100,
    "df": 100,
    "tp": "fiend",
    "value": "a-200",
    "desc": "Cannot attack directly. If this card destroys a monster by battle: This card loses 200 ATK."
  },
  {
    "cn": "pot of greed",
    "atr": "spell",
    "desc": "Draw 2 cards from your Deck."
  },
  {
    "cn": "X-Head Cannon",
    "atr": "light",
    "tr": 4,
    "ak": 1800,
    "df": 1500,
    "tp": "machine"
  },
  {
    "cn": "token",
    "atr": "earth",
    "ak": 0,
    "df": 0,
    "extra": "true"
  },
  {
    "cn": "token",
    "atr": "earth",
    "ak": 0,
    "df": 0,
    "extra": "true"
  },
  {
    "cn": "token",
    "atr": "earth",
    "ak": 0,
    "df": 0,
    "extra": "true"
  },
  {
    "cn": "token",
    "atr": "earth",
    "ak": 0,
    "df": 0,
    "extra": "true"
  },
  {
    "cn": "Dark Magician of Chaos",
    "atr": "dark",
    "tr": 8,
    "ak": 2800,
    "df": 2600,
    "tp": "Spell-caster",
    "clr": 2
  },
  {
    "cn": "time wizard",
    "atr": "light",
    "tr": 2,
    "ak": 500,
    "df": 400,
    "value": "a*0.5",
    "desc": "Once per turn: You can toss a coin and call it. If you call it right, destroy all monsters your opponent controls. If you call it wrong, destroy as many monsters you control as possible, and if you do, take damage equal to half the total ATK those destroyed monsters had while face-up on the field."
  },
  {
    "cn": "thousand dragon",
    "atr": "wind",
    "tr": 7,
    "ak": 2400,
    "df": 2000,
    "tp": "dragon",
    "extra": "true",
    "clr": 1
  },
  {
    "cn": "Summoned Skull",
    "atr": "dark",
    "tr": 6,
    "ak": 2500,
    "df": 1200,
    "tp": "fiend"
  },
  {
    "cn": "Spear Dragon",
    "atr": "wind",
    "tr": 4,
    "ak": 1900,
    "df": 0,
    "tp": "dragon",
    "desc": "If this card attacks a Defense Position monster, inflict piercing battle damage. If this card attacks, it is changed to Defense Position at the end of the Damage Step."
  },
  {
    "cn": "big burger",
    "atr": "earth",
    "tr": 4,
    "ak": 1800,
    "df": 1800,
    "tp": "food",
    "emoji": "🍔"
  },

  {
    "cn": "Magical Arm Shield",
    "atr": "trap",
    
  },

  {
    "cn": "Spellbinding Circle",
    "atr": "trap",
    
  },

  {
    "cn": "Magic Jammer ",
    "atr": "trap",
    
  },

 {
    "cn": "Sangan",
    "atr": "dark",
    "tr": 3,
    "ak": 1000,
    "df": 600,
    "tp": "fiend",
    "desc": "If this card is sent from the field to the GY: Add 1 monster with 1500 or less ATK from your Deck to your hand, but you cannot activate cards, or the effects of cards, with that name for the rest of this turn. You can only use this effect of Sangan once per turn.."
  },

{
    "cn": "witch of the blacl forest",
    "atr": "dark",
    "tr": 3,
    "ak": 1000,
    "df": 600,
    "tp": "fiend",
    "desc": "If this card is sent from the field to the GY: Add 1 monster with 1500 or less ATK from your Deck to your hand, but you cannot activate cards, or the effects of cards, with that name for the rest of this turn. You can only use this effect of Sangan once per turn.."
  },

]

;