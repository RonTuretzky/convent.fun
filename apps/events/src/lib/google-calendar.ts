export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

export async function fetchGoogleCalendarEvents(): Promise<
  GoogleCalendarEvent[]
> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    console.warn("Google Calendar API key or calendar ID not set");
    return [];
  }

  const now = new Date().toISOString();
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("timeMin", now);
  url.searchParams.set("maxResults", "100");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    console.error("Google Calendar API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data.items ?? [];
}
