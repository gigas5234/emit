export type MentorColor =
  | "Red"
  | "Blue"
  | "Yellow"
  | "Purple"
  | "Gray"
  | "Green"
  | "Orange"
  | "Navy";

export interface MentorMatch {
  id: number;
  color1: MentorColor;
  color2: MentorColor;
  mixedColorResult: string;
  mentorName: string;
  occupation: string;
  coreExperienceInsight: string;
}

export const MENTOR_MATCHES: MentorMatch[] = [
  {
    id: 1,
    color1: "Red",
    color2: "Blue",
    mixedColorResult: "Muted_Violet",
    mentorName: "Oprah Winfrey",
    occupation: "Media Leader",
    coreExperienceInsight:
      "Overcoming childhood trauma (Blue) through resilience and vocal passion (Red).",
  },
  {
    id: 2,
    color1: "Red",
    color2: "Yellow",
    mixedColorResult: "Warm_Orange",
    mentorName: "Maya Angelou",
    occupation: "Poet/Activist",
    coreExperienceInsight:
      "Transforming righteous anger (Red) into powerful, peaceful wisdom (Yellow).",
  },
  {
    id: 3,
    color1: "Red",
    color2: "Purple",
    mixedColorResult: "Deep_Magenta",
    mentorName: "Napoleon Bonaparte",
    occupation: "Strategist",
    coreExperienceInsight:
      "The constant battle between immense ambition (Red) and strategic anxiety (Purple).",
  },
  {
    id: 4,
    color1: "Red",
    color2: "Gray",
    mixedColorResult: "Ashen_Red",
    mentorName: "Viktor Frankl",
    occupation: "Psychiatrist",
    coreExperienceInsight:
      "Finding 'Man's Search for Meaning' amidst rage (Red) and total despair (Gray).",
  },
  {
    id: 5,
    color1: "Red",
    color2: "Green",
    mixedColorResult: "Earthy_Brown",
    mentorName: "Coco Chanel",
    occupation: "Designer",
    coreExperienceInsight:
      "Channeling the anger of poverty (Red) into a drive to outshine rivals (Green).",
  },
  {
    id: 6,
    color1: "Red",
    color2: "Orange",
    mixedColorResult: "Fiery_Amber",
    mentorName: "Elon Musk",
    occupation: "Entrepreneur",
    coreExperienceInsight:
      "Handling the pressure of bankruptcy (Orange) and public criticism (Red).",
  },
  {
    id: 7,
    color1: "Red",
    color2: "Navy",
    mixedColorResult: "Dark_Crimson",
    mentorName: "Malcolm X",
    occupation: "Activist",
    coreExperienceInsight:
      "Converting isolated loneliness (Navy) into organized, intellectual fire (Red).",
  },
  {
    id: 8,
    color1: "Blue",
    color2: "Yellow",
    mixedColorResult: "Soft_Green",
    mentorName: "Audrey Hepburn",
    occupation: "Actor/Humanitarian",
    coreExperienceInsight:
      "Filling the void of fame's loneliness (Blue) with the joy of giving (Yellow).",
  },
  {
    id: 9,
    color1: "Blue",
    color2: "Purple",
    mixedColorResult: "Indigo_Mist",
    mentorName: "Virginia Woolf",
    occupation: "Writer",
    coreExperienceInsight:
      "Exploring the delicate boundary between deep sorrow (Blue) and mental anxiety (Purple).",
  },
  {
    id: 10,
    color1: "Blue",
    color2: "Gray",
    mixedColorResult: "Dust_Blue",
    mentorName: "Abraham Lincoln",
    occupation: "Politician",
    coreExperienceInsight:
      "Leading a nation while enduring chronic clinical depression (Blue/Gray).",
  },
  {
    id: 11,
    color1: "Blue",
    color2: "Green",
    mixedColorResult: "Teal_Blue",
    mentorName: "Vincent van Gogh",
    occupation: "Artist",
    coreExperienceInsight:
      "Expressing the sadness of unrequited recognition (Blue) through jealous passion (Green).",
  },
  {
    id: 12,
    color1: "Blue",
    color2: "Orange",
    mixedColorResult: "Burnt_Sienna",
    mentorName: "J.K. Rowling",
    occupation: "Author",
    coreExperienceInsight:
      "Rising from the pressure of poverty (Orange) and clinical depression (Blue).",
  },
  {
    id: 13,
    color1: "Blue",
    color2: "Navy",
    mixedColorResult: "Midnight_Blue",
    mentorName: "Frida Kahlo",
    occupation: "Artist",
    coreExperienceInsight:
      "Confronting physical pain and isolation (Navy) through soulful art (Blue).",
  },
  {
    id: 14,
    color1: "Yellow",
    color2: "Purple",
    mixedColorResult: "Pale_Gold",
    mentorName: "Marie Curie",
    occupation: "Scientist",
    coreExperienceInsight:
      "Finding joy in discovery (Yellow) despite the anxiety of being an outsider (Purple).",
  },
  {
    id: 15,
    color1: "Yellow",
    color2: "Gray",
    mixedColorResult: "Silver_Yellow",
    mentorName: "Albert Schweitzer",
    occupation: "Physician",
    coreExperienceInsight:
      "Healing modern emptiness (Gray) through the peaceful joy of service (Yellow).",
  },
  {
    id: 16,
    color1: "Yellow",
    color2: "Green",
    mixedColorResult: "Lime_Gold",
    mentorName: "Michelle Obama",
    occupation: "Lawyer/Author",
    coreExperienceInsight:
      "Choosing self-worth and joy (Yellow) over the pressure of social comparison (Green).",
  },
  {
    id: 17,
    color1: "Yellow",
    color2: "Orange",
    mixedColorResult: "Sunset_Orange",
    mentorName: "Benjamin Franklin",
    occupation: "Statesman",
    coreExperienceInsight:
      "Managing massive workloads (Orange) through structured habits and peace (Yellow).",
  },
  {
    id: 18,
    color1: "Yellow",
    color2: "Navy",
    mixedColorResult: "Ethereal_Blue",
    mentorName: "Anna Pavlova",
    occupation: "Ballerina",
    coreExperienceInsight:
      "Finding the joy of flight (Yellow) within the strict isolation of discipline (Navy).",
  },
  {
    id: 19,
    color1: "Purple",
    color2: "Gray",
    mixedColorResult: "Cloudy_Purple",
    mentorName: "Socrates",
    occupation: "Philosopher",
    coreExperienceInsight:
      "Confronting the anxiety of the unknown (Purple) with intellectual emptiness (Gray).",
  },
  {
    id: 20,
    color1: "Purple",
    color2: "Green",
    mixedColorResult: "Sage_Purple",
    mentorName: "Natalie Portman",
    occupation: "Actor/Director",
    coreExperienceInsight:
      "Overcoming the 'Imposter Syndrome' (Green) and perfectionist anxiety (Purple).",
  },
  {
    id: 21,
    color1: "Purple",
    color2: "Orange",
    mixedColorResult: "Vibrant_Plum",
    mentorName: "Steve Jobs",
    occupation: "Tech Leader",
    coreExperienceInsight:
      "Balancing the anxiety of innovation (Purple) with extreme work pressure (Orange).",
  },
  {
    id: 22,
    color1: "Purple",
    color2: "Navy",
    mixedColorResult: "Cosmic_Indigo",
    mentorName: "Neil Armstrong",
    occupation: "Astronaut",
    coreExperienceInsight:
      "Maintaining calm (Navy) while facing the terrifying unknown of space (Purple).",
  },
  {
    id: 23,
    color1: "Gray",
    color2: "Green",
    mixedColorResult: "Olive_Gray",
    mentorName: "Jonathan Ive",
    occupation: "Designer",
    coreExperienceInsight:
      "Responding to dull industries (Gray) with a unique, minimalist edge (Green).",
  },
  {
    id: 24,
    color1: "Gray",
    color2: "Orange",
    mixedColorResult: "Steel_Orange",
    mentorName: "Bill Gates",
    occupation: "Tech Leader",
    coreExperienceInsight:
      "Managing burnout (Orange) through 'Think Weeks' to avoid mental emptiness (Gray).",
  },
  {
    id: 25,
    color1: "Gray",
    color2: "Navy",
    mixedColorResult: "Deep_Charcoal",
    mentorName: "Albert Camus",
    occupation: "Author",
    coreExperienceInsight:
      "Accepting the 'Absurd'—finding life in emptiness (Gray) and isolation (Navy).",
  },
  {
    id: 26,
    color1: "Green",
    color2: "Orange",
    mixedColorResult: "Rusty_Copper",
    mentorName: "Estée Lauder",
    occupation: "Entrepreneur",
    coreExperienceInsight:
      "Turning the pressure of sales (Orange) into a tool to beat competitors (Green).",
  },
  {
    id: 27,
    color1: "Green",
    color2: "Navy",
    mixedColorResult: "Dark_Teal",
    mentorName: "Zaha Hadid",
    occupation: "Architect",
    coreExperienceInsight:
      "Breaking through isolation (Navy) and being an outsider (Green) with radical art.",
  },
  {
    id: 28,
    color1: "Orange",
    color2: "Navy",
    mixedColorResult: "Stormy_Blue",
    mentorName: "Ernest Hemingway",
    occupation: "Author",
    coreExperienceInsight:
      "Writing with 'grace under pressure' (Orange) while battling inner solitude (Navy).",
  },
];

export function findMentorForColors(
  c1: MentorColor,
  c2: MentorColor
): MentorMatch | undefined {
  const [a, b] = [c1, c2].sort();
  return MENTOR_MATCHES.find((m) => {
    const [x, y] = [m.color1, m.color2].sort();
    return x === a && y === b;
  });
}

