import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { halls as seedHalls, initialShowtimes, movies as seedMovies, type Booking, type CinemaHall, type Movie, type Showtime, type Ticket } from "./data";

interface State {
  movies: Movie[]; halls: CinemaHall[]; showtimes: Showtime[];
  bookings: Booking[]; tickets: Ticket[];
}
interface Ctx extends State {
  set: (fn: (s: State) => State) => void;
}
const StoreCtx = createContext<Ctx | null>(null);
const KEY = "cinema-demo-v1";
const initial: State = { movies: seedMovies, halls: seedHalls, showtimes: initialShowtimes, bookings: [], tickets: [] };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setState({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, loaded]);
  return <StoreCtx.Provider value={{ ...state, set: setState }}>{children}</StoreCtx.Provider>;
}
export function useStore() {
  const c = useContext(StoreCtx); if (!c) throw new Error("StoreProvider missing"); return c;
}
export const uid = (p: string) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
