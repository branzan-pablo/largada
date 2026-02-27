export interface ScrapedRace {
  name: string;
  slug: string;
  date: string | null;
  startTime: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  distances: string[] | null;
  registrationPrice: string | null;
  registrationLink: string | null;
  registrationDeadline: string | null;
  prizeType: "money" | "trophy" | "both" | "none";
  prizeDetails: string | null;
  image_url: string | null;
  routeDescription: string | null;
  organizer: string;
  description: string | null;
  link: string;
}

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedRace[]>;
}
