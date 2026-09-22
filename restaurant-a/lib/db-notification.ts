import { supabase } from "@/lib/supabase"; 
type ClientCallback = (msg: string) => void;
const clients: { email: string, callback: ClientCallback }[] = [];

export function registerClient(email: string, callback: ClientCallback) {
  clients.push({ email, callback });
}

export function unregisterClient(email: string) {
  const index = clients.findIndex(c => c.email === email);
  if (index !== -1) clients.splice(index, 1);
}

export async function notifyUsersInCart(message: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("customer_email")
    .gt("total_price", 0); 
  if (error || !data) {
    console.error("Error fetching cart emails:", error?.message);
    return;
  }
  const emailsInCart = Array.from(new Set(data.map((r) => r.customer_email)));

  clients.forEach(c => {
    if (emailsInCart.includes(c.email)) {
      c.callback(message);
    }
  });
}