export interface User {
  id: number;
  email: string;
   firstname: string;
  lastname: string;
  role: "admin" | "staff" | "customer";
  created_at: string;
}

export interface City{
  
    id: number;
    cityName: string;
    country: string;
    emoji?: string;
    date?: string;
    notes?: string;
    lat: number;
    lng: number;
    imageUrl?: string;
  };
// export interface User {
//   id: number;
//   email: string;
//   firstname: string;
//   lastname: string;
//   role:   role: "admin" | "staff" | "customer";
//   created_at: string;
// }
