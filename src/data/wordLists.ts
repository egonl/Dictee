export type WordListDefinition = {
  entries: string[];
  random: boolean;
  gifUrl?: string;
};

// Basisset woorden voor dit eerste dictee-thema.
export const WORD_LISTS: Record<string, WordListDefinition> = {
  "Nederlandse wateren": {
    entries: [
      "Waddenzee",
      "IJsselmeer",
      "Markermeer",
      "IJssel",
      "Nederrijn",
      "Waal",
      "Maas",
      "Noordzeekanaal",
      "Amsterdam-Rijnkanaal",
      "Lek",
      "Nieuwe Waterweg",
      "Oosterschelde",
      "Westerschelde",
    ],
    random: true,
  },
  "Bekende artiesten": {
    entries: [
      "The Weeknd",
      "Billie Eilish",
      "Taylor Swift",
      "Drake",
      "Ariana Grande",
      "Post Malone",
      "Dua Lipa",
      "Kanye West",
      "Travis Scott",
      "Harry Styles",
      "Olivia Rodrigo",
      "Shakira",
      "Bad Bunny",
      "Kendrick Lamar",
      "Lady Gaga",
      "Ed Sheeran",
      "Rihanna",
      "Justin Bieber",
    ],
    random: true,
  },
};
